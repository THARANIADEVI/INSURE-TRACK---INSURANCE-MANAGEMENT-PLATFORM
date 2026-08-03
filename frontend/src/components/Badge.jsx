const STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  verified: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  expired: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  overdue: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  rejected: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  cancelled: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

const DOT_STYLES = {
  active: "bg-emerald-500",
  paid: "bg-emerald-500",
  approved: "bg-emerald-500",
  verified: "bg-emerald-500",
  pending: "bg-amber-500",
  expired: "bg-rose-500",
  overdue: "bg-rose-500",
  rejected: "bg-rose-500",
  cancelled: "bg-slate-400",
};

export default function Badge({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  const dot = DOT_STYLES[status] || "bg-slate-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
