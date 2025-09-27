from __future__ import annotations
import json
import asyncio
import time
from typing import Any, Dict, List
from collections import defaultdict

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.core.config import get_settings
from app.notification.redis_client import init_redis_pool, close_redis_pool
from app.notification.schemas import Event
from app.notification.email_service import send_digest_email
from app.notification.redis_client import _redis_pool
from app.db.database import async_session_maker


settings = get_settings()
DUE_ZSET = "notif:due"

class NotificationWorker:
    def __init__(self, db_session: AsyncSession, redis_client: redis.Redis):
        self.db = db_session
        self.redis = redis_client

    async def process_expired_windows(self) -> None:
        current_time_ms = int(time.time() * 1000)

        expired_groups = await self.redis.zrangebyscore(
            DUE_ZSET, 0, current_time_ms, withscores=True
        )

        if not expired_groups:
            return

        logger.info(f"Processing {len(expired_groups)} expired notification windows")

        for group_key, _ in expired_groups:
            try:
                if isinstance(group_key, bytes):
                    decoded_group_key = group_key.decode()
                else:
                    decoded_group_key = group_key
                await self._process_group(decoded_group_key)
                await self.redis.zrem(DUE_ZSET, decoded_group_key)
                await self.redis.delete(decoded_group_key)
            except Exception as e:
                logger.error(f"Error processing group {group_key}: {e}")

    async def _process_group(self, group_key: str) -> None:
        """Process a single notification group"""
        raw_events = await self.redis.lrange(group_key, 0, -1) # type: ignore
        if not raw_events:
            logger.info(f"📭 No events found for group {group_key}")
            return

        events = [json.loads(event) for event in raw_events]

        # Parse group key: notif:{board_id}:{actor_id}:{recipient_id}
        _, board_id, actor_id, recipient_id = group_key.split(":")

        # Summarize events
        summary = self._summarize_events(events)

        # Send notification
        await send_digest_email(
            db=self.db,
            recipient_id=recipient_id,
            board_id=board_id,
            actor_id=actor_id,
            summary=summary
        )

        logger.info(f"Sent digest email for group {group_key}")

    def _summarize_events(self, events: List[Event]) -> Dict[str, Any]:
        """Summarize events into a digestible format"""
        if not events:
            return self._empty_summary()

        summary = self._init_summary(events[0])

        for event in events:
            self._process_event(summary, event)

        summary["total_events"] = len(events)

        return dict(summary)

    def _empty_summary(self) -> Dict[str, Any]:
        """Return empty summary structure"""
        return {
            "actor_name": None,
            "total_events": 0,
            "boards": {}
        }

    def _init_summary(self, first_event: Event) -> Dict[str, Any]:
        """Initialize summary structure with first event data"""
        return {
            "actor_name": first_event.get("actor_name", "Unknown"),
            "total_events": 0,  # Will be set to len(events) later
            "boards": defaultdict(lambda: {
                "tables": defaultdict(lambda: {
                    "rows": defaultdict(lambda: {
                        "changes": defaultdict(dict),
                        "actions": [],
                        "name": "Untitled"
                    })
                })
            })
        }

    def _process_event(self, summary: Dict, event: Event) -> None:
        """Process a single event and update summary"""
        board_id = event.get("board_id")
        if not board_id:
            return

        table_id = event.get("table_id")
        row_id = event.get("row_id")

        if row_id and table_id:
            self._process_row_event(summary, event)

    def _process_row_event(self, summary: Dict, event: Event) -> None:
        """Process row-related events (created, updated, deleted)"""
        board_id = event["board_id"]
        table_id = event["table_id"]
        row_id = event["row_id"]
        event_type = event["type"]
        table_name = event.get("table_name", "Untitled Table")

        row_data = summary["boards"][board_id]["tables"][table_id]["rows"][row_id]

        if event_type == "RowCreated":
            self._add_row_action(row_data, "created", event)
        elif event_type == "RowUpdated":
            self._add_row_action(row_data, "updated", event)
            self._add_row_changes(row_data, event)
        elif event_type == "RowDeleted":
            self._add_row_action(row_data, "deleted", event)

        # Set table name from event
        summary["boards"][board_id]["tables"][table_id]["name"] = table_name


    def _add_row_action(self, row_data: Dict, action: str, event: Event) -> None:
        """Add action to row data"""
        if action not in row_data["actions"]:
            row_data["actions"].append(action)
        row_data["name"] = event.get("snapshot", {}).get("name", "Untitled")

    def _add_row_changes(self, row_data: Dict, event: Event) -> None:
        """Add field changes to row data"""
        for field, delta in event.get("delta", {}).items():
            row_data["changes"][field] = delta


async def run_worker() -> None:
    """Main worker loop"""
    logger.info("🚀 Starting notification worker...")

    try:
        # Initialize Redis pool
        await init_redis_pool()
        logger.info("✅ Worker Redis pool initialized")

        poll_interval = settings.notif_worker_poll_ms / 1000
        logger.info(f"📊 Poll interval: {poll_interval}s")

        while True:
            redis_client = None
            try:
                async with async_session_maker() as db:
                    redis_client = redis.Redis(connection_pool=_redis_pool)
                    worker = NotificationWorker(db, redis_client)
                    await worker.process_expired_windows()
            except Exception as e:
                logger.error(f"Worker error: {e}")
            finally:
                if redis_client:
                    await redis_client.aclose()

            await asyncio.sleep(poll_interval)

    except KeyboardInterrupt:
        logger.info("⏹️ Worker interrupted by user")
    except Exception as e:
        logger.error(f"❌ Worker error: {e}")
        raise
    finally:
        await close_redis_pool()
        logger.info("✅ Worker shutdown complete")


if __name__ == "__main__":
    asyncio.run(run_worker())
