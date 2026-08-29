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
        // Filtramos para mostrar SOLO lo activo (ocultar historial) y lo invertimos
        const downloadIds = Object.keys(data).filter(id => {
            const st = data[id].status;
            return st !== "Completado" && st !== "Cancelado" && st !== "Error";
        }).reverse();
        
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
                
                // Build initial structure with Waiting Area
                card.innerHTML = `
                    <div class="dl-header">
                        <div class="dl-title" title="${dl.title}">${dl.title}</div>
                        <div class="dl-controls">
                            <button class="dl-btn play-btn" data-action="pause" data-id="${id}">⏸</button>
                            <button class="dl-btn danger" data-action="delete" data-id="${id}">❌</button>
                        </div>
                    </div>
                    
                    <!-- Formulario de Esperando Calidad -->
                    <div class="dl-waiting-area" style="display: none; margin-bottom: 8px; justify-content: space-between; align-items: center;">
                        <select class="dl-quality-select" style="background:#222; color:#fff; border:1px solid #333; border-radius:4px; padding:4px; font-size:10px; width: 68%;">
                            <option value="best">Máxima Calidad (Auto)</option>
                            <option value="1080">1080p</option>
                            <option value="720">720p</option>
                            <option value="480">480p</option>
                            <option value="audio_only">Solo Audio (MP3)</option>
                        </select>
                        <button class="dl-btn-start" style="background:#ff0055; color:#fff; border:none; border-radius:4px; padding:4px 8px; font-size:10px; font-weight:bold; cursor:pointer;">▶ Iniciar</button>
                    </div>

                    <!-- Progreso y Estadísticas -->
                    <div class="dl-progress-container">
                        <div class="dl-progress-bg">
                            <div class="dl-progress-fill" style="width: 0%; background: #ff0055;"></div>
                        </div>
                        <div class="dl-stats">
                            <span class="dl-status" style="color: #aaa;"></span>
                            <span class="dl-info"></span>
                        </div>
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
                card.querySelector('.dl-btn-start').onclick = () => {
                    const quality = card.querySelector('.dl-quality-select').value;
                    fetch('http://127.0.0.1:8000/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, action: "start_video", quality: quality })
                    });
                    // Feedback visual
                    card.querySelector('.dl-btn-start').innerText = "⏳";
                    card.querySelector('.dl-btn-start').style.background = "#555";
                };
            }
            
            // DOM Elements
            const playBtn = card.querySelector('.play-btn');
            const waitingArea = card.querySelector('.dl-waiting-area');
            const progressContainer = card.querySelector('.dl-progress-container');
            const statusSpan = card.querySelector('.dl-status');
            const infoSpan = card.querySelector('.dl-info');
            const fillBar = card.querySelector('.dl-progress-fill');
            
            // Logic state
            const isWaiting = dl.status === "Esperando Calidad";
            const isPaused = dl.status === "Pausado" || dl.status === "Cancelado";
            const isError = dl.status === "Error";
            const isDone = dl.status === "Completado";

            if (isWaiting) {
                waitingArea.style.display = 'flex';
                progressContainer.style.display = 'none';
                playBtn.style.display = 'none';
            } else {
                waitingArea.style.display = 'none';
                progressContainer.style.display = 'block';
                
                if (isDone || isError) {
                    playBtn.style.display = 'none';
                } else {
                    playBtn.style.display = 'flex';
                    playBtn.innerText = isPaused ? "▶" : "⏸";
                    playBtn.setAttribute('data-action', isPaused ? "resume" : "pause");
                }
            }
            
            // Format Percent
            let rawPercent = 0;
            if (dl.percent) {
                rawPercent = parseFloat(dl.percent.replace('%', ''));
            }
            if (isNaN(rawPercent)) rawPercent = 0;
            if (isDone) rawPercent = 100;
            
            // Format Colors
            let statusColor = "#aaa";
            let progressColor = "#ff0055"; 
            if (isDone) { statusColor = "#28a745"; progressColor = "#28a745"; }
            if (isError) { statusColor = "#dc3545"; progressColor = "#dc3545"; }
            if (isPaused) { statusColor = "#ffc107"; progressColor = "#ffc107"; }
            if (isWaiting) { statusColor = "#00ccff"; }
            
            // Apply updates
            fillBar.style.width = rawPercent + '%';
            fillBar.style.background = progressColor;
            statusSpan.innerText = `${dl.status} - ${dl.percent || "0%"}`;
            statusSpan.style.color = statusColor;
            infoSpan.innerText = `${dl.speed || ""} • ${dl.size || ""}`;
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
