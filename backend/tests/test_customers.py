def test_agent_creates_and_lists_customer(client, agent):
    resp = client.post(
        "/api/customers",
        headers=agent["headers"],
        json={"name": "Jane Doe", "email": "jane@test.com", "phone": "5551234"},
    )
    assert resp.status_code == 201
    customer_id = resp.get_json()["customer"]["id"]

    listed = client.get("/api/customers", headers=agent["headers"])
    assert listed.status_code == 200
    assert listed.get_json()["total"] == 1

    searched = client.get("/api/customers", headers=agent["headers"], query_string={"search": "jane"})
    assert searched.get_json()["total"] == 1

    fetched = client.get(f"/api/customers/{customer_id}", headers=agent["headers"])
    assert fetched.status_code == 200
    assert fetched.get_json()["customer"]["name"] == "Jane Doe"


def test_customer_role_cannot_create_customer(client, customer_user):
    resp = client.post(
        "/api/customers", headers=customer_user["headers"], json={"name": "X", "email": "x@test.com"}
    )
    assert resp.status_code == 403


def test_customer_can_view_and_edit_own_profile_only(client, agent, customer_user, customer_record):
    other = client.post(
        "/api/customers", headers=agent["headers"], json={"name": "Other Person", "email": "other@test.com"}
    ).get_json()["customer"]

    own = client.get(f"/api/customers/{customer_record}", headers=customer_user["headers"])
    assert own.status_code == 200

    forbidden = client.get(f"/api/customers/{other['id']}", headers=customer_user["headers"])
    assert forbidden.status_code == 403

    update = client.put(
        f"/api/customers/{customer_record}", headers=customer_user["headers"], json={"phone": "9998887"}
    )
    assert update.status_code == 200
    assert update.get_json()["customer"]["phone"] == "9998887"

    forbidden_update = client.put(
        f"/api/customers/{other['id']}", headers=customer_user["headers"], json={"phone": "0000000"}
    )
    assert forbidden_update.status_code == 403


def test_customer_me_endpoint(client, customer_user, customer_record):
    resp = client.get("/api/customers/me", headers=customer_user["headers"])
    assert resp.status_code == 200
    assert resp.get_json()["customer"]["id"] == customer_record


def test_customer_history_aggregates_policies_claims_payments(client, agent, customer_record):
    policy = client.post(
        "/api/policies",
        headers=agent["headers"],
        json={
            "customer_id": customer_record,
            "policy_type": "Health",
            "premium_amount": "100.00",
            "start_date": "2026-01-01",
            "end_date": "2027-01-01",
        },
    ).get_json()["policy"]

    client.post(
        "/api/premiums",
        headers=agent["headers"],
        json={"policy_id": policy["id"], "due_date": "2026-02-01", "amount": "100.00"},
    )

    resp = client.get(f"/api/customers/{customer_record}/history", headers=agent["headers"])
    assert resp.status_code == 200
    body = resp.get_json()
    assert len(body["policies"]) == 1
    assert len(body["payments"]) == 1
