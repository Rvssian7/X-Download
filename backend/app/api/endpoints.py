import uuid
import asyncio
from fastapi import APIRouter
from app.models.schemas import ActionRequest, DownloadRequest, SettingsRequest
from app.services.download_manager import get_downloads, save_history, run_download_process, delete_download_files
from app.services.websocket_manager import manager
from app.services.logger import logger
from datetime import datetime

router = APIRouter()
downloads = get_downloads()

@router.get("/ping")
def ping():
    return {"status": "ok"}

@router.get("/progress")
def get_progress():
    downloads = get_downloads()
    res = {}
    for k, v in downloads.items():
        res[k] = {
            "url": v["url"],
            "title": v.get("title", "Descarga"),
            "status": v["status"],
            "percent": v.get("percent", "0%"),
            "speed": v.get("speed", ""),
            "eta": v.get("eta", ""),
            "size": v.get("size", ""),
            "is_video": v["is_video"],
            "quality": v.get("quality", "best"),
            "created_at": v.get("created_at", "")
        }
    return res

@router.post("/action")
async def handle_action(req: ActionRequest):
    logger.info(f"Acción recibida: {req.action} para ID: {req.id}")
    downloads = get_downloads()
    d = downloads.get(req.id)
    if not d:
        logger.warning(f"Intento de acción en descarga inexistente: {req.id}")
        return {"status": "error"}
    
    if req.action in ["cancel", "pause", "delete"]:
        if d.get("process"):
            try: 
                d["process"].kill()
                logger.info(f"Proceso asesinado exitosamente para {req.id}")
            except Exception as e: 
                logger.error(f"Error al matar proceso {req.id}: {str(e)}")
            
        if req.action == "pause":
            d["status"] = "Pausado"
        elif req.action == "cancel":
            d["status"] = "Cancelado"
            
        if req.action == "delete":
            logger.info(f"Borrando archivos físicos para {req.id}")
            delete_download_files(d)
            del downloads[req.id]
            
        save_history(downloads)
        manager.mark_changed()
            
    elif req.action == "resume":
        if d["status"] in ["Pausado", "Error", "Cancelado"]:
            d["status"] = "Iniciando..."
            logger.info(f"Reanudando descarga {req.id}")
            asyncio.create_task(run_download_process(req.id))
            save_history(downloads)
            manager.mark_changed()
            
    elif req.action == "start_video":
        d["status"] = "Iniciando..."
        d["quality"] = req.quality
        logger.info(f"Iniciando video {req.id} con calidad {req.quality}")
        asyncio.create_task(run_download_process(req.id))
        save_history(downloads)
        manager.mark_changed()
            
    return {"status": "ok"}

@router.post("/download")
async def download(req: DownloadRequest):
    # Smart GitHub detection centralizada en el servidor
    if req.url.startswith("https://github.com/") and not req.url.endswith(".zip") and "/releases/" not in req.url:
        import re
        match = re.match(r'^https://github\.com/([^/]+)/([^/?#]+)', req.url)
        if match:
            repo_path = f"{match.group(1)}/{match.group(2)}"
            if repo_path.endswith(".git"): 
                repo_path = repo_path[:-4]
            req.url = f"https://github.com/{repo_path}/archive/refs/heads/main.zip"
            req.title = repo_path + " (Código Fuente)"
            req.is_video = False

    logger.info(f"Nueva solicitud de descarga recibida: {req.url} (Video: {req.is_video})")
    downloads = get_downloads()
    
    # 🛡️ Escudo Anti-Colisión: Prevenir descargas duplicadas simultáneas
    active_statuses = ["En cola", "Iniciando...", "Esperando Calidad", "Descargando"]
    for existing_id, d_info in downloads.items():
        if d_info.get("url") == req.url and d_info.get("status") in active_statuses:
            logger.warning(f"Colisión evitada: La URL {req.url} ya está activa.")
            return {"status": "started", "id": existing_id} # Fingimos éxito para calmar al frontend
            
    did = str(uuid.uuid4())
    status = "Esperando Calidad" if req.is_video else "Iniciando..."
    downloads[did] = {
        "url": req.url,
        "is_video": req.is_video,
        "title": req.title,
        "status": status,
        "process": None,
        "percent": "0%",
        "speed": "",
        "eta": "",
        "size": "",
        "quality": "best",
        "created_at": datetime.now().strftime("%d/%m/%Y %H:%M")
    }
    save_history(downloads)
    if not req.is_video:
        asyncio.create_task(run_download_process(did))
    manager.mark_changed()
    return {"status": "started", "id": did}

from app.services.settings_service import load_settings, save_settings
from app.services.download_manager import update_semaphore_limit

@router.get("/settings")
def get_settings():
    return load_settings()

@router.post("/settings")
async def update_settings(req: SettingsRequest):
    settings = load_settings()
    settings["download_dir"] = req.download_dir
    settings["max_concurrent"] = max(1, req.max_concurrent)
    settings["speed_limit"] = req.speed_limit
    save_settings(settings)
    await update_semaphore_limit(settings["max_concurrent"])
    return {"status": "ok"}
