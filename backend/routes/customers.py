from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import db
from models.customer import Customer
from models.user import User
from schemas.customer import customer_schema, customer_update_schema
from utils.decorators import role_required
from utils.pagination import paginate

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")


def _get_own_customer():
    identity = get_jwt_identity()
    return Customer.query.filter_by(user_id=int(identity)).first()


@customers_bp.route("", methods=["POST"])
@role_required("admin", "agent")
def create_customer():
    try:
        data = customer_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    customer = Customer(**data)
    matching_user = User.query.filter_by(email=data["email"], role="customer").first()
    if matching_user:
        customer.user_id = matching_user.id

    db.session.add(customer)
    db.session.commit()
    return jsonify({"customer": customer.to_dict()}), 201


@customers_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_customers():
    query = Customer.query
    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Customer.name.ilike(like), Customer.email.ilike(like), Customer.phone.ilike(like))
        )
    query = query.order_by(Customer.created_at.desc())
    return jsonify(paginate(query, lambda c: c.to_dict()))


@customers_bp.route("/me", methods=["GET"])
@role_required("customer")
def get_my_customer_profile():
    customer = _get_own_customer()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404
    return jsonify({"customer": customer.to_dict()})


@customers_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    claims = get_jwt()
    customer = Customer.query.get_or_404(customer_id)
    if claims.get("role") == "customer" and customer.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden"}), 403
    return jsonify({"customer": customer.to_dict()})


@customers_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    claims = get_jwt()
    customer = Customer.query.get_or_404(customer_id)
    if claims.get("role") == "customer" and customer.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden"}), 403

    try:
        data = customer_update_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    for key, value in data.items():
        setattr(customer, key, value)
    db.session.commit()
    return jsonify({"customer": customer.to_dict()})


@customers_bp.route("/<int:customer_id>/history", methods=["GET"])
@jwt_required()
def customer_history(customer_id):
    claims = get_jwt()
    customer = Customer.query.get_or_404(customer_id)
    if claims.get("role") == "customer" and customer.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden"}), 403

    policies = [p.to_dict() for p in customer.policies]
    claim_history = []
    payment_history = []
    for policy in customer.policies:
        claim_history.extend(c.to_dict() for c in policy.claims)
        payment_history.extend(p.to_dict() for p in policy.payments)

    return jsonify(
        {
            "customer": customer.to_dict(),
            "policies": policies,
            "claims": claim_history,
            "payments": payment_history,
        }
    )
