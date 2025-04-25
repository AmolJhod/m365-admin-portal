import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Ban, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [userName, setUserName] = useState("User");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch the user's name from the query string
        const params = new URLSearchParams(window.location.search);
        const name = params.get("name");
        if (name) setUserName(name);

        // Fetch users from the backend
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users`,
          {
            withCredentials: true, // Include cookies in the request
          }
        );
        setUsers(res.data.value || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setError("Failed to fetch users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUserState = async (id, enabled) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}/account`,
        { enabled: !enabled },
        { withCredentials: true }
      );
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, accountEnabled: !enabled } : user
        )
      );
      toast.success(`User account ${enabled ? "disabled" : "enabled"} successfully.`);
    } catch (err) {
      console.error("Failed to toggle user state", err);
      toast.error("Failed to update user state.");
    }
  };

  const forceSignOut = async (id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}/signout`,
        {},
        { withCredentials: true }
      );
      toast.success("User has been signed out.");
    } catch (err) {
      console.error("Failed to force sign out", err);
      toast.error("Failed to sign out user.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div> {/* Add a CSS loader or spinner */}
      </div>
    );
  }

  if (error) {
    return <p className="text-center mt-10 text-red-600">{error}</p>;
  }

  if (!loading && users.length === 0) {
    return <p className="text-center mt-10">No users found.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Welcome, {userName} 👋
      </h1>
      <h2 className="text-xl font-semibold text-center mb-4">
        Microsoft 365 Users
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.03 }}
            className="shadow-2xl rounded-2xl bg-white dark:bg-gray-900 transition-all duration-300"
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.displayName || "Unnamed User"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {user.mail || "No email"}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => toggleUserState(user.id, user.accountEnabled)}
                  >
                    {user.accountEnabled ? (
                      <span className="flex items-center gap-2 text-red-600">
                        <Ban size={16} /> Disable Account
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-green-600">
                        <BadgeCheck size={16} /> Enable Account
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-yellow-600 hover:text-yellow-800"
                    onClick={() => forceSignOut(user.id)}
                  >
                    <LogOut size={16} className="mr-2" /> Force Sign-Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
