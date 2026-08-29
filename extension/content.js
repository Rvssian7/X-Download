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

        document.getElementById('xd-start').onclick = async () => {
            const btn = document.getElementById('xd-start');
            btn.innerText = "⏳ Enviando...";
            btn.disabled = true;
            try {
                await fetch('http://127.0.0.1:8000/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url: request.url, 
                        is_video: false, 
                        title: request.filename 
                    })
                });
                btn.innerText = "✅ ¡Enviado!";
                btn.style.background = "#28a745";
                btn.style.color = "#fff";
                setTimeout(() => modal.remove(), 1000);
            } catch (e) {
                btn.innerText = "❌ Error";
                btn.style.background = "#dc3545";
                btn.style.color = "#fff";
                setTimeout(() => modal.remove(), 2000);
            }
        };
    }
});
