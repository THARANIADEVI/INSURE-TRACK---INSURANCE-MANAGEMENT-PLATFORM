from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from models.notification import Notification
from utils.decorators import role_required
from utils.pagination import paginate

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.route("/mine", methods=["GET"])
@role_required("admin", "agent", "customer")
def my_notifications():
    identity = int(get_jwt_identity())
    query = Notification.query.filter_by(user_id=identity).order_by(Notification.sent_at.desc())
    return jsonify(paginate(query, lambda n: n.to_dict()))


@notifications_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_notifications():
    query = Notification.query
    user_id = request.args.get("user_id", type=int)
    if user_id:
        query = query.filter_by(user_id=user_id)
    query = query.order_by(Notification.sent_at.desc())
    return jsonify(paginate(query, lambda n: n.to_dict()))
