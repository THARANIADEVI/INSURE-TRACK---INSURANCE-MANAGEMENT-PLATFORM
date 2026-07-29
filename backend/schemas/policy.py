from marshmallow import Schema, fields, validate

from models.policy import POLICY_STATUSES


class PolicySchema(Schema):
    customer_id = fields.Int(required=True)
    policy_type = fields.Str(required=True, validate=validate.Length(min=1, max=80))
    premium_amount = fields.Decimal(required=True, as_string=False, places=2)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)


class PolicyUpdateSchema(Schema):
    policy_type = fields.Str(required=False, validate=validate.Length(min=1, max=80))
    premium_amount = fields.Decimal(required=False, as_string=False, places=2)
    start_date = fields.Date(required=False)
    end_date = fields.Date(required=False)
    status = fields.Str(required=False, validate=validate.OneOf(POLICY_STATUSES))


policy_schema = PolicySchema()
policy_update_schema = PolicyUpdateSchema()
