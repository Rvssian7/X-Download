// --- INTERCEPTOR DE DESCARGAS NORMALES ---
chrome.downloads.onCreated.addListener(async (downloadItem) => {
    if (downloadItem.state === 'interrupted' || downloadItem.state === 'complete') return;
    if (downloadItem.url.startsWith('data:') || downloadItem.url.startsWith('blob:')) return;
    try {
        const response = await fetch('http://127.0.0.1:8000/ping');
        if (response.ok) {
            chrome.downloads.cancel(downloadItem.id);
            await fetch('http://127.0.0.1:8000/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: downloadItem.finalUrl || downloadItem.url, is_video: false })
            });
        }
    } catch (e) {
        console.log("Backend offline.");
    }
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
    if (request.action === "download_video") {
        fetch('http://127.0.0.1:8000/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: request.url, is_video: true, title: request.title || "Video" })
        })
        .then(res => sendResponse({ success: res.ok }))
        .catch(e => sendResponse({ success: false }));
        return true; 
    }
    else if (request.action === "get_sniffed_urls") {
        // Enviar al popup las URLs que olió el sabueso
        const tabId = request.tabId;
        const urls = sniffedUrls[tabId] ? Array.from(sniffedUrls[tabId]) : [];
        sendResponse({ urls: urls });
        return true;
    }
});
