// --- BOTÓN FLOTANTE EN VIDEOS (SOLO SITIOS OFICIALES) ---
const supportedDomains = [
    'youtube.com', 'youtu.be', 'vimeo.com', 'twitter.com', 
    'x.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'twitch.tv'
];

function isSupportedSite() {
    const hostname = window.location.hostname.toLowerCase();
    return supportedDomains.some(domain => hostname.includes(domain));
}

function createDownloadButton(videoElement) {
    // Si no es un sitio soportado, no hacemos nada
    if (!isSupportedSite()) return;
    
    // Si ya le pusimos botón, ignorar
    if (videoElement.dataset.pxInjected) return;
    videoElement.dataset.pxInjected = "true";

    const btn = document.createElement("button");
    btn.innerText = "⬇ X-Download";
    btn.className = "px-download-btn";
    
    // Estilos básicos para que sea visible
    Object.assign(btn.style, {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 999999,
        backgroundColor: '#ff0055',
        color: 'white',
        border: '1px solid white',
        borderRadius: '5px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        opacity: '0.7'
    });

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Enviamos la URL de la página actual para que yt-dlp la analice
        const pageUrl = window.location.href;
        
        btn.innerText = "⏳ Enviando...";
        chrome.runtime.sendMessage({ action: "download_video", url: pageUrl, title: document.title }, (response) => {
            if (response && response.success) {
                btn.innerText = "✅ ¡Enviado!";
            } else {
                btn.innerText = "❌ Backend Apagado";
            }
            setTimeout(() => btn.innerText = "⬇ X-Download", 3000);
        });
    };

    // Asegurar que el padre pueda contener elementos absolutos
    if (videoElement.parentNode) {
        const style = window.getComputedStyle(videoElement.parentNode);
        if (style.position === 'static') {
            videoElement.parentNode.style.position = 'relative';
        }
        videoElement.parentNode.appendChild(btn);
    }
}

// Escanear el DOM periódicamente por si cargan videos asíncronos (ej. YouTube)
setInterval(() => {
    if (!isSupportedSite()) return;
    const videos = document.querySelectorAll("video");
    videos.forEach(createDownloadButton);
}, 2000);
