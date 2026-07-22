import { useState } from "react";
import { Outlet } from "react-router";

import AuthNavbar from "./AuthNavbar";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="min-w-0 flex-1">
        <AuthNavbar />

        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
