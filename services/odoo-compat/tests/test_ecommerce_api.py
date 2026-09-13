from fastapi.testclient import TestClient

from app.api import app


client = TestClient(app)


def test_search_endpoint_returns_expected_shape():
    response = client.get("/api/search?q=parfum&limit=2")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert "query" in payload
    assert payload["query"] == "parfum"


def test_catalog_keeps_premium_design_metadata_when_odoo_is_disabled():
    response = client.get("/api/catalog?limit=2")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert payload["count"] >= 0

    if payload["items"]:
        product = payload["items"][0]
        assert "currency" in product
        assert "design" in product
        assert "stock_status" in product
        assert "badge" in product["design"]


def test_cart_flow():
    response = client.post("/api/cart/items", json={"product_id": 42, "quantity": 2})
    assert response.status_code == 200
    payload = response.json()
    assert payload["product_id"] == 42
    assert payload["quantity"] == 2

    cart = client.get("/api/cart")
    assert cart.status_code == 200
    cart_payload = cart.json()
    assert cart_payload["items"]
    assert "total" in cart_payload


def test_cart_update_and_clear():
    client.post("/api/cart/clear")
    item = client.post("/api/cart/items", json={"product_id": 99, "quantity": 1})
    assert item.status_code == 200
    updated = client.put("/api/cart/items/99", json={"quantity": 3})
    assert updated.status_code == 200
    payload = updated.json()
    assert payload["quantity"] == 3

    cart = client.get("/api/cart")
    assert cart.status_code == 200
    assert cart.json()["count"] == 1

    cleared = client.post("/api/cart/clear")
    assert cleared.status_code == 200
    assert cleared.json()["count"] == 0


def test_order_endpoint_accepts_payload():
    response = client.post(
        "/api/orders",
        json={
            "customer": {"name": "Test Client", "email": "test@example.com"},
            "shipping_address": {"city": "Paris", "country": "FR"},
            "items": [{"product_id": 42, "quantity": 1, "unit_price": 120.0}],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"draft", "created"}
    assert payload["items"]


def test_customer_and_checkout_flow():
    customer_response = client.post(
        "/api/customers",
        json={
            "name": "Alice Client",
            "email": "alice@example.com",
            "phone": "+33600000000",
            "address": {"street": "12 rue des Fleurs", "city": "Paris", "zip": "75001", "country": "FR"},
        },
    )
    assert customer_response.status_code == 200
    customer_payload = customer_response.json()
    assert customer_payload["email"] == "alice@example.com"

    checkout_response = client.post(
        "/api/checkout",
        json={
            "customer_email": "alice@example.com",
            "shipping_address": {"street": "12 rue des Fleurs", "city": "Paris", "zip": "75001", "country": "FR"},
            "items": [{"product_id": 42, "quantity": 2, "unit_price": 80.0}],
        },
    )
    assert checkout_response.status_code == 200
    checkout_payload = checkout_response.json()
    assert checkout_payload["status"] in {"created", "draft"}
    assert checkout_payload["customer"]["email"] == "alice@example.com"
    assert checkout_payload["items"]


def test_checkout_auto_creates_customer_when_missing():
    response = client.post(
        "/api/checkout",
        json={
            "customer": {"name": "New Customer", "email": "new.customer@example.com"},
            "shipping_address": {"street": "8 avenue de l'Opéra", "city": "Paris", "zip": "75002", "country": "FR"},
            "items": [{"product_id": 10, "quantity": 1, "unit_price": 99.5}],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["customer"]["email"] == "new.customer@example.com"
    assert payload["total"] == 99.5


def test_checkout_rejects_empty_items():
    response = client.post(
        "/api/checkout",
        json={
            "customer_email": "empty@example.com",
            "shipping_address": {"street": "1 rue Test", "city": "Lyon", "zip": "69001", "country": "FR"},
            "items": [],
        },
    )
    assert response.status_code == 422


def test_orders_tracking_and_production_health():
    order = client.post(
        "/api/orders",
        json={
            "customer": {"name": "Tracking Customer", "email": "track@example.com"},
            "shipping_address": {"city": "Marseille", "country": "FR"},
            "items": [{"product_id": 7, "quantity": 1, "unit_price": 49.0}],
        },
    )
    assert order.status_code == 200
    order_data = order.json()
    order_id = order_data["id"] if "id" in order_data else 1

    status_response = client.get(f"/api/orders/{order_id}/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert "status" in status_payload

    health_response = client.get("/api/health")
    assert health_response.status_code == 200
    health_payload = health_response.json()
    assert "odoo_sync" in health_payload
    assert "status" in health_payload


def test_order_detail_and_status_transition():
    order = client.post(
        "/api/orders",
        json={
            "customer": {"name": "Order Status User", "email": "status.user@example.com"},
            "shipping_address": {"city": "Nice", "country": "FR"},
            "items": [{"product_id": 17, "quantity": 2, "unit_price": 35.0}],
        },
    )
    assert order.status_code == 200
    order_id = order.json()["id"]

    detail = client.get(f"/api/orders/{order_id}")
    assert detail.status_code == 200
    detail_payload = detail.json()
    assert detail_payload["id"] == order_id
    assert detail_payload["customer"]["email"] == "status.user@example.com"

    updated = client.patch(f"/api/orders/{order_id}/status", json={"status": "confirmed"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "confirmed"

    current = client.get(f"/api/orders/{order_id}/status")
    assert current.status_code == 200
    assert current.json()["status"] == "confirmed"


def test_security_headers_are_present_on_health_response():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "strict-transport-security" in response.headers
    assert "content-security-policy" in response.headers


def test_checkout_endpoint_is_rate_limited_after_threshold():
    client.app.state.rate_limit_per_minute = 1
    client.app.state.rate_limit_store.clear()

    ok = client.post(
        "/api/checkout",
        json={
            "customer_email": "rate.limit@example.com",
            "shipping_address": {"street": "1 rue du test", "city": "Paris", "zip": "75000", "country": "FR"},
            "items": [{"product_id": 1, "quantity": 1, "unit_price": 15.0}],
        },
    )
    assert ok.status_code == 200

    blocked = client.post(
        "/api/checkout",
        json={
            "customer_email": "rate.limit@example.com",
            "shipping_address": {"street": "2 rue du test", "city": "Paris", "zip": "75000", "country": "FR"},
            "items": [{"product_id": 2, "quantity": 1, "unit_price": 20.0}],
        },
    )
    assert blocked.status_code == 429

    client.app.state.rate_limit_per_minute = 60
    client.app.state.rate_limit_store.clear()
