import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { Card, CardContent } from "@/components/ui/card";

const skuNames = {
  "ENTERPRISEPACK": "Office 365 E3",
  "EMS": "Enterprise Mobility + Security E3",
  "SPE_E5": "Microsoft 365 E5",
  "SPE_E3": "Microsoft 365 E3",
  "POWER_BI_PRO": "Power BI Pro",
  // Add more as needed
};

const sections = [
  {
    key: "cost-tracking",
    title: "Cost Tracking & Dashboards",
    subs: [
      {
        key: "unified-cost-reporting",
        label: "Unified Azure + M365 cost reporting",
        api: "/api/finops/cost-tracking/license-by-department"
      },
      {
        key: "forecasting",
        label: "Forecasting (predict future costs based on trends)",
        api: "/api/finops/cost-tracking/license-forecast"
      },
      {
        key: "comparison",
        label: "Comparison reports (On-prem vs. Cloud costs)",
        api: null
      }
    ]
  },
  {
    key: "license-optimization",
    title: "License Optimization",
    subs: [
      {
        key: "unused-licenses",
        label: "Identify unused M365 licenses",
        api: "/api/finops/license-optimization"
      },
      {
        key: "recommend-downgrade",
        label: "Recommend downgrades",
        api: null
      },
      {
        key: "track-usage",
        label: "Track Microsoft 365 vs. Office 365 usage",
        api: null
      }
    ]
  },
  {
    key: "automated-cost-control",
    title: "Automated Cost Control",
    subs: [
      {
        key: "auto-shutdown",
        label: "Auto-shutdown unused VMs",
        api: null
      },
      {
        key: "budget-alerts",
        label: "Set budget alerts",
        api: null
      },
      {
        key: "policy-governance",
        label: "Policy-based governance",
        api: null
      }
    ]
  },
  {
    key: "waste-detection",
    title: "Waste Detection & Savings Tips",
    subs: [
      {
        key: "idle-resources",
        label: "Find idle resources",
        api: null
      },
      {
        key: "right-size",
        label: "Right-size recommendations",
        api: null
      },
      {
        key: "spot-vs-reserved",
        label: "Spot vs. Reserved Instance analysis",
        api: null
      }
    ]
  },
  {
    key: "shadow-it",
    title: "Shadow IT & SaaS Spend Tracking",
    subs: [
      {
        key: "unauthorized-apps",
        label: "Detect unauthorized cloud apps",
        api: null
      },
      {
        key: "compare-costs",
        label: "Compare costs (Teams vs. Zoom usage)",
        api: null
      }
    ]
  }
];

const companyLogo = null;
const companyName = "Mr. Closync";
const backgroundImage = "https://www.mrclosync.com/wp-content/uploads/2023/11/mrclosync-logo.png";

