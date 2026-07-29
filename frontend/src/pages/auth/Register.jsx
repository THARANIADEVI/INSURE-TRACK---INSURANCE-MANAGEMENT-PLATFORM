import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/Button";
import FormField, { Input } from "../../components/FormField";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ ...form, role: "customer" });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand-700">Create account</h1>
        <p className="mb-6 text-sm text-brand-500">Register as a customer</p>

        <form onSubmit={handleSubmit}>
          <FormField label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
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
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>

          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          {success && <p className="mb-3 text-sm text-emerald-600">Account created! Redirecting to login...</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Register"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
