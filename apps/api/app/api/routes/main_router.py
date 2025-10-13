from typing import List, Optional, Union
from enum import Enum
from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from app.api.routes.v1.auth_route import router as auth_router
from app.api.routes.v1.user_route import router as user_router
from app.api.routes.v1.board_route import router as board_router
from app.api.routes.v1.table_route import router as table_router
from app.api.routes.v1.row_route import router as row_router
from app.api.routes.v1.health_route import router as health_router
from app.api.routes.util import use_route_names_as_operation_ids, save_openapi_yaml
from app.DI.current_user import CurrentUserDep
from app.common.errors.error_model import ErrorResponseModel


class RouteConfig:
    def __init__(  # noqa: PLR0913
        self,
        router: APIRouter,
        prefix: str,
        tags: Optional[List[Union[str, Enum]]],
        protected: bool = False,
    ) -> None:
        self.router = router
        self.prefix = prefix
        self.tags = tags if tags else []
        self.protected = protected


internal_server_error = {
    "model": ErrorResponseModel,
    "description": "Internal Server Error",
    "content": {
        "application/json": {
            "example": {
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please try again later.",
                    "details": None,
                }
            }
        }
    },
}

routes = {
    "auth": [RouteConfig(auth_router, "/auth", ["auth"])],
    "user": [RouteConfig(user_router, "/users", ["user"], protected=True)],
    "board": [RouteConfig(board_router, "/boards", ["board"], protected=True)],
    "table": [
        RouteConfig(table_router, "/boards/{board_id}/tables", ["table"], protected=True)
    ],
    "row": [
        RouteConfig(
            row_router,
            "/boards/{board_id}/tables/{table_id}/rows",
            ["row"],
            protected=True,
        ),
    ],
}


def add_routes(app: FastAPI) -> None:
    client_prefix = "/api/v1"

    for group in routes.values():
        for controller in group:
            for route in controller.router.routes:
                if isinstance(route, APIRoute):
                    route.responses.setdefault(500, internal_server_error)

            deps = []
            if controller.protected:
                deps.append(CurrentUserDep)

            app.include_router(
                controller.router,
                prefix=f"{client_prefix}{controller.prefix}",
                tags=controller.tags,
                dependencies=deps,
            )

    app.include_router(health_router, prefix=f"{client_prefix}")
    use_route_names_as_operation_ids(app)
    save_openapi_yaml(app, "openapi.yaml")
