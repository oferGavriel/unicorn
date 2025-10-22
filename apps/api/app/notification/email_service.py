# ruff: noqa: E501
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

import resend

from app.database_models import User
from app.core.logger import logger
from app.core.config import get_settings


settings = get_settings()

frontend_url = settings.frontend_url
resend.api_key = settings.resend_api_key
FROM_EMAIL = settings.from_email
FROM_NAME = settings.from_name


class EmailService:
    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db

    # ruff: noqa: PLR0913
    async def send_digest_email(
        self,
        recipient_id: str,
        board_id: str,
        board_name: str,
        actor_name: str,
        summary: Dict[str, Any],
    ) -> bool:
        try:
            recipient = await self._get_recipient(recipient_id)
            if not recipient:
                logger.error(
                    "email.recipient_not_found",
                    extra={"recipient_id": recipient_id},
                )
                return False

            html_content = self._generate_digest_html(
                board_name=board_name,
                board_id=board_id,
                actor_name=actor_name,
                summary=summary,
            )

            text_content = self._generate_digest_text(
                board_name=board_name,
                board_id=board_id,
                actor_name=actor_name,
                summary=summary,
            )

            subject = f"Activity in {board_name}"
            success = await self._send_via_resend(
                to_email=recipient.email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
            )

            if success:
                logger.info(
                    "email.digest_sent",
                    extra={
                        "recipient_id": recipient_id,
                        "board_id": board_id,
                    },
                )

            return success

        except Exception as e:
            logger.error(
                "email.send_failed",
                extra={
                    "recipient_id": recipient_id,
                    "board_id": board_id,
                    "error": str(e),
                },
            )
            return False

    async def _get_recipient(self, recipient_id: str) -> Optional[User]:
        if not self.db:
            from app.core.database import async_session_maker

            async with async_session_maker() as session:
                result = await session.execute(
                    select(User).where(User.id == recipient_id)
                )
                return result.scalar_one_or_none()

        result = await self.db.execute(select(User).where(User.id == recipient_id))
        return result.scalar_one_or_none()

    async def _send_via_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> bool:
        settings = get_settings()
        if not settings.should_send_emails:
            logger.info(
                "email.sending_disabled",
                extra={
                    "environment": settings.environment,
                    "to_email": to_email,
                },
            )
            return True

        try:
            email_response = resend.Emails.send(
                {
                    "from": f"{FROM_NAME} <{FROM_EMAIL}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                    "text": text_content,
                }
            )

            logger.info(
                "email.resend_success",
                extra={"resend_id": email_response.get("id")},
            )
            return True

        except Exception as e:
            logger.error(
                "email.resend_error",
                extra={"error": str(e)},
            )
            return False

    def _generate_digest_html(
        self,
        board_name: str,
        board_id: str,
        actor_name: str,
        summary: Dict[str, Any],
    ) -> str:
        total_events = summary.get("total_events", 0)
        boards_data = summary.get("boards", {})

        board_url = f"{frontend_url}/boards/{board_id}"

        html = self._generate_html_header()
        html += self._generate_html_intro(actor_name, total_events, board_name)

        for _, board_data in boards_data.items():
            tables_data = board_data.get("tables", {})

            for _, table_data in tables_data.items():
                table_name = table_data.get("name", "Untitled Table")
                rows_data = table_data.get("rows", {})

                html += f'<div class="table-section"><h3>{table_name}</h3>'
                html += self._generate_rows_html(rows_data)
                html += "</div>"

        html += self._generate_html_footer(board_url, board_name)

        return html

    def _generate_html_header(self) -> str:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .table-section {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                }
                .changes {
                    margin: 10px 0 10px 20px;
                    padding: 10px;
                    background-color: #fff;
                    border-left: 3px solid #6c757d;
                    border-radius: 4px;
                }
                .change-item {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #3b82f6;
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
        """

    def _generate_html_intro(
        self,
        actor_name: str,
        total_events: int,
        board_name: str,
    ) -> str:
        return f"""
                <div class="header">
                    <h2>Activity in {board_name}</h2>
                    <p><strong>{actor_name}</strong> made {total_events} {'change' if total_events == 1 else 'changes'}:</p>
                </div>
        """

    def _generate_rows_html(self, rows: Dict[str, Any]) -> str:
        html = ""

        for _, row_data in rows.items():
            row_name = row_data.get("name", "Untitled Row")
            actions = row_data.get("actions", [])
            changes = row_data.get("changes", {})

            action_text, icon = self._get_action_details(actions, changes)

            html += f"""
            <p><strong>{icon} Task: {row_name}</strong> - {action_text}</p>
            """

            if changes:
                html += self._generate_changes_html(changes)

        return html

    def _get_action_details(
        self,
        actions: list,
        changes: Dict[str, Any],
    ) -> tuple[str, str]:
        if "created" in actions:
            return "created a new row", "✨"
        elif "deleted" in actions:
            return "deleted the row", "🗑️"
        elif "updated" in actions:
            if len(changes) == 1:
                field = list(changes.keys())[0]
                field_name = self._get_friendly_field_name(field)
                return f"updated {field_name.lower()}", "✏️"
            else:
                return "updated the row", "✏️"
        else:
            return "modified the row", "📝"

    def _generate_changes_html(self, changes: Dict[str, Any]) -> str:
        html = '<div class="changes"><strong>Changes:</strong>'

        for field, change_data in changes.items():
            from_val = self._format_field_value(field, change_data["from_value"])
            to_val = self._format_field_value(field, change_data["to_value"])
            field_display = self._get_friendly_field_name(field)

            html += f"""
            <div class="change-item">
                • {field_display}:
                <span style="color: #dc3545;">{from_val}</span> →
                <span style="color: #28a745;">{to_val}</span>
            </div>
            """

        html += "</div>"
        return html

    def _generate_html_footer(self, board_url: str, board_name: str) -> str:
        return f"""
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
        """

    def _generate_digest_text(
        self,
        board_name: str,
        board_id: str,
        actor_name: str,
        summary: Dict[str, Any],
    ) -> str:
        total_events = summary.get("total_events", 0)
        boards_data = summary.get("boards", {})

        board_url = f"{frontend_url}/boards/{board_id}"

        text = f"""
Activity in {board_name}

{actor_name} made {total_events} {'change' if total_events == 1 else 'changes'}:

"""

        for _, board_data in boards_data.items():
            tables_data = board_data.get("tables", {})

            for _, table_data in tables_data.items():
                table_name = table_data.get("name", "Untitled Table")
                rows_data = table_data.get("rows", {})

                text += f"\nTable: {table_name}\n"
                text += "=" * len(table_name) + "\n"

                for _, row_data in rows_data.items():
                    row_name = row_data.get("name", "Untitled Row")
                    actions = row_data.get("actions", [])
                    changes = row_data.get("changes", {})

                    if "created" in actions:
                        action_text = "created"
                    elif "deleted" in actions:
                        action_text = "deleted"
                    elif "updated" in actions:
                        if len(changes) == 1:
                            field = list(changes.keys())[0]
                            field_name = self._get_friendly_field_name(field)
                            action_text = f"updated {field_name.lower()}"
                        else:
                            action_text = "updated"
                    else:
                        action_text = "modified"

                    text += f"• {action_text}: {row_name}\n"

                    if changes:
                        for field, change_data in changes.items():
                            from_val = self._format_field_value(
                                field, change_data["from_value"]
                            )
                            to_val = self._format_field_value(
                                field, change_data["to_value"]
                            )
                            field_display = self._get_friendly_field_name(field)

                            text += f"  - {field_display}: {from_val} → {to_val}\n"

                    text += "\n"

        text += f"""
          View Board: {board_url}

          ---
          You received this email because you're a member of {board_name} and haven't been active recently.
          To stop receiving these notifications, update your notification preferences in your account settings.
        """

        return text

    def _get_friendly_field_name(self, field: str) -> str:
        field_mapping = {
            "name": "Task Name",
            "status": "Status",
            "priority": "Priority",
            "due_date": "Due Date",
            "owner_id": "Owner",
            "description": "Description",
            "position": "Position",
        }
        return field_mapping.get(field, field.replace("_", " ").title())

    def _format_field_value(self, field: str, value: str) -> str:
        if not value:
            return "Not set"

        if field == "due_date":
            return self._format_due_date(value)

        if field in ["status", "priority"]:
            return value.replace("_", " ").title()

        return value

    def _format_due_date(self, value: str) -> str:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt.strftime("%B %d, %Y at %I:%M %p")
        except (ValueError, AttributeError):
            return value


async def send_digest_email(
    recipient_id: str,
    board_id: str,
    board_name: str,
    actor_name: str,
    summary: Dict[str, Any],
) -> bool:
    email_service = EmailService()
    return await email_service.send_digest_email(
        recipient_id=recipient_id,
        board_id=board_id,
        board_name=board_name,
        actor_name=actor_name,
        summary=summary,
    )
