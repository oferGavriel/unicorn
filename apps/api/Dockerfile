FROM python:3.12.8-slim as base

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
