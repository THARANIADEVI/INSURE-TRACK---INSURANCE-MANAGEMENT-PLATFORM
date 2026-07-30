def test_register_creates_customer(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "New User", "email": "new@test.com", "password": "password123"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["user"]["role"] == "customer"


def test_register_ignores_client_supplied_role(client):
    """Public registration must never allow self-provisioning admin/agent accounts."""
    resp = client.post(
        "/api/auth/register",
        json={"name": "Sneaky", "email": "sneaky@test.com", "password": "password123", "role": "admin"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["user"]["role"] == "customer"


def test_register_duplicate_email_rejected(client):
    payload = {"name": "Dup", "email": "dup@test.com", "password": "password123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_validation_error(client):
    resp = client.post("/api/auth/register", json={"name": "", "email": "not-an-email", "password": "short"})
    assert resp.status_code == 400
    assert "errors" in resp.get_json()


def test_login_success_and_failure(client):
    client.post(
        "/api/auth/register", json={"name": "Login User", "email": "login@test.com", "password": "password123"}
    )
    ok = client.post("/api/auth/login", json={"email": "login@test.com", "password": "password123"})
    assert ok.status_code == 200
    body = ok.get_json()
    assert "access_token" in body and "refresh_token" in body

    bad = client.post("/api/auth/login", json={"email": "login@test.com", "password": "wrong"})
    assert bad.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client, customer_user):
    resp = client.get("/api/auth/me", headers=customer_user["headers"])
    assert resp.status_code == 200
    assert resp.get_json()["user"]["email"] == "customer@test.com"


def test_refresh_issues_new_access_token(client):
    client.post(
        "/api/auth/register", json={"name": "Refresh User", "email": "refresh@test.com", "password": "password123"}
    )
    login = client.post("/api/auth/login", json={"email": "refresh@test.com", "password": "password123"})
    refresh_token = login.get_json()["refresh_token"]

    resp = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()
