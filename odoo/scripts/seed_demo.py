"""Idempotent local demo data for `odoo shell`.

Usage:
  Get-Content odoo/scripts/seed_demo.py |
    docker compose -f docker-compose.dev.yml run --rm -T odoo \
      odoo shell -d <database>
"""

categories = {}
for name in ("Designers", "Niche", "Coffrets"):
    category = env["product.category"].search([("name", "=", name)], limit=1)
    if not category:
        category = env["product.category"].create({"name": name})
    categories[name] = category

products = (
    ("Ambre Nocturne", 68000, "Designers"),
    ("Rose Noire", 95000, "Niche"),
    ("Oud Prestige", 120000, "Niche"),
    ("Jardin Secret", 52000, "Designers"),
)

stock_location = env.ref("stock.stock_location_stock")
for name, price, category_name in products:
    template = env["product.template"].search([("name", "=", name)], limit=1)
    values = {
        "name": name,
        "list_price": price,
        "sale_ok": True,
        "is_storable": True,
        "categ_id": categories[category_name].id,
    }
    if template:
        template.write(values)
    else:
        template = env["product.template"].create(values)

    product = template.product_variant_id
    quantity_to_add = max(0, 20 - product.qty_available)
    if quantity_to_add:
        env["stock.quant"]._update_available_quantity(
            product,
            stock_location,
            quantity_to_add,
        )

shipping_products = {}
for code, name, price in (
    ("standard", "Livraison Standard", 3000),
    ("express", "Livraison Express", 7000),
):
    template = env["product.template"].search([("name", "=", name)], limit=1)
    values = {
        "name": name,
        "list_price": price,
        "sale_ok": False,
        "type": "service",
    }
    if template:
        template.write(values)
    else:
        template = env["product.template"].create(values)
    shipping_products[code] = template.product_variant_id.id

env.cr.commit()
print(
    "IMANA_SEED_IDS:"
    f"{shipping_products['standard']}:"
    f"{shipping_products['express']}"
)
