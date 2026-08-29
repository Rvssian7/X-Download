import os
import asyncio
import re
import glob
from app.config import DOWNLOAD_DIR
from app.services.history_service import load_history, save_history
from app.services.notifications import notify_mac
from app.services.logger import logger
from app.services.notifications import notify_mac

# Estado global Singleton
downloads = load_history()

def get_downloads():
    return downloads

def delete_download_files(d: dict):
    safe_title = "".join(c for c in d["title"] if c.isalnum() or c in " _-").strip()
    if not safe_title: safe_title = "Descarga"
    
    if d["is_video"]:
        for f in glob.glob(os.path.join(DOWNLOAD_DIR, f"{safe_title}.*")):
            try: os.remove(f)
            except: pass
    else:
        url_name = d["url"].split('/')[-1].split('?')[0]
        if url_name:
            for f in glob.glob(os.path.join(DOWNLOAD_DIR, f"{url_name}*")):
                try: os.remove(f)
                except: pass

MAX_CONCURRENT_DOWNLOADS = 3
download_semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)

async def run_download_process(did: str):
    d = downloads[did]
    
    d["status"] = "En cola"
    save_history(downloads)
    
    async with download_semaphore:
        # Si el usuario lo pausó o canceló mientras estaba en la cola, abortamos
        if d.get("status") not in ["En cola", "Iniciando..."]:
            return
            
        d["status"] = "Descargando"
        save_history(downloads)
        
        safe_title = "".join(c for c in d["title"] if c.isalnum() or c in " _-").strip()
    if not safe_title: safe_title = "Descarga"
    
    if d["is_video"]:
        qual = d.get("quality", "best")
        if qual == "1080p": f = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'
        elif qual == "720p": f = 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'
        elif qual == "audio": f = 'bestaudio/best'
        else: f = 'bestvideo+bestaudio/best'
        
        cmd = ['yt-dlp', '-o', os.path.join(DOWNLOAD_DIR, f"{safe_title}.%(ext)s"), '-f', f]
        if qual == "audio":
            cmd += ['--extract-audio', '--audio-format', 'mp3']
        cmd += ['--newline', d["url"]]
    else:
        cmd = ['aria2c', '--dir', DOWNLOAD_DIR, '-x', '16', '-s', '16', '-k', '1M', '--continue=true', d["url"]]
        
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
        )
        d["process"] = proc
        
        loop_counter = 0
        while True:
            line = await proc.stdout.readline()
            if not line: break
            text = line.decode('utf-8', errors='ignore').strip()
            
            if d["is_video"]:
                if "[download]" in text and "%" in text:
                    m = re.search(r'([0-9.]+)%.*?of\s+([~0-9.a-zA-Z]+).*?at\s+([0-9.a-zA-Z/]+).*?ETA\s+([0-9:]+)', text)
                    if m: d["percent"], d["size"], d["speed"], d["eta"] = m.group(1)+"%", m.group(2), m.group(3), m.group(4)
            else:
                if "%" in text and "ETA:" in text:
                    m = re.search(r'([0-9.]+[a-zA-Z]+)/([0-9.]+[a-zA-Z]+)\(([0-9.]+)%\).*?DL:([0-9.]+[a-zA-Z]+).*?ETA:([a-zA-Z0-9]+)', text)
                    if m: d["size"], d["percent"], d["speed"], d["eta"] = m.group(2), m.group(3)+"%", m.group(4)+"/s", m.group(5)
            
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
    except Exception as e:
        logger.error(f"Excepción grave en proceso {did}: {str(e)}")
        if d["status"] == "Descargando":
            d["status"] = "Error"
            save_history(downloads)
