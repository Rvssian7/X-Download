const SERVER_URL = "http://127.0.0.1:8000";
// --- INTERCEPTOR DE DESCARGAS NORMALES ---
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    if (downloadItem.state === 'interrupted' || downloadItem.state === 'complete') {
        suggest();
        return false;
    }
    if (downloadItem.url.startsWith('data:') || downloadItem.url.startsWith('blob:')) {
        suggest();
        return false;
    }
    
    fetch('http://127.0.0.1:8000/ping')
        .then(res => {
            if (res.ok) {
                chrome.downloads.cancel(downloadItem.id);
                
                const targetUrl = downloadItem.finalUrl || downloadItem.url;
                const targetName = downloadItem.filename || "Descarga Directa";
                
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs.length > 0) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "show_confirm",
                            url: targetUrl,
                            filename: targetName
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                // Fallback: la página no tiene el inyector cargado (ej. no se refrescó o es una pestaña en blanco).
                                // Lo enviamos directo para no dejar al usuario varado.
                                fetch('http://127.0.0.1:8000/download', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url: targetUrl, is_video: false, title: targetName })
                                });
                            }
                        });
                    }
                });
            }
            suggest();
        })
        .catch(e => {
            suggest();
        });
        
    return true; // Indica que suggest() se llamará de forma asíncrona
});

// --- SABUESO DE RED (NETWORK SNIFFER) ---
let sniffedUrls = {}; // Diccionario: tabId -> Set de URLs

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    let isVideo = false;
    const url = details.url.toLowerCase();
    const urlWithoutQuery = url.split('?')[0];
    
    // Filtro por extensión en URL (ignorando .ts que son fragmentos sueltos)
    if ((urlWithoutQuery.endsWith('.m3u8') || urlWithoutQuery.endsWith('.mp4') || urlWithoutQuery.endsWith('.mkv') || urlWithoutQuery.endsWith('.webm')) && !url.includes('.ts')) {
        isVideo = true;
    }

    // Filtro por cabeceras HTTP de respuesta (para URLs ofuscadas sin extensión)
    if (details.responseHeaders) {
        for (let header of details.responseHeaders) {
            if (header.name.toLowerCase() === 'content-type') {
                const type = header.value.toLowerCase();
                if (type.includes('video/') || type.includes('mpegurl') || type.includes('application/x-mpegurl')) {
                    if (!type.includes('mp2t') && !url.includes('.ts')) { // Ignorar fragmentos TS
                        isVideo = true;
                    }
                }
                break;
            }
        }
    }

    if (isVideo) {
        const tabId = details.tabId;
        if (tabId >= 0) {
            if (!sniffedUrls[tabId]) sniffedUrls[tabId] = new Set();
            sniffedUrls[tabId].add(details.url);
            
            chrome.action.setBadgeText({ text: sniffedUrls[tabId].size.toString(), tabId: tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#ff0055', tabId: tabId });
        }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Limpiar la lista si el usuario recarga o cierra la pestaña
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        sniffedUrls[tabId] = new Set();
        chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
});
chrome.tabs.onRemoved.addListener((tabId) => {
    delete sniffedUrls[tabId];
});


// --- COMUNICADOR CENTRAL ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download_video" || request.action === "execute_download" || request.action === "download_floating") {
        
        let finalUrl = request.url;
        
        // Magia 1: Rescatar el título real de la página (no el del iframe)
        const finalTitle = (sender.tab && sender.tab.title) ? sender.tab.title : (request.title || request.filename);

        // Magia 2: Si el botón flotante capturó una URL inservible (iframe, blob, página), usamos lo que el sabueso de red atrapó.
        if (request.action === "download_floating") {
            const looksLikeVideo = finalUrl.includes('.mp4') || finalUrl.includes('.m3u8') || finalUrl.includes('.mkv') || finalUrl.includes('.webm') || finalUrl.includes('.mpd');
            
            if (!looksLikeVideo && sender.tab && sniffedUrls[sender.tab.id] && sniffedUrls[sender.tab.id].size > 0) {
                const arr = Array.from(sniffedUrls[sender.tab.id]);
                finalUrl = arr[arr.length - 1]; // Tomar el último archivo real que atrapamos
            }
        }

        fetch('http://127.0.0.1:8000/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: finalUrl, 
                is_video: request.action === "download_video" || request.action === "download_floating",
                title: finalTitle
            })
        })
        .then(res => {
            if(res.ok) sendResponse({ success: true });
            else sendResponse({ success: false });
        })
        .catch(err => {
            sendResponse({ success: false });
        });
        return true; // Necesario para enviar respuesta de forma asíncrona
    }
    
    if (request.action === "get_sniffed_urls") {
        const urls = sniffedUrls[request.tabId] ? Array.from(sniffedUrls[request.tabId]) : [];
        sendResponse({ urls: urls });
        return true;
    }
});
