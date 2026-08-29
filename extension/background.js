let sniffedUrls = {};
let badgeInterval = null;

// Función para actualizar la insignia verde
function checkDownloads() {
    fetch('http://127.0.0.1:8000/progress')
        .then(res => res.json())
        .then(data => {
            const activeIds = Object.keys(data).filter(id => {
                const st = data[id].status;
                return st !== "Completado" && st !== "Cancelado" && st !== "Error";
            });
            
            if (activeIds.length > 0) {
                chrome.action.setBadgeText({ text: activeIds.length.toString() });
                chrome.action.setBadgeBackgroundColor({ color: '#28a745' }); // Verde neón
                
                // Si hay descargas activas, asegurarnos de que el ciclo de chequeo esté vivo
                if (!badgeInterval) {
                    badgeInterval = setInterval(checkDownloads, 3000);
                }
            } else {
                // No hay descargas: Limpiar insignia y apagar el motor para no gastar CPU/RAM
                chrome.action.setBadgeText({ text: '' });
                if (badgeInterval) {
                    clearInterval(badgeInterval);
                    badgeInterval = null;
                }
            }
        })
        .catch(err => {
            // Servidor apagado
            chrome.action.setBadgeText({ text: '' });
            if (badgeInterval) {
                clearInterval(badgeInterval);
                badgeInterval = null;
            }
        });
}

// Ejecutar revisión inmediatamente al despertar la extensión
checkDownloads();

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        if (details.type === 'main_frame' || details.type === 'sub_frame') return;

        let contentType = '';
        for (let i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name.toLowerCase() === 'content-type') {
                contentType = details.responseHeaders[i].value.toLowerCase();
                break;
            }
        }

        // Filtro de Rayos X: Detectar M3U8 o videos aunque no tengan extensión
        if (contentType.includes('video/') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegurl')) {
            // Ignorar los fragmentos pequeños .ts
            if (details.url.includes('.ts') || details.url.includes('.js')) return;

            if (!sniffedUrls[details.tabId]) {
                sniffedUrls[details.tabId] = new Set();
            }
            sniffedUrls[details.tabId].add(details.url);
            
            // Actualizar el número del sabueso (solo si no hay descargas activas que requieran la insignia verde)
            fetch('http://127.0.0.1:8000/progress').then(r => r.json()).then(data => {
                const activeIds = Object.keys(data).filter(id => data[id].status !== "Completado" && data[id].status !== "Cancelado" && data[id].status !== "Error");
                if (activeIds.length === 0) {
                    chrome.action.setBadgeText({text: sniffedUrls[details.tabId].size.toString(), tabId: details.tabId});
                    chrome.action.setBadgeBackgroundColor({color: '#ff0055', tabId: details.tabId});
                }
            }).catch(() => {});
        }
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
);

// Limpiar memoria cuando se cierra una pestaña
chrome.tabs.onRemoved.addListener(function(tabId) {
    if (sniffedUrls[tabId]) {
        delete sniffedUrls[tabId];
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_sniffed_urls") {
        let urls = sniffedUrls[request.tabId] ? Array.from(sniffedUrls[request.tabId]) : [];
        sendResponse({urls: urls});
        return true;
    }
    
    if (request.action === "download_video" || request.action === "download_floating" || request.action === "execute_download") {
        
        let finalUrl = request.url;
        
        // Magia 1: Rescatar el título real de la página (no el del iframe)
        const finalTitle = (sender.tab && sender.tab.title) ? sender.tab.title : (request.title || request.filename);

        // Magia 2: Si el botón flotante capturó una URL inservible, usamos lo que el sabueso atrapó.
        if (request.action === "download_floating") {
            const looksLikeVideo = finalUrl.includes('.mp4') || finalUrl.includes('.m3u8') || finalUrl.includes('.mkv') || finalUrl.includes('.webm') || finalUrl.includes('.mpd');
            
            if (!looksLikeVideo && sender.tab && sniffedUrls[sender.tab.id] && sniffedUrls[sender.tab.id].size > 0) {
                const arr = Array.from(sniffedUrls[sender.tab.id]);
                finalUrl = arr[arr.length - 1]; // Tomar el último archivo real
            }
        }
        
        fetch('http://127.0.0.1:8000/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: finalUrl, 
                is_video: request.action === "download_video" || request.action === "download_floating",
                title: finalTitle,
                quality: request.quality
            })
        })
        .then(res => {
            if (!badgeInterval) {
                checkDownloads(); // Iniciar el ciclo de chequeo para la insignia verde inmediatamente
            }
            sendResponse({success: true});
        })
        .catch(err => {
            console.error(err);
            sendResponse({success: false});
        });
        
        return true; // Necesario para sendResponse asíncrono
    }
});

// --- SECUESTRADOR DE DESCARGAS (ESTILO IDM) ---
chrome.downloads.onCreated.addListener((item) => {
    // Solo secuestrar descargas de internet reales, ignorar archivos internos (blob, data)
    if (!item.url.startsWith("http")) return;
    
    // Verificamos en milisegundos si nuestro motor (FastAPI) está encendido
    fetch('http://127.0.0.1:8000/ping')
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {
                // 1. Cancelar la descarga nativa lenta de Chrome
                chrome.downloads.cancel(item.id);
                
                // 2. Extraer un nombre bonito (ej. archivo.zip)
                let title = item.filename || item.url.split('/').pop() || "Archivo";
                title = title.split(/[\\/]/).pop(); // Limpiar rutas de carpetas si Chrome las pone
                
                // 3. Enviarlo al motor de X-Download por debajo de la mesa
                fetch('http://127.0.0.1:8000/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url: item.url, 
                        is_video: false,
                        title: title
                    })
                }).then(() => {
                    // 4. Encender el radar de la insignia verde
                    if (!badgeInterval) {
                        checkDownloads();
                    }
                }).catch(err => console.error("Error al enviar al gestor", err));
            }
        })
        .catch(err => {
            // Si hay error (servidor apagado), no hacemos nada y dejamos que Chrome lo descargue normal.
            console.log("Motor apagado. Descargando con Chrome nativo.");
        });
});
