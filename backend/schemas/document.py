from marshmallow import Schema, fields, validate


class DocumentReviewSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(["verified", "rejected"]))
    review_notes = fields.Str(required=False, allow_none=True)


document_review_schema = DocumentReviewSchema()
