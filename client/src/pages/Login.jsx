import React from "react";

const Login = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Sign in with Microsoft</h1>
      <a
        href="http://localhost:3200/auth/login"
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
      >
        Sign In
      </a>
    </div>
  );
};

export default Login;
