# 🚀 X-Download

X-Download es un **acelerador de descargas privado** y **sniffer de videos** de código abierto. Está compuesto por un potente motor backend local (Python/FastAPI) y una extensión nativa para Google Chrome (Manifest V3).

Esta herramienta está diseñada para interceptar tráfico de red en tiempo real, extraer flujos de video ocultos (como HLS/`.m3u8`) de sitios complejos y gestionar las descargas mediante un sistema inteligente de colas y WebSockets.

---

## 🌟 Características Principales
*   **Gestor de Cola Inteligente:** Límite máximo de 3 descargas simultáneas para proteger la memoria RAM. Las demás esperan pacientemente.
*   **El Sabueso (Sniffer MV3):** Extensión que intercepta paquetes de red a bajo nivel (`onHeadersReceived`) para atrapar videos que otras extensiones no pueden ver.
*   **Panel WebSockets en Tiempo Real:** Interfaz minimalista y oscura (Dark Mode) que refleja el progreso de la descarga en tiempo real sin recargar la página.
*   **Tecnología Subyacente:** Usa `yt-dlp` y `aria2c` gestionados de forma asíncrona mediante subprocesos, permitiendo pausa y reanudación real.
*   **Notificaciones Nativas:** Avisos integrados directamente en el Centro de Notificaciones de macOS.

---

## 📋 Requisitos Previos
Antes de instalar X-Download, asegúrate de tener lo siguiente en tu sistema:
1. **Sistema Operativo:** macOS (Requerido para las notificaciones nativas y el archivo de arranque `.command`).
2. **Python:** Versión 3.9 o superior.
3. **Navegador:** Google Chrome (Para instalar la extensión).
4. **FFmpeg (Recomendado):** Necesario para que `yt-dlp` pueda unir video y audio en máxima calidad. Instálalo desde la terminal con:
   ```bash
   brew install ffmpeg
   ```

---

## ⚙️ Instalación

### 1. Clonar el Repositorio
Abre tu terminal y descarga el código fuente:
```bash
git clone https://github.com/Rvssian7/X-Download.git
cd X-Download
```

### 2. Configurar el Motor (Backend)
Crea el entorno virtual de Python y descarga las dependencias necesarias:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn yt-dlp websockets
```

### 3. Instalar la Extensión de Chrome
1. Abre Google Chrome y ve a la ruta `chrome://extensions/`.
2. Activa el **Modo Desarrollador** (Interruptor en la esquina superior derecha).
3. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta `extension` que viene dentro de este proyecto.
5. Fija la extensión en la barra de tareas de tu navegador.

---

## 🚀 Uso

1. **Encender el motor:** Ve a la carpeta principal del proyecto y haz doble clic en el archivo `start_x_download.command`. Esto abrirá una terminal que dejará el servidor corriendo de fondo en consumo ultra-bajo de RAM.
2. **Abrir el Panel:** Ingresa desde cualquier navegador a [http://127.0.0.1:8000](http://127.0.0.1:8000) para ver tu panel de control.
3. **Descargar un Video:**
   - Si estás en un sitio soportado (YouTube, Vimeo, Twitter), verás un botón flotante **rojo** sobre el video.
   - Si estás en una página compleja de streaming, abre la extensión **"El Sabueso"** en tu navegador, recarga la página con `F5` y captura la URL de transmisión pura.

Tus descargas y logs se guardarán automáticamente en la ruta: `~/Downloads/X-Download/`.

---

*Desarrollado con Arquitectura Limpia y Vanilla JS.*