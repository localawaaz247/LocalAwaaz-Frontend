import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, MapPin, Search, Clock, CheckCircle,
    XCircle, ShieldCheck, Mail, ChevronRight, Filter
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import AuthorityDetailModal from '../modals/AuthorityDetailModal';

const AdminVerification = () => {
    // Portal hydration state
    const [isMounted, setIsMounted] = useState(false);

    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED'
    const [search, setSearch] = useState('');

    // Mobile Filter State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const [selectedAuthority, setSelectedAuthority] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        fetchAuthorities();
    }, [activeTab]);

    const fetchAuthorities = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/authorities', {
                params: { status: activeTab }
            });
            setAuthorities(res.data.data);
        } catch (error) {
            console.error("Failed to fetch authorities:", error);
            showToast({ icon: 'error', title: 'Failed to load verification queue' });
        } finally {
            setLoading(false);
        }
    };

    const handleActionComplete = () => {
        fetchAuthorities();
    };

    const openModal = (auth) => {
        setSelectedAuthority(auth);
        setIsModalOpen(true);
    };

    const filteredAuthorities = authorities.filter(auth => {
        const orgName = auth.authorityProfile?.departmentName?.toLowerCase() || '';
        const email = auth.contact?.email?.toLowerCase() || '';
        const searchLower = search.toLowerCase();
        return orgName.includes(searchLower) || email.includes(searchLower);
    });

    // Configuration for tabs
    const TABS = [
        { id: 'PENDING', label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'from-amber-500/20', activeBg: 'bg-amber-500/10 border-amber-500/30' },
        { id: 'APPROVED', label: 'Approved', icon: CheckCircle, color: 'text-emerald-500', bg: 'from-emerald-500/20', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
        { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-rose-500', bg: 'from-rose-500/20', activeBg: 'bg-rose-500/10 border-rose-500/30' }
    ];

    // Status visual mapping
    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
            case 'APPROVED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
            case 'REJECTED': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
            default: return 'text-muted-foreground bg-muted border-border/50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 md:space-y-8 flex flex-col min-h-full pb-10 relative"
        >
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <ShieldCheck className="text-primary w-8 h-8" /> Authority Gatekeeper
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Review, verify, and manage official and NGO accounts on the platform.
                    </p>
                </div>
            </div>

            {/* Mobile Filter Toggle Header */}
            <div className="flex md:hidden justify-between items-center mt-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Search className="text-primary" size={20} /> Search Profiles
                </h3>
                <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* --- FILTER & TABS BAR --- */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]">
                <div className="flex flex-col xl:flex-row gap-4">
                    {/* Search Input (Hidden on mobile unless toggled) */}
                    <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block relative flex-1 group`}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by organization or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                        />
                    </div>

                    {/* Tabs (Always visible, responsive scroll) */}
                    <div className="flex gap-2 w-full xl:w-auto overflow-x-auto thin-scrollbar shrink-0">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    title={tab.label}
                                    className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 text-sm font-bold rounded-xl transition-all border shadow-sm ${isActive
                                        ? `${tab.activeBg} ${tab.color}`
                                        : 'bg-background/50 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? tab.color : 'opacity-70'}`} />
                                    <span className="hidden sm:inline tracking-wider uppercase text-[11px] sm:text-xs">{tab.label}</span>
                                    {isActive && !loading && (
                                        <span className={`ml-1 sm:ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-background border ${isActive ? tab.color.replace('text-', 'border-') : ''}`}>
                                            {filteredAuthorities.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MAIN GRID AREA --- */}
            <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col relative z-[10] p-4 md:p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex h-full items-center justify-center p-12">
                        <MiniLoader />
                    </div>
                ) : filteredAuthorities.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground"
                    >
                        <ShieldCheck className="w-12 h-12 opacity-20 mx-auto mb-3" />
                        <p className="text-sm font-medium">
                            No {activeTab.toLowerCase()} requests found matching your filters.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        <AnimatePresence>
                            {filteredAuthorities.map((auth, index) => {
                                const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];

                                return (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.03 }}
                                        key={auth._id}
                                        onClick={() => openModal(auth)}
                                        className="relative overflow-hidden text-left p-4 sm:p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg group flex flex-col h-full"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${activeTabData.bg} to-transparent opacity-0 group-hover:opacity-30 transition-opacity`} />

                                        <div className="relative z-10 flex flex-col h-full gap-4">
                                            {/* Top Row: Icon & Status */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="p-2.5 bg-background/80 rounded-xl shadow-inner border border-border/50 shrink-0 group-hover:border-primary/30 transition-colors">
                                                    <Building2 className={`w-5 h-5 ${activeTabData.color}`} />
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${getStatusStyles(auth.authorityProfile?.verificationStatus)}`}>
                                                    {auth.authorityProfile?.verificationStatus}
                                                </span>
                                            </div>

                                            {/* Core Data */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-black text-foreground drop-shadow-sm truncate group-hover:text-primary transition-colors">
                                                    {auth.authorityProfile?.departmentName || 'Unknown Organization'}
                                                </h4>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                    {auth.role} Account
                                                </p>
                                            </div>

                                            {/* Bottom Info & Action Hint */}
                                            <div className="pt-3 border-t border-border/50 mt-auto flex items-end justify-between">
                                                <div className="space-y-1.5 min-w-0 pr-2">
                                                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                                        <MapPin size={12} className="shrink-0" />
                                                        <span className="truncate">{auth.authorityProfile?.assignedDistrict || 'N/A'}, {auth.authorityProfile?.assignedState || 'N/A'}</span>
                                                    </p>
                                                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                                        <Mail size={12} className="shrink-0" />
                                                        <span className="truncate">{auth.contact?.email}</span>
                                                    </p>
                                                </div>

                                                <div className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${activeTabData.color}`}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* --- PORTAL MODAL --- */}
            {isMounted && createPortal(
                <div style={{ zIndex: 9999, position: 'relative' }}>
                    <AuthorityDetailModal
                        authority={selectedAuthority}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onActionComplete={handleActionComplete}
                    />
                </div>,
                document.body
            )}
        </motion.div>
    );
};

export default AdminVerification;