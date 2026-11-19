@echo off
REM Porneste serverul local ELIT SCADA (cu reincarcare automata) si deschide browserul
cd /d "%~dp0"
start "" http://localhost:8080/
node dev/server.js 8080
