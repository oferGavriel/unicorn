from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable, Awaitable
import time

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

http_requests_in_progress = Gauge(
    "http_requests_in_progress",
    "Number of HTTP requests in progress",
    ["method", "endpoint"],
)

http_exceptions_total = Counter(
    "http_exceptions_total",
    "Total HTTP exceptions",
    ["method", "endpoint", "exception_type"],
)


class PrometheusMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        path = self._normalize_path(request.url.path)

        http_requests_in_progress.labels(method=method, endpoint=path).inc()

        start_time = time.time()
        status_code = 500  # Default in case of unhandled exception

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response

        except Exception as exc:
            http_exceptions_total.labels(
                method=method,
                endpoint=path,
                exception_type=type(exc).__name__,
            ).inc()
            raise

        finally:
            duration = time.time() - start_time

            http_requests_total.labels(
                method=method,
                endpoint=path,
                status_code=status_code,
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=path,
            ).observe(duration)

            http_requests_in_progress.labels(method=method, endpoint=path).dec()

    @staticmethod
    def _normalize_path(path: str) -> str:
        parts = path.split("/")
        normalized_parts = []

        for i, part in enumerate(parts):
            if part and (
                part.isdigit()
                or "-" in part
                or (len(part) > 20 and part.isalnum())
            ):
                normalized_parts.append("{id}")
            else:
                normalized_parts.append(part)

        return "/".join(normalized_parts)


async def metrics_endpoint(request: Request) -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
