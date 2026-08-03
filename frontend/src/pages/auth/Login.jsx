import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import FormField, { Input } from "../../components/FormField";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      const dest = location.state?.from || (user.role === "customer" ? "/my-dashboard" : "/dashboard");
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand-700">Insurance MP</h1>
        <p className="mb-6 text-sm text-brand-500">Log in to your account</p>

        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password">
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>

          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-600">
          No account?{" "}
          <Link to="/register" className="font-semibold text-brand-700 underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
