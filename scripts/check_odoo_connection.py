from __future__ import annotations


import os
from pathlib import Path
from typing import Any

import httpx


def load_dotenv(path: str | Path) -> dict[str, str]:
    values: dict[str, str] = {}
    env_file = Path(path)
    if not env_file.exists():
        return values
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def probe_login(base_url: str, database: str, username: str, password: str) -> dict[str, Any]:
    payload = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "service": "common",
            "method": "login",
            "args": [database, username, password],
        },
    }
    candidates = [
        "/jsonrpc",
    ]
    for endpoint in candidates:
        try:
            response = httpx.post(f"{base_url.rstrip('/')}{endpoint}", json=payload, timeout=20)
            text = response.text.strip()
            print(f"[probe] {endpoint} -> HTTP {response.status_code}")
            if response.status_code != 200:
                print("Endpoint rejected the request or returned an invalid response.")
                print("---")
                continue
            if "faultCode" in text or "error" in text.lower():
                print("Endpoint rejected the request or returned an invalid response.")
                print("---")
                continue
            try:
                data = response.json()
            except ValueError:
                print("Endpoint rejected the request or returned an invalid response.")
                print("---")
                continue
            if isinstance(data, dict) and type(data.get("result")) is int and data["result"] > 0:
                return {
                    "database": database,
                    "endpoint": endpoint,
                    "uid": data["result"],
                    "status": "ok",
                }
            print("Authentication did not return a positive user id.")
            print("---")
        except Exception as exc:  # pragma: no cover - diagnostic script
            print(f"[probe] {endpoint} -> ERROR: {type(exc).__name__}")
    return {"database": database, "status": "failed"}


def main() -> None:
    env_values = load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    required = ("ODOO_URL", "ODOO_DB", "ODOO_USERNAME", "ODOO_PASSWORD")
    config = {key: os.getenv(key, env_values.get(key, "")) for key in required}
    missing = [key for key, value in config.items() if not value.strip()]
    if missing:
        print("Missing configuration: " + ", ".join(missing))
        raise SystemExit(2)
    base_url = config["ODOO_URL"].strip()
    username = config["ODOO_USERNAME"].strip()
    password = config["ODOO_PASSWORD"]
    db_candidates = [config["ODOO_DB"].strip()]

    print("Odoo diagnostic for Odoo Online v19")
    print(f"URL: {base_url}")
    print(f"Username: {username}")
    print(f"Candidates: {db_candidates}")
    print("---")

    for candidate in db_candidates:
        if not candidate:
            continue
        result = probe_login(base_url, candidate, username, password)
        if result.get("status") == "ok":
            print(f"VALID DATABASE FOUND: {result['database']} | endpoint={result['endpoint']} | uid={result['uid']}")
            return

    print("No valid Odoo database was accepted for this account on the provided Odoo Online instance.")
    print("Check the database name, the account, or the Odoo Online test subscription.")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
