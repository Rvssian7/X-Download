import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from app.api import endpoints
from app.config import DOWNLOAD_DIR
from app.services.websocket_manager import manager
from app.services.download_manager import get_downloads
from app.services.logger import logger

app = FastAPI(title="X-Download")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router)

templates = Jinja2Templates(directory="templates")

async def progress_broadcaster():
    logger.info("Iniciando tarea en segundo plano: Broadcasting WebSockets (Basado en Eventos)")
    while True:
        try:
            await manager.state_changed.wait()
            manager.state_changed.clear()
            
            if manager.active_connections:
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
                await manager.broadcast_progress(res)
        except Exception as e:
            logger.error(f"Error en WebSocket broadcaster: {str(e)}")
        
        # Throttling: máximo 2 envíos por segundo para evitar saturar el WebSocket
        await asyncio.sleep(0.5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(progress_broadcaster())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Mantiene la conexión viva
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/", response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"request": request, "download_dir": DOWNLOAD_DIR}
    )
