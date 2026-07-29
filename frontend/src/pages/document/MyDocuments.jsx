import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField, { Select } from "../../components/FormField";

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("identity");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await api.get("/documents/mine");
    setDocuments(data.documents);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first");
      return;
    }
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    try {
      await api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
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

  return (
    <Card title="My Documents">
      <form onSubmit={handleUpload} className="mb-6 flex items-end gap-3 rounded-lg bg-brand-50 p-4">
        <FormField label="Document type">
          <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="identity">Identity</option>
            <option value="policy">Policy</option>
            <option value="claim">Claim</option>
          </Select>
        </FormField>
        <FormField label="File (pdf, png, jpg, doc)">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        </FormField>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </form>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-brand-500">
            <th className="py-2">File name</th>
            <th>Type</th>
            <th>Uploaded</th>
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
              <td className="text-right">
                <button className="text-brand-600 underline" onClick={() => handleDownload(d)}>
                  Download
                </button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-brand-400">
                No documents uploaded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
