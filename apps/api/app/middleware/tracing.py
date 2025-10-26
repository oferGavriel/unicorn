import time
import uuid
from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logger import set_trace_id, set_user_id, logger


class TracingMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
        set_trace_id(trace_id)

        user_id = getattr(request.state, "user_id", None)
        if user_id:
            set_user_id(str(user_id))

        request.state.trace_id = trace_id

        start_time = time.time()

        logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "method": request.method,
                    "path": request.url.path,
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                }
            },
        )

        try:
            response = await call_next(request)

            duration_ms = (time.time() - start_time) * 1000

            response.headers["X-Trace-ID"] = trace_id

            logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "extra_fields": {
                        "trace_id": trace_id,
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                        "user_id": user_id,
                    }
                },
            )

            return response

        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000

            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "extra_fields": {
                        "trace_id": trace_id,
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": round(duration_ms, 2),
                        "exception_type": type(exc).__name__,
                        "user_id": user_id,
                    }
                },
                exc_info=exc,
            )

            # Re-raise to let exception handlers deal with it
            raise
