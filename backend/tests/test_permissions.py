"""Cross-cutting checks that role_required actually gates the modules it's applied to."""


def test_no_token_is_401(client):
    assert client.get("/api/customers").status_code == 401
    assert client.get("/api/policies").status_code == 401
    assert client.get("/api/employees").status_code == 401


def test_customer_cannot_hit_admin_routes(client, customer_user):
    resp = client.get("/api/customers", headers=customer_user["headers"])
    assert resp.status_code == 403

    resp = client.get("/api/employees", headers=customer_user["headers"])
    assert resp.status_code == 403

    resp = client.get("/api/settings", headers=customer_user["headers"])
    assert resp.status_code == 403


def test_agent_cannot_manage_employees_or_settings(client, agent):
    assert client.get("/api/employees", headers=agent["headers"]).status_code == 403
    assert client.get("/api/settings", headers=agent["headers"]).status_code == 403


def test_admin_can_reach_staff_routes(client, admin):
    assert client.get("/api/customers", headers=admin["headers"]).status_code == 200
    assert client.get("/api/employees", headers=admin["headers"]).status_code == 200
    assert client.get("/api/settings", headers=admin["headers"]).status_code == 200
