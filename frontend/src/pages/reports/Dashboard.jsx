import { useEffect, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField, { Input, Select } from "../../components/FormField";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ start_date: "", end_date: "", policy_type: "" });
  const [loadError, setLoadError] = useState("");

  async function load(activeFilters = filters) {
    const params = {
      start_date: activeFilters.start_date || undefined,
      end_date: activeFilters.end_date || undefined,
      policy_type: activeFilters.policy_type || undefined,
    };
    try {
      const { data } = await api.get("/reports/summary", { params });
      setSummary(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load report summary");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(e) {
    e.preventDefault();
    load();
  }

  function handleReset() {
    const cleared = { start_date: "", end_date: "", policy_type: "" };
    setFilters(cleared);
    load(cleared);
  }

  async function handleExport(format) {
    setExporting(true);
    try {
      const params = {
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        policy_type: filters.policy_type || undefined,
      };
      const response = await api.get(`/reports/${format}`, { responseType: "blob", params });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `business_report.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loadError && !summary) return <p className="text-rose-600">{loadError}</p>;
  if (!summary) return <p className="text-brand-500">Loading...</p>;

  const claimData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [summary.claim_stats.pending, summary.claim_stats.approved, summary.claim_stats.rejected],
        backgroundColor: ["#fbbf24", "#10b981", "#f43f5e"],
      },
    ],
  };

  const premiumData = {
    labels: summary.monthly_premium_collection.map((r) => MONTH_NAMES[r.month - 1]),
    datasets: [
      {
        label: "Premium Collected",
        data: summary.monthly_premium_collection.map((r) => r.total),
        backgroundColor: "#0ea5e9",
      },
    ],
  };

  const growthData = {
    labels: summary.customer_growth.map((r) => MONTH_NAMES[r.month - 1]),
    datasets: [
      {
        label: "New Customers",
        data: summary.customer_growth.map((r) => r.count),
        borderColor: "#0284c7",
        backgroundColor: "#bae6fd",
        tension: 0.3,
      },
    ],
  };

  const policyTypeData = {
    labels: summary.policy_type_breakdown.map((r) => r.policy_type),
    datasets: [
      {
        label: "Policies by Type",
        data: summary.policy_type_breakdown.map((r) => r.count),
        backgroundColor: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1"],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Card title="Advanced Filters">
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-3">
          <FormField label="Start date">
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </FormField>
          <FormField label="End date">
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </FormField>
          <FormField label="Policy type">
            <Select
              value={filters.policy_type}
              onChange={(e) => setFilters({ ...filters, policy_type: e.target.value })}
            >
              <option value="">All types</option>
              {summary.policy_type_breakdown.map((row) => (
                <option key={row.policy_type} value={row.policy_type}>
                  {row.policy_type}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit">Apply</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </form>
        <p className="mt-2 text-xs text-brand-500">
          Showing {summary.filters.start_date} to {summary.filters.end_date}
          {summary.filters.policy_type ? ` · ${summary.filters.policy_type}` : ""}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Policies" value={summary.active_policies} />
        <StatCard label="Expired Policies" value={summary.expired_policies} />
        <StatCard label="Total Customers" value={summary.total_customers} />
        <StatCard label="Premium Collected" value={summary.premium_collected.toFixed(2)} />
      </div>

      <Card
        title="Business Report Export"
        action={
          <div className="flex gap-2">
            <Button onClick={() => handleExport("pdf")} disabled={exporting}>
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button variant="secondary" onClick={() => handleExport("excel")} disabled={exporting}>
              Export Excel
            </Button>
          </div>
        }
      >
        <p className="text-sm text-brand-600">
          Download the report (policies, claims, premiums, customer growth) for the filters above, as PDF or Excel.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Claim Statistics">
          <Pie data={claimData} />
        </Card>
        <Card title="Premium Collection">
          <Bar data={premiumData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Policies by Type">
          <Pie data={policyTypeData} />
        </Card>
        <Card title="Customer Growth">
          <Line data={growthData} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-sm">
      <p className="text-sm text-brand-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-900">{value}</p>
    </div>
  );
}
