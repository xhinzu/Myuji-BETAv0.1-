@echo off
title MyuJiku v2 Launcher
cd /d "%~dp0"

echo =======================================================
echo   Launching MyuJiku v2 Desktop Music Player...
echo =======================================================

if exist "%~dp0MyuJiku.exe" (
    start "" "%~dp0MyuJiku.exe"
    exit /b 0
)

if exist "F:\vbcode\releases\MyuJiku.exe" (
    start "" "F:\vbcode\releases\MyuJiku.exe"
    exit /b 0
)

echo Executable not found. Launching via pnpm...
pnpm desktop:tauri
