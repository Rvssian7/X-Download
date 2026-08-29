from pydantic import BaseModel
from typing import Optional

class DownloadRequest(BaseModel):
    url: str
    is_video: bool = False
    title: Optional[str] = "Descarga"

class ActionRequest(BaseModel):
    id: str
    action: str
    quality: Optional[str] = "best"

class SettingsRequest(BaseModel):
    download_dir: str
    max_concurrent: int
    speed_limit: str
