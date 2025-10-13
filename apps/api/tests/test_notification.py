import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Generator, List
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi import status
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from http import HTTPStatus

from app.notification.worker import NotificationWorker
from app.notification.email_service import EmailService, EmailTemplate, send_digest_email
from app.database_models import User, Board
import pytest_asyncio
from tests.conftest import get_authenticated_client
from tests.utils.register_and_login_user import register_and_login_user
from app.main import app

@pytest.fixture(autouse=True)
def mock_notification_settings() -> Generator[None, None, None]:
    """Override notification settings for all notification tests"""
    # Create a mock settings object with test values
    mock_settings = MagicMock()
    mock_settings.notif_suppress_minutes = 0
    mock_settings.notif_window_seconds = 1
    mock_settings.notif_worker_poll_ms = 100
    mock_settings.notif_suppress_seconds = 0
    mock_settings.redis_url = "redis://localhost:6379/0"
    mock_settings.resend_api_key = "test-key"
    mock_settings.from_email = "test@example.com"
    mock_settings.from_name = "Test App"
    mock_settings.frontend_url = "http://localhost:5173"

    # Patch get_settings in all the modules that use it
    with patch('app.notification.emitter.get_settings', return_value=mock_settings), \
         patch('app.notification.worker.get_settings', return_value=mock_settings), \
         patch('app.notification.email_service.get_settings', return_value=mock_settings), \
         patch('app.core.redis.get_settings', return_value=mock_settings):
        yield

