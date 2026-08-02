import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import FormField, { Input } from "../../components/FormField";

export default function CustomerDetail() {
  const { id } = useParams();
  const [history, setHistory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewError, setReviewError] = useState({});
  const [loadError, setLoadError] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/customers/${id}/history`);
      setHistory(data);
      setForm({
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        dob: data.customer.dob || "",
      });
      const docsRes = await api.get("/documents", { params: { customer_id: id } });
      setDocuments(docsRes.data.documents);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load customer");
    }
  }

  async function handleDownload(doc) {
    const response = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.file_name;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleVerify(docId, status) {
    setReviewError((e) => ({ ...e, [docId]: "" }));
    try {
      await api.put(`/documents/${docId}/verify`, { status, review_notes: reviewNotes[docId] || undefined });
      load();
    } catch (err) {
      setReviewError((e) => ({ ...e, [docId]: err.response?.data?.error || "Failed to review document" }));
    }
  }

  async function handleDeleteDocument(doc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete document");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/customers/${id}`, form);
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    }
  }

  if (loadError && !history) return <p className="text-rose-600">{loadError}</p>;
  if (!history) return <p className="text-brand-500">Loading...</p>;

  const { customer, policies, claims, payments } = history;

  return (
    <div className="space-y-6">
      <Card
        title={customer.name}
        action={<Button variant="secondary" onClick={() => setEditing((s) => !s)}>{editing ? "Cancel" : "Edit"}</Button>}
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

      <Card title="Policy History">
        <SimpleTable
          rows={policies}
          columns={[
            ["policy_number", "Policy #"],
            ["policy_type", "Type"],
            ["premium_amount", "Premium"],
            ["status", "Status", (v) => <Badge status={v} />],
          ]}
        />
      </Card>

      <Card title="Claim History">
        <SimpleTable
          rows={claims}
          columns={[
            ["reason", "Reason"],
            ["claim_amount", "Amount"],
            ["status", "Status", (v) => <Badge status={v} />],
          ]}
        />
      </Card>

      <Card title="Payment History">
        <SimpleTable
          rows={payments}
          columns={[
            ["due_date", "Due Date"],
            ["amount", "Amount"],
            ["payment_status", "Status", (v) => <Badge status={v} />],
          ]}
        />
      </Card>

      <Card title="Uploaded Documents">
        {documents.length === 0 ? (
          <p className="text-brand-400">No documents uploaded yet</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-brand-500">
                <th className="py-2">File name</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Verification</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-brand-50 align-top">
                  <td className="py-2">
                    <p className="font-medium text-brand-900">{d.file_name}</p>
                    {d.ocr_text && (
                      <p className="mt-1 max-w-xs truncate text-xs text-brand-500" title={d.ocr_text}>
                        OCR: {d.ocr_text}
                      </p>
                    )}
                  </td>
                  <td className="capitalize text-brand-700">{d.doc_type}</td>
                  <td className="text-brand-700">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                  <td>
                    <Badge status={d.verification_status} />
                    {d.review_notes && (
                      <p className="mt-1 max-w-xs truncate text-xs text-brand-500" title={d.review_notes}>
                        Notes: {d.review_notes}
                      </p>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <button className="text-brand-600 underline" onClick={() => handleDownload(d)}>
                        Download
                      </button>
                      <button className="text-rose-600 underline" onClick={() => handleDeleteDocument(d)}>
                        Delete
                      </button>
                      {d.verification_status === "pending" && (
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="Notes (optional)"
                            value={reviewNotes[d.id] || ""}
                            onChange={(e) => setReviewNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                            className="w-32 rounded border border-brand-200 bg-offwhite px-2 py-1 text-xs outline-none focus:border-brand-500"
                          />
                          <button className="text-emerald-600 underline" onClick={() => handleVerify(d.id, "verified")}>
                            Verify
                          </button>
                          <button className="text-rose-600 underline" onClick={() => handleVerify(d.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      )}
                      {reviewError[d.id] && <p className="text-xs text-rose-600">{reviewError[d.id]}</p>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function SimpleTable({ rows, columns }) {
  if (!rows.length) return <p className="text-brand-400">No records yet</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-brand-100 text-brand-500">
          {columns.map(([key, label]) => (
            <th key={key} className="py-2">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-brand-50">
            {columns.map(([key, , render]) => (
              <td key={key} className="py-2 text-brand-800">
                {render ? render(row[key]) : row[key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
