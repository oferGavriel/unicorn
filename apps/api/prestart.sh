#! /usr/bin/env bash

# Path: prestart.sh
cd /app

# Let the DB start
python -m app.scripts.backend_pre_start

# Run migrations
alembic upgrade head

# Create initial data in DB
# python ./app/scripts/initial_data.py
