export default function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-brand-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
