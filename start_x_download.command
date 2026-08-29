#!/bin/bash
echo "Iniciando Acelerador X-Download..."
cd "$(dirname "$0")/backend"
source venv/bin/activate
python run.py
