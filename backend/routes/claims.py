from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import db
from models.audit_log import log_action
from models.claim import Claim
from models.customer import Customer
from models.policy import Policy
from models.user import User
from schemas.claim import claim_review_schema, claim_schema
from schemas.claim_assign import claim_assign_schema
from utils.decorators import role_required
from utils.notifications import send_notification
from utils.pagination import paginate

claims_bp = Blueprint("claims", __name__, url_prefix="/api/claims")


@claims_bp.route("", methods=["POST"])
@role_required("customer")
def submit_claim():
    identity = int(get_jwt_identity())
    customer = Customer.query.filter_by(user_id=identity).first()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404

    try:
        data = claim_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    policy = Policy.query.get_or_404(data["policy_id"])
    if policy.customer_id != customer.id:
        return jsonify({"error": "Forbidden: policy does not belong to you"}), 403
    if policy.status != "active":
        return jsonify({"error": "Cannot submit a claim on a non-active policy"}), 400

    claim = Claim(
        policy_id=policy.id,
        claim_amount=data["claim_amount"],
        reason=data["reason"],
        status="pending",
    )
    db.session.add(claim)
    db.session.commit()
    return jsonify({"claim": claim.to_dict()}), 201


@claims_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_claims():
    query = Claim.query
    status = request.args.get("status")
    if status:
        query = query.filter(Claim.status == status)
    policy_id = request.args.get("policy_id", type=int)
    if policy_id:
        query = query.filter(Claim.policy_id == policy_id)
    assigned_to = request.args.get("assigned_to", type=int)
    if assigned_to:
        query = query.filter(Claim.assigned_to == assigned_to)
    query = query.order_by(Claim.submission_date.desc())
    return jsonify(paginate(query, lambda c: c.to_dict()))


@claims_bp.route("/mine", methods=["GET"])
@role_required("customer")
def my_claims():
    identity = int(get_jwt_identity())
    customer = Customer.query.filter_by(user_id=identity).first()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404
    policy_ids = [p.id for p in customer.policies]
    query = Claim.query.filter(Claim.policy_id.in_(policy_ids)).order_by(Claim.submission_date.desc())
    return jsonify(paginate(query, lambda c: c.to_dict()))


@claims_bp.route("/<int:claim_id>", methods=["GET"])
@jwt_required()
def get_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    return jsonify({"claim": claim.to_dict()})


@claims_bp.route("/<int:claim_id>/assign", methods=["PATCH"])
@role_required("admin")
def assign_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)

    try:
        data = claim_assign_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    agent = User.query.get(data["agent_id"])
    if not agent or agent.role != "agent":
        return jsonify({"error": "agent_id must reference an existing agent"}), 400

    claim.assigned_to = agent.id
    log_action("claim", claim.id, "assigned", int(get_jwt_identity()), f"assigned_to={agent.id}")
    send_notification(
        agent.id,
        "email",
        f"Claim #{claim.id} assigned to you",
        f"Claim #{claim.id} for policy {claim.policy.policy_number} was assigned to you for review.",
    )

    db.session.commit()
    return jsonify({"claim": claim.to_dict()})


@claims_bp.route("/<int:claim_id>/review", methods=["PUT"])
@role_required("admin", "agent")
def review_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    if claim.status != "pending":
        return jsonify({"error": "Claim already reviewed"}), 400

    try:
        data = claim_review_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    claim.status = data["status"]
    claim.review_notes = data.get("review_notes")
    claim.reviewed_by = int(get_jwt_identity())
    claim.reviewed_at = datetime.now(timezone.utc)

    log_action("claim", claim.id, f"review:{claim.status}", claim.reviewed_by, claim.review_notes)

    customer_user_id = claim.policy.customer.user_id if claim.policy.customer else None
    send_notification(
        customer_user_id,
        "email",
        f"Your claim has been {claim.status}",
        f"Claim #{claim.id} for policy {claim.policy.policy_number} was {claim.status}."
        + (f" Notes: {claim.review_notes}" if claim.review_notes else ""),
    )

    db.session.commit()
    return jsonify({"claim": claim.to_dict()})
