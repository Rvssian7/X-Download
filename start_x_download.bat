@echo off
echo Iniciando Acelerador X-Download...
cd /d "%~dp0backend"
call venv\Scripts\activate
python run.py
pause
