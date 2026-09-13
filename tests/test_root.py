from fastapi.testclient import TestClient

from app.api import app


client = TestClient(app)


def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["app"] == "Maison Imana"


def test_favicon_route():
    response = client.get("/favicon.ico")
    assert response.status_code in (200, 204)
