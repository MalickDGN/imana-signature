from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from app.config import settings
from app.odoo.service import OdooService


def _odoo_sync_status() -> str:
    if not settings.enable_odoo_sync:
        return "disabled"
    if not settings.odoo_db or not settings.odoo_username or not settings.odoo_password:
        return "disabled"
    return "ok"

logger = logging.getLogger("maison_imana")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI(title=settings.app_name, version="1.0.0")
app.state.rate_limit_per_minute = 60
app.state.rate_limit_store = defaultdict(list)


def _reset_rate_limit_store():
    app.state.rate_limit_store.clear()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    request.state.request_id = request_id
    start_time = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path

    if path in {"/api/checkout", "/api/odoo/checkout"}:
        now = time.time()
        limit = int(getattr(app.state, "rate_limit_per_minute", 60))
        window = app.state.rate_limit_store[client_ip]
        window[:] = [ts for ts in window if now - ts < 60]
        if len(window) >= limit:
            logger.warning("rate_limited path=%s client_ip=%s request_id=%s", path, client_ip, request_id)
            response = await call_next(request)
            response.headers["x-request-id"] = request_id
            response.headers["retry-after"] = "60"
            response.status_code = 429
            return response
        window.append(now)

    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    response.headers["x-content-type-options"] = "nosniff"
    response.headers["x-frame-options"] = "DENY"
    response.headers["referrer-policy"] = "strict-origin-when-cross-origin"
    response.headers["x-xss-protection"] = "1; mode=block"
    response.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains"
    response.headers["content-security-policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline' https:; "
        "script-src 'self' 'unsafe-inline' https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none';"
    )
    elapsed_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "request path=%s method=%s status=%s duration_ms=%.2f client_ip=%s request_id=%s",
        path,
        request.method,
        response.status_code,
        elapsed_ms,
        client_ip,
        request_id,
    )
    return response

service = OdooService()
_cart: dict[str, list[dict[str, object]]] = {"items": []}
_customers: dict[str, dict[str, object]] = {}
_orders: list[dict[str, object]] = []


class CartItemInput(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class CustomerInput(BaseModel):
    name: str
    email: str


class ShippingAddressInput(BaseModel):
    city: str
    country: str


class OrderItemInput(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)


class OrderInput(BaseModel):
    customer: CustomerInput
    shipping_address: ShippingAddressInput
    items: list[OrderItemInput]


class AddressInput(BaseModel):
    street: str
    city: str
    zip: str
    country: str


class CustomerProfileInput(BaseModel):
    name: str
    email: str
    phone: str
    address: AddressInput


class CheckoutInput(BaseModel):
    customer_email: str | None = None
    customer: dict[str, str] | None = None
    shipping_address: AddressInput | dict[str, str] | None = None
    items: list[OrderItemInput]

    @model_validator(mode="before")
    @classmethod
    def normalize_payload(cls, values):
        if not isinstance(values, dict):
            return values

        if "customer_email" not in values and isinstance(values.get("customer"), dict):
            values["customer_email"] = values["customer"].get("email")

        if "shipping_address" in values and values["shipping_address"] is not None and not isinstance(values["shipping_address"], dict):
            values["shipping_address"] = values["shipping_address"].model_dump()

        if values.get("shipping_address") is None and isinstance(values.get("address"), dict):
            values["shipping_address"] = values["address"]

        return values

    @model_validator(mode="after")
    def validate_and_normalize(self):
        if not self.items:
            raise ValueError("items must contain at least one item")

        if not self.resolved_customer_email and isinstance(self.customer, dict):
            email = str(self.customer.get("email", "")).strip()
            if email:
                self.customer_email = email

        return self

    @property
    def resolved_customer_email(self) -> str:
        if self.customer_email:
            return self.customer_email
        if isinstance(self.customer, dict):
            return str(self.customer.get("email", ""))
        return ""

    @property
    def resolved_shipping_address(self) -> dict[str, str]:
        if isinstance(self.shipping_address, dict):
            return self.shipping_address
        if self.shipping_address is None:
            return {}
        return self.shipping_address.model_dump()


@app.get("/")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "status": "ok", "environment": settings.environment}


@app.get("/favicon.ico")
def favicon() -> None:
    return None


@app.get("/health")
@app.get("/api/health")
def health_check() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "odoo_sync": _odoo_sync_status(),
        "ready": settings.enable_odoo_sync and bool(settings.odoo_db and settings.odoo_username and settings.odoo_password),
    }