class TestWorker:
    @pytest.fixture
    def mock_db(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture
    def sample_events(self) -> List[Dict[str, Any]]:
        board_id = str(uuid4())
        table_id = str(uuid4())
        row_id = str(uuid4())
        actor_id = str(uuid4())
        return [
            {
                "type": "RowCreated",
                "actor_id": actor_id,
                "actor_name": "John Doe",
                "board_id": board_id,
                "table_id": table_id,
                "row_id": row_id,
                "at": datetime.now(timezone.utc).isoformat(),
                "snapshot": {"name": "Test Row", "status": "NOT_STARTED"},
            }
        ]

    @pytest.mark.asyncio
    async def test_no_expired_groups(self, mock_db: AsyncMock, mock_redis: AsyncMock) -> None:
        worker = NotificationWorker(mock_db, mock_redis)
        mock_redis.zrangebyscore.return_value = []

        await worker.process_expired_windows()

        mock_redis.zrangebyscore.assert_called_once()
        mock_redis.zrem.assert_not_called()
        mock_redis.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_expired_group_sends_email(
      self,
      mock_db: AsyncMock,
      mock_redis: AsyncMock,
      sample_events: List[Dict[str, Any]]
    ) -> None:
        worker = NotificationWorker(mock_db, mock_redis)

        board_id = sample_events[0]["board_id"]
        actor_id = sample_events[0]["actor_id"]
        recipient_id = str(uuid4())
        group_key = f"notif:{board_id}:{actor_id}:{recipient_id}"

        mock_redis.zrangebyscore.return_value = [(group_key.encode(), 1234567890.0)]
        mock_redis.lrange.return_value = [json.dumps(e) for e in sample_events]

        with patch("app.notification.worker.send_digest_email", new=AsyncMock()) as send_email:
            await worker.process_expired_windows()

            send_email.assert_called_once()
            mock_redis.zrem.assert_called_once_with("notif:due", group_key)
            mock_redis.delete.assert_called_once_with(group_key)

    @pytest.mark.asyncio
    async def test_process_group_empty_noop(self, mock_db: AsyncMock, mock_redis: AsyncMock) -> None:
        worker = NotificationWorker(mock_db, mock_redis)
        group_key = "notif:board:actor:recipient"
        mock_redis.lrange.return_value = []

        await worker._process_group(group_key)

        mock_redis.lrange.assert_called_once_with(group_key, 0, -1)

    @pytest.mark.asyncio
    async def test_process_expired_windows_error_handled(self, mock_db: AsyncMock, mock_redis: AsyncMock) -> None:
        worker = NotificationWorker(mock_db, mock_redis)
        group_key = "notif:board:actor:recipient"
        mock_redis.zrangebyscore.return_value = [(group_key.encode(), 1.0)]
        mock_redis.lrange.side_effect = Exception("boom")

        # Should not raise
        await worker.process_expired_windows()

    def test_summarize_events_basic(self, mock_db: AsyncMock, mock_redis: AsyncMock) -> None:
        worker = NotificationWorker(mock_db, mock_redis)
        events = [
            {
                "type": "RowCreated",
                "actor_id": "actor",
                "actor_name": "Alice",
                "board_id": "b1",
                "table_id": "t1",
                "row_id": "r1",
                "snapshot": {"name": "Row 1", "status": "NOT_STARTED"},
            }
        ]
        summary = worker._summarize_events(events)  # type: ignore
        assert summary["actor_name"] == "Alice"
        assert summary["total_events"] == len(events)
        assert "b1" in summary["boards"]
        assert "t1" in summary["boards"]["b1"]["tables"]
        assert "r1" in summary["boards"]["b1"]["tables"]["t1"]["rows"]
        assert "created" in summary["boards"]["b1"]["tables"]["t1"]["rows"]["r1"]["actions"]

    def test_summarize_events_malformed_event(self, mock_db: AsyncMock, mock_redis: AsyncMock) -> None:
        worker = NotificationWorker(mock_db, mock_redis)
        events = [{"type": "RowCreated", "board_id": "b1"}]
        summary = worker._summarize_events(events)  # type: ignore
        assert summary["total_events"] == len(events)
        assert isinstance(summary["boards"], dict)


class TestEmailService:
    """Test the EmailService class and its various email templates"""

    @pytest.fixture
    def mock_db(self) -> AsyncMock:
        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()
        db.execute = AsyncMock()
        return db

    @pytest.fixture
    def sample_user(self) -> User:
        return User(
            id=str(uuid4()),
            email="test@example.com",
            first_name="John",
            last_name="Doe",
        )

    @pytest.fixture
    def sample_board(self) -> Board:
        return Board(
            id=str(uuid4()),
            name="Test Board",
            description="Test Description",
            owner_id=str(uuid4()),
            position=1,
        )

    @pytest.mark.asyncio
    async def test_send_digest_email_success(
      self,
       mock_db: AsyncMock,
       sample_user: User,
       sample_board: Board
    ) -> None:
        """Test successful digest email sending"""
        email_service = EmailService(mock_db)

        # Mock database queries properly
        mock_result = MagicMock()
        mock_result.scalar.return_value = 1
        mock_result.scalar_one_or_none.side_effect = [sample_board, sample_user]
        mock_db.execute.return_value = mock_result

        # Mock Resend API
        with patch('resend.Emails.send') as mock_resend:
            mock_resend.return_value = {"id": "test-email-id"}

            summary = {
                "actor_name": "Alice Smith",
                "total_events": 2,
                "boards": {
                    "board1": {
                        "tables": {
                            "table1": {
                                "name": "Test Table",
                                "rows": {
                                    "row1": {
                                        "name": "Test Row",
                                        "actions": ["created"],
                                        "changes": {}
                                    }
                                }
                            }
                        }
                    }
                }
            }

            result = await email_service.send_digest_email(
                recipient_id=str(sample_user.id),
                board_id=str(sample_board.id),
                actor_id=str(uuid4()),
                summary=summary
            )

            assert result is True
            mock_resend.assert_called_once()

            # Verify notification was created
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called()

    @pytest.mark.asyncio
    async def test_send_welcome_email(self, mock_db: AsyncMock, sample_user: User) -> None:
        """Test welcome email sending"""
        email_service = EmailService(mock_db)

        # Mock database query properly
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db.execute.return_value = mock_result

        # Mock Resend API
        with patch('resend.Emails.send') as mock_resend:
            mock_resend.return_value = {"id": "welcome-email-id"}

            result = await email_service.send_welcome_email(str(sample_user.id))

            assert result is True
            mock_resend.assert_called_once()

            # Verify email content
            call_args = mock_resend.call_args[0][0]
            assert "Welcome" in call_args["subject"]
            assert sample_user.email in call_args["to"]
            assert "Welcome to" in call_args["html"]

    @pytest.mark.asyncio
    async def test_send_board_invitation_email(self, mock_db: AsyncMock, sample_user: User, sample_board: Board) -> None:
        """Test board invitation email sending"""
        email_service = EmailService(mock_db)

        # Mock database queries properly
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.side_effect = [sample_board, sample_user]
        mock_db.execute.return_value = mock_result

        # Mock Resend API
        with patch('resend.Emails.send') as mock_resend:
            mock_resend.return_value = {"id": "invitation-email-id"}

            result = await email_service.send_board_invitation(
                recipient_id=str(sample_user.id),
                board_id=str(sample_board.id),
                inviter_id=str(uuid4()),
                inviter_name="Jane Smith"
            )

            assert result is True
            mock_resend.assert_called_once()

            # Verify email content
            call_args = mock_resend.call_args[0][0]
            assert sample_board.name in call_args["subject"]
            assert "invited you to join" in call_args["subject"]
            assert "Jane Smith" in call_args["html"]

    @pytest.mark.asyncio
    async def test_send_email_recipient_not_found(self, mock_db: AsyncMock) -> None:
        """Test email sending when recipient is not found"""
        email_service = EmailService(mock_db)

        # Mock database query to return None (user not found)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await email_service.send_email(
            template=EmailTemplate.WELCOME,
            recipient_id="non-existent-id",
            subject="Test Subject",
            context={}
        )

        assert result is False
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_backward_compatibility_send_digest_email(self, mock_db: AsyncMock, sample_user: User, sample_board: Board) -> None:
        """Test backward compatibility function"""
        # Mock database queries properly
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.side_effect = [sample_board, sample_user]
        mock_db.execute.return_value = mock_result

        # Mock Resend API
        with patch('resend.Emails.send') as mock_resend:
            mock_resend.return_value = {"id": "test-email-id"}

            summary = {
                "actor_name": "Alice Smith",
                "total_events": 1,
                "boards": {}
            }

            # Test the backward compatibility function
            await send_digest_email(
                db=mock_db,
                recipient_id=str(sample_user.id),
                board_id=str(sample_board.id),
                actor_id=str(uuid4()),
                summary=summary
            )

            mock_resend.assert_called_once()


