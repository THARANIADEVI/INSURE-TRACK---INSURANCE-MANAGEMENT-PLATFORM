import io
import uuid
from datetime import date, timedelta

import qrcode
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import db
from models.audit_log import log_action
from models.customer import Customer
from models.policy import Policy
from schemas.policy import policy_schema, policy_update_schema
from utils.decorators import role_required
from utils.notifications import send_notification
from utils.pagination import paginate

policies_bp = Blueprint("policies", __name__, url_prefix="/api/policies")


def _generate_policy_number():
    return f"POL-{uuid.uuid4().hex[:10].upper()}"


@policies_bp.route("", methods=["POST"])
@role_required("admin", "agent")
def create_policy():
    try:
        data = policy_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    Customer.query.get_or_404(data["customer_id"])

    policy = Policy(
        customer_id=data["customer_id"],
        policy_type=data["policy_type"],
        policy_number=_generate_policy_number(),
        premium_amount=data["premium_amount"],
        start_date=data["start_date"],
        end_date=data["end_date"],
        status="active",
    )
    db.session.add(policy)
    db.session.commit()
    return jsonify({"policy": policy.to_dict()}), 201


@policies_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_policies():
    query = Policy.query
    status = request.args.get("status")
    if status:
        query = query.filter(Policy.status == status)
    customer_id = request.args.get("customer_id", type=int)
    if customer_id:
        query = query.filter(Policy.customer_id == customer_id)
    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Policy.policy_number.ilike(like), Policy.policy_type.ilike(like))
        )
    query = query.order_by(Policy.created_at.desc())
    return jsonify(paginate(query, lambda p: p.to_dict()))


@policies_bp.route("/mine", methods=["GET"])
@role_required("customer")
def my_policies():
    identity = int(get_jwt_identity())
    customer = Customer.query.filter_by(user_id=identity).first()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404
    query = Policy.query.filter_by(customer_id=customer.id).order_by(Policy.created_at.desc())
    return jsonify(paginate(query, lambda p: p.to_dict()))


@policies_bp.route("/expiring", methods=["GET"])
@role_required("admin", "agent")
def expiring_policies():
    days = request.args.get("days", 30, type=int)
    cutoff = date.today() + timedelta(days=days)
    query = (
        Policy.query.filter(Policy.status == "active", Policy.end_date <= cutoff)
        .order_by(Policy.end_date.asc())
    )
    return jsonify({"policies": [p.to_dict() for p in query.all()]})


@policies_bp.route("/expiring/notify", methods=["POST"])
@role_required("admin", "agent")
def notify_expiring_policies():
    days = request.get_json(silent=True) or {}
    cutoff = date.today() + timedelta(days=days.get("days", 30))
    policies = Policy.query.filter(Policy.status == "active", Policy.end_date <= cutoff).all()

    notified = 0
    for policy in policies:
        user_id = policy.customer.user_id if policy.customer else None
        if not user_id:
            continue
        send_notification(
            user_id,
            "email",
            "Your policy is expiring soon",
            f"Policy {policy.policy_number} ({policy.policy_type}) expires on {policy.end_date.isoformat()}.",
        )
        notified += 1
    db.session.commit()
    return jsonify({"notified": notified})


@policies_bp.route("/<int:policy_id>/qr", methods=["GET"])
@jwt_required()
def policy_qr(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    payload = f"POLICY:{policy.policy_number}|TYPE:{policy.policy_type}|STATUS:{policy.status}"
    img = qrcode.make(payload)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return send_file(buffer, mimetype="image/png", download_name=f"{policy.policy_number}-qr.png")


@policies_bp.route("/<int:policy_id>", methods=["GET"])
@jwt_required()
def get_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    return jsonify({"policy": policy.to_dict()})


@policies_bp.route("/<int:policy_id>", methods=["PUT"])
@role_required("admin", "agent")
def update_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    try:
        data = policy_update_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    for key, value in data.items():
        setattr(policy, key, value)
    log_action("policy", policy.id, "update", int(get_jwt_identity()), str(data))
    db.session.commit()
    return jsonify({"policy": policy.to_dict()})


@policies_bp.route("/<int:policy_id>/renew", methods=["POST"])
@role_required("admin", "agent")
def renew_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    extend_days = request.get_json(silent=True) or {}
    months = extend_days.get("months", 12)
    policy.end_date = policy.end_date + timedelta(days=30 * months)
    policy.status = "active"
    log_action("policy", policy.id, "renew", int(get_jwt_identity()), f"extended by {months} months")
    db.session.commit()
    return jsonify({"policy": policy.to_dict()})


@policies_bp.route("/<int:policy_id>/cancel", methods=["POST"])
@role_required("admin", "agent")
def cancel_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    policy.status = "cancelled"
    log_action("policy", policy.id, "cancel", int(get_jwt_identity()))
    db.session.commit()
    return jsonify({"policy": policy.to_dict()})
