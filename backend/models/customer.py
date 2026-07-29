from datetime import datetime, timezone

from . import db


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=True)
    name = db.Column(db.String(120), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="customer")
    policies = db.relationship("Policy", back_populates="customer", cascade="all, delete-orphan")
    documents = db.relationship("Document", back_populates="customer", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "dob": self.dob.isoformat() if self.dob else None,
            "phone": self.phone,
            "address": self.address,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
