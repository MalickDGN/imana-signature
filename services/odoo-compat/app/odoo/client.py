import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class OdooClient:
    """Secure Odoo JSON-RPC client for the backend-only integration layer."""

    COMMON_ENDPOINTS = ("/jsonrpc",)
    OBJECT_ENDPOINTS = ("/jsonrpc",)

    def __init__(self) -> None:
        self.base_url = settings.odoo_url.rstrip("/")
        self.timeout = settings.odoo_timeout
        self.database = settings.odoo_db
        self.username = settings.odoo_username
        self.password = settings.odoo_password
        self.uid: int | None = None
        self._common_endpoint = self.COMMON_ENDPOINTS[0]
        self._object_endpoint = self.OBJECT_ENDPOINTS[0]
        self._session = httpx.Client(base_url=self.base_url, timeout=self.timeout)

    def close(self) -> None:
        self._session.close()

    def __enter__(self) -> "OdooClient":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def _post_with_fallback(self, endpoints: tuple[str, ...], payload: dict[str, Any]) -> dict[str, Any]:
        last_error: Exception | None = None
        for endpoint in endpoints:
            try:
                response = self._session.post(endpoint, json=payload)
                response.raise_for_status()
                try:
                    data = response.json()
                except ValueError as exc:
                    body = response.text[:300].replace("\n", " ")
                    last_error = RuntimeError(f"Odoo endpoint '{endpoint}' returned a non-JSON response: {body}")
                    continue
                if isinstance(data, dict) and "error" in data:
                    last_error = RuntimeError(f"Odoo endpoint '{endpoint}' returned an error: {data['error']}")
                    continue
                return data
            except (httpx.HTTPError, ValueError, TypeError) as exc:
                last_error = exc
        if last_error is not None:
            raise RuntimeError(f"Odoo request failed across all endpoints: {last_error}") from last_error
        raise RuntimeError("Odoo request failed across all endpoints")

    def authenticate(self) -> int:
        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "service": "common",
                "method": "login",
                "args": [self.database, self.username, self.password],
            },
        }
        data = self._post_with_fallback(self.COMMON_ENDPOINTS, payload)

        if "error" in data:
            raise RuntimeError(f"Odoo authentication failed: {data['error']}")
        uid = data.get("result")
        if not uid:
            raise RuntimeError("Odoo login returned an empty user id")
        self.uid = int(uid)
        return self.uid

    def _execute_kw(self, model: str, method: str, *args: Any, **kwargs: Any) -> Any:
        if not settings.enable_odoo_sync:
            raise RuntimeError("Odoo sync is disabled in environment configuration")
        if self.uid is None:
            self.authenticate()

        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "service": "object",
                "method": "execute_kw",
                "args": [
                    self.database,
                    self.uid,
                    self.password,
                    model,
                    method,
                    list(args),
                    kwargs,
                ],
            },
        }
        data = self._post_with_fallback(self.OBJECT_ENDPOINTS, payload)

        if "error" in data:
            raise RuntimeError(f"Odoo request failed: {data['error']}")
        return data.get("result")

    def fetch(
        self,
        model: str,
        domain: list | None = None,
        fields: list[str] | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"fields": fields or []}
        if limit is not None:
            params["limit"] = limit
        if offset:
            params["offset"] = offset
        return self._execute_kw(model, "search_read", domain or [], params)

    def call(self, model: str, method: str, *args: Any, **kwargs: Any) -> Any:
        return self._execute_kw(model, method, *args, **kwargs)

    def create(self, model: str, values: dict[str, Any]) -> Any:
        return self._execute_kw(model, "create", values)

    def write(self, model: str, record_id: int, values: dict[str, Any]) -> bool:
        return bool(self._execute_kw(model, "write", record_id, values))
