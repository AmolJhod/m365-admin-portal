import React, { useEffect, useState } from "react";
import axios from "axios";

const CostTracking = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/finops/cost-tracking`, { withCredentials: true })
      .then(res => setData(res.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Cost Tracking & Dashboards</h2>
      <div className="mb-4">
        <b>License Count by Department:</b>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Department</th>
              <th className="border px-2 py-1">License Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.costByDept).map(([dept, count]) => (
              <tr key={dept}>
                <td className="border px-2 py-1">{dept}</td>
                <td className="border px-2 py-1">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostTracking;