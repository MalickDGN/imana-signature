# Odoo Online v19 setup

This project is ready for Odoo Online v19, but the database name must match the subscription exactly.

## Required configuration

Set the following environment values in the project `.env` file:

```env
ODOO_URL=https://edu-mdgnsignature.odoo.com
ODOO_DB=your-exact-database
ODOO_USERNAME=your-user@example.com
ODOO_PASSWORD=your-api-key-or-password
ODOO_TIMEOUT=20
ENABLE_ODOO_SYNC=true
```

## Important note

Odoo Online instances often require the exact database name used by the hosted subscription. The login can be valid while the database name is still wrong.

## Diagnostic command

```bash
python scripts/check_odoo_connection.py
```

This read-only script authenticates through `/jsonrpc` using only the configured database. Exit codes: 0 for a positive user ID, 1 for failure, 2 for missing configuration. It does not guess database names or log response bodies.

## Safe behavior

If the live Odoo connection fails, the backend stays in a safe `disabled` mode instead of crashing or exposing credentials.
