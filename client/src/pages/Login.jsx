import React from "react";

const Login = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Sign in with Microsoft</h1>
      <a
        href={`${import.meta.env.VITE_BACKEND_URL}/auth/login`}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign In
      </a>
    </div>
  );
};

export default Login;
