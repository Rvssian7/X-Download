# 🚀 X-Download

X-Download es un **Gestor de Descargas Global y Autónomo** de código abierto. Evolucionó de ser un simple script a una arquitectura empresarial "fantasma" que se ejecuta en segundo plano.

Su propósito es interceptar TODO el tráfico de tu navegador web, atrapar enlaces ocultos (como `HLS/m3u8` en sitios de streaming), asesinar la aburrida descarga nativa de Chrome, y gestionar los archivos a velocidades agresivas usando motores paralelos de 16 conexiones.

---

## 🌟 Características Principales (Nueva Generación)

*   👻 **Arquitectura Fantasma (Event-Driven):** El servidor consume **0% de CPU** cuando está inactivo. Usa eventos asíncronos y WebSockets en tiempo real para comunicarse con tu navegador sin hacer *polling* destructivo.
*   🥷 **Secuestrador de Descargas Globales:** Si le das clic a un archivo (`.zip`, `.pdf`), la extensión lo secuestra en milisegundos, bloquea a Chrome y lo envía al motor. Te avisa con una elegante **Alerta Emergente (Toast)** inyectada en la web.
*   🕹️ **Botón Flotante Inyectado (Videos):** Posiciona automáticamente un botón minimalista sobre cualquier reproductor de video en internet. Soporta selección de calidad en línea y bypass de *iframes* cruzados.
*   ⚡ **Mini-Panel en Tiempo Real (WebSockets):** Ya no necesitas abrir páginas extra. La propia ventana de la extensión te muestra barras de progreso, velocidad en vivo y te permite Pausar, Reanudar y Eliminar.
*   🕵️‍♂️ **El Sabueso de Red:** Si un video oculta su ruta (`blob:`), el botón flotante se sincroniza con el olfato del Service Worker (`background.js`) para extraer el último archivo multimedia interceptado en la red.
*   🚀 **Motores Duales (Turbo):** Usa `aria2c` (-x 16) para archivos pesados y un motor modificado de `yt-dlp` (-N 8) que descarga videos fraccionados en 8 conexiones simultáneas.
*   🟢 **Insignias Dinámicas:** El ícono de la extensión brilla en verde mostrándote exactamente cuántas tareas están corriendo.

---

## 📋 Requisitos del Sistema y Dependencias

1. **Python 3.9+** (El cerebro del servidor).
2. **Navegador basado en Chromium** (Google Chrome, Brave, Edge).
3. **Motores Nativos Requeridos:**
   * **FFmpeg:** Vital para que `yt-dlp` pueda fusionar el audio de alta calidad con el video 4K.
   * **Aria2c:** Vital para descargar archivos en 16 partes simultáneas.

**🍎 En macOS:**
```bash
brew install ffmpeg aria2c
```

**🪟 En Windows:**
* FFmpeg y Aria2: Instálalos usando `winget install ffmpeg` y `winget install aria2`, o descárgalos manualmente y agrégalos al `PATH`.

---

## ⚙️ Instalación Paso a Paso

### 1. Descargar el Proyecto
Abre tu terminal (o Símbolo del Sistema) y clona el repositorio:
```bash
git clone https://github.com/Rvssian7/X-Download.git
cd X-Download
```

### 2. Configurar el Motor (Backend)
Necesitamos instalar las librerías de Python (FastAPI, WebSockets) en un entorno aislado para no ensuciar tu computadora.

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

### 3. Encender el Motor Central
El servidor de Python debe estar corriendo de fondo para que la extensión de Chrome pueda enviarle las descargas.

**🍎 En Mac / Linux:**
Desde la carpeta del proyecto, ejecuta:
```bash
cd backend
source venv/bin/activate
python run.py
```
*(Nota: El servidor correrá en `http://127.0.0.1:8000`. Deja esta ventana de terminal abierta).*

**🪟 En Windows:**
Desde la carpeta del proyecto, ejecuta:
```cmd
cd backend
venv\Scripts\activate
python run.py
```

### 4. Instalar la Extensión (Chrome / Brave / Edge)
Como la extensión incluye funciones avanzadas de secuestro de red, no está en la tienda pública. Se instala en segundos así:
1. Abre tu navegador y escribe en la barra de direcciones: `chrome://extensions/`
2. Arriba a la derecha, enciende el interruptor de **"Modo Desarrollador"**.
3. Arriba a la izquierda, haz clic en el botón **"Cargar descomprimida"** (*Load unpacked*).
4. Busca la carpeta donde clonaste el proyecto y selecciona **únicamente la sub-carpeta llamada `extension`**.
5. ¡Listo! Te recomendamos hacer clic en el ícono del rompecabezas de Chrome y fijar (`📌`) el ícono gris de X-Download en tu barra para abrir tu panel rápidamente.

---

## 🚀 Cómo Usarlo

Una vez que el servidor esté corriendo, olvídate de él. Todo ocurre en tu navegador:

1. **Descargar Archivos (Secuestrador):**
   * Dale clic a un archivo en internet. X-Download lo secuestrará y emergerá un cartel oscuro en tu pantalla avisándote del éxito.
2. **Descargar Videos con 1 Clic:**
   * Posa el mouse sobre cualquier película o video en internet. Verás un botón negro flotante en la esquina. Ábrelo, elige "1080p" y dale a Iniciar.
3. **Controlar el Progreso:**
   * Abre la extensión de Chrome. Verás la lista de descargas activas llenándose en tiempo real. Pausa, reanuda o elimina al gusto.

---
*Desarrollado con Arquitectura Limpia, Python, FastAPI y Vanilla JS.*
