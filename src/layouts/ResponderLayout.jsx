import React from "react";
import { Outlet } from "react-router-dom";

export default function ResponderLayout() {
  return (
    <main className="min-h-screen bg-gray-50 text-slate-900">
      <Outlet />
    </main>
  );
}
