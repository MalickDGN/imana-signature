from __future__ import annotations

from typing import Any

from app.config import settings
from app.odoo.repository import OdooRepository


class OdooService:
    """Business-facing service that transforms Odoo raw data into front-end-ready structures."""

    _fallback_products: list[dict[str, Any]] = [
        {
            "id": 101,
            "name": "IMANA Signature — L’Extrait Intense",
            "default_code": "IM-INT-101",
            "description_sale": "Parfum signature premium aux notes boisées et orientales.",
            "list_price": 149.0,
            "image_1920": "/assets/images/optimized/imana-product-1.webp",
            "website_published": True,
            "categ_id": 1,
            "sale_ok": True,
            "active": True,
            "currency": "EUR",
            "stock_status": "in_stock",
            "available": True,
            "stock_available": 9,
            "design": {"badge": "Signature", "layout": "editorial", "tone": "premium"},
        },
        {
            "id": 102,
            "name": "IMANA Signature — Fleur de Cuir",
            "default_code": "IM-FC-102",
            "description_sale": "Fleur de cuir et musc avec une signature veloutée et élégante.",
            "list_price": 168.0,
            "image_1920": "/assets/images/optimized/imana-product-2.webp",
            "website_published": True,
            "categ_id": 1,
            "sale_ok": True,
            "active": True,
            "currency": "EUR",
            "stock_status": "low_stock",
            "available": True,
            "stock_available": 3,
            "design": {"badge": "Nouveau", "layout": "editorial", "tone": "luxury"},
        },
        {
            "id": 103,
            "name": "IMANA Signature — Lumière de Santal",
            "default_code": "IM-LS-103",
            "description_sale": "Santal noble, extrait doux et lumineux pour un dressing haut de gamme.",
            "list_price": 189.0,
            "image_1920": "/assets/images/optimized/imana-product-3.webp",
            "website_published": True,
            "categ_id": 2,
            "sale_ok": True,
            "active": True,
            "currency": "EUR",
            "stock_status": "in_stock",
            "available": True,
            "stock_available": 12,
            "design": {"badge": "Best Seller", "layout": "editorial", "tone": "premium"},
        },
    ]

    def __init__(self, repository: OdooRepository | None = None):
        self.repository = repository or OdooRepository()

    def _is_available(self) -> bool:
        return settings.enable_odoo_sync and bool(settings.odoo_db and settings.odoo_username and settings.odoo_password)

    def _design_for_product(self, product: dict[str, Any]) -> dict[str, Any]:
        badge = "Signature"
        if product.get("default_code") and "Fleur" in str(product.get("default_code", "")):
            badge = "Nouveau"
        elif product.get("default_code") and "Santal" in str(product.get("default_code", "")):
            badge = "Best Seller"
        return {"badge": badge, "layout": "editorial", "tone": "premium"}

    def _fallback_catalog(self, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
        items = self._fallback_products[offset:offset + limit]
        return [
            {
                **item,
                "design": self._design_for_product(item),
                "currency": item.get("currency", "EUR"),
                "stock_status": "in_stock" if item.get("available", True) else "out_of_stock",
            }
            for item in items
        ]

    def _enrich_product(self, product: dict[str, Any]) -> dict[str, Any]:
        product_id = int(product.get("id", 0))
        stock_quantity = self.repository.get_stock(product_id) if product_id else 0
        design = self._design_for_product(product)
        available = stock_quantity > 0
        return {
            "id": product_id,
            "name": product.get("name"),
            "default_code": product.get("default_code"),
            "description_sale": product.get("description_sale"),
            "list_price": product.get("list_price", 0),
            "image_1920": product.get("image_1920"),
            "website_published": bool(product.get("website_published", False)),
            "category_id": product.get("categ_id"),
            "sale_ok": bool(product.get("sale_ok", True)),
            "active": bool(product.get("active", True)),
            "stock_available": stock_quantity,
            "available": available,
            "currency": "EUR",
            "stock_status": "in_stock" if available else "out_of_stock",
            "design": design,
        }

    def get_catalog(self, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
        if not self._is_available():
            return self._fallback_catalog(limit=limit, offset=offset)
        try:
            rows = self.repository.get_products(limit=limit, offset=offset)
        except RuntimeError:
            return self._fallback_catalog(limit=limit, offset=offset)
        return [self._enrich_product(product) for product in rows]

    def get_product(self, product_id: int) -> dict[str, Any] | None:
        if not self._is_available():
            for product in self._fallback_products:
                if int(product["id"]) == int(product_id):
                    item = {**product, "design": self._design_for_product(product), "currency": "EUR", "stock_status": "in_stock" if product.get("available", True) else "out_of_stock"}
                    return item
            return None
        try:
            product = self.repository.get_product(product_id)
        except RuntimeError:
            return None
        if product is None:
            return None
        return self._enrich_product(product)

    def get_categories(self) -> list[dict[str, Any]]:
        if not self._is_available():
            return [
                {"id": 1, "name": "Signature", "design": {"tone": "premium"}},
                {"id": 2, "name": "Lumière", "design": {"tone": "premium"}},
            ]
        try:
            return self.repository.get_categories()
        except RuntimeError:
            return [
                {"id": 1, "name": "Signature", "design": {"tone": "premium"}},
                {"id": 2, "name": "Lumière", "design": {"tone": "premium"}},
            ]

    def create_checkout_order(self, customer_email: str, shipping_address: dict[str, Any], items: list[dict[str, Any]]) -> dict[str, Any]:
        if not self._is_available():
            return {
                "status": "disabled",
                "customer": {"email": customer_email},
                "shipping_address": shipping_address,
                "items": items,
                "total": round(sum(float(item.get("unit_price", 0)) * float(item.get("quantity", 0)) for item in items), 2),
                "odoo_sync": "disabled",
            }

        try:
            customer_payload = {
                "name": customer_email.split("@")[0].replace(".", " ").title(),
                "email": customer_email,
                "phone": "",
                "address": shipping_address,
            }
            customer_id = self.repository.create_customer(customer_payload)
            order_id = self.repository.create_order(customer_id, items, shipping_address)
        except RuntimeError:
            return {
                "status": "disabled",
                "customer": {"email": customer_email},
                "shipping_address": shipping_address,
                "items": items,
                "total": round(sum(float(item.get("unit_price", 0)) * float(item.get("quantity", 0)) for item in items), 2),
                "odoo_sync": "disabled",
            }

        return {
            "status": "created",
            "customer": {"id": customer_id, "email": customer_email},
            "shipping_address": shipping_address,
            "items": items,
            "total": round(sum(float(item.get("unit_price", 0)) * float(item.get("quantity", 0)) for item in items), 2),
            "order_id": order_id,
            "odoo_sync": "ok",
        }
