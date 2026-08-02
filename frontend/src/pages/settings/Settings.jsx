import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField, { Input } from "../../components/FormField";

const LABELS = {
  policy_expiry_notice_days: "Policy expiry notice (days before end date)",
  premium_overdue_grace_days: "Premium overdue grace period (days)",
  max_claim_amount: "Maximum claim amount",
  company_name: "Company name",
};

function labelFor(key) {
  return LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/settings");
      setSettings(data.settings);
      setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value ?? ""])));
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(key) {
    setSavingKey(key);
    setSavedKey(null);
    setErrors((e) => ({ ...e, [key]: "" }));
    try {
      const { data } = await api.put(`/settings/${key}`, { value: values[key] });
      setSettings((prev) => prev.map((s) => (s.key === key ? data.setting : s)));
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000);
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: err.response?.data?.error || "Failed to save" }));
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Card title="System Settings">
      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <div className="max-w-xl space-y-4">
          {settings.map((s) => (
            <form
              key={s.key}
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(s.key);
              }}
              className="flex items-end gap-3 border-b border-brand-50 pb-4"
            >
              <div className="flex-1">
                <FormField label={labelFor(s.key)} error={errors[s.key]}>
                  <Input
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                  />
                </FormField>
              </div>
              <Button type="submit" variant="secondary" disabled={savingKey === s.key}>
                {savingKey === s.key ? "Saving..." : savedKey === s.key ? "Saved" : "Save"}
              </Button>
            </form>
          ))}
          {settings.length === 0 && <p className="text-brand-400">No settings found</p>}
        </div>
      )}
    </Card>
  );
}
