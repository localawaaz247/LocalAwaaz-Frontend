import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileSignature, ArrowLeftRight, Menu, X } from 'lucide-react';
import AuthorityAnalytics from '../components/authority/AuthorityAnalytics';
import AuthorityRadar from '../components/authority/AuthorityRadar';
import AuthorityActiveJobs from '../components/authority/AuthorityActiveJobs';
import { motion, AnimatePresence } from 'framer-motion';

const AuthorityDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hard redirect if a standard citizen tries to access this route
    useEffect(() => {
        if (user && !['official', 'ngo', 'other'].includes(user.role)) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const navItems = [
        { id: 'analytics', label: 'Local Analytics', icon: LayoutDashboard },
        { id: 'radar', label: 'Issue Radar', icon: Briefcase },
        { id: 'myjobs', label: 'Active Jobs', icon: FileSignature },
    ];

    if (!user) return null;

    return (
        <div className="h-screen w-full bg-background text-foreground flex flex-col md:flex-row overflow-hidden relative selection:bg-primary/30 font-sans">

            {/* ========================================= */}
            {/* 🟢 MOBILE HEADER (Menu Button on Left)    */}
            {/* ========================================= */}
            <div className="md:hidden flex items-center p-4 border-b border-border/50 bg-card/60 backdrop-blur-2xl z-40 sticky top-0 shadow-sm">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 mr-3 bg-transparent hover:bg-muted/50 rounded-xl transition-colors text-foreground"
                >
                    {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
                <div className="flex items-center gap-2">
                    <CustomAuthorityAdminIcon className="w-7 h-7" />
                    <span className="font-black text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Authority Space
                    </span>
                </div>
            </div>

            {/* ========================================= */}
            {/* 🟢 MOBILE BACKDROP OVERLAY                */}
            {/* ========================================= */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ========================================= */}
            {/* 🟢 GLOSSY SIDEBAR                         */}
            {/* ========================================= */}
            <div
                className={`fixed md:relative top-0 left-0 h-full w-72 md:w-64 bg-card/60 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl md:shadow-none z-50 transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Profile Header */}
                <div className="p-6 md:p-7 flex items-center gap-4 border-b border-border/50 shrink-0 bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <CustomAuthorityAdminIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-black text-lg leading-tight text-foreground truncate">Authority Space</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
                            {user.authorityProfile?.assignedDistrict || 'Local Officer'}
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto thin-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold group z-10 
                                    ${isActive ? 'text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                            >
                                {/* Animated Sliding Background */}
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActiveTab"
                                        className="absolute inset-0 bg-primary rounded-2xl shadow-[0_0_15px_rgba(var(--primary),0.3)] -z-10"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <Icon size={20} className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors"} />
                                <span className="tracking-wide">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Switch Button */}
                <div className="p-4 border-t border-border/50 shrink-0 bg-background/30 backdrop-blur-md">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black text-muted-foreground bg-card border border-border/50 hover:bg-muted hover:text-foreground transition-all shadow-sm group hover:border-primary/30"
                    >
                        <ArrowLeftRight size={18} className="group-hover:text-primary transition-colors" /> Switch to Citizen
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* 🟢 MAIN CONTENT AREA                      */}
            {/* ========================================= */}
            <main className="flex-1 h-[calc(100vh-73px)] md:h-screen overflow-y-auto thin-scrollbar bg-background/50 relative">
                {/* Global Ambient Glow */}
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto h-full flex flex-col relative z-10 p-4 sm:p-6 lg:p-8">
                    {/* Animated Tab Rendering */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-full flex flex-col"
                        >
                            {activeTab === 'analytics' && <AuthorityAnalytics />}
                            {activeTab === 'radar' && <AuthorityRadar />}
                            {activeTab === 'myjobs' && <AuthorityActiveJobs />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// 🟢 Custom SVG Wrapper for Authority Space Logo
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

export default AuthorityDashboard;