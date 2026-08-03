export default function Card({ title, action, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
          {title && <h2 className="font-heading text-lg font-semibold text-brand-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
