from datetime import datetime, timezone

from . import db

DOCUMENT_TYPES = ("identity", "policy", "claim")
VERIFICATION_STATUSES = ("pending", "verified", "rejected")


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    claim_id = db.Column(db.Integer, db.ForeignKey("claims.id"), nullable=True)
    doc_type = db.Column(db.String(20), nullable=False, default="identity")
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    ocr_text = db.Column(db.Text, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    verification_status = db.Column(db.String(20), nullable=False, default="pending")
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)

    customer = db.relationship("Customer", back_populates="documents")
    claim = db.relationship("Claim", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "claim_id": self.claim_id,
            "doc_type": self.doc_type,
            "file_name": self.file_name,
            "ocr_text": self.ocr_text,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "verification_status": self.verification_status,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes": self.review_notes,
        }
