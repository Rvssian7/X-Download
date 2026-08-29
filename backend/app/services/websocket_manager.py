from fastapi import WebSocket
from typing import List
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.state_changed = asyncio.Event()

    def mark_changed(self):
        self.state_changed.set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_progress(self, progress_data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(progress_data)
            except Exception:
                pass

manager = ConnectionManager()
