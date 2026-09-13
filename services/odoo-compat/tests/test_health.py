from fastapi.testclient import TestClient

from app.api import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_endpoint_returns_structure():
    response = client.get("/api/catalog?limit=5")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert "count" in payload
