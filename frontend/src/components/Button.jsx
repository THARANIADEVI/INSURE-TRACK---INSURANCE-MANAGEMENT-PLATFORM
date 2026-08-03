const VARIANTS = {
  primary:
    "bg-gradient-to-r from-brand-500 to-brand-700 text-white hover:from-brand-600 hover:to-brand-800 focus-visible:outline-brand-700",
  secondary: "bg-white text-brand-700 border-2 border-brand-300 hover:border-brand-500 hover:bg-brand-50",
  danger: "bg-gradient-to-r from-rose-500 to-rose-700 text-white hover:from-rose-600 hover:to-rose-800",
  ghost: "text-brand-700 hover:bg-brand-50",
};

export default function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
