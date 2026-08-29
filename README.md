# 🚀 X-Download

X-Download es un **acelerador de descargas hiper-optimizado** y un **sniffer de videos** de código abierto. Evolucionó de ser un simple script a una arquitectura empresarial "fantasma" que se ejecuta en segundo plano.

Su propósito es interceptar el tráfico de tu navegador web, atrapar enlaces ocultos (como `HLS/m3u8` en sitios de streaming), reemplazar la aburrida ventana de *"Guardar como..."* nativa de Chrome, y gestionar las descargas a la máxima velocidad posible usando múltiples conexiones concurrentes.

---

## 🌟 Características Principales

*   👻 **Arquitectura Fantasma (Event-Driven):** El servidor consume **0% de CPU** cuando está inactivo. Usa eventos asíncronos y WebSockets en tiempo real para comunicarse con tu navegador sin hacer *polling* destructivo.
*   🛡️ **Interceptor In-Page (Chrome):** Bloquea las descargas convencionales de Chrome y muestra un elegante modal oscuro dentro de la misma página web para confirmar la descarga.
*   🕵️‍♂️ **El Sabueso de Red:** Una extensión (Manifest V3) capaz de olfatear y extraer flujos de video protegidos que otras extensiones ignoran.
*   🚀 **Motores Duales (Anti-SSL):** Usa `aria2c` (16 conexiones simultáneas) para archivos pesados sin reservar espacio en disco, y `yt-dlp` para fusionar videos en 4K. Ambos ignoran los bloqueos por certificados SSL vencidos.
*   🧠 **Detección Inteligente de GitHub:** Pega la URL de cualquier repositorio de GitHub y el servidor la transformará automáticamente en una descarga directa del código fuente (`.zip`).
*   🛑 **Escudo Anti-Colisiones:** Evita que descargues el mismo archivo dos veces simultáneamente, protegiendo tu disco duro de corrupciones.

---

## 📋 Requisitos del Sistema y Dependencias

Antes de instalar X-Download, tu sistema necesita tener instalados los motores de descarga subyacentes.

1. **Python 3.9+** (El cerebro del servidor).
2. **Navegador basado en Chromium** (Google Chrome, Brave, Edge).
3. **Motores Nativos Requeridos:**
   * **FFmpeg:** Vital para que `yt-dlp` pueda fusionar el audio de alta calidad con el video 4K.
   * **Aria2c:** Vital para descargar archivos en 16 partes simultáneas.

**🍎 En macOS:**
Abre tu terminal y usa Homebrew para instalar todo de una vez:
```bash
brew install ffmpeg aria2c
```

**🪟 En Windows:**
* Python: Descárgalo desde la tienda de Windows o python.org.
* FFmpeg y Aria2: Instálalos usando `winget install ffmpeg` y `winget install aria2`, o descárgalos manualmente y asegúrate de agregarlos a tus variables de entorno (`PATH`).

---

## ⚙️ Instalación Paso a Paso

### Paso 1: Clonar el Proyecto
Descarga el código fuente en la carpeta que prefieras (recomendamos tu carpeta de Usuario o Documentos, fuera de carpetas sincronizadas en la nube para evitar errores de permisos).
```bash
git clone https://github.com/Rvssian7/X-Download.git
cd X-Download
```

### Paso 2: Instalar el Backend (FastAPI)
Configuraremos el entorno virtual de Python para mantener todo aislado y limpio.

**🍎 Mac / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

**🪟 Windows:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Paso 3: Encender el Servidor (Modo Fantasma vs. Consola)

El sistema soporta dos modos de ejecución:

**🍎 En macOS (Recomendado - Modo Fantasma con Launchd):**
X-Download puede arrancar solo cada vez que enciendas tu Mac y correr en el fondo de forma totalmente silenciosa.
1. Edita el archivo `.plist` (si creaste uno) para que las rutas apunten a tu carpeta del proyecto.
2. Cópialo a los LaunchAgents:
   ```bash
   cp com.rvssian.xdownload.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.rvssian.xdownload.plist
   ```
*(Nota: Si no quieres hacer esto, puedes simplemente correr `uvicorn main:app --port 8000` dentro de la carpeta backend).*

**🪟 En Windows / Uso Manual:**
Entra a la carpeta backend y ejecuta el servidor manualmente:
```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --port 8000
```

### Paso 4: Instalar la Extensión de Chrome
1. Abre tu navegador y ve a: `chrome://extensions/`
2. Activa el **"Modo Desarrollador"** (arriba a la derecha).
3. Haz clic en **"Cargar descomprimida"** (*Load unpacked*).
4. Selecciona la carpeta `extension` que viene dentro de este proyecto.
5. Fija el ícono de la extensión en tu barra de tareas para acceder rápido.

---

## 🚀 Cómo Usarlo

Una vez que el servidor esté corriendo en el puerto 8000 y la extensión esté instalada:

1. **El Panel de Control:** 
   * Haz clic en el ícono de la extensión de Chrome y presiona **"🖥️ Abrir Panel de Control"**. 
   * Se abrirá `http://127.0.0.1:8000`, donde podrás ver tus descargas en tiempo real, pausarlas, reanudarlas o eliminarlas.
2. **Descargas Directas (Interceptor):**
   * Navega por internet y descarga cualquier archivo `.zip`, `.pdf`, `.pkg` como lo harías normalmente.
   * X-Download bloqueará la ventana de tu sistema operativo y mostrará un modal negro y elegante en tu navegador para enviarlo directo al Panel.
3. **Cazar Videos Piratas:**
   * Entra a una página de streaming de películas o series.
   * Dale "Play" al reproductor oculto.
   * Abre la extensión de Chrome; verás que el Sabueso detectó la ruta cifrada de la película. Dale al botón de enviar.
4. **Descargar Páginas Enteras (YouTube/Twitter):**
   * Estando en el video que te gusta, abre la extensión y haz clic en **"⬇ Descargar esta página web"**.

---
*Desarrollado con Arquitectura Limpia, Python, FastAPI y Vanilla JS.*