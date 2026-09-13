from fastapi.testclient import TestClient

from app.api import app


client = TestClient(app)


def test_odoo_catalog_sync_endpoint_exists():
    response = client.get("/api/odoo/sync/catalog")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "disabled"}


def test_odoo_customer_creation_endpoint_exists():
    response = client.post(
        "/api/odoo/customers",
        json={
            "name": "Alice Client",
            "email": "alice@example.com",
            "phone": "+33600000000",
            "address": {"street": "12 rue des Fleurs", "city": "Paris", "zip": "75001", "country": "FR"},
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"created", "disabled"}
    assert payload["customer"]["email"] == "alice@example.com"


def test_odoo_order_submission_endpoint_exists():
    response = client.post(
        "/api/odoo/orders",
        json={
            "customer": {"name": "Alice Client", "email": "alice@example.com"},
            "shipping_address": {"city": "Paris", "country": "FR"},
            "items": [{"product_id": 42, "quantity": 1, "unit_price": 120.0}],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"draft", "created", "disabled"}
    assert payload["items"]


def test_odoo_checkout_endpoint_exists():
    response = client.post(
        "/api/odoo/checkout",
        json={
            "customer": {"name": "Alice Client", "email": "alice@example.com", "phone": "+33600000000"},
            "shipping_address": {"street": "12 rue des Fleurs", "city": "Paris", "zip": "75001", "country": "FR"},
            "items": [{"product_id": 42, "quantity": 2, "unit_price": 80.0}],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"draft", "created", "disabled"}
    assert payload["customer"]["email"] == "alice@example.com"


def test_odoo_sync_status_endpoint_reports_configuration():
    response = client.get("/api/odoo/status")
    assert response.status_code == 200
    payload = response.json()
    assert "status" in payload
    assert "enabled" in payload
    assert "database" in payload
    assert "username" in payload
