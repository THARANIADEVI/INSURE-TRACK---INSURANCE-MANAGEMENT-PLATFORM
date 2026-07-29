import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import FormField, { Input, Select } from "../../components/FormField";

const EMPTY_FORM = { name: "", email: "", password: "", role: "agent" };

export default function EmployeeList() {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/employees", {
      params: { search: search || undefined, role: role || undefined, page },
    });
    setData(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  async function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    await load();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/employees", form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create employee");
    }
  }

  function startEdit(employee) {
    setEditingId(employee.id);
    setEditForm({ name: employee.name, email: employee.email, password: "", role: employee.role });
    setEditError("");
  }

  async function handleUpdate(e, id) {
    e.preventDefault();
    setEditError("");
    const payload = { name: editForm.name, email: editForm.email, role: editForm.role };
    if (editForm.password) payload.password = editForm.password;
    try {
      await api.put(`/employees/${id}`, payload);
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.error || "Failed to update employee");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this employee?")) return;
    try {
      await api.delete(`/employees/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete employee");
    }
  }

  return (
    <Card
      title="Employees"
      action={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Add Employee"}</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="ml-auto flex gap-2">
          {["", "admin", "agent"].map((r) => (
            <button
              key={r || "all"}
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                role === r ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"
              }`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

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
          <FormField label="Password">
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>
          {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}
          <div className="col-span-2">
            <Button type="submit">Save Employee</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-brand-500">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((emp) =>
              editingId === emp.id ? (
                <tr key={emp.id} className="border-b border-brand-50 bg-brand-50 align-top">
                  <td colSpan={5} className="py-3">
                    <form
                      onSubmit={(e) => handleUpdate(e, emp.id)}
                      className="grid grid-cols-2 gap-3 rounded-lg p-2 md:grid-cols-4"
                    >
                      <FormField label="Name">
                        <Input
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Email">
                        <Input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Role">
                        <Select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        >
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </Select>
                      </FormField>
                      <FormField label="New password (optional)">
                        <Input
                          type="password"
                          minLength={6}
                          placeholder="Leave blank to keep"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        />
                      </FormField>
                      {editError && <p className="col-span-4 text-sm text-rose-600">{editError}</p>}
                      <div className="col-span-2 space-x-2 md:col-span-4">
                        <Button type="submit">Save</Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={emp.id} className="border-b border-brand-50">
                  <td className="py-2 font-medium text-brand-900">{emp.name}</td>
                  <td className="text-brand-700">{emp.email}</td>
                  <td>
                    <Badge status={emp.role} />
                  </td>
                  <td className="text-brand-700">{emp.created_at ? emp.created_at.slice(0, 10) : "-"}</td>
                  <td className="space-x-2 text-right">
                    <button className="text-brand-600 underline" onClick={() => startEdit(emp)}>
                      Edit
                    </button>
                    <button
                      className="text-rose-600 underline disabled:cursor-not-allowed disabled:text-brand-300 disabled:no-underline"
                      disabled={emp.id === user?.id}
                      title={emp.id === user?.id ? "Cannot delete your own account" : undefined}
                      onClick={() => handleDelete(emp.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-400">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </Card>
  );
}
