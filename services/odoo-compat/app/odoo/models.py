from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProductRecord:
    id: int
    name: str
    default_code: str | None = None
    description_sale: str | None = None
    list_price: float = 0.0
    image_1920: str | None = None
    website_published: bool = False
    category_id: int | None = None
    sale_ok: bool = True
    active: bool = True
    stock_available: int = 0
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class CartEntry:
    product_id: int
    quantity: int
    unit_price: float


@dataclass
class OrderDraft:
    customer_name: str
    customer_email: str
    shipping_city: str
    shipping_country: str
    items: list[CartEntry] = field(default_factory=list)
