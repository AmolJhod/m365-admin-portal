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

const Forecasting = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/finops/cost-tracking/license-forecast`, { withCredentials: true })
      .then(res => setData(res.data));
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">License Cost Forecast</h2>
      {!data ? <div>Loading...</div> : (
        <>
          <table className="w-full border mb-4">
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
                  <td className="border px-2 py-1">${row.price}</td>
                  <td className="border px-2 py-1">{row.count}</td>
                  <td className="border px-2 py-1">${row.yearly}</td>
                </tr>
              ))}
              <tr className="font-bold bg-yellow-100">
                <td className="border px-2 py-1" colSpan={3}>Total Yearly Cost</td>
                <td className="border px-2 py-1">${data.totalYearly}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Forecasting;