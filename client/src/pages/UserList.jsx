import React, { useEffect, useState } from "react";
import axios from "axios";

const UserList = () => {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users`, { withCredentials: true })
      .then(res => setUsers(res.data));
  }, []);

  if (!users) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">User List</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Enabled</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{u.displayName}</td>
              <td className="border px-2 py-1">{u.userPrincipalName}</td>
              <td className="border px-2 py-1">{u.accountEnabled ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;