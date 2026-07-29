from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import db
from models.customer import Customer
from models.policy import Policy
from models.premium_payment import PremiumPayment
from schemas.premium_payment import premium_payment_record_schema, premium_payment_schema
from utils.decorators import role_required
from utils.notifications import send_notification
from utils.pagination import paginate

premiums_bp = Blueprint("premiums", __name__, url_prefix="/api/premiums")


def _mark_overdue():
    today = date.today()
    newly_overdue = PremiumPayment.query.filter(
        PremiumPayment.payment_status == "pending", PremiumPayment.due_date < today
    ).all()
    for payment in newly_overdue:
        payment.payment_status = "overdue"
        user_id = payment.policy.customer.user_id if payment.policy.customer else None
        send_notification(
            user_id,
            "sms",
            "Premium payment overdue",
            f"Premium of {payment.amount} for policy {payment.policy.policy_number} was due on "
            f"{payment.due_date.isoformat()} and is now overdue.",
        )
    db.session.commit()


@premiums_bp.route("", methods=["POST"])
@role_required("admin", "agent")
def schedule_premium():
    try:
        data = premium_payment_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    Policy.query.get_or_404(data["policy_id"])

    payment = PremiumPayment(
        policy_id=data["policy_id"],
        due_date=data["due_date"],
        amount=data["amount"],
        payment_status="pending",
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({"payment": payment.to_dict()}), 201


@premiums_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_premiums():
    _mark_overdue()
    query = PremiumPayment.query
    status = request.args.get("status")
    if status:
        query = query.filter(PremiumPayment.payment_status == status)
    policy_id = request.args.get("policy_id", type=int)
    if policy_id:
        query = query.filter(PremiumPayment.policy_id == policy_id)
    query = query.order_by(PremiumPayment.due_date.desc())
    return jsonify(paginate(query, lambda p: p.to_dict()))


@premiums_bp.route("/overdue", methods=["GET"])
@role_required("admin", "agent")
def overdue_premiums():
    _mark_overdue()
    query = PremiumPayment.query.filter(PremiumPayment.payment_status == "overdue").order_by(
        PremiumPayment.due_date.asc()
    )
    return jsonify({"payments": [p.to_dict() for p in query.all()]})


@premiums_bp.route("/mine", methods=["GET"])
@role_required("customer")
def my_premiums():
    _mark_overdue()
    identity = int(get_jwt_identity())
    customer = Customer.query.filter_by(user_id=identity).first()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404
    policy_ids = [p.id for p in customer.policies]
    query = PremiumPayment.query.filter(PremiumPayment.policy_id.in_(policy_ids)).order_by(
        PremiumPayment.due_date.desc()
    )
    return jsonify(paginate(query, lambda p: p.to_dict()))


@premiums_bp.route("/<int:payment_id>/pay", methods=["POST"])
@jwt_required()
def pay_premium(payment_id):
    payment = PremiumPayment.query.get_or_404(payment_id)
    claims = get_jwt()
    if claims.get("role") == "customer":
        identity = int(get_jwt_identity())
        customer = Customer.query.filter_by(user_id=identity).first()
        if not customer or payment.policy.customer_id != customer.id:
            return jsonify({"error": "Forbidden"}), 403

    if payment.payment_status == "paid":
        return jsonify({"error": "Payment already recorded"}), 400

    try:
        data = premium_payment_record_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    payment.payment_date = data["payment_date"]
    payment.payment_status = data.get("payment_status", "paid")
    db.session.commit()
    return jsonify({"payment": payment.to_dict()})
