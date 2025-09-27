# ruff: noqa: E501
import os
from typing import Dict, Any, Optional
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4
from datetime import datetime, timezone

import resend

from app.database_models import User, Board, Notification
from app.core.enums import (
    NotificationKindEnum,
    NotificationChannelEnum,
    NotificationStatusEnum,
)
from app.core.logger import logger
from app.core.config import get_settings

settings = get_settings()

resend.api_key = settings.resend_api_key

FROM_EMAIL = settings.from_email
FROM_NAME = settings.from_name


class EmailTemplate(Enum):
    """Email template types for different notification scenarios"""
    BOARD_ACTIVITY_DIGEST = "board_activity_digest"
    WELCOME = "welcome"
    BOARD_INVITATION = "board_invitation"
    ROW_ASSIGNMENT = "row_assignment"
    DEADLINE_REMINDER = "deadline_reminder"


class EmailService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ruff: noqa: PLR0913
    async def send_email(
        self,
        template: EmailTemplate,
        recipient_id: str,
        subject: str,
        context: Dict[str, Any],
        board_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> bool:
        """Send email using specified template and context"""
        try:
            # Get recipient
            recipient = await self._get_recipient(recipient_id)
            if not recipient:
                return False

            # Generate email content based on template
            html_content, text_content = await self._generate_email_content(
                template, context, recipient
            )

            # Create notification record
            notification = await self._create_notification(
                template, recipient_id, board_id, actor_id, subject, context
            )

            # Send email via Resend
            success = await self._send_via_resend(
                recipient.email, subject, html_content, text_content, notification.id
            )

            # Update notification status
            await self._update_notification_status(notification, success)

            return success

        except Exception as e:
            logger.error(f"Failed to send {template.value} email to {recipient_id}: {str(e)}")
            return False

    async def send_digest_email(
        self,
        recipient_id: str,
        board_id: str,
        actor_id: str,
        summary: Dict[str, Any],
    ) -> bool:
        """Send board activity digest email (backward compatibility)"""
        board = await self._get_board(board_id)
        if not board:
            return False

        subject = f"Activity in {board.name}"
        context = {
            "summary": summary,
            "board_name": board.name,
            "board_id": board_id,
            "board_url": f"/boards/{board_id}",
        }

        return await self.send_email(
            EmailTemplate.BOARD_ACTIVITY_DIGEST,
            recipient_id,
            subject,
            context,
            board_id,
            actor_id,
        )

    async def send_welcome_email(self, recipient_id: str) -> bool:
        """Send welcome email to new user"""
        subject = f"Welcome to {FROM_NAME}!"
        context = {
            "app_name": FROM_NAME,
            "dashboard_url": f"{settings.frontend_url}/dashboard",
        }

        return await self.send_email(
            EmailTemplate.WELCOME,
            recipient_id,
            subject,
            context,
        )

    async def send_board_invitation(
        self,
        recipient_id: str,
        board_id: str,
        inviter_id: str,
        inviter_name: str
    ) -> bool:
        """Send board invitation email"""
        board = await self._get_board(board_id)
        if not board:
            return False

        subject = f"{inviter_name} invited you to join {board.name}"
        context = {
            "board_name": board.name,
            "board_id": board_id,
            "inviter_name": inviter_name,
            "board_url": f"/boards/{board_id}",
        }

        return await self.send_email(
            EmailTemplate.BOARD_INVITATION,
            recipient_id,
            subject,
            context,
            board_id,
            inviter_id,
        )

    # Private helper methods
    async def _get_recipient(self, recipient_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == recipient_id))
        return result.scalar_one_or_none()

    async def _get_board(self, board_id: str) -> Optional[Board]:
        result = await self.db.execute(select(Board).where(Board.id == board_id))
        return result.scalar_one_or_none()


    async def _create_notification(
        self,
        template: EmailTemplate,
        recipient_id: str,
        board_id: Optional[str],
        actor_id: Optional[str],
        subject: str,
        context: Dict[str, Any],
    ) -> Notification:
        notification = Notification(
            id=uuid4(),
            board_id=board_id,
            actor_id=actor_id,
            recipient_id=recipient_id,
            kind=self._template_to_kind(template),
            channel=NotificationChannelEnum.EMAIL,
            status=NotificationStatusEnum.QUEUED,
            subject=subject,
            preview=self._generate_preview(template, context),
            payload=context,
        )

        self.db.add(notification)
        await self.db.commit()
        return notification

    async def _generate_email_content(
        self, template: EmailTemplate, context: Dict[str, Any], recipient: User
    ) -> tuple[str, str]:
        """Generate HTML and text content based on template"""
        if template == EmailTemplate.BOARD_ACTIVITY_DIGEST:
            return self._generate_digest_email(context)
        elif template == EmailTemplate.WELCOME:
            return self._generate_welcome_email(context, recipient)
        elif template == EmailTemplate.BOARD_INVITATION:
            return self._generate_invitation_email(context)
        else:
            # Fallback to basic template
            return self._generate_basic_email(template, context)

    async def _send_via_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
        notification_id: UUID
    ) -> bool:
        """Send email via Resend API"""
        try:
            email_response = resend.Emails.send({
                "from": f"{FROM_NAME} <{FROM_EMAIL}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content,
                "headers": {
                    "X-Entity-Ref-ID": str(notification_id),
                },
            })

            logger.info(f"Email sent successfully, Resend ID: {email_response.get('id')}")
            return True

        except Exception as e:
            logger.error(f"Resend API error: {str(e)}")
            return False

    async def _update_notification_status(self, notification: Notification, success: bool) -> None:
        """Update notification status based on send result"""
        if success:
            notification.status = NotificationStatusEnum.SENT
            notification.sent_at = datetime.now(timezone.utc)
        else:
            notification.status = NotificationStatusEnum.FAILED

        await self.db.commit()

    def _template_to_kind(self, template: EmailTemplate) -> NotificationKindEnum:
        """Map email template to notification kind"""
        mapping = {
            EmailTemplate.BOARD_ACTIVITY_DIGEST: NotificationKindEnum.BOARD_ACTIVITY_DIGEST,
            EmailTemplate.WELCOME: NotificationKindEnum.WELCOME,
            EmailTemplate.BOARD_INVITATION: NotificationKindEnum.BOARD_INVITATION,
            EmailTemplate.ROW_ASSIGNMENT: NotificationKindEnum.ROW_ASSIGNMENT,
            EmailTemplate.DEADLINE_REMINDER: NotificationKindEnum.DEADLINE_REMINDER,
        }
        return mapping.get(template, NotificationKindEnum.BOARD_ACTIVITY_DIGEST)

    def _generate_preview(self, template: EmailTemplate, context: Dict[str, Any]) -> str:
        """Generate email preview text"""
        if template == EmailTemplate.BOARD_ACTIVITY_DIGEST:
            summary = context.get("summary", {})
            actor_name = summary.get("actor_name", "Someone")
            total_events = summary.get("total_events", 0)
            return f"{actor_name} made {total_events} changes"
        elif template == EmailTemplate.WELCOME:
            return "Welcome to our platform!"
        elif template == EmailTemplate.BOARD_INVITATION:
            inviter_name = context.get("inviter_name", "Someone")
            board_name = context.get("board_name", "a board")
            return f"{inviter_name} invited you to join {board_name}"
        else:
            return "You have a new notification"

    # Email content generators
    def _generate_digest_email(self, context: Dict[str, Any]) -> tuple[str, str]:
        """Generate board activity digest email content"""
        summary = context["summary"]
        board_name = context["board_name"]
        board_url = context["board_url"]

        # HTML content (existing logic)
        html_content = self._generate_email_html(summary, board_name, board_url)

        # Text content (existing logic)
        text_content = self._generate_email_text(summary, board_name, board_url)

        return html_content, text_content

    def _generate_welcome_email(self, context: Dict[str, Any], recipient: User) -> tuple[str, str]:
        """Generate welcome email content"""
        app_name = context["app_name"]
        dashboard_url = context["dashboard_url"]

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to {app_name}</title>
        </head>
        <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h1>Welcome to {app_name}, {recipient.first_name}!</h1>
                <p>We're excited to have you on board. Get started by exploring your dashboard.</p>
                <a href="{dashboard_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Welcome to {app_name}, {recipient.first_name}!

        We're excited to have you on board. Get started by exploring your dashboard.

        Dashboard: {dashboard_url}
        """

        return html_content, text_content

    def _generate_invitation_email(self, context: Dict[str, Any]) -> tuple[str, str]:
        """Generate board invitation email content"""
        board_name = context["board_name"]
        inviter_name = context["inviter_name"]
        board_url = context["board_url"]

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invitation to {board_name}</title>
        </head>
        <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h1>You're invited to join {board_name}</h1>
                <p>{inviter_name} has invited you to collaborate on this board.</p>
                <a href="{board_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Board</a>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        You're invited to join {board_name}

        {inviter_name} has invited you to collaborate on this board.

        Join Board: {board_url}
        """

        return html_content, text_content

    def _generate_basic_email(self, template: EmailTemplate, context: Dict[str, Any]) -> tuple[str, str]:
        """Generate basic email content for unknown templates"""
        html_content = """
        <!DOCTYPE html>
        <html>
        <body>
            <h1>Notification</h1>
            <p>You have a new notification.</p>
        </body>
        </html>
        """

        text_content = "You have a new notification."

        return html_content, text_content

    # Keep existing methods for backward compatibility
    def _generate_email_html(self, summary: Dict[str, Any], board_name: str, board_url: str) -> str:
        """Generate HTML email content (existing method)"""
        actor_name = summary["actor_name"]
        total_events = summary["total_events"]

        # Base URL - you might want to make this configurable
        base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        board_url = f"{base_url}/boards/{board_url}"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activity in {board_name}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .activity-item {{ background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; margin-bottom: 10px; }}
                .changes {{ background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; }}
                .change-item {{ margin: 5px 0; font-size: 14px; }}
                .button {{ display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0; color: #495057;">Activity in {board_name}</h2>
                    <p style="margin: 10px 0 0 0; color: #6c757d;">{actor_name} made {total_events} changes</p>
                </div>
        """  # noqa: E501

        # Add activity details
        for _board_id_key, board_data in summary["boards"].items():
            for _table_id, table_data in board_data["tables"].items():
                table_name = table_data.get("name", "Untitled Table")

                html += f"""
                <div class="activity-item">
                    <h3 style="margin-top: 0; color: #495057;">{table_name}</h3>
                """

                for _row_id, row_data in table_data["rows"].items():
                    row_name = row_data.get("name", "Untitled Row")
                    actions = row_data["actions"]

                    if "created" in actions:
                        action_text = "created a new row"
                        icon = "✨"
                    elif "deleted" in actions:
                        action_text = "deleted the row"
                        icon = "🗑️"
                    elif "updated" in actions:
                        action_text = "updated the row"
                        icon = "✏️"
                    else:
                        action_text = "modified the row"
                        icon = "📝"

                    html += f"""
                    <p><strong>{icon} {row_name}</strong> - {action_text}</p>
                    """

                    # Show changes
                    if row_data["changes"]:
                        html += '<div class="changes"><strong>Changes:</strong>'
                        for field, delta in row_data["changes"].items():
                            from_val = delta["from"] or "empty"
                            to_val = delta["to"] or "empty"
                            field_display = field.replace("_", " ").title()
                            html += f'<div class="change-item">• {field_display}: <span style="color: #dc3545;">{from_val}</span> → <span style="color: #28a745;">{to_val}</span></div>'  # noqa: E501
                        html += "</div>"

                html += "</div>"

        html += f"""
                <div style="text-align: center;">
                    <a href="{board_url}" class="button">View Board</a>
                </div>

                <div class="footer">
                    <p>You received this email because you're a member of {board_name} and haven't been active recently.</p>
                    <p>To stop receiving these notifications, update your notification preferences in your account settings.</p>
                </div>
            </div>
        </body>
        </html>
        """  # noqa: E501

        return html

    def _generate_email_text(self, summary: Dict[str, Any], board_name: str, board_url: str) -> str:
        """Generate plain text email content (existing method)"""
        actor_name = summary["actor_name"]
        total_events = summary["total_events"]
        base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        board_url = f"{base_url}/boards/{board_url}"

        text = f"""
          Activity in {board_name}

          {actor_name} made {total_events} changes:

        """

        for _board_id_key, board_data in summary["boards"].items():
            for _table_id, table_data in board_data["tables"].items():
                table_name = table_data.get("name", "Untitled Table")
                text += f"\nTable: {table_name}\n" + "=" * len(table_name) + "\n"

                for _row_id, row_data in table_data["rows"].items():
                    row_name = row_data.get("name", "Untitled Row")
                    actions = ", ".join(row_data["actions"])
                    text += f"• {row_name} was {actions}\n"

                    # Show changes
                    if row_data["changes"]:
                        for field, delta in row_data["changes"].items():
                            from_val = delta["from"] or "empty"
                            to_val = delta["to"] or "empty"
                            field_display = field.replace("_", " ").title()
                            text += f"  - {field_display}: {from_val} → {to_val}\n"
                    text += "\n"

        text += f"""
          View Board: {board_url}

          ---
          You received this email because you're a member of {board_name} and haven't been active recently.
          To stop receiving these notifications, update your notification preferences in your account settings.
          """  # noqa: E501

        return text


# Backward compatibility function
async def send_digest_email(
    db: AsyncSession,
    recipient_id: str,
    board_id: str,
    actor_id: str,
    summary: Dict[str, Any],
) -> bool:
    """Backward compatibility function"""
    email_service = EmailService(db)
    return await email_service.send_digest_email(recipient_id, board_id, actor_id, summary)
