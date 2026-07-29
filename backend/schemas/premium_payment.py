from marshmallow import Schema, fields, validate

from models.premium_payment import PAYMENT_STATUSES


class PremiumPaymentSchema(Schema):
    policy_id = fields.Int(required=True)
    due_date = fields.Date(required=True)
    amount = fields.Decimal(required=True, as_string=False, places=2)


class PremiumPaymentRecordSchema(Schema):
    payment_date = fields.Date(required=True)
    payment_status = fields.Str(load_default="paid", validate=validate.OneOf(PAYMENT_STATUSES))


premium_payment_schema = PremiumPaymentSchema()
premium_payment_record_schema = PremiumPaymentRecordSchema()
