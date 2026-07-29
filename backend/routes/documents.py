import os

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from models import db
from models.customer import Customer
from models.document import DOCUMENT_TYPES, Document
from utils.decorators import role_required
from utils.files import allowed_file, save_upload
from utils.ocr import extract_text

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def _resolve_customer_for_upload():
    """Returns the Customer record the uploaded document should attach to, based on role."""
    claims = get_jwt()
    identity = int(get_jwt_identity())
    if claims.get("role") == "customer":
        return Customer.query.filter_by(user_id=identity).first()
    customer_id = request.form.get("customer_id", type=int)
    if not customer_id:
        return None
    return Customer.query.get(customer_id)


@documents_bp.route("", methods=["POST"])
@jwt_required()
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    file_storage = request.files["file"]
    if file_storage.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file_storage.filename):
        return jsonify({"error": "File type not allowed"}), 400

    customer = _resolve_customer_for_upload()
    if not customer:
        return jsonify({"error": "Customer profile not found"}), 404

    doc_type = request.form.get("doc_type", "identity")
    if doc_type not in DOCUMENT_TYPES:
        return jsonify({"error": f"doc_type must be one of {DOCUMENT_TYPES}"}), 400
    claim_id = request.form.get("claim_id", type=int)

    original_name, dest_path = save_upload(file_storage)
    ocr_text = extract_text(dest_path)

    document = Document(
        customer_id=customer.id,
        claim_id=claim_id,
        doc_type=doc_type,
        file_name=original_name,
        file_path=dest_path,
        ocr_text=ocr_text,
    )
    db.session.add(document)
    db.session.commit()
    return jsonify({"document": document.to_dict()}), 201


@documents_bp.route("", methods=["GET"])
@role_required("admin", "agent")
def list_documents():
    query = Document.query
    customer_id = request.args.get("customer_id", type=int)
    if customer_id:
        query = query.filter(Document.customer_id == customer_id)
    claim_id = request.args.get("claim_id", type=int)
    if claim_id:
        query = query.filter(Document.claim_id == claim_id)
    query = query.order_by(Document.uploaded_at.desc())
    return jsonify({"documents": [d.to_dict() for d in query.all()]})


@documents_bp.route("/mine", methods=["GET"])
@role_required("customer")
def my_documents():
    identity = int(get_jwt_identity())
    customer = Customer.query.filter_by(user_id=identity).first()
    if not customer:
        return jsonify({"error": "No customer profile linked to this account yet"}), 404
    query = Document.query.filter_by(customer_id=customer.id).order_by(Document.uploaded_at.desc())
    return jsonify({"documents": [d.to_dict() for d in query.all()]})


@documents_bp.route("/<int:document_id>/download", methods=["GET"])
@jwt_required()
def download_document(document_id):
    claims = get_jwt()
    document = Document.query.get_or_404(document_id)
    if claims.get("role") == "customer":
        identity = int(get_jwt_identity())
        customer = Customer.query.filter_by(user_id=identity).first()
        if not customer or document.customer_id != customer.id:
            return jsonify({"error": "Forbidden"}), 403

    if not os.path.exists(document.file_path):
        return jsonify({"error": "File missing on server"}), 404

    return send_file(document.file_path, as_attachment=True, download_name=document.file_name)
