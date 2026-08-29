const SERVER_URL = "http://127.0.0.1:8000";
const WS_URL = "ws://127.0.0.1:8000/ws";

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    
    // --- BOTONES PRINCIPALES ---
    document.getElementById('btn-panel').onclick = () => {
        chrome.tabs.create({ url: SERVER_URL });
    };
    
    const btnPage = document.getElementById('btn-page');
    btnPage.onclick = () => {
        btnPage.innerText = "⏳ Enviando...";
        btnPage.disabled = true;
        chrome.runtime.sendMessage({ action: "download_video", url: tab.url, title: tab.title }, (res) => {
            if (res && res.success) {
                btnPage.innerText = "✅ ¡Enviado!";
                btnPage.style.background = "#28a745";
            } else {
                btnPage.innerText = "❌ Backend apagado";
                btnPage.style.background = "#dc3545";
            }
            setTimeout(() => {
                btnPage.innerText = "⬇ Descargar página actual";
                btnPage.style.background = "#1a1a1a";
                btnPage.disabled = false;
            }, 2000);
        });
    };
    
    // --- SABUESO DE RED ---
    chrome.runtime.sendMessage({action: "get_sniffed_urls", tabId: tab.id}, (response) => {
        const snifferArea = document.getElementById('sniffer-area');
        if (response && response.urls && response.urls.length > 0) {
            snifferArea.innerHTML = "";
            response.urls.reverse().forEach(url => {
                const div = document.createElement('div');
                div.className = 'url-item';
                
                let shortUrl = url.split('?')[0];
                let displayPath = new URL(shortUrl).pathname.split('/').pop() || "streaming.m3u8";
                
                div.innerHTML = `<div class="url-item-title">${displayPath}</div>`;
                
                const btn = document.createElement('button');
                btn.className = "btn-sniff";
                btn.innerText = "Atrapar video";
                btn.onclick = () => {
                    btn.innerText = "⏳ Enviando...";
                    chrome.runtime.sendMessage({ action: "download_video", url: url, title: tab.title }, (res) => {
                        if (res && res.success) {
                            btn.innerText = "✅ ¡Enviado!";
                            btn.style.background = "#28a745";
                        } else {
                            btn.innerText = "❌ Error";
                            btn.style.background = "#dc3545";
                        }
                    });
                };
                div.appendChild(btn);
                snifferArea.appendChild(div);
            });
        }
    });

    // --- MINI-PANEL WEBSOCKET ---
    let ws = new WebSocket(WS_URL);
    const dlArea = document.getElementById('downloads-area');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const downloadIds = Object.keys(data);
        
        if (downloadIds.length === 0) {
            dlArea.innerHTML = `<div class="dl-empty">No hay descargas activas</div>`;
            return;
        }
        
        // Remove the empty message if there are downloads
        const emptyMsg = dlArea.querySelector('.dl-empty');
        if (emptyMsg) emptyMsg.remove();
        
        downloadIds.forEach(id => {
            const dl = data[id];
            
            let card = document.getElementById(`dl-card-${id}`);
            if (!card) {
                card = document.createElement('div');
                card.className = "dl-card";
                card.id = `dl-card-${id}`;
                dlArea.appendChild(card);
                
                // Build initial structure
                card.innerHTML = `
                    <div class="dl-header">
                        <div class="dl-title" title="${dl.title}">${dl.title}</div>
                        <div class="dl-controls">
                            <button class="dl-btn play-btn" data-action="pause" data-id="${id}">⏸</button>
                            <button class="dl-btn danger" data-action="delete" data-id="${id}">❌</button>
                        </div>
                    </div>
                    <div class="dl-progress-bg">
                        <div class="dl-progress-fill" style="width: 0%; background: #ff0055;"></div>
                    </div>
                    <div class="dl-stats">
                        <span class="dl-status" style="color: #aaa;"></span>
                        <span class="dl-info"></span>
                    </div>
                `;
                
                // Add event listeners ONCE
                card.querySelector('.play-btn').onclick = (e) => {
                    const action = e.currentTarget.getAttribute('data-action');
                    fetch('http://127.0.0.1:8000/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, action: action })
                    });
                };
                card.querySelector('.danger').onclick = () => {
                    fetch('http://127.0.0.1:8000/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, action: "delete" })
                    });
                };
            }
            
            // Now update the dynamic parts smoothly
            const playBtn = card.querySelector('.play-btn');
            const isPaused = dl.status === "Pausado" || dl.status === "Cancelado";
            const isError = dl.status === "Error";
            const isDone = dl.status === "Completado";
            
            if (isDone || isError) {
                playBtn.style.display = 'none'; // Hide play/pause if finished/error
            } else {
                playBtn.style.display = 'flex';
                playBtn.innerText = isPaused ? "▶" : "⏸";
                playBtn.setAttribute('data-action', isPaused ? "resume" : "pause");
            }
            
            let rawPercent = 0;
            if (dl.percent) {
                rawPercent = parseFloat(dl.percent.replace('%', ''));
            }
            if (isNaN(rawPercent)) rawPercent = 0;
            if (dl.status === "Completado") rawPercent = 100;
            
            let statusColor = "#aaa";
            let progressColor = "#ff0055"; 
            if (dl.status === "Completado") { statusColor = "#28a745"; progressColor = "#28a745"; }
            if (dl.status === "Error") { statusColor = "#dc3545"; progressColor = "#dc3545"; }
            if (dl.status === "Pausado") { statusColor = "#ffc107"; progressColor = "#ffc107"; }
            
            card.querySelector('.dl-progress-fill').style.width = rawPercent + '%';
            card.querySelector('.dl-progress-fill').style.background = progressColor;
            
            const statusSpan = card.querySelector('.dl-status');
            statusSpan.innerText = `${dl.status} - ${dl.percent || "0%"}`;
            statusSpan.style.color = statusColor;
            
            card.querySelector('.dl-info').innerText = `${dl.speed || ""} • ${dl.size || ""}`;
        });
        
        // Remove cards that no longer exist on server
        Array.from(dlArea.children).forEach(child => {
            if (child.id && child.id.startsWith('dl-card-')) {
                const id = child.id.replace('dl-card-', '');
                if (!downloadIds.includes(id)) {
                    child.remove();
                }
            }
        });
    };
    
    ws.onerror = () => {
        dlArea.innerHTML = `<div class="dl-empty">No se pudo conectar al Panel (Backend apagado)</div>`;
    };
    
    ws.onclose = () => {
        if(dlArea.innerHTML.includes("Conectando")) {
            dlArea.innerHTML = `<div class="dl-empty">Panel apagado. Inicia el servidor.</div>`;
        }
    };
});
