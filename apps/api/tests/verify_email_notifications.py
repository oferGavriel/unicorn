import asyncio
import sys
import time
from uuid import UUID, uuid4
from typing import Dict, Any, List

sys.path.append('/Users/oferiko/Developer/personal/unicorn/apps/api')

from app.db.database import async_session_maker
from app.notification.email_service import EmailService
from app.database_models import User, Board, Table, Row
from app.core.enums import StatusEnum, PriorityEnum


class ResendSandboxConfig:
    SANDBOX_ADDRESSES = {
        "delivered": "delivered@resend.dev",
        "bounced": "bounced@resend.dev",
        "complained": "complained@resend.dev"
    }

    @classmethod
    def get_sandbox_email(cls, test_type: str = "delivered", label: str | None = None) -> str:
        base_email = cls.SANDBOX_ADDRESSES[test_type]
        if label:
            local, domain = base_email.split("@", 1)
            return f"{local}+{label}@{domain}"
        return base_email


class TestDataFactory:

    @staticmethod
    async def create_test_user(
        db_session,
        user_number: int,
        with_avatar: bool = True
    ) -> Dict[str, Any]:
        user_id = uuid4()
        avatar_url = (
            f"https://api.dicebear.com/7.x/avataaars/svg?seed=user{user_number}"
            if with_avatar else None
        )

        # Use timestamp to ensure unique emails
        timestamp = int(time.time() * 1000)  # milliseconds

        user = User(
            id=user_id,
            email=f"test-user{user_number}-{timestamp}@example.com",
            first_name=f"TestUser{user_number}",
            last_name="Integration",
            password_hash="test_hash", # noqa: S106
            avatar_url=avatar_url
        )
        db_session.add(user)

        return {
            "id": str(user_id),
            "first_name": f"TestUser{user_number}",
            "last_name": "Integration",
            "avatar_url": avatar_url
        }

    @staticmethod
    async def create_test_board(
        db_session,
        owner_id: str,
        name: str = "Test Board"
    ) -> UUID:
        board_id = uuid4()
        board = Board(
            id=board_id,
            name=name,
            description="Board for testing",
            owner_id=owner_id
        )
        db_session.add(board)
        return board_id

    @staticmethod
    async def create_test_table(
        db_session,
        board_id: UUID,
        name: str = "Test Table"
    ) -> UUID:
        table_id = uuid4()
        table = Table(
            id=table_id,
            name=name,
            description="Table for testing",
            board_id=board_id
        )
        db_session.add(table)
        return table_id

    @staticmethod
    async def create_test_row(
        db_session,
        table_id: UUID,
        name: str = "Test Row",
        position: int = 1
    ) -> UUID:
        row_id = uuid4()
        row = Row(
            id=row_id,
            name=name,
            status=StatusEnum.NOT_STARTED,
            priority=PriorityEnum.MEDIUM,
            table_id=table_id,
            position=position
        )
        db_session.add(row)
        return row_id


