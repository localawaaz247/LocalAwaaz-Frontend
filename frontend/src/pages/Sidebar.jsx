/* eslint-disable no-unused-vars */
import {
  Home,
  PlusCircle,
  Bell,
  User,
  LayoutGrid,
  ClipboardList,
} from "lucide-react";

import { NavLink, useLocation} from "react-router-dom"

const Sidebar = () => {
    const location=useLocation();
    const path=location.pathname;
  return (
    <aside className="md:w-64 h-screen bg-card px-4 py-6 border-r border-border">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 rounded-xl  flex items-center justify-center shadow-lg">
         <img src="/logo.png" alt="/logo" className="h-8 w-10"/>
        </div>
        <span className="text-xl text-gradient font-semibold">LocalAwaaz</span>
      </div>

      {/* Main Menu */}
      <nav className="space-y-2">
      <NavLink to="/dashboard" end> <SidebarItem icon={Home} label="Home Feed"  active={path ==="/dashboard"}/></NavLink>
       <NavLink to="report"> <SidebarItem icon={PlusCircle} label="Report Issue" active={path ==="/dashboard/report"}/></NavLink>
        <NavLink to="notifications"><SidebarItem icon={Bell} label="Notifications" active={path ==="/dashboard/notifications"} /></NavLink>
       <NavLink to="profile"> <SidebarItem icon={User} label="My Profile" active={path ==="/dashboard/profile"} /></NavLink>
      </nav>

      {/* Admin Section */}
      <div className="mt-8">
        <p className="text-xs text-muted-foreground px-2 mb-3 tracking-wider font-semibold">
          ADMIN
        </p>
        <nav className="space-y-2">
          <SidebarItem icon={LayoutGrid} label="Dashboard" />
          <SidebarItem icon={ClipboardList} label="Manage Issues" />
        </nav>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon: Icon, label, active }) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
        ${
          active
            ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg scale-105"
            : "hover:bg-muted text-foreground/80 hover:text-foreground"
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default Sidebar;
