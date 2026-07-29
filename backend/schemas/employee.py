from marshmallow import Schema, fields, validate

EMPLOYEE_ROLES = ("admin", "agent")


class EmployeeCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    role = fields.Str(required=True, validate=validate.OneOf(EMPLOYEE_ROLES))


class EmployeeUpdateSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=False)
    role = fields.Str(required=False, validate=validate.OneOf(EMPLOYEE_ROLES))
    password = fields.Str(required=False, validate=validate.Length(min=6))


employee_create_schema = EmployeeCreateSchema()
employee_update_schema = EmployeeUpdateSchema()