const Dashboard = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSub, setExpandedSub] = useState({});
  const [subData, setSubData] = useState({});
  const [loadingSub, setLoadingSub] = useState({});

  const handleSectionExpand = (key) => {
    setExpandedSection(expandedSection === key ? null : key);
    setExpandedSub({});
  };

  const handleSubExpand = async (sectionKey, sub) => {
    setExpandedSub((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === sub.key ? null : sub.key
    }));
    if (sub.api && !subData[`${sectionKey}-${sub.key}`]) {
      setLoadingSub((prev) => ({ ...prev, [`${sectionKey}-${sub.key}`]: true }));
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}${sub.api}`,
          { withCredentials: true }
        );
        setSubData((prev) => ({
          ...prev,
          [`${sectionKey}-${sub.key}`]: res.data
        }));
      } catch {
        setSubData((prev) => ({
          ...prev,
          [`${sectionKey}-${sub.key}`]: { error: "Failed to load data" }
        }));
      }
      setLoadingSub((prev) => ({ ...prev, [`${sectionKey}-${sub.key}`]: false }));
    }
  };

  const handleExportCSV = (data, filename) => {
    if (!data) return;
    let csv = "";
    if (data.usage) {
      csv = "Department,License Count\n" +
        Object.entries(data.usage).map(([dept, count]) => `${dept},${count}`).join("\n");
    } else if (data.licenses) {
      csv = "License Name,Count,Assigned Users\n" +
        data.licenses.map(lic =>
          `${skuNames[lic.sku] || lic.sku},${lic.count},"${lic.users.map(u => `${u.name} (${u.email})`).join("; ")}"`
        ).join("\n");
    } else if (data.licenses) {
      csv = "License Type,Current Price (USD/month),Assigned Count,Yearly Cost (USD)\n" +
        data.licenses.map(row =>
          `${skuNames[row.sku] || row.sku},${row.price},${row.count},${row.yearly}`
        ).join("\n");
    } else {
      csv = JSON.stringify(data, null, 2);
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = (data, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(filename, 10, 15);
    doc.setFontSize(10);
    let y = 30;
    if (data.usage) {
      doc.text("Department, License Count", 10, y);
      y += 8;
      Object.entries(data.usage).forEach(([dept, count]) => {
        doc.text(`${dept}, ${count}`, 10, y);
        y += 8;
      });
    } else if (data.licenses) {
      doc.text("License Name, Count, Assigned Users", 10, y);
      y += 8;
      data.licenses.forEach(lic => {
        doc.text(`${skuNames[lic.sku] || lic.sku}, ${lic.count}, ${lic.users.map(u => `${u.name} (${u.email})`).join("; ")}`, 10, y);
        y += 8;
      });
    } else {
      doc.text(JSON.stringify(data, null, 2), 10, y);
    }
    doc.save(`${filename}.pdf`);
  };

  // Renderers for each API response
  const renderSubData = (sub, data) => {
    if (sub.key === "unified-cost-reporting" && data.usage) {
      return (
        <table className="w-full border mb-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">Department</th>
              <th className="border px-2 py-1">License Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.usage).map(([dept, count]) => (
              <tr key={dept}>
                <td className="border px-2 py-1">{dept}</td>
                <td className="border px-2 py-1">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (sub.key === "unused-licenses" && data.licenses) {
      return (
        <table className="w-full border mb-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">License Name</th>
              <th className="border px-2 py-1">Count</th>
              <th className="border px-2 py-1">Assigned Users</th>
            </tr>
          </thead>
          <tbody>
            {data.licenses.map((lic, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{skuNames[lic.sku] || lic.sku}</td>
                <td className="border px-2 py-1">{lic.count}</td>
                <td className="border px-2 py-1">
                  <div className="max-h-24 overflow-y-auto">
                    {lic.users.map(u => (
                      <div key={u.email}>{u.name} ({u.email})</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (sub.key === "forecasting" && data.licenses) {
      return (
        <table className="w-full border mb-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">License Type</th>
              <th className="border px-2 py-1">Current Price (USD/month)</th>
              <th className="border px-2 py-1">Assigned Count</th>
              <th className="border px-2 py-1">Yearly Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {data.licenses.map((row, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{skuNames[row.sku] || row.sku}</td>
                <td className="border px-2 py-1">{row.price}</td>
                <td className="border px-2 py-1">{row.count}</td>
                <td className="border px-2 py-1">{row.yearly}</td>
              </tr>
            ))}
            <tr className="font-bold bg-yellow-100">
              <td className="border px-2 py-1" colSpan={3}>Total Yearly Cost</td>
              <td className="border px-2 py-1">{data.totalYearly}</td>
            </tr>
          </tbody>
        </table>
      );
    }
    // Fallback for other APIs or not implemented
    return (
      <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div
      className="w-screen h-screen min-h-screen min-w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center bg-white bg-opacity-80">
        <div className="flex flex-col items-center mt-8 mb-4">
          {companyLogo && (
            <img src={companyLogo} alt="logo" className="h-16 mb-2" />
          )}
          <h1 className="text-5xl font-extrabold text-blue-700 mb-2">{companyName}</h1>
          <h2 className="text-3xl font-bold text-center mb-8">FinOps Tool</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl px-8">
          {sections.map((section) => (
            <Card
              key={section.key}
              className={`cursor-pointer hover:shadow-2xl transition border-2 border-blue-100 hover:border-blue-400 bg-gradient-to-br from-white to-blue-50 ${
                expandedSection === section.key ? "ring-2 ring-blue-400" : ""
              }`}
              onClick={() => handleSectionExpand(section.key)}
            >
              <CardContent>
                <h2 className="text-2xl font-semibold mb-2 text-blue-700">{section.title}</h2>
                <ul className="mb-2 list-disc list-inside text-gray-700">
                  {section.subs.map((sub) => (
                    <li key={sub.key}>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          handleSubExpand(section.key, sub);
                        }}
                      >
                        <span>{sub.label}</span>
                        <span className="ml-2 text-blue-600 text-xs underline">
                          {expandedSub[section.key] === sub.key ? "Hide" : "Show"}
                        </span>
                      </div>
                      {expandedSub[section.key] === sub.key && (
                        <div className="mt-2 max-h-60 overflow-y-auto rounded bg-white shadow-inner border border-gray-200 p-2">
                          {sub.api ? (
                            loadingSub[`${section.key}-${sub.key}`] ? (
                              <div>Loading...</div>
                            ) : subData[`${section.key}-${sub.key}`]?.error ? (
                              <div className="text-red-600">{subData[`${section.key}-${sub.key}`].error}</div>
                            ) : (
                              <div>
                                {renderSubData(sub, subData[`${section.key}-${sub.key}`])}
                                <div className="flex gap-4 mt-2 mb-2">
                                  <button
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleExportCSV(subData[`${section.key}-${sub.key}`], sub.key);
                                    }}
                                  >
                                    Export to Excel
                                  </button>
                                  <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleExportPDF(subData[`${section.key}-${sub.key}`], sub.key);
                                    }}
                                  >
                                    Export to PDF
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <div>No data available for this sub-section.</div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;