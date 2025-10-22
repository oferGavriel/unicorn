import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Generator, List
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from http import HTTPStatus

from app.notification.worker import NotificationWorker
from app.notification.email_service import EmailService
from app.notification.schemas import (
    Event,
    BoardContext,
    TableContext,
    UserSnapshot,
    Snapshot,
)
from app.database_models import User, Board
import pytest_asyncio
from tests.conftest import get_authenticated_client


@pytest.fixture(autouse=True)
def mock_notification_settings() -> Generator[None, None, None]:
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

    with (
        patch("app.notification.emitter.get_settings", return_value=mock_settings),
        patch("app.notification.worker.get_settings", return_value=mock_settings),
        patch("app.notification.email_service.get_settings", return_value=mock_settings),
        patch("app.core.redis.get_settings", return_value=mock_settings),
    ):
        yield


class TestWorker:
    @pytest.fixture
    def mock_redis(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture
    def mock_email_service(self) -> AsyncMock:
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
                "board": {"id": board_id, "name": "Test Board"},
                "table": {"id": table_id, "name": "Test Table", "board_id": board_id},
                "actor": {
                    "id": actor_id,
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john@example.com",
                },
                "row_id": row_id,
                "at": datetime.now(timezone.utc).isoformat(),
                "snapshot": {"name": "Test Row", "status": "NOT_STARTED"},
            }
        ]

    @pytest.mark.asyncio
    async def test_no_expired_groups(
        self, mock_redis: AsyncMock, mock_email_service: AsyncMock
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)
        mock_redis.zrangebyscore.return_value = []

        await worker.process_expired_windows()

        mock_redis.zrangebyscore.assert_called_once()
        mock_redis.zrem.assert_not_called()
        mock_redis.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_expired_group_sends_email(
        self,
        mock_redis: AsyncMock,
        mock_email_service: AsyncMock,
        sample_events: List[Dict[str, Any]],
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)

        board_id = sample_events[0]["board"]["id"]
        actor_id = sample_events[0]["actor"]["id"]
        recipient_id = str(uuid4())
        group_key = f"notif:{board_id}:{actor_id}:{recipient_id}"

        mock_redis.zrangebyscore.return_value = [(group_key.encode(), 1234567890.0)]
        mock_redis.lrange.return_value = [json.dumps(e) for e in sample_events]

        mock_email_service.send_digest_email = AsyncMock(return_value=True)

        await worker.process_expired_windows()

        mock_email_service.send_digest_email.assert_called_once()
        call_args = mock_email_service.send_digest_email.call_args[1]
        assert call_args["recipient_id"] == recipient_id
        assert call_args["board_id"] == board_id
        assert call_args["board_name"] == "Test Board"
        assert call_args["actor_name"] == "John Doe"

        mock_redis.zrem.assert_called_once_with("notif:due", group_key)
        mock_redis.delete.assert_called_once_with(group_key)

    @pytest.mark.asyncio
    async def test_process_group_empty_noop(
        self, mock_redis: AsyncMock, mock_email_service: AsyncMock
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)
        group_key = "notif:board:actor:recipient"
        mock_redis.lrange.return_value = []

        await worker._process_group(group_key)

        mock_redis.lrange.assert_called_once_with(group_key, 0, -1)

    @pytest.mark.asyncio
    async def test_process_expired_windows_error_handled(
        self, mock_redis: AsyncMock, mock_email_service: AsyncMock
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)
        group_key = "notif:board:actor:recipient"
        mock_redis.zrangebyscore.return_value = [(group_key.encode(), 1.0)]
        mock_redis.lrange.side_effect = Exception("boom")

        await worker.process_expired_windows()

    def test_summarize_events_basic(
        self, mock_redis: AsyncMock, mock_email_service: AsyncMock
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)
        board_id = "b1"
        table_id = "t1"
        row_id = "r1"
        at = datetime.now(timezone.utc).isoformat()
        events: List[Event] = [
            Event(
                type="RowCreated",
                board=BoardContext(id=board_id, name="Board 1"),
                table=TableContext(id=table_id, name="Table 1", board_id=board_id),
                actor=UserSnapshot(
                    id="actor",
                    first_name="Alice",
                    last_name="Smith",
                    email="alice@example.com",
                ),
                at=at,
                row_id=row_id,
                snapshot=Snapshot(name="Row 1", status="NOT_STARTED"),
            )
        ]
        summary = worker._summarize_events(events)
        assert summary["actor_name"] == "Alice Smith"
        assert summary["total_events"] == len(events)
        assert board_id in summary["boards"]
        assert table_id in summary["boards"][board_id]["tables"]
        assert row_id in summary["boards"][board_id]["tables"][table_id]["rows"]
        assert (
            "created"
            in summary["boards"][board_id]["tables"][table_id]["rows"][row_id]["actions"]
        )

    def test_summarize_events_with_changes(
        self, mock_redis: AsyncMock, mock_email_service: AsyncMock
    ) -> None:
        worker = NotificationWorker(mock_redis, mock_email_service)
        board_id = "b1"
        table_id = "t1"
        row_id = "r1"
        at = datetime.now(timezone.utc).isoformat()
        events: List[Event] = [
            Event(
                type="RowUpdated",
                board=BoardContext(id=board_id, name="Board 1"),
                table=TableContext(id=table_id, name="Table 1", board_id=board_id),
                actor=UserSnapshot(
                    id="actor",
                    first_name="Alice",
                    last_name="Smith",
                    email="alice@example.com",
                ),
                at=at,
                row_id=row_id,
                snapshot=Snapshot(name="Row 1", status="working_on_it"),
                changed=["status"],
                delta={
                    "status": {"from_value": "not_started", "to_value": "working_on_it"}
                },
            ),
        ]
        summary = worker._summarize_events(events)
        assert summary["total_events"] == 1
        changes = summary["boards"][board_id]["tables"][table_id]["rows"][row_id][
            "changes"
        ]
        assert "status" in changes
        assert changes["status"]["from_value"] == "not_started"
        assert changes["status"]["to_value"] == "working_on_it"


