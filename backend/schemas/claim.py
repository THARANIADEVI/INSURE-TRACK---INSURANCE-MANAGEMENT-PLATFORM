from marshmallow import Schema, fields, validate


class ClaimSchema(Schema):
    policy_id = fields.Int(required=True)
    claim_amount = fields.Decimal(required=True, as_string=False, places=2)
    reason = fields.Str(required=True, validate=validate.Length(min=1))


class ClaimReviewSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(["approved", "rejected"]))
    review_notes = fields.Str(required=False, allow_none=True)


claim_schema = ClaimSchema()
claim_review_schema = ClaimReviewSchema()
