const urlParams = new URLSearchParams(window.location.search);
const downloadUrl = decodeURIComponent(urlParams.get('url'));
const filename = decodeURIComponent(urlParams.get('filename') || "Archivo Directo");

document.getElementById('fname').innerText = filename;

document.getElementById('btn-cancel').onclick = () => {
    window.close();
};

document.getElementById('btn-start').onclick = async () => {
    const btn = document.getElementById('btn-start');
    btn.innerText = "⏳ Enviando...";
    btn.disabled = true;
    
    try {
        await fetch('http://127.0.0.1:8000/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: downloadUrl, 
                is_video: false, 
                title: filename 
            })
        });
        btn.innerText = "✅ ¡Enviado!";
        btn.style.background = "#28a745";
        btn.style.color = "#fff";
        setTimeout(() => window.close(), 1000);
    } catch (e) {
        btn.innerText = "❌ Error al enviar";
        btn.style.background = "#dc3545";
        btn.style.color = "#fff";
        setTimeout(() => window.close(), 2000);
    }
};
