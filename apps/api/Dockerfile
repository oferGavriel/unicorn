FROM python:3.12-slim

# System deps
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Poetry
ENV POETRY_VERSION=1.8.2
RUN pip install "poetry==${POETRY_VERSION}"

# Copy only descriptors first for layer caching
WORKDIR /code
COPY apps/api/pyproject.toml apps/api/poetry.lock* /code/

# Install deps
RUN poetry config virtualenvs.create false && poetry install --no-root --only main

# Copy source
COPY apps/api /code

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]