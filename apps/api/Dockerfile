FROM python:3.12.8-slim
WORKDIR /app

ARG ENV=dev
ENV ENV=$ENV

RUN apt-get update && apt-get install -y gcc libpq-dev curl && apt-get clean

COPY apps/api/pyproject.toml apps/api/poetry.lock* ./

RUN pip install --upgrade pip \
 && pip install poetry \
 && poetry config virtualenvs.create false \
 && if [ "$ENV" = "prod" ]; then \
      poetry install --no-interaction --no-ansi --only main --no-root; \
    else \
      poetry install --no-interaction --no-ansi --with dev --no-root; \
    fi

  COPY apps/api /app
COPY apps/api/app/core/config.py /app/core/config.py

RUN chmod +x /app/run.sh /app/prestart.sh

EXPOSE 8000
CMD ["/app/run.sh"]
