import io

import pytest

from app import create_app
from config import Config
from extensions import bcrypt
from models import db as _db
from models.customer import Customer
from models.user import User


class TestConfig(Config):
    TESTING = True
    SECRET_KEY = "test-secret-key-not-for-prod-use"
    JWT_SECRET_KEY = "test-jwt-secret-key-not-for-prod-use"
    WTF_CSRF_ENABLED = False


@pytest.fixture()
def app(tmp_path):
    TestConfig.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'test.db'}"
    TestConfig.UPLOAD_FOLDER = str(tmp_path / "uploads")
    TestConfig.REPORTS_FOLDER = str(tmp_path / "reports")

    application = create_app(TestConfig)
    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def _create_user(app, name, email, password, role):
    with app.app_context():
        user = User(
            name=name,
            email=email,
            password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
            role=role,
        )
        _db.session.add(user)
        _db.session.commit()
        return user.id


def _login(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.get_json()
    return resp.get_json()["access_token"]


def _actor(app, client, name, email, role):
    user_id = _create_user(app, name, email, "password123", role)
    token = _login(client, email, "password123")
    return {"id": user_id, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture()
def admin(app, client):
    return _actor(app, client, "Ada Admin", "admin@test.com", "admin")


@pytest.fixture()
def agent(app, client):
    return _actor(app, client, "Alan Agent", "agent@test.com", "agent")


@pytest.fixture()
def customer_user(app, client):
    return _actor(app, client, "Cara Customer", "customer@test.com", "customer")


@pytest.fixture()
def customer_record(app, customer_user):
    with app.app_context():
        customer = Customer(
            user_id=customer_user["id"],
            name="Cara Customer",
            email="customer@test.com",
            phone="5550100",
        )
        _db.session.add(customer)
        _db.session.commit()
        return customer.id


def make_pdf_file(name="document.pdf"):
    return (io.BytesIO(b"%PDF-1.4 fake pdf content"), name)
