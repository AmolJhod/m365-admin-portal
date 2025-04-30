import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart2,
  Users,
  ShieldCheck,
  Zap,
  Eye,
  FileDown,
  FileText,
} from "lucide-react";

const skuNames = {
  "ENTERPRISEPACK": "Office 365 E3",
  "EMS": "Enterprise Mobility + Security E3",
  "SPE_E5": "Microsoft 365 E5",
  "SPE_E3": "Microsoft 365 E3",
  "POWER_BI_PRO": "Power BI Pro",
};

const sections = [
  {
    key: "cost-tracking",
    title: "Cost Tracking & Dashboards",
    icon: <BarChart2 size={20} />,
    subs: [
      {
        key: "unified-cost-reporting",
        label: "Unified Azure + M365 cost reporting",
        api: "/api/finops/cost-tracking/license-by-department",
      },
      {
        key: "forecasting",
        label: "Forecasting",
        api: "/api/finops/cost-tracking/license-forecast",
      },
      {
        key: "comparison",
        label: "Comparison reports",
        api: "/api/finops/cost-tracking/comparison-reports",
      },
    ],
  },
  {
    key: "license-optimization",
    title: "License Optimization",
    icon: <Users size={20} />,
    subs: [
      {
        key: "unused-licenses",
        label: "Identify unused M365 licenses",
        api: "/api/finops/license-optimization",
      },
      {
        key: "recommend-downgrade",
        label: "Recommend downgrades",
        api: "/api/finops/license-optimization/recommend-downgrade",
      },
      {
        key: "track-usage",
        label: "Track M365 vs. O365 usage",
        api: "/api/finops/license-optimization/track-usage",
      },
    ],
  },
  {
    key: "automated-cost-control",
    title: "Automated Cost Control",
    icon: <Zap size={20} />,
    subs: [
      { key: "auto-shutdown", label: "Auto-shutdown unused VMs", api: "/api/finops/automated-cost-control/auto-shutdown" },
      { key: "budget-alerts", label: "Set budget alerts", api: "/api/finops/automated-cost-control/budget-alerts" },
      { key: "policy-governance", label: "Policy-based governance", api: "/api/finops/automated-cost-control/policy-governance" },
    ],
  },
  {
    key: "waste-detection",
    title: "Waste Detection & Savings Tips",
    icon: <ShieldCheck size={20} />,
    subs: [
      { key: "idle-resources", label: "Find idle resources", api: "/api/finops/waste-detection/idle-resources" },
      { key: "right-size", label: "Right-size recommendations", api: "/api/finops/waste-detection/right-size" },
      { key: "spot-vs-reserved", label: "Spot vs. Reserved Instance analysis", api: "/api/finops/waste-detection/spot-vs-reserved" },
    ],
  },
  {
    key: "shadow-it",
    title: "Shadow IT & SaaS Spend Tracking",
    icon: <Eye size={20} />,
    subs: [
      { key: "unauthorized-apps", label: "Detect unauthorized cloud apps", api: "/api/finops/shadow-it/unauthorized-apps" },
      { key: "compare-costs", label: "Compare costs (Teams vs. Zoom usage)", api: "/api/finops/shadow-it/compare-costs" },
    ],
  },
];

