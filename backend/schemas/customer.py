from marshmallow import Schema, fields, validate


class CustomerSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    dob = fields.Date(required=False, allow_none=True)
    phone = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
    address = fields.Str(required=False, allow_none=True, validate=validate.Length(max=255))
    email = fields.Email(required=True)


class CustomerUpdateSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=1, max=120))
    dob = fields.Date(required=False, allow_none=True)
    phone = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
    address = fields.Str(required=False, allow_none=True, validate=validate.Length(max=255))
    email = fields.Email(required=False)


customer_schema = CustomerSchema()
customer_update_schema = CustomerUpdateSchema()
