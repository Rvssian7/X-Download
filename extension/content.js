const SERVER_URL = "http://127.0.0.1:8000";
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "show_confirm") {
        // Prevent multiple modals
        if (document.getElementById('x-download-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'x-download-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.7); z-index: 2147483647;
            display: flex; justify-content: center; align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            backdrop-filter: blur(4px);
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            background: #121212; width: 350px; padding: 25px;
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            text-align: center; border: 1px solid #333; color: #fff;
        `;

        card.innerHTML = `
            <h2 style="margin-top:0; font-size:16px; margin-bottom:15px; color:#00ffcc;">🚀 ¿Enviar a X-Download?</h2>
            <div style="background:#1a1a1a; padding:12px; border-radius:8px; font-size:13px; margin-bottom:25px; word-break:break-all; border:1px solid #333; color:#ccc;">
                ${request.filename}
            </div>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="xd-cancel" style="padding:10px 20px; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; background:#333; color:#fff;">Cancelar</button>
                <button id="xd-start" style="padding:10px 20px; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; background:#fff; color:#000;">Iniciar Descarga</button>
            </div>
        `;

        modal.appendChild(card);
        document.body.appendChild(modal);

        document.getElementById('xd-cancel').onclick = () => {
            modal.remove();
        };

        document.getElementById('xd-start').onclick = () => {
            const btn = document.getElementById('xd-start');
            btn.innerText = "⏳ Enviando...";
            btn.disabled = true;
            
            chrome.runtime.sendMessage({
                action: "execute_download",
                url: request.url,
                filename: request.filename
            }, (res) => {
                if (res && res.success) {
                    btn.innerText = "✅ ¡Enviado!";
                    btn.style.background = "#28a745";
                    btn.style.color = "#fff";
                    setTimeout(() => modal.remove(), 1000);
                } else {
                    btn.innerText = "❌ Error";
                    btn.style.background = "#dc3545";
                    btn.style.color = "#fff";
                    setTimeout(() => modal.remove(), 2000);
                }
            });
        };
    }
});

// --- BOTÓN FLOTANTE ESTILO IDM ---
(function() {
    // 1. Crear el botón flotante
    const floatBtn = document.createElement('div');
    floatBtn.id = 'xd-float-btn';
    floatBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Descargar Video
    `;
    floatBtn.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        background: rgba(18, 18, 18, 0.85);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 6px 12px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: none;
        align-items: center;
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: opacity 0.2s, background 0.2s;
        opacity: 0.75;
    `;
    
    // Hover effects
    floatBtn.onmouseover = () => { 
        floatBtn.style.opacity = '1'; 
        floatBtn.style.background = 'rgba(30, 30, 30, 0.95)'; 
    };
    floatBtn.onmouseout = () => { 
        floatBtn.style.opacity = '0.75'; 
        floatBtn.style.background = 'rgba(18, 18, 18, 0.85)'; 
    };
    
    // Inyectar al DOM cuando esté listo
    if (document.body) document.body.appendChild(floatBtn);
    else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(floatBtn));

    let currentVideoUrl = "";
    
    // Acción de descargar
    floatBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        floatBtn.innerHTML = "⏳ Enviando...";
        
        // Usar la URL directa del video si la tiene, de lo contrario enviar la página al Sniffer
        let urlToSend = currentVideoUrl;
        if (!urlToSend || urlToSend.startsWith('blob:')) {
            urlToSend = window.location.href; // El sabueso (yt-dlp) se encargará
        }
        
        chrome.runtime.sendMessage({
            action: "download_video",
            url: urlToSend,
            title: document.title
        }, (res) => {
            if (res && res.success) {
                floatBtn.innerHTML = "✅ ¡Enviado al Panel!";
                floatBtn.style.background = "rgba(40, 167, 69, 0.9)";
            } else {
                floatBtn.innerHTML = "❌ Error al conectar";
                floatBtn.style.background = "rgba(220, 53, 69, 0.9)";
            }
            setTimeout(() => {
                floatBtn.style.display = 'none';
                floatBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Descargar Video`;
            }, 3000);
        });
    };

    let hideTimeout;
    let lastMove = 0;
    
    // El "Vigilante Ninja" - Detecta videos al pasar el mouse
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastMove < 50) return; // Throttling: Max 20 veces por segundo para no gastar CPU
        lastMove = now;
        
        const videos = document.getElementsByTagName('video');
        let foundHover = false;
        
        for (let i = 0; i < videos.length; i++) {
            const rect = videos[i].getBoundingClientRect();
            // Ignorar reproductores minúsculos o invisibles
            if (rect.width < 150 || rect.height < 100) continue;
            
            // ¿El mouse está dentro de este video?
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                
                foundHover = true;
                
                
                // Posicionar el botón flotante en la esquina superior IZQUIERDA
                // Ya que estamos atrapados en un iframe y no podemos salir de él sin volvernos invisibles.
                floatBtn.style.display = 'flex';
                
                // Lo ponemos a 10px del borde superior y 10px del borde izquierdo
                floatBtn.style.top = (rect.top + 10) + 'px';
                floatBtn.style.left = (rect.left + 10) + 'px';
                
                currentVideoUrl = videos[i].src || videos[i].currentSrc || window.location.href;
                
                clearTimeout(hideTimeout);
                break; 
            }
        }
        
        // También mantenerlo visible si el mouse está posado sobre el botón mismo
        if (floatBtn.style.display !== 'none') {
            const btnRect = floatBtn.getBoundingClientRect();
            if (e.clientX >= btnRect.left && e.clientX <= btnRect.right &&
                e.clientY >= btnRect.top && e.clientY <= btnRect.bottom) {
                foundHover = true;
                clearTimeout(hideTimeout);
            }
        }
        
        // Si el mouse salió del video y del botón, esconder con un pequeño retraso
        if (!foundHover && floatBtn.style.display !== 'none') {
            hideTimeout = setTimeout(() => {
                floatBtn.style.display = 'none';
            }, 300);
        }
    });
})();

// --- SISTEMA DE NOTIFICACIONES (TOASTS) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "show_toast") {
        const toast = document.createElement('div');
        toast.innerHTML = request.message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(18, 18, 18, 0.95);
            color: #fff;
            border: 1px solid #333;
            border-left: 4px solid #00ff88;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            font-weight: 500;
            z-index: 2147483647;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform: translateY(30px);
            opacity: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Desaparecer a los 3.5 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
