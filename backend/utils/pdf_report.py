from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_summary_pdf(dest_path, summary):
    doc = SimpleDocTemplate(dest_path, pagesize=A4)
    styles = getSampleStyleSheet()
    filters = summary.get("filters", {})
    elements = [
        Paragraph("Insurance Management Platform - Business Report", styles["Title"]),
        Paragraph(f"Generated on {date.today().isoformat()}", styles["Normal"]),
        Paragraph(
            f"Period: {filters.get('start_date', '-')} to {filters.get('end_date', '-')}"
            + (f" | Policy type: {filters['policy_type']}" if filters.get("policy_type") else ""),
            styles["Normal"],
        ),
        Spacer(1, 16),
    ]

    overview_data = [
        ["Metric", "Value"],
        ["Active Policies", summary["active_policies"]],
        ["Expired Policies", summary["expired_policies"]],
        ["Cancelled Policies", summary["cancelled_policies"]],
        ["Total Customers", summary["total_customers"]],
        ["Premium Collected", f"{summary['premium_collected']:.2f}"],
        ["Pending Claims", summary["claim_stats"]["pending"]],
        ["Approved Claims", summary["claim_stats"]["approved"]],
        ["Rejected Claims", summary["claim_stats"]["rejected"]],
    ]
    elements.append(_table(overview_data))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("Policies by Type", styles["Heading2"]))
    policy_type_rows = [["Policy Type", "Count"]] + [
        [row["policy_type"], row["count"]] for row in summary.get("policy_type_breakdown", [])
    ] or [["-", "-"]]
    elements.append(_table(policy_type_rows))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("Monthly Premium Collection", styles["Heading2"]))
    monthly_rows = [["Month", "Total Collected"]] + [
        [f"{row['year']}-{row['month']:02d}", f"{row['total']:.2f}"]
        for row in summary["monthly_premium_collection"]
    ] or [["-", "-"]]
    elements.append(_table(monthly_rows))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("Customer Growth", styles["Heading2"]))
    growth_rows = [["Month", "New Customers"]] + [
        [f"{row['year']}-{row['month']:02d}", row["count"]] for row in summary["customer_growth"]
    ] or [["-", "-"]]
    elements.append(_table(growth_rows))

    doc.build(elements)
    return dest_path


def _table(data):
    table = Table(data, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table
