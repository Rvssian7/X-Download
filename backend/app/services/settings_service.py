import json
import os
from app.config import DOWNLOAD_DIR
from app.services.logger import logger

SETTINGS_FILE = os.path.join(DOWNLOAD_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "download_dir": DOWNLOAD_DIR,
    "max_concurrent": 3,
    "speed_limit": ""
}

def load_settings() -> dict:
    if not os.path.exists(SETTINGS_FILE):
        save_settings(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
    try:
        with open(SETTINGS_FILE, 'r') as f:
            data = json.load(f)
            # Merge with defaults in case of missing keys
            return {**DEFAULT_SETTINGS, **data}
    except Exception as e:
        logger.error(f"Error cargando settings: {e}")
        return DEFAULT_SETTINGS

def save_settings(settings: dict):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=4)
    except Exception as e:
        logger.error(f"Error guardando settings: {e}")
