import os
import asyncio
import re
import glob
from app.config import DOWNLOAD_DIR
from app.services.history_service import load_history, save_history
from app.services.notifications import notify_mac
from app.services.logger import logger
from app.services.settings_service import load_settings
from app.services.websocket_manager import manager

# Estado global Singleton
downloads = load_history()

def get_downloads():
    return downloads

def delete_download_files(d: dict):
    settings = load_settings()
    base_dir = settings.get("download_dir", DOWNLOAD_DIR)
    # We use a broad glob search since we don't know the exact subfolder it went to
    safe_title = "".join(c for c in d["title"] if c.isalnum() or c in " _-").strip()
    if not safe_title: safe_title = "Descarga"
    
    if d["is_video"]:
        for f in glob.glob(os.path.join(base_dir, "**", f"{safe_title}.*"), recursive=True):
            try: os.remove(f)
            except: pass
    else:
        url_name = d["url"].split('/')[-1].split('?')[0]
        if url_name:
            for f in glob.glob(os.path.join(base_dir, "**", f"{url_name}*"), recursive=True):
                try: os.remove(f)
                except: pass

class DynamicSemaphore:
    def __init__(self, value):
        self.value = value
        self.active = 0
        self.cond = asyncio.Condition()

    async def acquire(self):
        async with self.cond:
            await self.cond.wait_for(lambda: self.active < self.value)
            self.active += 1

    async def release(self):
        async with self.cond:
            self.active -= 1
            self.cond.notify_all()

    async def __aenter__(self):
        await self.acquire()

    async def __aexit__(self, *args):
        await self.release()

    async def set_limit(self, new_value):
        async with self.cond:
            self.value = new_value
            self.cond.notify_all()

# Inicializamos el semáforo con el valor de la configuración
initial_settings = load_settings()
download_semaphore = DynamicSemaphore(initial_settings.get("max_concurrent", 3))

async def update_semaphore_limit(new_limit: int):
    await download_semaphore.set_limit(new_limit)

def get_category_folder(d: dict, settings: dict) -> str:
    base = settings.get("download_dir", DOWNLOAD_DIR)
    
    if d["is_video"]:
        if d.get("quality") == "audio":
            cat = "Musica"
        else:
            cat = "Videos"
    else:
        url = d["url"].lower()
        if ".zip" in url or ".rar" in url or ".7z" in url or ".gz" in url:
            cat = "Comprimidos"
        elif ".pdf" in url or ".docx" in url or ".xlsx" in url:
            cat = "Documentos"
        else:
            cat = "Otros"
            
    cat_path = os.path.join(base, cat)
    os.makedirs(cat_path, exist_ok=True)
    return cat_path

async def run_download_process(did: str):
    d = downloads[did]
    
    d["status"] = "En cola"
    save_history(downloads)
    
    async with download_semaphore:
        if d.get("status") not in ["En cola", "Iniciando..."]:
            return
            
        d["status"] = "Descargando"
        manager.mark_changed()
        save_history(downloads)
        
        settings = load_settings()
        out_folder = get_category_folder(d, settings)
        speed_limit = settings.get("speed_limit", "").strip()
        
        safe_title = "".join(c for c in d["title"] if c.isalnum() or c in " _-").strip()
        if not safe_title: safe_title = "Descarga"
        
        if d["is_video"]:
            q_map = {
                "best": "bestvideo+bestaudio/best",
                "1080p": "bestvideo[height<=1080]+bestaudio/best",
                "720p": "bestvideo[height<=720]+bestaudio/best",
                "audio": "bestaudio/best"
            }
            fmt = q_map.get(d.get("quality", "best"), "bestvideo+bestaudio/best")
            
            cmd = ["yt-dlp", "-f", fmt, "--newline"]
            if speed_limit:
                cmd.extend(["--limit-rate", speed_limit])
            if d.get("quality") == "audio":
                cmd.extend(['--extract-audio', '--audio-format', 'mp3'])
            cmd.extend(["--output", os.path.join(out_folder, f"{safe_title}.%(ext)s"), d["url"]])
        else:
            cmd = ["aria2c", "-x", "16", "-s", "16", "--continue=true", "--file-allocation=none", "--summary-interval=1", "--dir", out_folder]
            if speed_limit:
                cmd.extend(["--max-overall-download-limit", speed_limit])
            cmd.append(d["url"])
            
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
            )
            d["process"] = proc
            
            import re
            loop_counter = 0
            while True:
                line = await proc.stdout.readline()
                if not line: break
                text = line.decode('utf-8', errors='ignore').strip()
                
                if d["is_video"]:
                    if "[download]" in text and "%" in text:
                        m = re.search(r'([0-9.]+)%.*?of\s+([~0-9.a-zA-Z]+).*?at\s+([0-9.a-zA-Z/]+).*?ETA\s+([0-9:]+)', text)
                        if m: 
                            d["percent"], d["size"], d["speed"], d["eta"] = m.group(1)+"%", m.group(2), m.group(3), m.group(4)
                            manager.mark_changed()
                else:
                    if "%" in text and "ETA:" in text:
                        m = re.search(r'([0-9.]+[a-zA-Z]+)/([0-9.]+[a-zA-Z]+)\(([0-9.]+)%\).*?DL:([0-9.]+[a-zA-Z]+).*?ETA:([a-zA-Z0-9]+)', text)
                        if m: 
                            d["size"], d["percent"], d["speed"], d["eta"] = m.group(2), m.group(3)+"%", m.group(4)+"/s", m.group(5)
                            manager.mark_changed()
                
                loop_counter += 1
                if loop_counter % 20 == 0: save_history(downloads)
                        
            await proc.wait()
            
            if d["status"] == "Descargando": 
                if proc.returncode == 0:
                    d["status"] = "Completado"
                    d["percent"] = "100%"
                    notify_mac("X-Download", f"¡Descarga completada!\n{safe_title}")
                else:
                    d["status"] = "Error"
                save_history(downloads)
                manager.mark_changed()
        except Exception as e:
            logger.error(f"Excepción grave en proceso {did}: {str(e)}")
            if d["status"] == "Descargando":
                d["status"] = "Error"
                save_history(downloads)
                manager.mark_changed()
