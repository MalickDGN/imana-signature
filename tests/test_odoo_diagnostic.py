import importlib.util
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest

spec = importlib.util.spec_from_file_location(
    "odoo_diagnostic", Path(__file__).resolve().parents[1] / "scripts/check_odoo_connection.py"
)
diagnostic = importlib.util.module_from_spec(spec)
spec.loader.exec_module(diagnostic)


@pytest.mark.parametrize("uid, expected", [(42, "ok"), (False, "failed"), (True, "failed"), (0, "failed"), (-1, "failed"), ("42", "failed")])
def test_probe_requires_positive_integer_uid(uid, expected):
    with patch.object(diagnostic.httpx, "post", return_value=httpx.Response(200, json={"result": uid})) as post:
        result = diagnostic.probe_login("https://example.com", "db", "user", "secret")
    assert result["status"] == expected
    assert post.call_args.args == ("https://example.com/jsonrpc",)
    assert post.call_count == 1


def test_backend_uses_jsonrpc_transport():
    from app.odoo.client import OdooClient

    assert OdooClient.COMMON_ENDPOINTS == ("/jsonrpc",)
    assert OdooClient.OBJECT_ENDPOINTS == ("/jsonrpc",)
