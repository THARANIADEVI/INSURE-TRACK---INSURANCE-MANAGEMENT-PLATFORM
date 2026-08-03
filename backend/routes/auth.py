import hmac

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError

from extensions import bcrypt
from models import db
from models.user import ROLES, User
from schemas.auth import login_schema, register_schema

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _find_user_by_email(email):
    return User.query.filter(db.func.lower(User.email) == email.lower()).first()


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = register_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if _find_user_by_email(data["email"]):
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(name=data["name"], email=data["email"], password_hash=password_hash, role="customer")
    db.session.add(user)
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = login_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    user = _find_user_by_email(data["email"])
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
        }
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"error": "User not found"}), 404
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    return jsonify({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/bootstrap-admin", methods=["POST"])
def bootstrap_admin():
    secret = current_app.config.get("ADMIN_BOOTSTRAP_SECRET", "")
    if not secret:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    provided_secret = data.get("secret", "")
    if not hmac.compare_digest(secret, provided_secret):
        return jsonify({"error": "Invalid secret"}), 401

    if User.query.filter_by(role="admin").first():
        return jsonify({"error": "An admin account already exists; use /api/employees instead"}), 403

    role = data.get("role", "admin")
    if role not in ROLES:
        return jsonify({"error": f"Invalid role '{role}'. Must be one of: {', '.join(ROLES)}"}), 400

    email = data.get("email", "")
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": f"No user found with email '{email}'. Register that account first."}), 404

    user.role = role
    db.session.commit()
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    secret = current_app.config.get("PASSWORD_RESET_SECRET", "")
    if not secret:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    provided_secret = data.get("secret", "")
    if not hmac.compare_digest(secret, provided_secret):
        return jsonify({"error": "Invalid secret"}), 401

    email = data.get("email", "")
    new_password = data.get("new_password", "")
    if not email or len(new_password) < 6:
        return jsonify({"error": "email and new_password (min 6 chars) are required"}), 400

    user = _find_user_by_email(email)
    if not user:
        return jsonify({"error": f"No user found with email '{email}'."}), 404

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"user": user.to_dict()})
