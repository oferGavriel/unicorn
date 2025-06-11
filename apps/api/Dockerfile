FROM python:3.12-slim as base

RUN addgroup --system --gid 1000 app && \
  adduser --system --uid 1000 --group app

WORKDIR /app

RUN pip3 install poetry
RUN poetry config virtualenvs.create false

COPY apps/api/pyproject.toml apps/api/poetry.lock ./

RUN poetry install --no-root

USER root

COPY apps/api/ .

RUN chmod +x run.sh

RUN chmod -R 777 app/db/migrations/versions

RUN mkdir -p logs openapi_specs && chown -R app:app logs openapi_specs

RUN ls -l

RUN chown -R app $HOME

USER app

EXPOSE 8000

CMD ["bash", "/app/run.sh"]

# # System deps & debugpy
# RUN apt-get update \
#   && apt-get install -y build-essential libpq-dev curl \
#   && rm -rf /var/lib/apt/lists/* \
#   && pip install debugpy

# # Poetry
# ENV POETRY_VERSION=1.8.2
# RUN pip install "poetry==${POETRY_VERSION}"

# # Copy only descriptors first for layer caching
# WORKDIR /code
# COPY apps/api/pyproject.toml apps/api/poetry.lock* /code/

# # Install deps
# RUN poetry config virtualenvs.create false && poetry install --no-root --only main

# # Copy source
# COPY apps/api /code

# EXPOSE 8000 8000

# CMD ["sh", "-c", "\
#   alembic upgrade head && \
#   uvicorn app.main:app \
#   --host 0.0.0.0 --port 8000 --reload"]

# # CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
