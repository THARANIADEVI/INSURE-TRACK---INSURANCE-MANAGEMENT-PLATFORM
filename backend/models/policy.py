from datetime import datetime, timezone

from . import db

POLICY_STATUSES = ("active", "expired", "cancelled")


class Policy(db.Model):
    __tablename__ = "policies"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    policy_type = db.Column(db.String(80), nullable=False)
    policy_number = db.Column(db.String(50), unique=True, nullable=False)
    premium_amount = db.Column(db.Numeric(12, 2), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    customer = db.relationship("Customer", back_populates="policies")
    claims = db.relationship("Claim", back_populates="policy", cascade="all, delete-orphan")
    payments = db.relationship("PremiumPayment", back_populates="policy", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "policy_type": self.policy_type,
            "policy_number": self.policy_number,
            "premium_amount": float(self.premium_amount) if self.premium_amount is not None else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
