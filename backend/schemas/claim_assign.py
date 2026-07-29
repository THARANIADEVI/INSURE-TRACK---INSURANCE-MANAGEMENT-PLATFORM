from marshmallow import Schema, fields


class ClaimAssignSchema(Schema):
    agent_id = fields.Int(required=True)


claim_assign_schema = ClaimAssignSchema()