const Dashboard = () => {
  const [selectedSection, setSelectedSection] = useState(sections[0].key);
  const [selectedSub, setSelectedSub] = useState(sections[0].subs[0].key);
  const [subData, setSubData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const section = sections.find((s) => s.key === selectedSection);
    const sub = section.subs.find((s) => s.key === selectedSub);
    if (sub.api) {
      setLoading(true);
      setError("");
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}${sub.api}`, { withCredentials: true })
        .then((res) => setSubData((d) => ({ ...d, [selectedSub]: res.data })))
        .catch(() => setError("Failed to load data"))
        .finally(() => setLoading(false));
    }
  }, [selectedSection, selectedSub]);

  const exportNote = "Report generated and downloaded from www.mrclosync.com";

// CSV Export
const handleExportCSV = () => {
  const data = subData[selectedSub];
  let csv = "";
  if (!data) {
    csv = "No data available";
  } else if (data.usage) {
    csv = "Department,License Count\n" +
      Object.entries(data.usage).map(([dept, count]) => `"${dept}",${count}`).join("\n");
  } else if (data.licenses && data.licenses[0]?.users) {
    csv = "License Name,Count,Assigned Users\n" +
      data.licenses.map(lic =>
        `"${skuNames[lic.sku] || lic.sku}",${lic.count},"${lic.users.map(u => `${u.name} (${u.email})`).join("; ")}"`
      ).join("\n");
  } else if (data.licenses && data.licenses[0]?.price !== undefined) {
    csv = "License Type,Current Price (USD/month),Assigned Count,Yearly Cost (USD)\n" +
      data.licenses.map(row =>
        `"${skuNames[row.sku] || row.sku}",${row.price},${row.count},${row.yearly}`
      ).join("\n") +
      `\n"Total Yearly Cost",,,${data.totalYearly}`;
  } else {
    csv = JSON.stringify(data, null, 2);
  }
  // Add note at the end
  csv += `\n\n"${exportNote}"`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${selectedSub}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// PDF Export
const handleExportPDF = () => {
  const data = subData[selectedSub];
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(selectedSub.replace(/-/g, " "), 10, 15);
  doc.setFontSize(10);

  let finalY = 30;
  if (!data) {
    doc.text("No data available", 10, finalY);
  } else if (data.usage) {
    autoTable(doc, {
      startY: 25,
      head: [["Department", "License Count"]],
      body: Object.entries(data.usage).map(([dept, count]) => [dept, count]),
      styles: { fillColor: [240, 240, 255] },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  } else if (data.licenses && data.licenses[0]?.users) {
    autoTable(doc, {
      startY: 25,
      head: [["License Name", "Count", "Assigned Users"]],
      body: data.licenses.map(lic => [
        skuNames[lic.sku] || lic.sku,
        lic.count,
        lic.users.map(u => `${u.name} (${u.email})`).join('\n'),
      ]),
      styles: { fillColor: [240, 240, 255], cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        2: { cellWidth: 70 },
      },
      didParseCell: function (data) {
        if (data.column.index === 2) {
          data.cell.styles.valign = 'top';
        }
      }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  } else if (data.licenses && data.licenses[0]?.price !== undefined) {
    autoTable(doc, {
      startY: 25,
      head: [["License Type", "Current Price (USD/month)", "Assigned Count", "Yearly Cost (USD)"]],
      body: [
        ...data.licenses.map(row => [
          skuNames[row.sku] || row.sku,
          `$${row.price}`,
          row.count,
          `$${row.yearly}`,
        ]),
        [
          { content: "Total Yearly Cost", colSpan: 3, styles: { fontStyle: "bold" } },
          `$${data.totalYearly}`,
        ],
      ],
      styles: { fillColor: [240, 240, 255] },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" }
    });
    finalY = doc.lastAutoTable.finalY + 10;
  } else {
    doc.text(JSON.stringify(data, null, 2), 10, finalY);
    finalY += 10;
  }
  // Add note at the bottom
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(exportNote, 10, finalY);
  doc.save(`${selectedSub}.pdf`);
};

  const renderSubData = () => {
    const data = subData[selectedSub];
    if (loading) return (
      <div className="flex items-center gap-2 text-blue-600 font-semibold">
        <span className="animate-spin text-2xl">⏳</span>
        Loading...
      </div>
    );
    if (error) return <div className="text-red-600">{error}</div>;
    if (!data) return <div className="text-gray-500">No data loaded yet.</div>;

    if (data.usage) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-blue-200 to-blue-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">Department</th>
                <th className="border px-3 py-2">License Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.usage).map(([dept, count], i) => (
                <tr key={dept} className={i % 2 === 0 ? "bg-white" : "bg-blue-50 hover:bg-blue-100"}>
                  <td className="border px-3 py-2">{dept}</td>
                  <td className="border px-3 py-2">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (data.licenses && data.licenses[0]?.users) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-green-200 to-green-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">License Name</th>
                <th className="border px-3 py-2">Count</th>
                <th className="border px-3 py-2">Assigned Users</th>
              </tr>
            </thead>
            <tbody>
              {data.licenses.map((lic, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-green-50 hover:bg-green-100"}>
                  <td className="border px-3 py-2">{skuNames[lic.sku] || lic.sku}</td>
                  <td className="border px-3 py-2">{lic.count}</td>
                  <td className="border px-3 py-2">
                    <div className="max-h-24 overflow-y-auto">
                      {lic.users.map((u) => (
                        <div key={u.email}>{u.name} <span className="text-xs text-gray-500">({u.email})</span></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (data.licenses && data.licenses[0]?.price !== undefined) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-yellow-200 to-yellow-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">License Type</th>
                <th className="border px-3 py-2">Current Price (USD/month)</th>
                <th className="border px-3 py-2">Assigned Count</th>
                <th className="border px-3 py-2">Yearly Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {data.licenses.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-yellow-50 hover:bg-yellow-100"}>
                  <td className="border px-3 py-2">{skuNames[row.sku] || row.sku}</td>
                  <td className="border px-3 py-2">${row.price}</td>
                  <td className="border px-3 py-2">{row.count}</td>
                  <td className="border px-3 py-2">${row.yearly}</td>
                </tr>
              ))}
              <tr className="font-bold bg-yellow-200">
                <td className="border px-3 py-2" colSpan={3}>Total Yearly Cost</td>
                <td className="border px-3 py-2">${data.totalYearly}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    // Comparison Reports
    if (
      data.months &&
      data.departments &&
      data.data &&
      Array.isArray(data.data)
    ) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-purple-200 to-purple-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">Department</th>
                {data.months.map((m) => (
                  <th key={m} className="border px-3 py-2">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, i) => (
                <tr key={row.department} className={i % 2 === 0 ? "bg-white" : "bg-purple-50 hover:bg-purple-100"}>
                  <td className="border px-3 py-2">{row.department}</td>
                  {data.months.map((m) => (
                    <td key={m} className="border px-3 py-2">{row[m]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Recommend Downgrades
    if (data.recommendations) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-pink-200 to-pink-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">User</th>
                <th className="border px-3 py-2">Email</th>
                <th className="border px-3 py-2">Current License</th>
                <th className="border px-3 py-2">Suggested License</th>
                <th className="border px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.recommendations.map((rec, i) => (
                <tr key={rec.email} className={i % 2 === 0 ? "bg-white" : "bg-pink-50 hover:bg-pink-100"}>
                  <td className="border px-3 py-2">{rec.user}</td>
                  <td className="border px-3 py-2">{rec.email}</td>
                  <td className="border px-3 py-2">{rec.currentLicense}</td>
                  <td className="border px-3 py-2">{rec.suggestedLicense}</td>
                  <td className="border px-3 py-2">{rec.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Track M365 vs O365 Usage
    if (data.usage && Array.isArray(data.usage)) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-gradient-to-r from-blue-200 to-blue-100 sticky top-0">
              <tr>
                <th className="border px-3 py-2">License</th>
                <th className="border px-3 py-2">Users</th>
                <th className="border px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.usage.map((row, i) => (
                <tr key={row.license} className={i % 2 === 0 ? "bg-white" : "bg-blue-50 hover:bg-blue-100"}>
                  <td className="border px-3 py-2">{row.license}</td>
                  <td className="border px-3 py-2">{row.users}</td>
                  <td className="border px-3 py-2">{row.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Automated Cost Control
    if (data.autoShutdowns) {
      // Render autoShutdowns table
    }
    if (data.budgetAlerts) {
      // Render budgetAlerts table
    }
    if (data.policyBlocks) {
      // Render policyBlocks table
    }
    // Waste Detection
    if (data.idleResources) {
      // Render idleResources table
    }
    if (data.rightSize) {
      // Render rightSize table
    }
    if (data.spotVsReserved) {
      // Render spotVsReserved table
    }
    // Shadow IT
    if (data.unauthorizedApps) {
      // Render unauthorizedApps table
    }
    if (data.teamsVsZoom) {
      // Render teamsVsZoom table
    }
    return (
      <pre className="bg-gray-100 rounded p-4 text-xs overflow-x-auto shadow-inner">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 shadow-2xl relative z-10">
        <h1 className="text-3xl font-extrabold mb-10 text-center tracking-tight drop-shadow-lg">FinOps Portal</h1>
        <nav>
          {sections.map((section) => (
            <div key={section.key} className="mb-6">
              <div
                className={`flex items-center gap-2 font-bold cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedSection === section.key
                    ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg"
                    : "hover:bg-blue-800/60"
                }`}
                onClick={() => {
                  setSelectedSection(section.key);
                  setSelectedSub(section.subs[0].key);
                }}
              >
                {section.icon}
                <span>{section.title}</span>
                {selectedSection === section.key && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </div>
              {selectedSection === section.key && (
                <ul className="ml-4 mt-2">
                  {section.subs.map((sub) => (
                    <li
                      key={sub.key}
                      className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                        selectedSub === sub.key
                          ? "bg-white text-blue-900 font-semibold shadow"
                          : "hover:bg-blue-700/40"
                      }`}
                      onClick={() => setSelectedSub(sub.key)}
                    >
                      {sub.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto text-xs text-blue-100 text-center opacity-70">
          &copy; {new Date().getFullYear()} FinOps Portal
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-start justify-start p-10">
        <div className="w-full max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-3xl font-bold capitalize tracking-tight flex-1">
              {sections.find(s => s.key === selectedSection)?.title}
              <span className="block text-lg font-medium text-blue-600 mt-1">
                {sections.find(s => s.key === selectedSection)?.subs.find(su => su.key === selectedSub)?.label}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                className="group relative px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition flex items-center gap-2"
                onClick={handleExportCSV}
              >
                <FileDown size={18} />
                <span className="hidden md:inline">Export Excel</span>
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition">Download as CSV</span>
              </button>
              <button
                className="group relative px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
                onClick={handleExportPDF}
              >
                <FileText size={18} />
                <span className="hidden md:inline">Export PDF</span>
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition">Download as PDF</span>
              </button>
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl shadow-xl p-8">
            {renderSubData()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;