@app.get("/api/catalog")
def get_catalog(
    limit: int = Query(default=50, ge=1, le=250),
    offset: int = Query(default=0, ge=0),
) -> dict[str, object]:
    try:
        products = service.get_catalog(limit=limit, offset=offset)
        return {"items": products, "count": len(products), "limit": limit, "offset": offset}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/categories")
def get_categories() -> dict[str, object]:
    try:
        return {"items": service.get_categories()}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/products/{product_id}")
def get_product(product_id: int) -> dict[str, object]:
    try:
        product = service.get_product(product_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if product is None:
        raise HTTPException(status_code=404, detail="product_not_found")
    return {"item": product}


@app.get("/api/search")
def search_products(q: str = Query(default="", min_length=1), limit: int = Query(default=10, ge=1, le=50)) -> dict[str, object]:
    if not q:
        return {"items": [], "query": q, "count": 0, "limit": limit}

    try:
        items = service.get_catalog(limit=limit, offset=0)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    filtered = [
        item for item in items if q.lower() in str(item.get("name", "")).lower() or q.lower() in str(item.get("default_code", "")).lower()
    ]
    return {"items": filtered[:limit], "query": q, "count": len(filtered), "limit": limit}


@app.get("/api/cart")
def get_cart() -> dict[str, object]:
    total = sum(float(item.get("unit_price", 0)) * float(item.get("quantity", 0)) for item in _cart["items"])
    return {"items": _cart["items"], "count": len(_cart["items"]), "total": round(total, 2)}


@app.post("/api/cart/items")
def add_cart_item(payload: CartItemInput) -> dict[str, object]:
    existing = next((item for item in _cart["items"] if int(item.get("product_id")) == payload.product_id), None)
    if existing is not None:
        existing["quantity"] = int(existing.get("quantity", 0)) + payload.quantity
        existing["unit_price"] = float(existing.get("unit_price", 0))
        return {"product_id": payload.product_id, "quantity": existing["quantity"], "status": "updated"}

    _cart["items"].append({
        "product_id": payload.product_id,
        "quantity": payload.quantity,
        "unit_price": 0.0,
    })
    return {"product_id": payload.product_id, "quantity": payload.quantity, "status": "added"}


@app.put("/api/cart/items/{product_id}")
def update_cart_item(product_id: int, payload: dict[str, int]) -> dict[str, object]:
    quantity = int(payload.get("quantity", 0))
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity_must_be_positive")

    for item in _cart["items"]:
        if int(item.get("product_id")) == product_id:
            item["quantity"] = quantity
            return {"product_id": product_id, "quantity": quantity, "status": "updated"}

    raise HTTPException(status_code=404, detail="cart_item_not_found")


@app.post("/api/cart/clear")
def clear_cart() -> dict[str, object]:
    _cart["items"] = []
    return {"status": "cleared", "count": 0}


@app.post("/api/customers")
def upsert_customer(payload: CustomerProfileInput) -> dict[str, object]:
    customer_data = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "address": payload.address.model_dump(),
    }
    _customers[payload.email] = customer_data
    return {"status": "created", **customer_data}


@app.post("/api/odoo/customers")
def sync_odoo_customer(payload: CustomerProfileInput) -> dict[str, object]:
    status = _odoo_sync_status()
    customer_data = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "address": payload.address.model_dump(),
    }
    if status == "disabled":
        return {
            "status": "disabled",
            "customer": customer_data,
            "message": "Odoo customer sync is disabled because the connection is not configured.",
        }

    try:
        customer_id = service.repository.create_customer(customer_data)
        return {
            "status": "created",
            "customer": {"id": customer_id, "email": payload.email, "name": payload.name, "phone": payload.phone},
            "address": customer_data["address"],
            "odoo_sync": status,
        }
    except RuntimeError:
        return {
            "status": "disabled",
            "customer": customer_data,
            "message": "Odoo customer sync is temporarily unavailable.",
            "odoo_sync": status,
        }


@app.post("/api/orders")
def create_order(payload: OrderInput) -> dict[str, object]:
    order_items = [
        {"product_id": item.product_id, "quantity": item.quantity, "unit_price": item.unit_price}
        for item in payload.items
    ]
    order = {
        "id": len(_orders) + 1,
        "status": "draft",
        "customer": payload.customer.model_dump(),
        "shipping_address": payload.shipping_address.model_dump(),
        "items": order_items,
        "total": round(sum(item["unit_price"] * item["quantity"] for item in order_items), 2),
        "odoo_sync": _odoo_sync_status(),
    }
    _orders.append(order)
    return order


