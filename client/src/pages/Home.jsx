import React from "react";

const Home = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-700">FinOps Tool</h1>
        <p className="mb-8 text-lg text-gray-700">
          Unified Microsoft 365 & Azure cost control, license optimization, and cloud governance.
        </p>
        <a href={`${backendUrl}/auth/login`}>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
            Sign in with Microsoft
          </button>
        </a>
      </div>
      <footer className="mt-10 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} <a href="https://www.mrclosync.com" className="underline hover:text-blue-700" target="_blank" rel="noopener noreferrer">Mr. Closync</a>. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;