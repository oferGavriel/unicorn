from __future__ import annotations
import json
import asyncio
import time
from typing import Any, Dict, List
from collections import defaultdict

import redis.asyncio as redis

from app.core.logger import logger
from app.core.config import get_settings
from app.core.redis import init_redis_pool, close_redis_pool
from app.notification.schemas import Event
from app.notification.email_service import EmailService


DUE_ZSET = "notif:due"


class NotificationWorker:
    def __init__(self, redis_client: redis.Redis, email_service: EmailService):
        self.redis = redis_client
        self.email_service = email_service

    async def process_expired_windows(self) -> None:
        current_time_ms = int(time.time() * 1000)

        expired_groups = await self.redis.zrangebyscore(
            DUE_ZSET, 0, current_time_ms, withscores=True
        )

        if not expired_groups:
            return

        logger.info(
            "worker.processing_windows",
            extra={"count": len(expired_groups)},
        )

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
                logger.error(
                    "worker.process_group_error",
                    extra={"group_key": group_key, "error": str(e)},
                )

    async def _process_group(self, group_key: str) -> None:
        raw_events = await self.redis.lrange(group_key, 0, -1)  # type: ignore
        if not raw_events:
            logger.info(
                "worker.no_events",
                extra={"group_key": group_key},
            )
            return

        events: List[Event] = [json.loads(event) for event in raw_events]

        _, board_id, actor_id, recipient_id = group_key.split(":")

        summary = self._summarize_events(events)

        settings = get_settings()
        if not settings.should_send_emails:
            logger.info(
                "worker.email_disabled",
                extra={
                    "environment": settings.environment,
                    "group_key": group_key,
                },
            )
            return

        first_event = events[0]
        board_name = first_event["board"]["name"]
        actor_name = (
            f"{first_event['actor']['first_name']} {first_event['actor']['last_name']}"
        )

        await self.email_service.send_digest_email(
            recipient_id=recipient_id,
            board_id=board_id,
            board_name=board_name,
            actor_name=actor_name,
            summary=summary,
        )

        logger.info(
            "worker.digest_sent",
            extra={
                "group_key": group_key,
                "event_count": len(events),
            },
        )

    def _summarize_events(self, events: List[Event]) -> Dict[str, Any]:
        if not events:
            return self._empty_summary()

        summary = self._init_summary(events[0])

        for event in events:
            self._process_event(summary, event)

        summary["total_events"] = len(events)

        return dict(summary)

    def _empty_summary(self) -> Dict[str, Any]:
        return {
            "actor_name": None,
            "total_events": 0,
            "boards": {},
        }

    def _init_summary(self, first_event: Event) -> Dict[str, Any]:
        actor = first_event["actor"]
        return {
            "actor_name": f"{actor['first_name']} {actor['last_name']}",
            "total_events": 0,
            "boards": defaultdict(
                lambda: {
                    "tables": defaultdict(
                        lambda: {
                            "name": "Untitled Table",
                            "rows": defaultdict(
                                lambda: {
                                    "name": "Untitled",
                                    "actions": [],
                                    "changes": {},
                                }
                            ),
                        }
                    )
                }
            ),
        }

    def _process_event(self, summary: Dict, event: Event) -> None:
        board_id = event["board"]["id"]
        table_id = event["table"]["id"]
        row_id = event.get("row_id")

        if not row_id:
            return

        row_data = summary["boards"][board_id]["tables"][table_id]["rows"][row_id]

        summary["boards"][board_id]["tables"][table_id]["name"] = event["table"]["name"]

        event_type = event["type"]
        if event_type == "RowCreated":
            self._add_action(row_data, "created")
        elif event_type == "RowUpdated":
            self._add_action(row_data, "updated")
            self._add_changes(row_data, event)
        elif event_type == "RowDeleted":
            self._add_action(row_data, "deleted")

        if "snapshot" in event:
            row_data["name"] = event["snapshot"].get("name", "Untitled")

    def _add_action(self, row_data: Dict, action: str) -> None:
        if action not in row_data["actions"]:
            row_data["actions"].append(action)

    def _add_changes(self, row_data: Dict, event: Event) -> None:
        delta = event.get("delta", {})

        for field_name, field_delta in delta.items():
            row_data["changes"][field_name] = {
                "from_value": field_delta["from_value"],
                "to_value": field_delta["to_value"],
            }


async def run_worker() -> None:
    logger.info("worker.starting")

    try:
        await init_redis_pool()
        logger.info("worker.redis_initialized")

        settings = get_settings()
        poll_interval = settings.notif_worker_poll_ms / 1000
        logger.info(
            "worker.config",
            extra={"poll_interval_sec": poll_interval},
        )

        while True:
            redis_client = None
            try:
                settings = get_settings()
                redis_client = redis.Redis.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )

                email_service = EmailService()

                worker = NotificationWorker(redis_client, email_service)

                await worker.process_expired_windows()

            except Exception as e:
                logger.error(
                    "worker.loop_error",
                    extra={"error": str(e)},
                )
            finally:
                if redis_client:
                    await redis_client.aclose()

            await asyncio.sleep(poll_interval)

    except KeyboardInterrupt:
        logger.info("worker.interrupted")
    except Exception as e:
        logger.error(
            "worker.fatal_error",
            extra={"error": str(e)},
        )
        raise
    finally:
        await close_redis_pool()
        logger.info("worker.shutdown_complete")


if __name__ == "__main__":
    asyncio.run(run_worker())
