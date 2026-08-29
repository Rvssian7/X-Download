import subprocess

def notify_mac(title: str, text: str):
    script = f'display notification "{text}" with title "{title}"'
    try:
        subprocess.run(['osascript', '-e', script])
    except Exception:
        pass
