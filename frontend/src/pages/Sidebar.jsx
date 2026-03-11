/* eslint-disable no-unused-vars */
import axios from "axios";
import {
  Home,
  PlusCircle,
  Bell,
  User,
  Sparkle,
  Settings,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../reducer/authReducer";
import { useNotifications } from "../hooks/useNotifications";

const Sidebar = () => {
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
  });

  const path = location.pathname;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.user);
  const name = user?.name;
  const { unreadCount, markAsRead } = useNotifications(user);

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    } else {
      return name[0].toUpperCase();
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Explicit Light/Dark toggle handlers
  const handleLightClick = (e) => {
    e.stopPropagation();
    if (isDarkMode) toggleTheme();
  };

  const handleDarkClick = (e) => {
    e.stopPropagation();
    if (!isDarkMode) toggleTheme();
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await dispatch(logout()).unwrap();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    } finally {
      setIsLoggingOut(false);
      setOpenModal(false);
    }
  };

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      {/* Dynamic Global Style: Prevents the feed content from sliding under the fixed navbars */}
      <style>{`
        @media (max-width: 767px) {
          body { padding-bottom: 4rem; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          body { padding-top: 4rem; }
        }
      `}</style>

      {/* Responsive Layout */}
      <aside className="
        fixed bottom-0 left-0 w-full h-16 z-40 bg-card border-t border-border transition-all duration-300
        md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-6
        lg:sticky lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:py-6 lg:px-4
      ">
        <div className="flex w-full h-full flex-row items-center justify-between lg:flex-col lg:items-stretch lg:justify-start">

          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 lg:mb-10 lg:px-2 flex-shrink-0">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="/logo" className="h-6 w-8 lg:h-8 lg:w-10" />
            </div>
            <span className="text-lg lg:text-xl text-gradient font-semibold">LocalAwaaz</span>
          </div>

          {/* Main Menu Nav Links */}
          <nav className="flex flex-row w-full justify-between items-center px-4 md:px-0 md:justify-center md:gap-6 lg:flex-col lg:gap-2 lg:items-start lg:w-full lg:mt-0">
            <NavLink to="/dashboard" end className="w-auto lg:w-full">
              <SidebarItem icon={Home} label="Home Feed" active={path === "/dashboard"} />
            </NavLink>
            <NavLink to="report" className="w-auto lg:w-full">
              <SidebarItem icon={PlusCircle} label="Report Issue" active={path === "/dashboard/report"} />
            </NavLink>
            <NavLink to="notifications" onClick={() => markAsRead()} className="w-auto lg:w-full">
              <SidebarItem icon={Bell} label="Notifications" active={path === "/dashboard/notifications"} unreadCount={unreadCount} />
            </NavLink>
            <NavLink to="assistant" className="w-auto lg:w-full">
              <SidebarItem icon={Sparkle} label="LokAi" active={path === "/dashboard/assistant"} />
            </NavLink>

            {/* User Profile Trigger Button (Mobile & Tablet) */}
            <div className="flex lg:hidden flex-shrink-0 relative items-center justify-center">
              <button
                className="flex items-center justify-center p-2"
                onClick={() => setOpenModal(true)}
              >
                <div className={`w-8 h-8 rounded-full border text-xs flex justify-center items-center transition-colors 
                  ${openModal ? 'border-primary text-primary' : 'border-foreground/30 text-foreground'}`}
                >
                  {getInitials(name)}
                </div>
              </button>
            </div>
          </nav>

          {/* User Profile Trigger Button (Desktop Only) */}
          <div className="hidden lg:flex flex-col mt-auto w-full">
            <button
              className="flex items-center gap-3 w-full border-t pt-6 border-foreground/30 hover:opacity-80 transition-opacity"
              onClick={() => setOpenModal(true)}
            >
              <div className="w-8 h-8 rounded-full border text-gradient border-accent text-xs flex justify-center items-center">
                {getInitials(name)}
              </div>
              <span className="text-gradient font-semibold truncate">{name}</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Centered User Options Modal */}
      {openModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setOpenModal(false)}
        >
          <div
            className="bg-card glass-card border border-border/50 rounded-2xl w-full max-w-sm shadow-2xl p-4 md:p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-semibold text-foreground">Menu</h3>
              <button
                onClick={() => setOpenModal(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <NavLink
                to="profile"
                onClick={() => setOpenModal(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left"
              >
                <User className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">My Profile</span>
              </NavLink>

              <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5" />
                  <span className="text-sm md:text-base font-medium">Dark Mode</span>
                </div>

                {/* Fixed Toggle Switch */}
                <div className="flex items-center bg-muted/80 rounded-full p-1 gap-1 border border-border/50">
                  <button
                    onClick={handleLightClick}
                    className={`p-1.5 rounded-full transition-all ${!isDarkMode ? 'bg-primary text-primary-foreground shadow-sm scale-100' : 'text-muted-foreground hover:text-foreground scale-90'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDarkClick}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-primary text-primary-foreground shadow-sm scale-100' : 'text-muted-foreground hover:text-foreground scale-90'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left"
                onClick={() => setOpenModal(false)}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">Settings</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left"
                onClick={() => {
                  setOpenModal(false);
                  navigate('/dashboard/help');
                }}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">Help</span>
              </button>

              <div className="pt-2 mt-2 border-t border-border/50">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm md:text-base font-medium">Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm md:text-base font-medium">Log out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div >
      )}
    </>
  );
};

const SidebarItem = ({ icon: Icon, label, active, unreadCount }) => {
  return (
    <div
      className={`flex items-center justify-center lg:justify-start px-3 py-2 md:px-4 md:py-2.5 lg:px-4 lg:py-3 rounded-xl cursor-pointer transition-all duration-200 relative w-auto lg:w-full
        ${active
          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg scale-105"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 md:w-5 md:h-5 lg:w-5 lg:h-5" />
        <span className="hidden md:inline text-sm font-medium">{label}</span>
      </div>

      {/* Dynamic Badge Position */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 md:relative md:top-auto md:right-auto lg:absolute lg:right-4 bg-red-500 text-white text-[10px] md:text-xs rounded-full px-1.5 py-0.5 md:px-2 md:py-1 font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default Sidebar;