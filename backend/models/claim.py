from datetime import datetime, timezone

from . import db

CLAIM_STATUSES = ("pending", "approved", "rejected")


class Claim(db.Model):
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey("policies.id"), nullable=False)
    claim_amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    submission_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    policy = db.relationship("Policy", back_populates="claims")
    documents = db.relationship("Document", back_populates="claim", cascade="all, delete-orphan")
    assignee = db.relationship("User", foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "claim_amount": float(self.claim_amount) if self.claim_amount is not None else None,
            "reason": self.reason,
            "status": self.status,
            "submission_date": self.submission_date.isoformat() if self.submission_date else None,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes": self.review_notes,
            "assigned_to": self.assigned_to,
            "assignee_name": self.assignee.name if self.assignee else None,
        }
