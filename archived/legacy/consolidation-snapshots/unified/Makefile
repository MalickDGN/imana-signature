.PHONY: install build test docker-ready dev-safe dev down logs clean

# ====================================================================================
# Tâches de Développement Générales
# ====================================================================================
install:
	pnpm install

build:
	pnpm run build

# ====================================================================================
# Tâches de Test et Qualité
# ====================================================================================
test:
	pnpm run test

# ====================================================================================
# Gestion de l'Environnement Docker
# ====================================================================================
docker-ready:
	powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/ensure-docker.ps1

dev-safe: docker-ready
	docker compose -f docker-compose.dev.yml down --remove-orphans
	docker compose -f docker-compose.dev.yml up -d --build

dev: docker-ready
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down --remove-orphans

logs:
	docker compose -f docker-compose.dev.yml logs -f

clean:
	@echo "Nettoyage des conteneurs Docker..."
	docker compose -f docker-compose.dev.yml down --remove-orphans -v
	-docker compose -f docker-compose.prod.yml down --remove-orphans -v 2>nul
	@echo "Conteneurs nettoyés."