@app.get("/api/orders/{order_id}")
def get_order(order_id: int) -> dict[str, object]:
    order = next((entry for entry in _orders if int(entry.get("id", -1)) == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="order_not_found")
    return order


@app.get("/api/orders/{order_id}/status")
def get_order_status(order_id: int) -> dict[str, object]:
    order = next((entry for entry in _orders if int(entry.get("id", -1)) == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="order_not_found")
    return {"order_id": order_id, "status": order.get("status", "draft"), "odoo_sync": _odoo_sync_status()}


@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: int, payload: dict[str, str]) -> dict[str, object]:
    order = next((entry for entry in _orders if int(entry.get("id", -1)) == order_id), None)
    if order is None:
        raise HTTPException(status_code=404, detail="order_not_found")
    status = payload.get("status", "draft")
    order["status"] = status
    return {"order_id": order_id, "status": status}


@app.post("/api/checkout")
def checkout(payload: CheckoutInput) -> dict[str, object]:
    customer_email = payload.resolved_customer_email
    if not customer_email:
        raise HTTPException(status_code=400, detail="customer_email_required")

    customer = _customers.get(customer_email)
    if customer is None:
        customer = {
            "name": (payload.customer or {}).get("name") or customer_email.split("@")[0].replace(".", " ").title(),
            "email": customer_email,
            "phone": (payload.customer or {}).get("phone") or "",
            "address": payload.resolved_shipping_address,
        }
        _customers[customer_email] = customer

    items = [
        {"product_id": item.product_id, "quantity": item.quantity, "unit_price": item.unit_price}
        for item in payload.items
    ]
    order = {
        "status": "created",
        "customer": customer,
        "shipping_address": payload.resolved_shipping_address,
        "items": items,
        "total": round(sum(item["unit_price"] * item["quantity"] for item in items), 2),
        "workflow": "checkout",
    }
    _orders.append(order)
    return order


@app.get("/api/odoo/status")
def odoo_status() -> dict[str, object]:
    enabled = settings.enable_odoo_sync
    ready = bool(settings.odoo_db and settings.odoo_username and settings.odoo_password)
    status = "ok" if enabled and ready else "disabled"
    return {
        "status": status,
        "enabled": enabled,
        "database": settings.odoo_db,
        "username": settings.odoo_username,
        "ready": ready,
    }


@app.get("/api/odoo/sync/catalog")
def sync_odoo_catalog() -> dict[str, object]:
    status = _odoo_sync_status()
    return {
        "status": status,
        "message": "Catalog synchronization is ready and guarded by environment configuration." if status == "ok" else "Odoo sync is disabled because credentials are not configured.",
        "target": "product.template",
    }


@app.post("/api/odoo/orders")
def sync_odoo_order(payload: OrderInput) -> dict[str, object]:
    status = _odoo_sync_status()
    order = {
        "status": "draft" if status == "disabled" else "created",
        "customer": payload.customer.model_dump(),
        "shipping_address": payload.shipping_address.model_dump(),
        "items": [
            {"product_id": item.product_id, "quantity": item.quantity, "unit_price": item.unit_price}
            for item in payload.items
        ],
        "total": round(sum(item.unit_price * item.quantity for item in payload.items), 2),
        "odoo_sync": status,
    }
    _orders.append(order)
    return order


@app.post("/api/odoo/checkout")
def sync_odoo_checkout(payload: CheckoutInput) -> dict[str, object]:
    customer_email = payload.resolved_customer_email
    if not customer_email:
        raise HTTPException(status_code=400, detail="customer_email_required")

    items = [
        {"product_id": item.product_id, "quantity": item.quantity, "unit_price": item.unit_price}
        for item in payload.items
    ]
    result = service.create_checkout_order(customer_email, payload.resolved_shipping_address, items)

    customer = _customers.get(customer_email)
    if customer is None:
        customer = {
            "name": (payload.customer or {}).get("name") or customer_email.split("@")[0].replace(".", " ").title(),
            "email": customer_email,
            "phone": (payload.customer or {}).get("phone") or "",
            "address": payload.resolved_shipping_address,
        }
        _customers[customer_email] = customer

    result["customer"] = customer
    return result
