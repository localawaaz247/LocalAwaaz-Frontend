import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Users, MessageSquare, Radio, ArrowLeft, Sun, Moon, Menu, X } from 'lucide-react';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminIssues from '../components/admin/AdminIssues';
import AdminUsers from '../components/admin/AdminUsers';
import AdminInquiries from '../components/admin/AdminInquiries';
import AdminBroadcast from '../components/admin/AdminBroadcast';
import logo from "/logo.png";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('analytics');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    });

    const handleToggleTheme = (e) => {
        e.stopPropagation();
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

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const navItems = [
        { id: 'analytics', label: t('admin_nav_analytics'), icon: LayoutDashboard },
        { id: 'issues', label: t('admin_nav_issues'), icon: AlertCircle },
        { id: 'users', label: t('admin_nav_users'), icon: Users },
        { id: 'inquiries', label: t('admin_nav_inquiries'), icon: MessageSquare },
        { id: 'broadcast', label: t('admin_nav_broadcast'), icon: Radio },
    ];

    return (
        <div className="flex h-[100dvh] w-full bg-background overflow-hidden animate-fade-in relative">

            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div
                className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside className={`w-64 flex-shrink-0 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col z-[70] transition-transform duration-300 fixed inset-y-0 left-0 lg:static lg:h-full lg:translate-x-0 rounded-none m-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                <div className="p-5 md:p-6 flex items-center justify-between gap-3 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="w-8 h-8" />
                        <span className="text-lg md:text-xl font-bold font-display text-gradient">{t('admin_panel')}</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 py-4 md:py-6 px-3 md:px-4 space-y-1.5 overflow-y-auto thin-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(45,212,191,0.1)]'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'}`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border/50 space-y-2 shrink-0 bg-card/50">
                    <button
                        onClick={handleToggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-sm font-medium"
                    >
                        <div className="flex items-center gap-3">
                            {isDarkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-orange-500" />}
                            <span>{isDarkMode ? t('dark_mode') : t('light_mode')}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-sm font-medium border border-transparent hover:border-border/50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('back_to_appfeed')}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">

                <div className="sticky top-0 z-30 flex h-14 md:h-16 shrink-0 w-full items-center justify-between px-4 md:px-6 lg:px-10 border-b bg-background/80 backdrop-blur-xl border-border/50">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold font-display text-foreground text-gradient">{t('dashboard_overview')}</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 lg:p-10 w-full">
                    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-4 md:space-y-6 w-full">
                        {activeTab === 'analytics' && <AdminAnalytics />}
                        {(activeTab === 'issues' || activeTab === 'users' || activeTab === 'inquiries' || activeTab === 'broadcast') && (
                            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl flex-1 flex flex-col min-h-[500px] md:min-h-[600px] overflow-hidden">
                                {activeTab === 'issues' && <AdminIssues />}
                                {activeTab === 'users' && <AdminUsers />}
                                {activeTab === 'inquiries' && <AdminInquiries />}
                                {activeTab === 'broadcast' && <AdminBroadcast />}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;