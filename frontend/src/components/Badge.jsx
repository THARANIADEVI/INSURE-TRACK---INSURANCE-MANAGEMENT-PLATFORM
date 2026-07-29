const STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  paid: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-rose-100 text-rose-700",
  overdue: "bg-rose-100 text-rose-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function Badge({ status }) {
  const style = STYLES[status] || "bg-slate-200 text-slate-700";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}
