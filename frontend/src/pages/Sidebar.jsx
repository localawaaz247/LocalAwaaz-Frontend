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
import { BASE_URL } from "../utils/config";

const Sidebar = () => {
    const location=useLocation();
    const [openModal,setOpenModal]=useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const path=location.pathname;
    const modalRef = useRef(null);
    const navigate=useNavigate();

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

    const handleLogout=async()=>{
      try {
        const res=await axios.post(`${BASE_URL}/auth/logout`);
        navigate("/");
        
      } catch (error) {
        console.log(error);
      }
    }

    // Check for saved theme preference or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

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
        
        <NavLink to="notifications"><SidebarItem icon={Bell} label="Notifications" active={path ==="/dashboard/notifications"} /></NavLink>

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
              <NavLink to="profile"> <SidebarItem icon={User} label="My Profile" /></NavLink>
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
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Help</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left" onClick={handleLogout}>
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Log out</span>
              </button>
            </div>
          </div>
        )}
        
        <button 
          className="flex gap-3 items-center mt-4 w-full" 
          onClick={() => setOpenModal(!openModal)}
        >
          <div className="w-8 h-8 rounded-full border text-gradient border-white text-xs flex justify-center items-center">
            AM
          </div>
          <span className="text-foreground">Amit Maurya</span>
        </button>
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
