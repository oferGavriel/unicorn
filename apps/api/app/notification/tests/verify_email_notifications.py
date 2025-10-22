# ruff: noqa: E501
import asyncio
import sys
import time
from uuid import UUID, uuid4
from typing import Dict, Any, List, Callable, Optional

sys.path.append("/Users/oferiko/Developer/personal/unicorn/apps/api")

from app.core.database import async_session_maker, AsyncSession
from app.notification.email_service import EmailService
from app.database_models import User, Board, Table, Row
from app.core.enums import StatusEnum, PriorityEnum


class ResendSandboxConfig:
    SANDBOX_ADDRESSES = {
        "delivered": "delivered@resend.dev",
        "bounced": "bounced@resend.dev",
        "complained": "complained@resend.dev",
    }

    @classmethod
    def get_sandbox_email(
        cls, test_type: str = "delivered", label: Optional[str] = None
    ) -> str:
        base_email = cls.SANDBOX_ADDRESSES[test_type]
        if label:
            local, domain = base_email.split("@", 1)
            return f"{local}+{label}@{domain}"
        return base_email


class TestDataFactory:
    @staticmethod
    async def create_test_user(
        db_session: AsyncSession, user_number: int
    ) -> Dict[str, Any]:
        user_id = uuid4()
        timestamp = int(time.time() * 1000)

        user = User(
            id=user_id,
            email=f"test-user{user_number}-{timestamp}@example.com",
            first_name=f"TestUser{user_number}",
            last_name="Integration",
            password_hash="test_hash",  # noqa: S106
        )
        db_session.add(user)

        return {
            "id": str(user_id),
            "first_name": f"TestUser{user_number}",
            "last_name": "Integration",
        }

    @staticmethod
    async def create_test_board(
        db_session: AsyncSession, owner_id: str, name: str = "Test Board"
    ) -> UUID:
        board_id = uuid4()
        board = Board(
            id=board_id, name=name, description="Board for testing", owner_id=owner_id
        )
        db_session.add(board)
        return board_id

    @staticmethod
    async def create_test_table(
        db_session: AsyncSession, board_id: UUID, name: str = "Test Table"
    ) -> UUID:
        table_id = uuid4()
        table = Table(
            id=table_id, name=name, description="Table for testing", board_id=board_id
        )
        db_session.add(table)
        return table_id

    @staticmethod
    async def create_test_row(
        db_session: AsyncSession,
        table_id: UUID,
        name: str = "Test Row",
        position: int = 1,
    ) -> UUID:
        row_id = uuid4()
        row = Row(
            id=row_id,
            name=name,
            status=StatusEnum.NOT_STARTED,
            priority=PriorityEnum.MEDIUM,
            table_id=table_id,
            position=position,
        )
        db_session.add(row)
        return row_id


class EmailTestScenarios:
    @staticmethod
    def create_task_name_change_scenario(
        board_id: str, table_id: str, row_id: str, actor_name: str
    ) -> Dict[str, Any]:
        return {
            "actor_name": actor_name,
            "total_events": 1,
            "boards": {
                board_id: {
                    "tables": {
                        table_id: {
                            "name": "Test Table",
                            "rows": {
                                row_id: {
                                    "name": "Updated Task Name",
                                    "actions": ["updated"],
                                    "changes": {
                                        "name": {
                                            "from_value": "Original Task Name",
                                            "to_value": "Updated Task Name",
                                        }
                                    },
                                }
                            },
                        }
                    }
                }
            },
        }

    @staticmethod
    def create_status_change_scenario(
        board_id: str, table_id: str, row_id: str, actor_name: str
    ) -> Dict[str, Any]:
        return {
            "actor_name": actor_name,
            "total_events": 1,
            "boards": {
                board_id: {
                    "tables": {
                        table_id: {
                            "name": "Test Table",
                            "rows": {
                                row_id: {
                                    "name": "Test Task",
                                    "actions": ["updated"],
                                    "changes": {
                                        "status": {
                                            "from_value": "not_started",
                                            "to_value": "working_on_it",
                                        }
                                    },
                                }
                            },
                        }
                    }
                }
            },
        }

    @staticmethod
    def create_owner_assignment_scenario(
        board_id: str, table_id: str, row_id: str, actor_name: str, owner_ids: List[str]
    ) -> Dict[str, Any]:
        return {
            "actor_name": actor_name,
            "total_events": 1,
            "boards": {
                board_id: {
                    "tables": {
                        table_id: {
                            "name": "Test Table",
                            "rows": {
                                row_id: {
                                    "name": "Test Task",
                                    "actions": ["updated"],
                                    "changes": {
                                        "owner_id": {
                                            "from_value": "",
                                            "to_value": ",".join(owner_ids),
                                        }
                                    },
                                }
                            },
                        }
                    }
                }
            },
        }

    @staticmethod
    def create_multiple_changes_scenario(
        board_id: str, table_id: str, row_id: str, actor_name: str
    ) -> Dict[str, Any]:
        return {
            "actor_name": actor_name,
            "total_events": 1,
            "boards": {
                board_id: {
                    "tables": {
                        table_id: {
                            "name": "Test Table",
                            "rows": {
                                row_id: {
                                    "name": "Test Task",
                                    "actions": ["updated"],
                                    "changes": {
                                        "name": {
                                            "from_value": "Old Name",
                                            "to_value": "New Name",
                                        },
                                        "status": {
                                            "from_value": "not_started",
                                            "to_value": "working_on_it",
                                        },
                                        "priority": {
                                            "from_value": "low",
                                            "to_value": "high",
                                        },
                                    },
                                }
                            },
                        }
                    }
                }
            },
        }


