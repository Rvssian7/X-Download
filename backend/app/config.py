import os

DOWNLOAD_DIR = os.path.expanduser("~/Downloads/X-Download")
HISTORY_FILE = os.path.expanduser("~/Downloads/X-Download/history.json")

os.makedirs(DOWNLOAD_DIR, exist_ok=True)
