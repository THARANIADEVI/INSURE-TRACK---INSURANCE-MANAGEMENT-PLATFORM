import os
from datetime import timedelta

from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def _normalized_database_uri():
    uri = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'insurance.db')}")
    # Render/Heroku-style Postgres URLs use the "postgres://" scheme, which
    # SQLAlchemy 1.4+ no longer recognizes; it requires "postgresql://".
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    # Flask-SQLAlchemy resolves a relative "sqlite:///name.db" path against
    # app.instance_path (backend/instance/), not this directory. Force it to
    # an absolute path here so a relative DATABASE_URL (e.g. from .env) can't
    # silently point at a different, un-migrated database file.
    if uri.startswith("sqlite:///"):
        db_path = uri[len("sqlite:///"):]
        if not os.path.isabs(db_path):
            uri = f"sqlite:///{os.path.join(BASE_DIR, db_path)}"
    return uri


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = _normalized_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB

    REPORTS_FOLDER = os.environ.get("REPORTS_FOLDER", os.path.join(BASE_DIR, "reports"))

    # Comma-separated list of allowed frontend origins for CORS in production,
    # e.g. "https://my-app.vercel.app". Defaults to "*" for local development.
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

    # One-time shared secret for POST /api/auth/bootstrap-admin, used to promote
    # the first admin account on hosts (e.g. Render free tier) with no shell
    # access. Unset/empty disables the endpoint entirely.
    ADMIN_BOOTSTRAP_SECRET = os.environ.get("ADMIN_BOOTSTRAP_SECRET", "")

    # Shared secret for POST /api/auth/reset-password, used to reset a user's
    # password on hosts with no shell access. Unset/empty disables the
    # endpoint entirely.
    PASSWORD_RESET_SECRET = os.environ.get("PASSWORD_RESET_SECRET", "")
