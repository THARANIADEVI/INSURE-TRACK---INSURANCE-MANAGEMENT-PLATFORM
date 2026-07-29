from flask import Blueprint, jsonify, request

from models.audit_log import AuditLog
from utils.decorators import role_required
from utils.pagination import paginate

audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit-logs")


@audit_bp.route("", methods=["GET"])
@role_required("admin")
def list_audit_logs():
    query = AuditLog.query
    entity_type = request.args.get("entity_type")
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    entity_id = request.args.get("entity_id", type=int)
    if entity_id:
        query = query.filter_by(entity_id=entity_id)
    query = query.order_by(AuditLog.created_at.desc())
    return jsonify(paginate(query, lambda a: a.to_dict()))
