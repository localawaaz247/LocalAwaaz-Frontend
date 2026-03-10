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
  ChartNoAxesColumnDecreasing,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import {  NavLink, useLocation, useNavigate} from "react-router-dom"
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../reducer/authReducer";
import { useNotifications } from "../hooks/useNotifications";

const Sidebar = () => {
    const location=useLocation();
    const [openModal,setOpenModal]=useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    });
    const path=location.pathname;
    const modalRef = useRef(null);
    const dispatch=useDispatch();
    const navigate=useNavigate();

    const user=useSelector((state)=>state.auth?.user);
    const name=user?.name;
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

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout=async()=>{
      try { 
        setIsLoggingOut(true);
        await dispatch(logout()).unwrap();
        navigate("/");
      } catch (error) {
         console.error("Logout error:", error);
         // Still navigate even if logout API fails
         navigate("/");
      } finally {
        setIsLoggingOut(false);
      }
    }

    // Apply theme to DOM on mount and when theme changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setOpenModal(false);
            }
        };

        if (openModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openModal]);
  return (
    <aside className="md:w-64 h-screen bg-card px-4 py-6 border-r border-border flex flex-col justify-between">
      
      {/* Logo */}
      <div>
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 rounded-xl  flex items-center justify-center shadow-lg">
         <img src="/logo.png" alt="/logo" className="h-8 w-10"/>
        </div>
        <span className="text-xl text-gradient font-semibold">LocalAwaaz</span>
      </div>

      {/* Main Menu */}
     
      <nav>
      <NavLink to="/dashboard" end> <SidebarItem icon={Home} label="Home Feed"  active={path ==="/dashboard"}/></NavLink>
       <NavLink to="report"> <SidebarItem icon={PlusCircle} label="Report Issue" active={path ==="/dashboard/report"}/></NavLink>
        
        <NavLink to="notifications" onClick={() => markAsRead()}>
          <SidebarItem icon={Bell} label="Notifications" active={path ==="/dashboard/notifications"} unreadCount={unreadCount} />
        </NavLink>

        <NavLink to="assistant"> <SidebarItem icon={Sparkle} label="LokAi " active={path ==="/dashboard/assistant"}/></NavLink>
      </nav>
      </div>
      

      <div className="  relative" ref={modalRef}> 
        {/* User Options Modal */}
        {openModal && (
          <div className={`absolute left-0 glass-card rounded-xl p-2 animate-fade-in-up w-56 ${
            isDarkMode ? 'bottom-0 mb-2' : 'bottom-full mb-2'
          }`}>
            <div className="space-y-1">
              <NavLink to="profile" onClick={() => setOpenModal(false)}> <SidebarItem icon={User} label="My Profile" /></NavLink>
              <div className="w-full flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                  <span className="text-sm font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                      setOpenModal(false);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      !isDarkMode 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                      setOpenModal(false);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      isDarkMode 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left" onClick={() => setOpenModal(false)}>
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left" onClick={() => setOpenModal(false)}>
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Help</span>
              </button>
              <button 
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-red-500">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">Log out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        <button 
          className="flex gap-3 items-center mt-4 w-full border-t pt-6 border-foreground/30" 
          onClick={() => setOpenModal(!openModal)}
        >
          <div className="w-8 h-8 rounded-full border text-gradient border-accent text-xs flex justify-center items-center  ">
            {getInitials(name)}
          </div>
          <span className="text-gradient font-semibold">{name}</span>
        </button>
      </div>
    

      
      
    </aside>
  );
};

const SidebarItem = ({ icon: Icon, label, active, unreadCount }) => {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
        ${
          active
            ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg scale-105"
            : "hover:bg-muted text-foreground/80 hover:text-foreground"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default Sidebar;
