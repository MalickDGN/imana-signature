from __future__ import annotations

from typing import Any

from app.odoo.client import OdooClient


class OdooRepository:
    """Repository layer encapsulating access to Odoo models and data mapping."""

    def __init__(self, client: OdooClient | None = None):
        self.client = client or OdooClient()

    def get_products(self, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
        return self.client.fetch(
            "product.template",
            domain=[["sale_ok", "=", True], ["active", "=", True]],
            fields=[
                "id",
                "name",
                "default_code",
                "description_sale",
                "list_price",
                "image_1920",
                "website_published",
                "categ_id",
                "sale_ok",
                "active",
            ],
            limit=limit,
            offset=offset,
        )

    def get_product(self, product_id: int) -> dict[str, Any] | None:
        rows = self.client.fetch(
            "product.template",
            domain=[["id", "=", product_id], ["sale_ok", "=", True], ["active", "=", True]],
            fields=[
                "id",
                "name",
                "default_code",
                "description_sale",
                "list_price",
                "image_1920",
                "website_published",
                "categ_id",
                "sale_ok",
                "active",
            ],
            limit=1,
        )
        return rows[0] if rows else None

    def get_categories(self) -> list[dict[str, Any]]:
        return self.client.fetch(
            "product.category",
            fields=["id", "name", "parent_id", "display_name"],
            limit=200,
        )

    def get_stock(self, product_id: int) -> int:
        rows = self.client.fetch(
            "stock.quant",
            domain=[["product_id", "=", product_id]],
            fields=["quantity"],
            limit=50,
        )
        return sum(float(row.get("quantity", 0)) for row in rows)

    def create_customer(self, payload: dict[str, Any]) -> int:
        values = {
            "name": payload.get("name", ""),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
        }
        address = payload.get("address") or {}
        if address:
            values.update({
                "street": address.get("street", ""),
                "city": address.get("city", ""),
                "zip": address.get("zip", ""),
                "country_id": address.get("country_id") or False,
            })
        customer_id = self.client.create("res.partner", values)
        return int(customer_id)

    def create_order(self, customer_id: int, items: list[dict[str, Any]], shipping_address: dict[str, Any]) -> int:
        order_id = self.client.create(
            "sale.order",
            {
                "partner_id": customer_id,
                "state": "draft",
                "warehouse_id": False,
                "note": f"Shipping: {shipping_address.get('city', '')} - {shipping_address.get('country', '')}",
            },
        )
        order_lines = []
        for item in items:
            line_values = {
                "order_id": order_id,
                "product_id": item.get("product_id"),
                "product_uom_qty": item.get("quantity", 1),
                "price_unit": item.get("unit_price", 0),
            }
            order_lines.append((0, 0, line_values))
        self.client.write("sale.order", int(order_id), {"order_line": order_lines})
        return int(order_id)
