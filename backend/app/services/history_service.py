import json
import os
from app.config import HISTORY_FILE

def load_history():
    downloads = {}
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                downloads = json.load(f)
                for k, d in downloads.items():
                    if d["status"] in ["Descargando", "Iniciando...", "En cola"]:
                        d["status"] = "Pausado"
                    d["process"] = None
        except Exception:
            pass
    return downloads

def save_history(downloads: dict):
    safe_dict = {}
    for k, v in downloads.items():
        safe_dict[k] = {key: val for key, val in v.items() if key != "process"}
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(safe_dict, f)
    except Exception:
        pass
