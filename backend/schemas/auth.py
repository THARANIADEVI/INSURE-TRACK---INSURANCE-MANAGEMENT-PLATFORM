from marshmallow import EXCLUDE, Schema, fields, validate


class RegisterSchema(Schema):
    """Public self-registration always creates a customer account.

    Admin/agent accounts are provisioned only via the admin-only
    /api/employees endpoint, never through this public route.
    """

    class Meta:
        unknown = EXCLUDE

    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


register_schema = RegisterSchema()
login_schema = LoginSchema()
