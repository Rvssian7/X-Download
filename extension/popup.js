chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    
    // Funcionalidad del nuevo botón para capturar la página completa
    const btnPage = document.getElementById('btn-page');
    if (btnPage) {
        btnPage.onclick = () => {
            btnPage.innerText = "⏳ Enviando...";
            chrome.runtime.sendMessage({ action: "download_video", url: tab.url, title: tab.title }, (res) => {
                if (res && res.success) {
                    btnPage.innerText = "✅ ¡Enviado al Panel!";
                    btnPage.style.background = "#28a745";
                } else {
                    btnPage.innerText = "❌ Backend apagado";
                    btnPage.style.background = "#dc3545";
                }
                setTimeout(() => {
                    btnPage.innerText = "⬇ Descargar esta página web";
                    btnPage.style.background = "#111";
                }, 3000);
            });
        };
    }
    
    // Pedirle al background.js la lista de URLs olfateadas
    chrome.runtime.sendMessage({action: "get_sniffed_urls", tabId: tab.id}, (response) => {
        const list = document.getElementById('list');
        
        if (!response || !response.urls || response.urls.length === 0) {
            // Ya está el texto de ayuda por defecto en el HTML
            return;
        }
        
        list.innerHTML = ""; // Limpiar
        
        // Invertimos la lista para mostrar el más reciente arriba
        response.urls.reverse().forEach(url => {
            const div = document.createElement('div');
            div.className = 'url-item';
            
            // Mostrar solo una parte de la URL para que no ocupe 50 líneas
            let shortUrl = url.split('?')[0];
            const urlObj = new URL(shortUrl);
            let displayPath = urlObj.pathname.split('/').pop() || urlObj.hostname;
            div.innerHTML = `<b>Archivo detectado:</b><br><span style="color:#0088cc">${displayPath}</span>`;
            
            const btn = document.createElement('button');
            btn.innerText = "⬇ Enviar a X-Download";
            btn.onclick = () => {
                btn.innerText = "⏳ Enviando...";
                chrome.runtime.sendMessage({ action: "download_video", url: url, title: tabs[0].title }, (res) => {
                    if (res && res.success) {
                        btn.innerText = "✅ ¡Descargando!";
                        btn.style.background = "#28a745";
                    } else {
                        btn.innerText = "❌ Error (Backend apagado)";
                        btn.style.background = "#dc3545";
                    }
                });
            };
            
            div.appendChild(btn);
            list.appendChild(div);
        });
    });
});