class TestEmailService:
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
        self, mock_db: AsyncMock, sample_user: User, sample_board: Board
    ) -> None:
        email_service = EmailService(mock_db)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db.execute.return_value = mock_result

        board_id = str(sample_board.id)
        summary = {
            "actor_name": "Jane Doe",
            "total_events": 1,
            "boards": {
                board_id: {
                    "tables": {
                        "table1": {
                            "name": "Table 1",
                            "rows": {
                                "row1": {
                                    "name": "Row 1",
                                    "actions": ["created"],
                                    "changes": {},
                                }
                            },
                        }
                    }
                }
            },
        }

        with patch("app.notification.email_service.resend.Emails.send") as mock_send:
            mock_send.return_value = {"id": "email-123"}

            success = await email_service.send_digest_email(
                recipient_id=str(sample_user.id),
                board_id=board_id,
                board_name=sample_board.name,
                actor_name="Jane Doe",
                summary=summary,
            )

            assert success is True
            mock_send.assert_called_once()

            call_args = mock_send.call_args[0][0]
            assert call_args["to"] == [sample_user.email]
            assert sample_board.name in call_args["subject"]

    @pytest.mark.asyncio
    async def test_send_digest_email_recipient_not_found(
        self, mock_db: AsyncMock
    ) -> None:
        email_service = EmailService(mock_db)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        success = await email_service.send_digest_email(
            recipient_id=str(uuid4()),
            board_id=str(uuid4()),
            board_name="Test Board",
            actor_name="Jane Doe",
            summary={"actor_name": "Jane", "total_events": 0, "boards": {}},
        )

        assert success is False


class TestIntegrationNotificationFlow:
    @pytest_asyncio.fixture
    async def two_user_setup(self) -> AsyncGenerator[Dict[str, Any], None]:
        owner_client, owner_id = await get_authenticated_client(
            email="ofergavri@gmail.com"
        )

        board_resp = await owner_client.post(
            "/api/v1/boards/", json={"name": "Test Board", "description": "Test"}
        )
        assert board_resp.status_code == HTTPStatus.CREATED
        board_id = board_resp.json()["id"]

        table_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/",
            json={"name": "Test Table", "description": "Test"},
        )
        assert table_resp.status_code == HTTPStatus.CREATED
        table_id = table_resp.json()["id"]

        member_client, member_id = await get_authenticated_client(
            email="rotemgavriel25@gmail.com"
        )

        add_member_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/members",
            json={"user_id": member_id, "role": "MEMBER"},
        )
        assert add_member_resp.status_code == HTTPStatus.CREATED

        yield {
            "owner_client": owner_client,
            "owner_id": owner_id,
            "member_client": member_client,
            "member_id": member_id,
            "board_id": board_id,
            "table_id": table_id,
        }

        await owner_client.aclose()
        await member_client.aclose()

    @pytest.mark.asyncio
    async def test_two_users_get_notified_on_changes(
        self, mock_redis_dependency: AsyncMock, two_user_setup: Dict[str, Any]
    ) -> None:
        setup = two_user_setup
        owner_client = setup["owner_client"]
        board_id = setup["board_id"]
        table_id = setup["table_id"]

        mock_redis_dependency.pipeline.reset_mock()

        create_row_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
            json={
                "name": "Owner's Row",
                "status": "NOT_STARTED",
                "priority": "MEDIUM",
                "position": 1,
            },
        )
        assert create_row_resp.status_code == HTTPStatus.CREATED

        pipe = mock_redis_dependency.pipeline.return_value
        pipe.rpush.assert_called()
        pipe.zadd.assert_called()
        pipe.execute.assert_called()
