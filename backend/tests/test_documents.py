from .conftest import make_pdf_file


def _upload(client, headers, extra_form=None):
    stream, name = make_pdf_file()
    data = {"file": (stream, name), "doc_type": "identity"}
    if extra_form:
        data.update(extra_form)
    return client.post("/api/documents", headers=headers, data=data, content_type="multipart/form-data")


def test_customer_uploads_and_lists_own_documents(client, customer_user, customer_record):
    resp = _upload(client, customer_user["headers"])
    assert resp.status_code == 201
    doc = resp.get_json()["document"]
    assert doc["verification_status"] == "pending"

    mine = client.get("/api/documents/mine", headers=customer_user["headers"])
    assert mine.status_code == 200
    assert len(mine.get_json()["documents"]) == 1


def test_upload_rejects_bad_extension(client, customer_user):
    data = {"file": (b"not allowed", "virus.exe"), "doc_type": "identity"}
    resp = client.post(
        "/api/documents", headers=customer_user["headers"], data=data, content_type="multipart/form-data"
    )
    assert resp.status_code == 400


def test_staff_uploads_on_behalf_of_customer(client, agent, customer_record):
    resp = _upload(client, agent["headers"], extra_form={"customer_id": str(customer_record)})
    assert resp.status_code == 201
    assert resp.get_json()["document"]["customer_id"] == customer_record


def test_staff_lists_by_customer_and_status_filter(client, agent, customer_record):
    _upload(client, agent["headers"], extra_form={"customer_id": str(customer_record)})
    listed = client.get("/api/documents", headers=agent["headers"], query_string={"customer_id": customer_record})
    assert listed.status_code == 200
    assert len(listed.get_json()["documents"]) == 1

    pending = client.get(
        "/api/documents", headers=agent["headers"], query_string={"verification_status": "pending"}
    )
    assert len(pending.get_json()["documents"]) == 1

    verified = client.get(
        "/api/documents", headers=agent["headers"], query_string={"verification_status": "verified"}
    )
    assert len(verified.get_json()["documents"]) == 0


def test_download_permission_boundaries(client, agent, customer_user, customer_record):
    doc = _upload(client, customer_user["headers"]).get_json()["document"]

    own = client.get(f"/api/documents/{doc['id']}/download", headers=customer_user["headers"])
    assert own.status_code == 200

    staff = client.get(f"/api/documents/{doc['id']}/download", headers=agent["headers"])
    assert staff.status_code == 200


def test_customer_cannot_download_others_document(client, agent, customer_record):
    doc = _upload(client, agent["headers"], extra_form={"customer_id": str(customer_record)}).get_json()[
        "document"
    ]

    other = client.post(
        "/api/auth/register",
        json={"name": "Someone Else", "email": "someoneelse@test.com", "password": "password123"},
    )
    login = client.post("/api/auth/login", json={"email": "someoneelse@test.com", "password": "password123"})
    other_headers = {"Authorization": f"Bearer {login.get_json()['access_token']}"}

    resp = client.get(f"/api/documents/{doc['id']}/download", headers=other_headers)
    assert resp.status_code == 403


def test_verify_and_reject_workflow(client, agent, customer_record):
    doc = _upload(client, agent["headers"], extra_form={"customer_id": str(customer_record)}).get_json()[
        "document"
    ]

    verified = client.put(
        f"/api/documents/{doc['id']}/verify",
        headers=agent["headers"],
        json={"status": "verified", "review_notes": "Looks legit"},
    )
    assert verified.status_code == 200
    body = verified.get_json()["document"]
    assert body["verification_status"] == "verified"
    assert body["review_notes"] == "Looks legit"
    assert body["reviewed_by"] == agent["id"]

    again = client.put(f"/api/documents/{doc['id']}/verify", headers=agent["headers"], json={"status": "rejected"})
    assert again.status_code == 400


def test_verify_rejects_bad_status(client, agent, customer_record):
    doc = _upload(client, agent["headers"], extra_form={"customer_id": str(customer_record)}).get_json()[
        "document"
    ]
    resp = client.put(f"/api/documents/{doc['id']}/verify", headers=agent["headers"], json={"status": "bogus"})
    assert resp.status_code == 400


def test_customer_cannot_verify_documents(client, customer_user, customer_record):
    doc = _upload(client, customer_user["headers"]).get_json()["document"]
    resp = client.put(
        f"/api/documents/{doc['id']}/verify", headers=customer_user["headers"], json={"status": "verified"}
    )
    assert resp.status_code == 403
