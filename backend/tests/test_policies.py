def _create_policy(client, agent, customer_id, **overrides):
    payload = {
        "customer_id": customer_id,
        "policy_type": "Health",
        "premium_amount": "250.00",
        "start_date": "2026-01-01",
        "end_date": "2026-06-01",
    }
    payload.update(overrides)
    return client.post("/api/policies", headers=agent["headers"], json=payload)


def test_create_list_and_get_policy(client, agent, customer_record):
    created = _create_policy(client, agent, customer_record)
    assert created.status_code == 201
    policy = created.get_json()["policy"]
    assert policy["status"] == "active"
    assert policy["policy_number"].startswith("POL-")

    listed = client.get("/api/policies", headers=agent["headers"])
    assert listed.get_json()["total"] == 1

    fetched = client.get(f"/api/policies/{policy['id']}", headers=agent["headers"])
    assert fetched.status_code == 200


def test_create_policy_requires_existing_customer(client, agent):
    resp = _create_policy(client, agent, customer_id=9999)
    assert resp.status_code == 404


def test_customer_sees_only_their_own_policies(client, agent, customer_user, customer_record):
    _create_policy(client, agent, customer_record)
    other_customer = client.post(
        "/api/customers", headers=agent["headers"], json={"name": "Other", "email": "other2@test.com"}
    ).get_json()["customer"]
    _create_policy(client, agent, other_customer["id"])

    mine = client.get("/api/policies/mine", headers=customer_user["headers"])
    assert mine.status_code == 200
    assert mine.get_json()["total"] == 1


def test_renew_and_cancel_policy(client, agent, customer_record):
    policy = _create_policy(client, agent, customer_record).get_json()["policy"]

    renewed = client.post(f"/api/policies/{policy['id']}/renew", headers=agent["headers"], json={"months": 6})
    assert renewed.status_code == 200
    assert renewed.get_json()["policy"]["end_date"] > policy["end_date"]

    cancelled = client.post(f"/api/policies/{policy['id']}/cancel", headers=agent["headers"])
    assert cancelled.status_code == 200
    assert cancelled.get_json()["policy"]["status"] == "cancelled"


def test_expiring_policies_and_notify(client, agent, customer_record):
    _create_policy(client, agent, customer_record, end_date="2026-01-15")

    expiring = client.get("/api/policies/expiring", headers=agent["headers"], query_string={"days": 400})
    assert expiring.status_code == 200
    assert len(expiring.get_json()["policies"]) == 1

    notified = client.post("/api/policies/expiring/notify", headers=agent["headers"], json={"days": 400})
    assert notified.status_code == 200
    assert notified.get_json()["notified"] == 1


def test_policy_qr_returns_png(client, agent, customer_record):
    policy = _create_policy(client, agent, customer_record).get_json()["policy"]
    resp = client.get(f"/api/policies/{policy['id']}/qr", headers=agent["headers"])
    assert resp.status_code == 200
    assert resp.mimetype == "image/png"


def test_customer_cannot_create_policy(client, customer_user, customer_record):
    resp = _create_policy(client, customer_user, customer_record)
    assert resp.status_code == 403
