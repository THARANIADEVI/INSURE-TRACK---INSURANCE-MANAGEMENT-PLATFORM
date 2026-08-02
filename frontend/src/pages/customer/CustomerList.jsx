import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";
import FormField, { Input } from "../../components/FormField";

export default function CustomerList() {
  const location = useLocation();
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(Boolean(location.state?.openForm));
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", dob: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/customers", { params: { search: search || undefined, page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    await load();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/customers", { ...form, dob: form.dob || undefined });
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", address: "", dob: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create customer");
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Customers"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Register Customer"}</Button>
        }
      >
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <Input
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-3 rounded-lg bg-brand-50 p-4">
            <FormField label="Name">
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
              <Button type="submit">Save Customer</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-brand-500">Loading...</p>
        ) : loadError ? (
          <p className="text-rose-600">{loadError}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-brand-500">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-brand-50">
                  <td className="py-2 font-medium text-brand-900">{c.name}</td>
                  <td className="text-brand-700">{c.email}</td>
                  <td className="text-brand-700">{c.phone || "-"}</td>
                  <td className="text-right">
                    <Link to={`/customers/${c.id}`} className="text-brand-600 underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-brand-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <Pagination page={data.page} pages={data.pages} onChange={setPage} />
      </Card>
    </div>
  );
}