class TestEmailService(EmailService):
    def __init__(self, db: AsyncSession):
        super().__init__(db)

    async def _get_recipient(self, recipient_id: str) -> Optional[User]:
        mock_user = User(
            id=recipient_id,
            email=ResendSandboxConfig.get_sandbox_email(
                "delivered", f"user{recipient_id[:8]}"
            ),
            first_name="Test",
            last_name="User",
        )
        mock_user.first_name = "Test"
        mock_user.last_name = "User"
        return mock_user


class EmailNotificationTester:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.email_service = TestEmailService(db_session)

    # ruff: noqa: PLR0913
    async def send_test_email(
        self,
        recipient_id: UUID,
        board_id: UUID,
        summary: Dict[str, Any],
        board_name: str,
        actor_name: str,
        test_name: str,
    ) -> bool:
        print(f"📧 Sending email: {test_name}")

        try:
            success = await self.email_service.send_digest_email(
                recipient_id=str(recipient_id),
                board_id=str(board_id),
                board_name=board_name,
                actor_name=actor_name,
                summary=summary,
            )

            if success:
                print(f"   ✅ {test_name} - Email sent successfully")
            else:
                print(f"   ❌ {test_name} - Email failed to send")

            await asyncio.sleep(1)
            return success

        except Exception as e:
            print(f"   ❌ {test_name} - Error: {str(e)}")
            return False


class EmailNotificationVerifier:
    async def setup_test_data(self, db: AsyncSession) -> Dict[str, Any]:
        user_data = await TestDataFactory.create_test_user(db, 1)
        board_id = await TestDataFactory.create_test_board(db, user_data["id"])
        table_id = await TestDataFactory.create_test_table(db, board_id)
        row_id = await TestDataFactory.create_test_row(db, table_id)

        await db.commit()

        return {
            "user": user_data,
            "board_id": str(board_id),
            "table_id": str(table_id),
            "row_id": str(row_id),
        }

    async def verify_basic_notification_scenarios(
        self, test_setup: Dict[str, Any], email_tester: EmailNotificationTester
    ) -> bool:
        print("\n🧪 Verifying basic notification scenarios...")

        scenarios: List[tuple[str, Callable[[str, str, str, str], Dict[str, Any]]]] = [
            ("Task name change", EmailTestScenarios.create_task_name_change_scenario),
            ("Status change", EmailTestScenarios.create_status_change_scenario),
            ("Multiple changes", EmailTestScenarios.create_multiple_changes_scenario),
        ]

        results = []
        actor_name = (
            f"{test_setup['user']['first_name']} {test_setup['user']['last_name']}"
        )

        for scenario_name, scenario_func in scenarios:
            summary = scenario_func(
                test_setup["board_id"],
                test_setup["table_id"],
                test_setup["row_id"],
                actor_name,
            )

            success = await email_tester.send_test_email(
                recipient_id=test_setup["user"]["id"],
                board_id=test_setup["board_id"],
                summary=summary,
                board_name="Test Board",
                actor_name=actor_name,
                test_name=scenario_name,
            )
            results.append(success)

        print(f"✅ Basic scenarios completed: {sum(results)}/{len(results)} successful")
        return all(results)


async def run_email_notification_verification() -> None:
    print("🚀 Starting email notification verification...")
    print("📧 Using Resend sandbox mode - emails won't count against your limits!")
    print("🔍 Check your Resend dashboard to see the test emails")
    print("⚠️  This is a MANUAL VERIFICATION script - not a unit test!")

    async with async_session_maker() as db:
        verifier = EmailNotificationVerifier()
        email_tester = EmailNotificationTester(db)

        test_setup = await verifier.setup_test_data(db)

        basic_results = await verifier.verify_basic_notification_scenarios(
            test_setup, email_tester
        )

        print("\n" + "=" * 60)
        print("📊 EMAIL NOTIFICATION VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"Basic scenarios: {'✅ VERIFIED' if basic_results else '❌ FAILED'}")

        if basic_results:
            print("🎉 All email notifications verified successfully!")
            print("📬 Check your Resend dashboard to review the email formatting")
        else:
            print("⚠️  Some email notifications failed verification!")


if __name__ == "__main__":
    asyncio.run(run_email_notification_verification())
