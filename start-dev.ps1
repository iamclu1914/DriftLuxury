# start-dev.ps1

$ErrorActionPreference = "Stop"

try {
    # Start the backend server in a new terminal window
    Write-Host "Starting backend server in a new window..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\rdyal\OneDrive\Drift'; c:/Users/rdyal/OneDrive/Drift/.venv/Scripts/python.exe -m uvicorn backend.server:app --reload"

    # Wait for a few seconds to give the backend time to initialize
    Write-Host "Waiting for backend to start..."
    Start-Sleep -Seconds 5

    # Start the frontend server in the current window
    Write-Host "Starting frontend server..."
    cd 'c:\Users\rdyal\OneDrive\Drift\frontend'
    npm start
}
catch {
    Write-Error "An error occurred: $_"
}
