import React, { useEffect, useState } from "react";
import axios from "axios";

const Groups = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/groups`, { withCredentials: true })
      .then(res => setGroups(res.data));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Groups</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Members</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{g.displayName}</td>
              <td className="border px-2 py-1">{g.groupType}</td>
              <td className="border px-2 py-1">{g.members?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Groups;