class EmailTestScenarios:

    @staticmethod
    def create_task_name_change_scenario(
        board_id: str,
        table_id: str,
        row_id: str,
        actor_name: str
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
                                            "from": "Original Task Name",
                                            "to": "Updated Task Name"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    @staticmethod
    def create_status_change_scenario(
        board_id: str,
        table_id: str,
        row_id: str,
        actor_name: str
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
                                            "from": "not_started",
                                            "to": "working_on_it"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    @staticmethod
    def create_owner_assignment_scenario(
        board_id: str,
        table_id: str,
        row_id: str,
        actor_name: str,
        owner_ids: List[str]
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
                                            "from": "",
                                            "to": ",".join(owner_ids)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    @staticmethod
    def create_multiple_changes_scenario(
        board_id: str,
        table_id: str,
        row_id: str,
        actor_name: str
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
                                    "name": "Complex Task",
                                    "actions": ["updated"],
                                    "changes": {
                                        "name": {
                                            "from": "Simple Task",
                                            "to": "Complex Task"
                                        },
                                        "status": {
                                            "from": "not_started",
                                            "to": "working_on_it"
                                        },
                                        "priority": {
                                            "from": "medium",
                                            "to": "high"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }


class EmailNotificationTester:

    def __init__(self, db_session):
        self.db = db_session
        self.email_service = EmailService(db_session)
        self._setup_sandbox_recipient()

    def _setup_sandbox_recipient(self):
        async def mock_get_recipient(recipient_id: UUID):
            mock_user = User()
            mock_user.id = recipient_id
            mock_user.email = ResendSandboxConfig.get_sandbox_email("delivered", "notification_test")
            mock_user.first_name = "Test"
            mock_user.last_name = "User"
            return mock_user

        self.email_service._get_recipient = mock_get_recipient

    async def send_test_email( # noqa: PLR0913
        self,
        recipient_id: UUID,
        board_id: UUID,
        actor_id: str,
        summary: Dict[str, Any],
        test_name: str
    ) -> bool:
        print(f"📧 Sending email: {test_name}")

        try:
            success = await self.email_service.send_digest_email(
                recipient_id=recipient_id,
                board_id=board_id,
                actor_id=actor_id,
                summary=summary
            )

            if success:
                print(f"   ✅ {test_name} - Email sent successfully")
            else:
                print(f"   ❌ {test_name} - Email failed to send")

            # Rate limiting
            await asyncio.sleep(1)
            return success

        except Exception as e:
            print(f"   ❌ {test_name} - Error: {str(e)}")
            return False


class EmailNotificationVerifier:
    """Main class for verifying email notifications manually."""

    async def setup_test_data(self, db):
        """Setup test data for email notifications."""
        # Create test user
        user_data = await TestDataFactory.create_test_user(db, 1)

        # Create test board and table
        board_id = await TestDataFactory.create_test_board(db, user_data["id"])
        table_id = await TestDataFactory.create_test_table(db, board_id)

        # Create test row
        row_id = await TestDataFactory.create_test_row(db, table_id)

        await db.commit()

        return {
            "user": user_data,
            "board_id": str(board_id),
            "table_id": str(table_id),
            "row_id": str(row_id)
        }

    async def verify_basic_notification_scenarios(self, test_setup, email_tester):
        """Verify basic notification scenarios."""
        print("\n🧪 Verifying basic notification scenarios...")

        scenarios = [
            ("Task name change", EmailTestScenarios.create_task_name_change_scenario),
            ("Status change", EmailTestScenarios.create_status_change_scenario),
            ("Multiple changes", EmailTestScenarios.create_multiple_changes_scenario),
        ]

        results = []
        for scenario_name, scenario_func in scenarios:
            summary = scenario_func(
                test_setup["board_id"],
                test_setup["table_id"],
                test_setup["row_id"],
                f"{test_setup['user']['first_name']} {test_setup['user']['last_name']}"
            )

            success = await email_tester.send_test_email(
                recipient_id=test_setup["user"]["id"],
                board_id=test_setup["board_id"],
                actor_id=test_setup["user"]["id"],
                summary=summary,
                test_name=scenario_name
            )
            results.append(success)

        print(f"✅ Basic scenarios completed: {sum(results)}/{len(results)} successful")
        return all(results)

    async def verify_avatar_functionality(self, db, email_tester):
        """Verify avatar functionality with multiple users."""
        print("\n🧪 Verifying avatar functionality with 4 users...")

        # Create 4 users with avatars
        users = []
        for i in range(1, 5):
            user_data = await TestDataFactory.create_test_user(db, i, with_avatar=True)
            users.append(user_data)

        # Create test board and table
        board_id = await TestDataFactory.create_test_board(db, users[0]["id"], "Avatar Test Board")
        table_id = await TestDataFactory.create_test_table(db, board_id, "Avatar Test Table")
        row_id = await TestDataFactory.create_test_row(db, table_id, "Avatar Test Row")

        await db.commit()

        # Test scenarios
        scenarios = [
            {
                "name": "Actor avatar in header",
                "summary": {
                    "actor_name": f"{users[0]['first_name']} {users[0]['last_name']}",
                    "total_events": 1,
                    "boards": {
                        str(board_id): {
                            "tables": {
                                str(table_id): {
                                    "name": "Avatar Test Table",
                                    "rows": {
                                        str(row_id): {
                                            "name": "Avatar Test Row",
                                            "actions": ["created"],
                                            "changes": {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                "name": "Owner assignment with avatars",
                "summary": EmailTestScenarios.create_owner_assignment_scenario(
                    str(board_id),
                    str(table_id),
                    str(row_id),
                    f"{users[1]['first_name']} {users[1]['last_name']}",
                    [users[1]["id"], users[2]["id"], users[3]["id"]]
                )
            },
            {
                "name": "Multiple owner changes with avatars",
                "summary": {
                    "actor_name": f"{users[2]['first_name']} {users[2]['last_name']}",
                    "total_events": 1,
                    "boards": {
                        str(board_id): {
                            "tables": {
                                str(table_id): {
                                    "name": "Avatar Test Table",
                                    "rows": {
                                        str(row_id): {
                                            "name": "Avatar Test Row",
                                            "actions": ["updated"],
                                            "changes": {
                                                "owner_id": {
                                                    "from": f"{users[1]['id']},{users[2]['id']}",
                                                    "to": f"{users[3]['id']},{users[0]['id']}"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]

        results = []
        for scenario in scenarios:
            success = await email_tester.send_test_email(
                recipient_id=users[0]["id"],
                board_id=str(board_id),
                actor_id=users[0]["id"],
                summary=scenario["summary"],
                test_name=scenario["name"]
            )
            results.append(success)

        print("✅ Avatar functionality verification completed!")
        print("📬 Check your Resend dashboard for emails with avatars")
        return all(results)


# Standalone verification runner for manual testing
async def run_email_notification_verification():
    """Run email notification verification manually."""
    print("🚀 Starting email notification verification...")
    print("📧 Using Resend sandbox mode - emails won't count against your limits!")
    print("🔍 Check your Resend dashboard to see the test emails")
    print("⚠️  This is a MANUAL VERIFICATION script - not a unit test!")

    async with async_session_maker() as db:
        # Create verification instance
        verifier = EmailNotificationVerifier()
        email_tester = EmailNotificationTester(db)

        # Setup test data
        test_setup = await verifier.setup_test_data(db)

        # Run verifications
        basic_results = await verifier.verify_basic_notification_scenarios(test_setup, email_tester)
        avatar_results = await verifier.verify_avatar_functionality(db, email_tester)

        # Summary
        print("\n" + "="*60)
        print("📊 EMAIL NOTIFICATION VERIFICATION SUMMARY")
        print("="*60)
        print(f"Basic scenarios: {'✅ VERIFIED' if basic_results else '❌ FAILED'}")
        print(f"Avatar functionality: {'✅ VERIFIED' if avatar_results else '❌ FAILED'}")

        if basic_results and avatar_results:
            print("🎉 All email notifications verified successfully!")
            print("📬 Check your Resend dashboard to review the email formatting")
        else:
            print("⚠️  Some email notifications failed verification!")


if __name__ == "__main__":
    asyncio.run(run_email_notification_verification())
