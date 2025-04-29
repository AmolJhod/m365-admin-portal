import React, { useEffect, useState } from "react";
import axios from "axios";

const skuNames = {
  "ENTERPRISEPACK": "Office 365 E3",
  "EMS": "Enterprise Mobility + Security E3",
  "SPE_E5": "Microsoft 365 E5",
  "SPE_E3": "Microsoft 365 E3",
  "POWER_BI_PRO": "Power BI Pro",
  // Add more as needed
};

const LicenseOptimization = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/finops/license-optimization`, { withCredentials: true })
      .then(res => setData(res.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">License Optimization</h2>
      <table className="w-full border mb-4">
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
                {lic.users.map(u => `${u.name} (${u.email})`).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LicenseOptimization;