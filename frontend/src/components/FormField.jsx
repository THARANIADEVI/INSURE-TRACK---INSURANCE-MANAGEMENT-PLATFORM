export default function FormField({ label, error, children }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-brand-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-lg border border-brand-200 bg-offwhite px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      {...props}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-lg border border-brand-200 bg-offwhite px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea(props) {
  return (
    <textarea
      className="w-full rounded-lg border border-brand-200 bg-offwhite px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      rows={3}
      {...props}
    />
  );
}
