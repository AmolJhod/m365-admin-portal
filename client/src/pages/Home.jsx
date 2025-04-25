import React from "react";

const Home = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">O365 Admin Portal</h2>
      <a href={`${backendUrl}/auth/login`}>
        <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login with Microsoft
        </button>
      </a>
    </div>
  );
};

export default Home;