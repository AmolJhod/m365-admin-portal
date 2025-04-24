// src/components/ui/button.jsx
import React from "react";

export const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
}) => {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </button>
  );
};
