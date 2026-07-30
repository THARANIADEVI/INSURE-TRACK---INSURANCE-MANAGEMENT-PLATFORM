def _create_policy(client, agent, customer_id):
    return client.post(
        "/api/policies",
        headers=agent["headers"],
        json={
            "customer_id": customer_id,
            "policy_type": "Health",
            "premium_amount": "250.00",
            "start_date": "2026-01-01",
            "end_date": "2027-01-01",
        },
    ).get_json()["policy"]


def test_customer_submits_claim_on_own_active_policy(client, agent, customer_user, customer_record):
    policy = _create_policy(client, agent, customer_record)
    resp = client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "500.00", "reason": "Hospital visit"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["claim"]["status"] == "pending"


def test_cannot_submit_claim_on_others_policy(client, agent, customer_user, customer_record):
    other_customer = client.post(
        "/api/customers", headers=agent["headers"], json={"name": "Other", "email": "other3@test.com"}
    ).get_json()["customer"]
    policy = _create_policy(client, agent, other_customer["id"])

    resp = client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "100.00", "reason": "Not yours"},
    )
    assert resp.status_code == 403


def test_cannot_submit_claim_on_cancelled_policy(client, agent, customer_user, customer_record):
    policy = _create_policy(client, agent, customer_record)
    client.post(f"/api/policies/{policy['id']}/cancel", headers=agent["headers"])

    resp = client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "100.00", "reason": "Too late"},
    )
    assert resp.status_code == 400


def test_assign_and_review_claim(client, admin, agent, customer_user, customer_record):
    policy = _create_policy(client, admin, customer_record)
    claim = client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "500.00", "reason": "Repair"},
    ).get_json()["claim"]

    assigned = client.patch(
        f"/api/claims/{claim['id']}/assign", headers=admin["headers"], json={"agent_id": agent["id"]}
    )
    assert assigned.status_code == 200
    assert assigned.get_json()["claim"]["assigned_to"] == agent["id"]

    reviewed = client.put(
        f"/api/claims/{claim['id']}/review",
        headers=agent["headers"],
        json={"status": "approved", "review_notes": "Looks good"},
    )
    assert reviewed.status_code == 200
    body = reviewed.get_json()["claim"]
    assert body["status"] == "approved"
    assert body["review_notes"] == "Looks good"

    already = client.put(
        f"/api/claims/{claim['id']}/review", headers=agent["headers"], json={"status": "rejected"}
    )
    assert already.status_code == 400


def test_assign_rejects_non_agent(client, admin, customer_user, customer_record):
    policy = _create_policy(client, admin, customer_record)
    claim = client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "500.00", "reason": "Repair"},
    ).get_json()["claim"]

    resp = client.patch(
        f"/api/claims/{claim['id']}/assign", headers=admin["headers"], json={"agent_id": customer_user["id"]}
    )
    assert resp.status_code == 400


def test_customer_sees_only_their_claims(client, agent, customer_user, customer_record):
    policy = _create_policy(client, agent, customer_record)
    client.post(
        "/api/claims",
        headers=customer_user["headers"],
        json={"policy_id": policy["id"], "claim_amount": "500.00", "reason": "Repair"},
    )

    mine = client.get("/api/claims/mine", headers=customer_user["headers"])
    assert mine.get_json()["total"] == 1
