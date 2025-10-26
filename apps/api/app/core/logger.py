"""
Enhanced structured logging with JSON output and trace ID support.
This replaces the existing logger.py
"""
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
from contextvars import ContextVar

# Context variable to store trace_id across async requests
trace_id_var: ContextVar[str | None] = ContextVar("trace_id", default=None)
user_id_var: ContextVar[str | None] = ContextVar("user_id", default=None)


class StructuredFormatter(logging.Formatter):

    def format(self, record: logging.LogRecord) -> str:
        # Base log entry
        log_entry: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        trace_id = trace_id_var.get()
        if trace_id:
            log_entry["trace_id"] = trace_id

        user_id = user_id_var.get()
        if user_id:
            log_entry["user_id"] = user_id

        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        reserved_attrs = {
            "name",
            "msg",
            "args",
            "created",
            "filename",
            "funcName",
            "levelname",
            "levelno",
            "lineno",
            "module",
            "msecs",
            "message",
            "pathname",
            "process",
            "processName",
            "relativeCreated",
            "thread",
            "threadName",
            "exc_info",
            "exc_text",
            "stack_info",
            "extra_fields",
        }
        for key, value in record.__dict__.items():
            if key not in reserved_attrs and not key.startswith("_"):
                log_entry[key] = value

        return json.dumps(log_entry)


def setup_logging() -> logging.Logger:
    """
    Setup application logging with structured JSON format.
    """
    LOG_DIR = Path("logs")
    LOG_DIR.mkdir(exist_ok=True)

    json_formatter = StructuredFormatter()

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(json_formatter)
    console_handler.setLevel(logging.INFO)

    log_file = LOG_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"
    file_handler = logging.FileHandler(filename=log_file, encoding="utf-8")
    file_handler.setFormatter(json_formatter)
    file_handler.setLevel(logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    for noisy_logger in (
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "watchfiles.main",
        "watchgod",
    ):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    app_logger = logging.getLogger("app")

    return app_logger


logger = setup_logging()


def set_trace_id(trace_id: str) -> None:
    trace_id_var.set(trace_id)


def get_trace_id() -> str | None:
    return trace_id_var.get()


def set_user_id(user_id: str) -> None:
    user_id_var.set(user_id)


def get_user_id() -> str | None:
    return user_id_var.get()


def log_with_context(
    level: str,
    message: str,
    **extra_fields: Any,
) -> None:
    log_func = getattr(logger, level.lower())

    if trace_id := get_trace_id():
        extra_fields["trace_id"] = trace_id
    if user_id := get_user_id():
        extra_fields["user_id"] = user_id

    log_func(message, extra={"extra_fields": extra_fields})
