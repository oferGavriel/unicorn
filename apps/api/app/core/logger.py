import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from datetime import datetime

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

log_file = LOG_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

file_handler = TimedRotatingFileHandler(
    filename=log_file, when="midnight", interval=1, backupCount=7, encoding="utf-8"
)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

for noisy in (
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "watchgod",
    "watchfiles.main",
):
    logging.getLogger(noisy).setLevel(logging.WARNING)

logger = logging.getLogger("app")
