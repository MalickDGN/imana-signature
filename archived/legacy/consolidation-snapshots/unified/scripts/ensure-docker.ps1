$ErrorActionPreference = 'Stop'

function Test-DockerEngine {
    cmd.exe /d /c "docker info >nul 2>&1"
    return $LASTEXITCODE -eq 0
}

if (Test-DockerEngine) {
    Write-Host 'Docker est deja operationnel.'
    exit 0
}

Write-Host 'Docker Desktop est arrete. Demarrage en cours...'
docker desktop start

if ($LASTEXITCODE -ne 0) {
    throw 'Impossible de demarrer Docker Desktop. Ouvrez-le manuellement puis relancez la commande.'
}

$timeoutSeconds = 120
$pollIntervalSeconds = 3
$deadline = (Get-Date).AddSeconds($timeoutSeconds)

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $pollIntervalSeconds

    if (Test-DockerEngine) {
        Write-Host 'Le moteur Docker est operationnel.'
        exit 0
    }

    Write-Host 'En attente du moteur Docker...'
}

throw "Le moteur Docker n'a pas repondu apres $timeoutSeconds secondes."
