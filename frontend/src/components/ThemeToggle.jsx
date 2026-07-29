import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
      title="Toggle dark mode"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
