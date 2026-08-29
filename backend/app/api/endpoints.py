import uuid
import asyncio
from fastapi import APIRouter
from app.models.schemas import ActionRequest, DownloadRequest
from app.services.download_manager import get_downloads, save_history, run_download_process, delete_download_files
from app.services.logger import logger

router = APIRouter()

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
            "quality": v.get("quality", "best")
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
            
    elif req.action == "resume":
        if d["status"] in ["Pausado", "Error", "Cancelado"]:
            d["status"] = "Iniciando..."
            logger.info(f"Reanudando descarga {req.id}")
            asyncio.create_task(run_download_process(req.id))
            save_history(downloads)
            
    elif req.action == "start_video":
        d["status"] = "Iniciando..."
        d["quality"] = req.quality
        logger.info(f"Iniciando video {req.id} con calidad {req.quality}")
        asyncio.create_task(run_download_process(req.id))
        save_history(downloads)
            
    return {"status": "ok"}

@router.post("/download")
async def download(req: DownloadRequest):
    logger.info(f"Nueva solicitud de descarga recibida: {req.url} (Video: {req.is_video})")
    downloads = get_downloads()
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
        "quality": "best"
    }
    save_history(downloads)
    if not req.is_video:
        asyncio.create_task(run_download_process(did))
    return {"status": "started", "id": did}
