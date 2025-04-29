import React, { useEffect, useState } from "react";
import axios from "axios";

const UnifiedCostReporting = () => {
  const [vmData, setVmData] = useState(null);
  const [licenseData, setLicenseData] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/finops/cost-tracking/azure-vms`, { withCredentials: true })
      .then(res => setVmData(res.data));
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/finops/cost-tracking/license-by-department`, { withCredentials: true })
      .then(res => setLicenseData(res.data));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Azure VM Report</h2>
      {!vmData ? <div>Loading...</div> : (
        <table className="w-full mb-8 border">
          <thead>
            <tr>
              <th className="border px-2 py-1">VM Name</th>
              <th className="border px-2 py-1">Resource Group</th>
              <th className="border px-2 py-1">Location</th>
              <th className="border px-2 py-1">Provisioning Time</th>
            </tr>
          </thead>
          <tbody>
            {vmData.vms.length === 0 ? (
              <tr><td colSpan={4} className="text-center">No VMs found</td></tr>
            ) : vmData.vms.map(vm => (
              <tr key={vm.name}>
                <td className="border px-2 py-1">{vm.name}</td>
                <td className="border px-2 py-1">{vm.resourceGroup}</td>
                <td className="border px-2 py-1">{vm.location}</td>
                <td className="border px-2 py-1">{vm.provisioningTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2 className="text-2xl font-bold mb-4">License Usage by Department</h2>
      {!licenseData ? <div>Loading...</div> : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Department</th>
              <th className="border px-2 py-1">License Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(licenseData.usage).map(([dept, count]) => (
              <tr key={dept}>
                <td className="border px-2 py-1">{dept}</td>
                <td className="border px-2 py-1">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UnifiedCostReporting;