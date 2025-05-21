import os
import yaml

from fastapi import FastAPI
from fastapi.routing import APIRoute


def use_route_names_as_operation_ids(application: FastAPI) -> None:
    for route in application.routes:
        if isinstance(route, APIRoute):
            api_route: APIRoute = route
            route.operation_id = api_route.name


def save_openapi_yaml(_app: FastAPI, file_name: str) -> None:
    use_route_names_as_operation_ids(_app)

    if not os.path.exists("openapi_specs"):
        os.makedirs("openapi_specs")

    path = os.path.join("openapi_specs", file_name)
    openapi_data = _app.openapi()

    with open(path, "w", encoding="utf-8") as file:
        yaml.dump(openapi_data, file)
