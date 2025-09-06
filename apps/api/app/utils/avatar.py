from uuid import UUID
from urllib.parse import quote_plus
from app.core.config import get_settings

settings = get_settings()
CLOUD = settings.cloudinary_cloud_name
FOLDER = settings.cloudinary_folder
BASE_IMG = settings.cloudinary_base


PASTELS = [
    "AA47BD",
    "7B1EA2",
    "77919C",
    "455A65",
    "EB417A",
    "C1185C",
    "5D69C1",
    "0588D2",
    "00569B",
    "0098A6",
    "BF360D",
    "679F39",
    "8C6E63",
    "004C40",
    "33691D",
    "F5511E",
]


def _initials(first: str, last: str) -> str:
    return f"{first[:1]}{last[:1]}".upper() if last else first[:1].upper()


def _colour(user_id: UUID) -> str:
    return PASTELS[user_id.int % len(PASTELS)]


def avatar_url(first: str, last: str, user_id: UUID, size: int = 128) -> str:
    text = quote_plus(_initials(first, last))
    bg = _colour(user_id)
    font_size = int(size * 0.46)

    text_layer = f"l_text:Arial_{font_size}:{text},co_rgb:ffffff,g_center"
    opts = f"w_{size},h_{size},c_fill,r_max,b_rgb:{bg}/{text_layer}"

    return f"https://res.cloudinary.com/{CLOUD}/image/upload/{opts}/{FOLDER}/{BASE_IMG}"
