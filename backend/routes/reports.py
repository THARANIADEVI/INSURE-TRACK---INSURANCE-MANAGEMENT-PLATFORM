import os
from datetime import date, datetime

from flask import Blueprint, current_app, jsonify, request, send_file
from sqlalchemy import extract, func

from models import db
from models.claim import Claim
from models.customer import Customer
from models.policy import Policy
from models.premium_payment import PremiumPayment
from utils.decorators import role_required
from utils.excel_report import build_summary_excel
from utils.pdf_report import build_summary_pdf

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _parse_filters(args):
    start_date = None
    end_date = None
    if args.get("start_date"):
        start_date = datetime.strptime(args["start_date"], "%Y-%m-%d").date()
    if args.get("end_date"):
        end_date = datetime.strptime(args["end_date"], "%Y-%m-%d").date()
    policy_type = args.get("policy_type") or None
    return start_date, end_date, policy_type


def _build_summary(start_date=None, end_date=None, policy_type=None):
    today = date.today()
    range_start = start_date or date(today.year, 1, 1)
    range_end = end_date or today

    policy_query = Policy.query
    if policy_type:
        policy_query = policy_query.filter(Policy.policy_type == policy_type)

    active_policies = policy_query.filter(Policy.status == "active").count()
    expired_policies = policy_query.filter(Policy.status == "expired").count()
    cancelled_policies = policy_query.filter(Policy.status == "cancelled").count()

    policy_type_breakdown = [
        {"policy_type": ptype, "count": count}
        for ptype, count in db.session.query(Policy.policy_type, func.count(Policy.id))
        .group_by(Policy.policy_type)
        .all()
    ]

    range_start_dt = datetime.combine(range_start, datetime.min.time())
    range_end_dt = datetime.combine(range_end, datetime.max.time())

    claim_query = db.session.query(Claim.status, func.count(Claim.id)).join(Policy, Claim.policy_id == Policy.id)
    claim_query = claim_query.filter(Claim.submission_date >= range_start_dt, Claim.submission_date <= range_end_dt)
    if policy_type:
        claim_query = claim_query.filter(Policy.policy_type == policy_type)
    claim_counts = dict(claim_query.group_by(Claim.status).all())

    premium_query = db.session.query(func.coalesce(func.sum(PremiumPayment.amount), 0)).join(
        Policy, PremiumPayment.policy_id == Policy.id
    )
    premium_query = premium_query.filter(
        PremiumPayment.payment_status == "paid",
        PremiumPayment.payment_date >= range_start,
        PremiumPayment.payment_date <= range_end,
    )
    if policy_type:
        premium_query = premium_query.filter(Policy.policy_type == policy_type)
    premium_collected = premium_query.scalar()

    customer_growth_rows = (
        db.session.query(
            extract("year", Customer.created_at), extract("month", Customer.created_at), func.count(Customer.id)
        )
        .filter(Customer.created_at >= range_start_dt, Customer.created_at <= range_end_dt)
        .group_by(extract("year", Customer.created_at), extract("month", Customer.created_at))
        .order_by(extract("month", Customer.created_at))
        .all()
    )
    customer_growth = [
        {"year": int(year), "month": int(month), "count": count} for year, month, count in customer_growth_rows
    ]

    monthly_premiums_rows = (
        db.session.query(
            extract("year", PremiumPayment.payment_date),
            extract("month", PremiumPayment.payment_date),
            func.coalesce(func.sum(PremiumPayment.amount), 0),
        )
        .join(Policy, PremiumPayment.policy_id == Policy.id)
        .filter(
            PremiumPayment.payment_status == "paid",
            PremiumPayment.payment_date >= range_start,
            PremiumPayment.payment_date <= range_end,
        )
    )
    if policy_type:
        monthly_premiums_rows = monthly_premiums_rows.filter(Policy.policy_type == policy_type)
    monthly_premiums_rows = monthly_premiums_rows.group_by(
        extract("year", PremiumPayment.payment_date), extract("month", PremiumPayment.payment_date)
    ).order_by(extract("month", PremiumPayment.payment_date)).all()
    monthly_premiums = [
        {"year": int(year), "month": int(month), "total": float(total)}
        for year, month, total in monthly_premiums_rows
    ]

    return {
        "filters": {
            "start_date": range_start.isoformat(),
            "end_date": range_end.isoformat(),
            "policy_type": policy_type,
        },
        "active_policies": active_policies,
        "expired_policies": expired_policies,
        "cancelled_policies": cancelled_policies,
        "total_customers": Customer.query.count(),
        "policy_type_breakdown": policy_type_breakdown,
        "claim_stats": {
            "pending": claim_counts.get("pending", 0),
            "approved": claim_counts.get("approved", 0),
            "rejected": claim_counts.get("rejected", 0),
        },
        "premium_collected": float(premium_collected or 0),
        "customer_growth": customer_growth,
        "monthly_premium_collection": monthly_premiums,
    }


@reports_bp.route("/summary", methods=["GET"])
@role_required("admin", "agent")
def summary():
    start_date, end_date, policy_type = _parse_filters(request.args)
    return jsonify(_build_summary(start_date, end_date, policy_type))


@reports_bp.route("/pdf", methods=["GET"])
@role_required("admin", "agent")
def summary_pdf():
    start_date, end_date, policy_type = _parse_filters(request.args)
    summary_data = _build_summary(start_date, end_date, policy_type)
    reports_folder = current_app.config["REPORTS_FOLDER"]
    os.makedirs(reports_folder, exist_ok=True)
    pdf_path = os.path.join(reports_folder, "monthly_business_report.pdf")
    build_summary_pdf(pdf_path, summary_data)
    return send_file(pdf_path, as_attachment=True, download_name="monthly_business_report.pdf")


@reports_bp.route("/excel", methods=["GET"])
@role_required("admin", "agent")
def summary_excel():
    start_date, end_date, policy_type = _parse_filters(request.args)
    summary_data = _build_summary(start_date, end_date, policy_type)
    reports_folder = current_app.config["REPORTS_FOLDER"]
    os.makedirs(reports_folder, exist_ok=True)
    excel_path = os.path.join(reports_folder, "monthly_business_report.xlsx")
    build_summary_excel(excel_path, summary_data)
    return send_file(
        excel_path,
        as_attachment=True,
        download_name="monthly_business_report.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
