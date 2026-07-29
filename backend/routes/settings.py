from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from models import db
from models.audit_log import log_action
from models.setting import DEFAULT_SETTINGS, Setting
from utils.decorators import role_required

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


def _ensure_defaults():
    existing = {s.key for s in Setting.query.all()}
    for key, value in DEFAULT_SETTINGS.items():
        if key not in existing:
            db.session.add(Setting(key=key, value=value))
    db.session.commit()


@settings_bp.route("", methods=["GET"])
@role_required("admin")
def list_settings():
    _ensure_defaults()
    settings = Setting.query.order_by(Setting.key.asc()).all()
    return jsonify({"settings": [s.to_dict() for s in settings]})


@settings_bp.route("/<string:key>", methods=["PUT"])
@role_required("admin")
def update_setting(key):
    data = request.get_json() or {}
    if "value" not in data:
        return jsonify({"error": "value is required"}), 400

    setting = Setting.query.filter_by(key=key).first()
    if not setting:
        setting = Setting(key=key)
        db.session.add(setting)

    setting.value = str(data["value"])
    setting.updated_by = int(get_jwt_identity())
    db.session.flush()
    log_action("setting", setting.id, "setting_updated", setting.updated_by, f"{key}={setting.value}")
    db.session.commit()
    return jsonify({"setting": setting.to_dict()})
