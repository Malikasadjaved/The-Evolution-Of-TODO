@echo off
REM Simple batch script to rebuild frontend with correct URLs

echo ========================================
echo Rebuilding Frontend for Kubernetes
echo ========================================
echo.

REM Get Minikube IP
for /f %%i in ('minikube ip') do set MINIKUBE_IP=%%i

echo Minikube IP: %MINIKUBE_IP%
echo.

REM Set URLs
set BACKEND_URL=http://%MINIKUBE_IP%:30002
set FRONTEND_URL=http://%MINIKUBE_IP%:30000
set AUTH_URL=%FRONTEND_URL%/api/auth

echo Backend URL:  %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo Auth URL:     %AUTH_URL%
echo.

echo ========================================
echo Step 1: Configure Docker for Minikube
echo ========================================
echo.

REM Configure Docker to use Minikube
@FOR /f "tokens=*" %%i IN ('minikube docker-env --shell cmd') DO @%%i

echo Docker configured to use Minikube daemon
echo.

echo ========================================
echo Step 2: Build Frontend Image
echo ========================================
echo.

docker build ^
  -f docker/frontend-web.Dockerfile ^
  --build-arg NEXT_PUBLIC_API_URL=%BACKEND_URL% ^
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET=DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A ^
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=%AUTH_URL% ^
  -t todo-frontend-web:latest ^
  frontend-web/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker build failed!
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Restart Frontend Deployment
echo ========================================
echo.

kubectl rollout restart deployment/todo-app-frontend-web
kubectl rollout status deployment/todo-app-frontend-web --timeout=3m

echo.
echo ========================================
echo SUCCESS! Deployment Complete
echo ========================================
echo.
echo Access your application:
echo   Frontend: %FRONTEND_URL%
echo   Backend:  %BACKEND_URL%
echo.
echo Open %FRONTEND_URL% in your browser!
echo.
pause
