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


def test_schedule_and_list_premium(client, agent, customer_record):
    policy = _create_policy(client, agent, customer_record)
    resp = client.post(
        "/api/premiums",
        headers=agent["headers"],
        json={"policy_id": policy["id"], "due_date": "2026-03-01", "amount": "100.00"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["payment"]["payment_status"] == "pending"

    listed = client.get("/api/premiums", headers=agent["headers"])
    assert listed.get_json()["total"] == 1


def test_overdue_premiums_flip_status_and_notify(client, agent, customer_record):
    policy = _create_policy(client, agent, customer_record)
    client.post(
        "/api/premiums",
        headers=agent["headers"],
        json={"policy_id": policy["id"], "due_date": "2020-01-01", "amount": "100.00"},
    )

    overdue = client.get("/api/premiums/overdue", headers=agent["headers"])
    assert overdue.status_code == 200
    payments = overdue.get_json()["payments"]
    assert len(payments) == 1
    assert payments[0]["payment_status"] == "overdue"


def test_customer_pays_own_premium(client, agent, customer_user, customer_record):
    policy = _create_policy(client, agent, customer_record)
    payment = client.post(
        "/api/premiums",
        headers=agent["headers"],
        json={"policy_id": policy["id"], "due_date": "2026-03-01", "amount": "100.00"},
    ).get_json()["payment"]

    paid = client.post(
        f"/api/premiums/{payment['id']}/pay",
        headers=customer_user["headers"],
        json={"payment_date": "2026-02-15"},
    )
    assert paid.status_code == 200
    assert paid.get_json()["payment"]["payment_status"] == "paid"

    again = client.post(
        f"/api/premiums/{payment['id']}/pay",
        headers=customer_user["headers"],
        json={"payment_date": "2026-02-16"},
    )
    assert again.status_code == 400


def test_customer_cannot_pay_others_premium(client, agent, customer_user, customer_record):
    other_customer = client.post(
        "/api/customers", headers=agent["headers"], json={"name": "Other", "email": "other4@test.com"}
    ).get_json()["customer"]
    policy = _create_policy(client, agent, other_customer["id"])
    payment = client.post(
        "/api/premiums",
        headers=agent["headers"],
        json={"policy_id": policy["id"], "due_date": "2026-03-01", "amount": "100.00"},
    ).get_json()["payment"]

    resp = client.post(
        f"/api/premiums/{payment['id']}/pay",
        headers=customer_user["headers"],
        json={"payment_date": "2026-02-15"},
    )
    assert resp.status_code == 403
