@echo off
setlocal

REM ================================
REM Build Settings
REM ================================
set APP_NAME=Electron Client
set VERSION=1.0.0

echo.
echo ================================
echo   Electron Build
echo ================================
echo App     : %APP_NAME%
echo Version : %VERSION%
echo ================================
echo.

REM 현재 BAT 파일 위치로 이동
cd /d "%~dp0"

REM package.json 버전 변경
call npm.cmd version %VERSION% --no-git-tag-version --allow-same-version

if errorlevel 1 (
    echo.
    echo [ERROR] Version update failed.
    pause
    exit /b 1
)

REM Electron Builder 실행
echo.
echo [BUILD] Building %APP_NAME%...
echo.

call npm.cmd run build

if errorlevel 1 (
    echo.
    echo ================================
    echo [ERROR] BUILD FAILED
    echo ================================
    pause
    exit /b 1
)

echo.
echo ================================
echo [SUCCESS] BUILD COMPLETE
echo ================================
echo.

REM 결과 폴더 열기
start "" "%~dp0dist"

pause
