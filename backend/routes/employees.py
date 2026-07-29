from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from extensions import bcrypt
from models import db
from models.audit_log import log_action
from models.user import User
from schemas.employee import EMPLOYEE_ROLES, employee_create_schema, employee_update_schema
from utils.decorators import role_required
from utils.pagination import paginate

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


@employees_bp.route("", methods=["GET"])
@role_required("admin")
def list_employees():
    query = User.query.filter(User.role.in_(EMPLOYEE_ROLES))
    role = request.args.get("role")
    if role:
        query = query.filter(User.role == role)
    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(User.name.ilike(like), User.email.ilike(like)))
    query = query.order_by(User.name.asc())
    return jsonify(paginate(query, lambda u: u.to_dict()))


@employees_bp.route("", methods=["POST"])
@role_required("admin")
def create_employee():
    try:
        data = employee_create_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    employee = User(name=data["name"], email=data["email"], password_hash=password_hash, role=data["role"])
    db.session.add(employee)
    db.session.flush()
    log_action("user", employee.id, "employee_created", int(get_jwt_identity()), f"role={employee.role}")
    db.session.commit()
    return jsonify({"employee": employee.to_dict()}), 201


@employees_bp.route("/<int:employee_id>", methods=["PUT"])
@role_required("admin")
def update_employee(employee_id):
    employee = User.query.filter(User.id == employee_id, User.role.in_(EMPLOYEE_ROLES)).first_or_404()

    try:
        data = employee_update_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if "email" in data and data["email"] != employee.email:
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already registered"}), 409
        employee.email = data["email"]
    if "name" in data:
        employee.name = data["name"]
    if "role" in data:
        employee.role = data["role"]
    if "password" in data:
        employee.password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    log_action("user", employee.id, "employee_updated", int(get_jwt_identity()))
    db.session.commit()
    return jsonify({"employee": employee.to_dict()})


@employees_bp.route("/<int:employee_id>", methods=["DELETE"])
@role_required("admin")
def delete_employee(employee_id):
    identity = int(get_jwt_identity())
    if employee_id == identity:
        return jsonify({"error": "Cannot delete your own account"}), 400

    employee = User.query.filter(User.id == employee_id, User.role.in_(EMPLOYEE_ROLES)).first_or_404()
    db.session.delete(employee)
    log_action("user", employee_id, "employee_deleted", identity)
    db.session.commit()
    return jsonify({"message": "Employee deleted"})