class TestNotificationServiceIntegration:
    @pytest.mark.asyncio
    async def test_emit_row_created(self, mock_redis_dependency: AsyncMock, table_with_two_members: Dict[str, Any]) -> None:
        setup = table_with_two_members
        owner_client = setup["owner_client"]
        board_id = setup["board_id"]
        table_id = setup["table_id"]

        resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={"name": "Test Row", "status": "NOT_STARTED", "priority": "MEDIUM", "position": 1},
        )
        assert resp.status_code == status.HTTP_201_CREATED

        mock_redis_dependency.pipeline.assert_called()
        pipe = mock_redis_dependency.pipeline.return_value
        pipe.rpush.assert_called()
        pipe.zadd.assert_called()
        pipe.execute.assert_called()

    @pytest.mark.asyncio
    async def test_emit_row_updated(self, mock_redis_dependency: AsyncMock, table_with_two_members: Dict[str, Any]) -> None:
        setup = table_with_two_members
        owner_client = setup["owner_client"]
        board_id = setup["board_id"]
        table_id = setup["table_id"]

        create_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={"name": "Test Row", "status": "NOT_STARTED", "priority": "MEDIUM", "position": 1},
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        row_id = create_resp.json()["id"]

        update_resp = await owner_client.patch(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
            json={"name": "Updated Test Row", "status": "working_on_it"},
        )
        assert update_resp.status_code == status.HTTP_200_OK

        mock_redis_dependency.pipeline.assert_called()
        pipe = mock_redis_dependency.pipeline.return_value
        pipe.rpush.assert_called()
        pipe.zadd.assert_called()
        pipe.execute.assert_called()


