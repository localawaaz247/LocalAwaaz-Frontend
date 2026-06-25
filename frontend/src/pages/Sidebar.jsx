import {
  Home, PlusCircle, Bell, User, Sparkle, Settings, HelpCircle,
  LogOut, Sun, Moon, X, ShieldCheck, Download, Briefcase, Trophy
} from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../reducer/authReducer";
import { useNotifications } from "../hooks/useNotifications";
import SettingsModal from "../components/modals/SettingsModal";
import { useTranslation } from "react-i18next";

// 🟢 Capacitor Imports
import { Capacitor } from '@capacitor/core';
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";

// 🟢 Added Logo Import (Adjust the path according to your folder structure)
import Logo from "../components/Logo";

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
  });

  const path = location.pathname;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.user);
  const profileDetail = useSelector((state) => state.profile?.profileDetail);

  const name = profileDetail?.name || user?.name;
  const profilePic = profileDetail?.profilePic || user?.profilePic;
  const { unreadCount, markAsRead } = useNotifications(user);

  const currentRole = profileDetail?.role || user?.role;
  const currentAuthorityProfile = profileDetail?.authorityProfile || user?.authorityProfile;
  const isApprovedAuthority = (user || profileDetail) &&
    ['official', 'ngo', 'other'].includes(currentRole) &&
    currentAuthorityProfile?.verificationStatus === 'APPROVED';

  // -----------------------------------
  // 🟢 App Download Logic (For EVERYONE)
  // -----------------------------------
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isNative = Capacitor.isNativePlatform();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadApp = async () => {
    try {
      setIsDownloading(true);
      const { data } = await axiosInstance.get('/app/latest');

      if (data.success && data.release && data.release.downloadUrl) {
        showToast({
          icon: 'success',
          title: 'Download Started',
          subtitle: isNative ? 'Downloading update...' : 'Your APK file is downloading.'
        });

        // Safely route the download based on environment
        window.open(data.release.downloadUrl, isNative ? '_system' : '_blank');
      } else {
        showToast({
          icon: 'error',
          title: 'Unavailable',
          subtitle: 'No application release found.'
        });
      }
    } catch (error) {
      console.error("Failed to fetch app download URL:", error);
      showToast({
        icon: 'error',
        title: 'Download Failed',
        subtitle: 'Could not connect to the server.'
      });
    } finally {
      setIsDownloading(false);
    }
  };
  // -----------------------------------

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length >= 2) return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    return name[0].toUpperCase();
  };

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
      navigate("/");
    } finally {
      setIsLoggingOut(false);
      setOpenModal(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          body { padding-bottom: 4rem; }
        }
      `}</style>

      <aside className="
        fixed bottom-0 left-0 w-full h-16 z-40 bg-card border-t border-border transition-all duration-300
        lg:sticky lg:top-0 lg:bottom-auto lg:h-screen lg:w-72 lg:border-t-0 lg:border-b-0 lg:border-r lg:py-6 lg:px-4
      ">
        <div className="flex w-full h-full flex-row items-center justify-between lg:flex-col lg:items-stretch lg:justify-start">

          {/* 🟢 Replaced old logo implementation with the new SVG Logo component */}
          <Logo className="hidden lg:flex lg:mb-10 lg:px-2 flex-shrink-0 h-10 lg:h-12" />

          <nav className="flex flex-row w-full justify-between items-center px-4 lg:px-0 lg:flex-col lg:gap-2 lg:items-start lg:w-full lg:mt-0">
            <NavLink to="/dashboard" end className="w-auto lg:w-full">
              <SidebarItem icon={Home} label={t('nav_home_feed')} active={path === "/dashboard"} />
            </NavLink>
            <NavLink to="report" className="w-auto lg:w-full">
              <SidebarItem icon={PlusCircle} label={t('nav_report_issue')} active={path === "/dashboard/report"} />
            </NavLink>
            <NavLink to="notifications" onClick={() => markAsRead()} className="w-auto lg:w-full">
              <SidebarItem icon={Bell} label={t('nav_notifications')} active={path === "/dashboard/notifications"} unreadCount={unreadCount} />
            </NavLink>
            <NavLink to="assistant" className="w-auto lg:w-full">
              <SidebarItem icon={Sparkle} label={t('nav_lokai')} active={path === "/dashboard/assistant"} />
            </NavLink>
            <NavLink to="leaderboard" className="w-auto lg:w-full">
              <SidebarItem icon={Trophy} label={t('nav_leaderboard', 'Leaderboard')} active={path.startsWith("/dashboard/leaderboard")} />
            </NavLink>

            {isApprovedAuthority && (
              <NavLink to="/authority" className="w-auto lg:w-full hidden lg:block">
                <SidebarItem icon={CustomAuthorityAdminIcon} label="Authority Space" active={path.startsWith("/authority")} isAuthorityLink={true} />
              </NavLink>
            )}

            {user?.role === 'admin' && (
              <NavLink to="/admin" className="w-auto lg:w-full hidden lg:block">
                <SidebarItem icon={CustomAuthorityAdminIcon} label={t('nav_admin_panel')} active={path.startsWith("/admin")} isAdminLink={true} />
              </NavLink>
            )}

            <div className="flex lg:hidden flex-shrink-0 relative items-center justify-center">
              <button
                className="flex items-center justify-center p-2 transition-transform active:scale-95"
                onClick={() => setOpenModal(true)}
              >
                <div className={`w-8 h-8 rounded-full border text-xs flex justify-center items-center overflow-hidden transition-colors 
                  ${openModal ? 'border-primary text-primary' : 'border-foreground/30 text-foreground'}`}
                >
                  {profilePic ? (
                    <img src={profilePic} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(name)
                  )}
                </div>
              </button>
            </div>
          </nav>

          <div className="hidden lg:flex flex-col mt-auto w-full pt-4 border-t border-border/50">
            <button
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-muted transition-all duration-200 group active:scale-95 text-left"
              onClick={() => setOpenModal(true)}
            >
              <div className="w-10 h-10 rounded-full border border-accent text-xs flex justify-center items-center overflow-hidden flex-shrink-0 bg-background group-hover:border-primary transition-colors">
                {profilePic ? (
                  <img src={profilePic} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-gradient font-bold">{getInitials(name)}</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-gradient font-semibold truncate leading-tight">{name}</span>
                <span className="text-[11px] text-muted-foreground capitalize truncate mt-0.5">{currentRole || 'User'}</span>
              </div>
            </button>
          </div>

        </div>
      </aside>

      {/* MOBILE MENU MODAL */}
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
              <h3 className="text-lg font-semibold text-foreground">{t('menu')}</h3>
              <button
                onClick={() => setOpenModal(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">

              {/* 🟢 APP DOWNLOAD BANNER (ALWAYS VISIBLE FOR BOTH WEB AND NATIVE) */}
              <div className="mb-3 p-3 bg-primary/10 rounded-xl border border-primary/20 flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Install App</h4>
                    <p className="text-xs text-primary/80 font-medium">
                      {isIOS ? "iOS App coming soon." : "Get the native Android experience."}
                    </p>
                  </div>
                </div>
                {!isIOS && (
                  <button
                    onClick={handleDownloadApp}
                    disabled={isDownloading}
                    className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? "Starting..." : "Download APK"}
                  </button>
                )}
              </div>

              {isApprovedAuthority && (
                <NavLink
                  to="/authority"
                  onClick={() => setOpenModal(false)}
                  className="w-full flex lg:hidden items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left active:scale-95"
                >
                  <CustomAuthorityAdminIcon className="w-5 h-5" />
                  <span className="text-sm md:text-base font-medium">Authority Space</span>
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setOpenModal(false)}
                  className="w-full flex lg:hidden items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left active:scale-95"
                >
                  <CustomAuthorityAdminIcon className="w-5 h-5" />
                  <span className="text-sm md:text-base font-medium">{t('nav_admin_panel')}</span>
                </NavLink>
              )}

              <NavLink
                to="profile"
                onClick={() => setOpenModal(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left active:scale-95"
              >
                <User className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">{t('my_profile')}</span>
              </NavLink>

              <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5" />
                  <span className="text-sm md:text-base font-medium">{t('dark_mode')}</span>
                </div>

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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left active:scale-95"
                onClick={() => {
                  setOpenModal(false);
                  setIsSettingsOpen(true);
                }}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">{t('settings')}</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-black/10 dark:hover:bg-black/40 transition-all duration-200 text-left active:scale-95"
                onClick={() => {
                  setOpenModal(false);
                  navigate('/dashboard/help');
                }}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm md:text-base font-medium">{t('help')}</span>
              </button>

              <div className="pt-2 mt-2 border-t border-border/50">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm md:text-base font-medium">{t('logging_out')}</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm md:text-base font-medium">{t('log_out')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

const SidebarItem = ({ icon: Icon, label, active, unreadCount, isAdminLink, isAuthorityLink }) => {
  return (
    <div
      title={label}
      className={`group flex items-center justify-center lg:justify-start px-3 py-2 md:px-4 md:py-2.5 lg:px-4 lg:py-3 rounded-xl cursor-pointer transition-all duration-200 relative w-auto lg:w-full hover:scale-105 active:scale-95
        ${active && (isAdminLink || isAuthorityLink)
          ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg scale-105 hover:scale-110"
          : active
            ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg scale-105 hover:scale-110"
            : (isAdminLink || isAuthorityLink)
              ? "text-red-500/80 hover:bg-red-500/10 hover:text-red-500"
              : "text-foreground/80 hover:bg-muted hover:text-foreground"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 md:w-5 md:h-5 lg:w-5 lg:h-5 transition-transform group-hover:scale-110" />
        <span className="hidden lg:inline text-sm font-medium">{label}</span>
      </div>

      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 md:relative md:top-auto md:right-auto lg:absolute lg:right-4 bg-red-500 text-white text-[10px] md:text-xs rounded-full px-1.5 py-0.5 md:px-2 md:py-1 font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

// 🟢 Custom SVG Wrapper for Admin and Authority Icons
const CustomAuthorityAdminIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className || ''} drop-shadow-sm`}
  >
    {/* Base Location Pin (Local) */}
    <path
      d="M12 21.5C12 21.5 19.5 14.5 19.5 9.5C19.5 5.35786 16.1421 2 12 2C7.85786 2 4.5 5.35786 4.5 9.5C4.5 14.5 12 21.5 12 21.5Z"
      className="fill-primary/10 stroke-primary"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Sound Wave Bars (Awaaz / Voice) */}
    <path d="M9 8.5V11.5" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 7V13" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 8.5V11.5" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />

    {/* Resolution Badge (Rewards/Tracking) */}
    <g transform="translate(1, 1)">
      {/* Background cutout to make it pop over the pin */}
      <circle cx="17" cy="17" r="5.5" className="fill-background" />
      {/* The Badge */}
      <circle cx="17" cy="17" r="4.5" className="fill-accent" />
      {/* The Checkmark */}
      <path d="M15 17L16.5 18.5L19.5 15.5" className="stroke-white dark:stroke-background" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export default Sidebar;