PYTHON ?= python3

run-backend:
	$(PYTHON) -m uvicorn app.main:app --reload --port 8000

run-frontend:
	@echo "Frontend not yet implemented in this repo; wire to Vite app when available."

run-sim:
	@echo "Simulator not yet implemented in this repo; hook up device simulator here."

# docker-compose lives at repo root (backend) to orchestrate api+web+sim
run-demo:
	docker compose up --build

demo: run-demo