class TestTwoUserNotificationFlow:
    """Test notification flow between two users with specific emails"""

    EXPECTED_CALLS_AFTER_FIRST_ACTION = 1
    EXPECTED_CALLS_AFTER_SECOND_ACTION = 2
    EXPECTED_CALLS_AFTER_THIRD_ACTION = 3

    @pytest_asyncio.fixture
    async def two_user_setup(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Helper fixture to create two authenticated users with a shared board"""

        # Create owner
        owner_client, owner_id = await get_authenticated_client(email="ofergavri@gmail.com")

        # Create board and table
        board_resp = await owner_client.post("/api/v1/boards/", json={"name": "Test Board", "description": "Test"})
        assert board_resp.status_code == HTTPStatus.CREATED
        board_id = board_resp.json()["id"]

        table_resp = await owner_client.post(f"/api/v1/boards/{board_id}/tables/", json={"name": "Test Table", "description": "Test"})
        assert table_resp.status_code == HTTPStatus.CREATED
        table_id = table_resp.json()["id"]

        # Create member
        member_client, member_id = await get_authenticated_client(email="rotemgavriel25@gmail.com")

        # Add member to board
        add_member_resp = await owner_client.post(f"/api/v1/boards/{board_id}/members", json={"user_id": member_id, "role": "MEMBER"})
        assert add_member_resp.status_code == HTTPStatus.CREATED

        yield {
            "owner_client": owner_client,
            "owner_id": owner_id,
            "member_client": member_client,
            "member_id": member_id,
            "board_id": board_id,
            "table_id": table_id,
        }

        # Cleanup
        await owner_client.aclose()
        await member_client.aclose()

    @pytest.mark.asyncio
    async def test_two_users_get_notified_on_changes(self, db: AsyncMock, mock_redis_dependency: AsyncMock, two_user_setup: Dict[str, Any]) -> None:
        """Test that when two users work on the same board, they get notified of each other's changes"""
        setup = two_user_setup
        owner_client = setup["owner_client"]
        member_client = setup["member_client"]
        board_id = setup["board_id"]
        table_id = setup["table_id"]

        mock_redis_dependency.pipeline.reset_mock()

        create_row_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={"name": "Owner's Row", "status": "NOT_STARTED", "priority": "MEDIUM", "position": 1},
        )
        assert create_row_resp.status_code == HTTPStatus.CREATED
        row_id = create_row_resp.json()["id"]

        assert mock_redis_dependency.pipeline.call_count >= self.EXPECTED_CALLS_AFTER_FIRST_ACTION
        pipe = mock_redis_dependency.pipeline.return_value
        pipe.rpush.assert_called()
        pipe.zadd.assert_called()
        pipe.execute.assert_called()

        update_row_resp = await member_client.patch(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
            json={"name": "Updated by Member", "status": "working_on_it"},
        )
        assert update_row_resp.status_code == HTTPStatus.OK

        assert mock_redis_dependency.pipeline.call_count >= self.EXPECTED_CALLS_AFTER_SECOND_ACTION

        create_row2_resp = await member_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={"name": "Member's Row", "status": "NOT_STARTED", "priority": "HIGH", "position": 2},
        )
        assert create_row2_resp.status_code == HTTPStatus.CREATED

        assert mock_redis_dependency.pipeline.call_count >= self.EXPECTED_CALLS_AFTER_THIRD_ACTION

    @pytest.mark.asyncio
    async def test_worker_processes_notifications_and_sends_emails(self, db: AsyncMock, mock_redis_dependency: AsyncMock) -> None:
        """Test that the worker processes expired notifications and sends emails"""

        # Create two users
        transport_owner = ASGITransport(app=app)
        owner_client = AsyncClient(transport=transport_owner, base_url="http://test")
        transport_member = ASGITransport(app=app)
        member_client = AsyncClient(transport=transport_member, base_url="http://test")

        try:
            # Register users
            cookies1, owner_id = await register_and_login_user(owner_client, email="ofergavri@gmail.com")
            owner_client.cookies.set("access_token", cookies1["access_token"])
            owner_client.cookies.set("refresh_token", cookies1["refresh_token"])

            cookies2, member_id = await register_and_login_user(member_client, email="rotemgavriel25@gmail.com")
            member_client.cookies.set("access_token", cookies2["access_token"])
            member_client.cookies.set("refresh_token", cookies2["refresh_token"])

            # Create board and table
            board_resp = await owner_client.post("/api/v1/boards/", json={"name": "Test Board", "description": "Test"})
            board_id = board_resp.json()["id"]

            table_resp = await owner_client.post(f"/api/v1/boards/{board_id}/tables/", json={"name": "Test Table", "description": "Test"})
            table_id = table_resp.json()["id"]

            # Add member
            await owner_client.post(f"/api/v1/boards/{board_id}/members", json={"user_id": member_id, "role": "MEMBER"})

            # Create a row to trigger notification
            create_row_resp = await owner_client.post(
                f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
                json={"name": "Test Row", "status": "NOT_STARTED", "priority": "MEDIUM", "position": 1},
            )
            assert create_row_resp.status_code == HTTPStatus.CREATED

            # Mock Redis to return expired groups
            group_key = f"notif:{board_id}:{owner_id}:{member_id}"
            sample_events = [{
                "type": "RowCreated",
                "actor_id": owner_id,
                "actor_name": "Owner User",
                "board_id": board_id,
                "table_id": table_id,
                "row_id": create_row_resp.json()["id"],
                "at": datetime.now(timezone.utc).isoformat(),
                "snapshot": {"name": "Test Row", "status": "NOT_STARTED"},
            }]

            mock_redis_dependency.zrangebyscore.return_value = [(group_key.encode(), 1234567890.0)]
            mock_redis_dependency.lrange.return_value = [json.dumps(e) for e in sample_events]

            # Create worker and process expired windows
            worker = NotificationWorker(db, mock_redis_dependency)

            # Mock the email sending
            with patch("app.notification.worker.send_digest_email", new=AsyncMock()) as send_email:
                await worker.process_expired_windows()

                # Verify email was sent
                send_email.assert_called_once()
                args = send_email.call_args[1]
                assert args["recipient_id"] == member_id
                assert args["board_id"] == board_id
                assert args["actor_id"] == owner_id

                # Verify Redis cleanup
                mock_redis_dependency.zrem.assert_called_once_with("notif:due", group_key)
                mock_redis_dependency.delete.assert_called_once_with(group_key)

        finally:
            await owner_client.aclose()
            await member_client.aclose()

    @pytest.mark.asyncio
    async def test_notification_suppression_disabled_in_tests(self, db: AsyncMock, mock_redis_dependency: AsyncMock, two_user_setup: Dict[str, Any]) -> None:
        """Test that notification suppression is disabled in tests"""
        setup = two_user_setup
        owner_client = setup["owner_client"]
        member_client = setup["member_client"]
        board_id = setup["board_id"]
        table_id = setup["table_id"]

        # Both users make requests (simulating active users)
        await owner_client.get(f"/api/v1/boards/{board_id}")
        await member_client.get(f"/api/v1/boards/{board_id}")

        # Reset mock call count before testing
        mock_redis_dependency.pipeline.reset_mock()

        # Owner creates a row - should still notify member (suppression disabled in tests)
        create_row_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={"name": "Test Row", "status": "NOT_STARTED", "priority": "MEDIUM", "position": 1},
        )
        assert create_row_resp.status_code == HTTPStatus.CREATED

        # Verify notification was still emitted (Redis was called)
        mock_redis_dependency.pipeline.assert_called()
        pipe = mock_redis_dependency.pipeline.return_value
        pipe.rpush.assert_called()
        pipe.zadd.assert_called()
        pipe.execute.assert_called()

