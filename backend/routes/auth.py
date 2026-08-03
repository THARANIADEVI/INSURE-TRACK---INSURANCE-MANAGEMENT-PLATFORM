import hmac
import uuid
from datetime import date, timedelta

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


@auth_bp.route("/seed-demo-data", methods=["POST"])
def seed_demo_data():
    """One-time demo/video-recording data seeder for hosts with no shell access.

    Creates an admin + agent demo login, links a customer profile to the
    given existing user, and populates a few policies/premiums/claims so
    the customer and staff dashboards have something real to show.
    Gated by the same secret as reset-password; unset/empty disables it.
    """
    secret = current_app.config.get("PASSWORD_RESET_SECRET", "")
    if not secret:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    if not hmac.compare_digest(secret, data.get("secret", "")):
        return jsonify({"error": "Invalid secret"}), 401

    customer_email = data.get("customer_email", "")
    target_user = _find_user_by_email(customer_email) if customer_email else None
    if not target_user:
        return jsonify({"error": f"No user found with email '{customer_email}'"}), 404

    from models.claim import Claim
    from models.customer import Customer
    from models.policy import Policy
    from models.premium_payment import PremiumPayment

    created = {"users": [], "policies": [], "premiums": 0, "claims": 0}

    def ensure_demo_login(name, email, password, role):
        u = _find_user_by_email(email)
        if not u:
            u = User(
                name=name,
                email=email.lower(),
                password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
                role=role,
            )
            db.session.add(u)
            db.session.flush()
            created["users"].append(email)
        return u

    ensure_demo_login("Ananya Admin", "admin@demo.com", "Demo@1234", "admin")
    ensure_demo_login("Priya Manager", "agent@demo.com", "Demo@1234", "agent")

    customer = target_user.customer
    if not customer:
        customer = Customer(
            user_id=target_user.id,
            name=target_user.name,
            email=target_user.email,
            phone="9876543210",
            address="12 MG Road, Chennai",
        )
        db.session.add(customer)
        db.session.flush()

    today = date.today()

    def make_policy(policy_type, status, start_offset, end_offset, premium):
        policy = Policy(
            customer_id=customer.id,
            policy_type=policy_type,
            policy_number=f"POL-{uuid.uuid4().hex[:10].upper()}",
            premium_amount=premium,
            start_date=today - timedelta(days=start_offset),
            end_date=today + timedelta(days=end_offset),
            status=status,
        )
        db.session.add(policy)
        db.session.flush()
        created["policies"].append(policy.policy_number)
        return policy

    policy_health = make_policy("Health Insurance", "active", 180, 185, 12000)
    policy_motor = make_policy("Motor Insurance", "active", 90, 275, 6500)
    policy_life = make_policy("Life Insurance", "expired", 400, -30, 20000)

    def make_premium(policy, due_offset, status, amount):
        db.session.add(
            PremiumPayment(
                policy_id=policy.id,
                due_date=today + timedelta(days=due_offset),
                payment_date=(today - timedelta(days=5)) if status == "paid" else None,
                amount=amount,
                payment_status=status,
            )
        )
        created["premiums"] += 1

    make_premium(policy_health, -10, "overdue", 3000)
    make_premium(policy_health, 20, "pending", 3000)
    make_premium(policy_motor, -40, "paid", 6500)
    make_premium(policy_life, -100, "paid", 20000)

    def make_claim(policy, amount, reason, status):
        db.session.add(Claim(policy_id=policy.id, claim_amount=amount, reason=reason, status=status))
        created["claims"] += 1

    make_claim(policy_motor, 4500, "Minor collision repair", "pending")
    make_claim(policy_health, 8000, "Hospitalization - appendix surgery", "approved")
    make_claim(policy_life, 15000, "Claim filed after policy expiry", "rejected")

    db.session.commit()
    return jsonify({"ok": True, "customer_id": customer.id, "created": created})
