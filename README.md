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
Para usar X-Download, asegúrate de cumplir con estos requisitos básicos:
1. **Sistema Operativo:** Funciona en **macOS** y **Windows**.
2. **Python:** Versión 3.9 o superior instalada en tu sistema.
3. **Navegador:** Google Chrome o Brave (Para poder instalar la extensión).
4. **FFmpeg (Recomendado):** Es vital para que `yt-dlp` pueda fusionar el video en 4K con el audio HQ. 
   - **En Mac:** `brew install ffmpeg`
   - **En Windows:** Descárgalo usando `winget install ffmpeg` o desde su sitio web oficial.

---

## ⚙️ Instalación Paso a Paso (Para Principiantes)

### Paso 1: Descargar el Proyecto
Abre tu terminal (o Símbolo del Sistema en Windows) y descarga el código:
```bash
git clone https://github.com/Rvssian7/X-Download.git
cd X-Download
```

### Paso 2: Instalar el Motor (Backend)
Debemos instalar las librerías de Python. Ejecuta los siguientes comandos dependiendo de tu sistema operativo:

**🍎 En Mac / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

**🪟 En Windows:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Paso 3: Instalar la Extensión en Chrome
1. Abre Google Chrome y escribe en la barra de direcciones: `chrome://extensions/`
2. Activa el **Modo Desarrollador** (El interruptor arriba a la derecha).
3. Haz clic en el botón superior izquierdo que dice **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta llamada `extension` que viene dentro de la carpeta de este proyecto.
5. Haz clic en el ícono del rompecabezas en Chrome y "fija" el ícono del perrito (El Sabueso) para tenerlo siempre a mano.

---

## 🚀 Cómo Usarlo en el Día a Día

### 1. Encender el servidor
Ve a la carpeta principal del proyecto y haz **doble clic** en tu archivo de arranque. Esto dejará el motor corriendo en segundo plano:
- 🍎 **Usuarios Mac:** Doble clic en `start_x_download.command`.
- 🪟 **Usuarios Windows:** Doble clic en `start_x_download.bat`.

### 2. Abrir tu Panel de Control
Ingresa desde tu navegador a [http://127.0.0.1:8000](http://127.0.0.1:8000) para ver y administrar tus descargas en tiempo real.

### 3. ¡Descargar!
- **Modo Página Completa:** Si estás en YouTube, Vimeo o Twitter, abre el menú del perrito en tu barra de Chrome y presiona el botón negro *"⬇ Descargar esta página web"*.
- **Modo Sabueso (Pirata):** Si estás en una página de streaming de películas, abre el menú del perrito, dale "Play" a la película en la página web, y verás cómo el radar atrapa el video puro para que lo descargues con el botón rojo.

Tus archivos finales se guardarán mágicamente en: `Descargas/X-Download/`.

---

*Desarrollado con Arquitectura Limpia y Vanilla JS.*