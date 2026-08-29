from pydantic import BaseModel

class DownloadRequest(BaseModel):
    url: str
    is_video: bool = False
    title: str = "Descarga"

class ActionRequest(BaseModel):
    id: str
    action: str
    quality: str = "best"
