import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField, { Input } from "../../components/FormField";

export default function MyProfile() {
  const [customer, setCustomer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  async function load() {
    try {
      const { data } = await api.get("/customers/me");
      setCustomer(data.customer);
      setForm({
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        dob: data.customer.dob || "",
      });
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/customers/${customer.id}`, form);
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    }
  }

  if (notFound) {
    return (
      <Card title="My Profile">
        <p className="text-brand-500">No customer profile linked to this account yet.</p>
      </Card>
    );
  }

  if (!customer) return <p className="text-brand-500">Loading...</p>;

  return (
    <Card
      title="My Profile"
      action={
        <Button variant="secondary" onClick={() => setEditing((s) => !s)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      }
    >
      {editing ? (
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
          <FormField label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Date of birth">
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormField>
          </div>
          {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}
          <div className="col-span-2">
            <Button type="submit">Save</Button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-brand-500">Email</dt>
            <dd className="font-medium text-brand-900">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-brand-500">Phone</dt>
            <dd className="font-medium text-brand-900">{customer.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-brand-500">Date of birth</dt>
            <dd className="font-medium text-brand-900">{customer.dob || "-"}</dd>
          </div>
          <div>
            <dt className="text-brand-500">Address</dt>
            <dd className="font-medium text-brand-900">{customer.address || "-"}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
