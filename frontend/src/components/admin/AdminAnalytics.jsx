import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, ShieldCheck, Clock, FileText, AlertTriangle, CheckSquare,
    X, Search, MapPin, ChevronRight, ChevronLeft, Shield, Briefcase,
    History, Zap, Camera, Download, Activity, Trophy, Medal, Star, Filter
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { cscApi } from '../../utils/cscAPI';

// --- HELPERS ---
const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&size=128&bold=true`;
const getCorsSafeUrl = (url) => {
    if (!url) return null;
    if (url.includes('ui-avatars.com')) return url;
    const baseUrl = axiosInstance.defaults.baseURL || '';
    return `${baseUrl}/proxy-image?url=${encodeURIComponent(url)}`;
};

const statusColors = {
    OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    RESOLVED: "bg-green-500/10 text-green-500 border-green-500/30",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/30",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
    DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    RELEASED: "bg-amber-500/10 text-amber-500 border-amber-500/30"
};

const generateTimeline = (issue) => {
    if (!issue) return [];
    const combined = [];
    combined.push({ type: 'create', label: 'Issue Reported', time: new Date(issue.createdAt), icon: <FileText size={14} />, color: 'text-blue-500 bg-blue-500/10' });

    if (issue.statusHistory) {
        issue.statusHistory.forEach(sh => {
            combined.push({ type: 'status', label: `Status changed to ${sh.status}`, time: new Date(sh.changedAt), detail: sh.remark, icon: <History size={14} />, color: 'text-yellow-500 bg-yellow-500/10' });
        });
    }
    if (issue.auditLog) {
        issue.auditLog.forEach(al => {
            combined.push({ type: 'audit', label: al.action.replace(/_/g, ' '), time: new Date(al.timestamp), detail: al.details, icon: <Shield size={14} />, color: 'text-indigo-500 bg-indigo-500/10' });
        });
    }
    return combined.sort((a, b) => b.time - a.time);
};

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'ROAD_&_POTHOLES', label: 'Road & Potholes' },
    { value: 'WATER_SUPPLY', label: 'Water Supply' },
    { value: 'ELECTRICITY', label: 'Electricity' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'SANITATION', label: 'Sanitation' },
    { value: 'GARBAGE', label: 'Garbage' },
    { value: 'DRAINAGE', label: 'Drainage' }
];

const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open' },
    { value: 'LOCKED', label: 'Assigned (Locked)' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected / Failed' },
    { value: 'ORPHANED', label: 'Orphaned' },
    { value: 'DISPUTED', label: 'Disputed' }
];

const AdminAnalytics = () => {
    // Portals mounting state
    const [isMounted, setIsMounted] = useState(false);

    // --- DATA STATES ---
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Bottom Table States
    const [issues, setIssues] = useState([]);
    const [issuesLoading, setIssuesLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ search: '', state: '', city: '', category: '', status: '' });

    // Mobile Filter State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Geo States
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);

    // --- MODAL STATES ---
    const [listModal, setListModal] = useState({ isOpen: false, title: '', type: 'USER', data: [], loading: false });
    const [careerModal, setCareerModal] = useState({ isOpen: false, profile: null, history: null, view: 'OVERVIEW', selectedCategory: '', issueList: [] });
    const [issueModal, setIssueModal] = useState({ isOpen: false, issue: null });
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        setIsMounted(true); // Ensures safe hydration for Portals
        fetchSummary();
        cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        fetchTableIssues();
    }, [page, filters]);

    useEffect(() => {
        if (!filters.state) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === filters.state);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [filters.state, statesList]);

    // Handle Scroll Locking
    useEffect(() => {
        if (listModal.isOpen || careerModal.isOpen || issueModal.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [listModal.isOpen, careerModal.isOpen, issueModal.isOpen]);

    // Auto-play video in issue modal
    useEffect(() => {
        const isVideo = issueModal.issue?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (issueModal.isOpen && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
        }
    }, [issueModal.isOpen, currentMediaIndex, issueModal.issue]);

    // --- FETCHERS ---
    const fetchSummary = async () => {
        setStatsLoading(true);
        try {
            const res = await axiosInstance.get('/admin/analytics/summary');
            setStats(res.data.data);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load analytics' });
        } finally {
            setStatsLoading(false);
        }
    };

    const closeIssueModal = () => {
        setIssueModal({ isOpen: false, issue: null });
        setCurrentMediaIndex(0);
    };

    const fetchTableIssues = async () => {
        setIssuesLoading(true);
        try {
            const res = await axiosInstance.get('/admin/issues', { params: { page, limit: 15, ...filters } });
            setIssues(res.data.data.issues);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load issues table' });
        } finally {
            setIssuesLoading(false);
        }
    };

    // --- CLICK HANDLERS ---
    const handleCardClick = async (title, type, fetchUrl, params = {}) => {
        setListModal({ isOpen: true, title, type, data: [], loading: true });
        try {
            const res = await axiosInstance.get(fetchUrl, { params: { limit: 100, ...params } });
            let records = [];
            if (Array.isArray(res.data.data)) records = res.data.data;
            else if (res.data.data?.users) records = res.data.data.users;
            else if (res.data.data?.issues) records = res.data.data.issues;

            setListModal(prev => ({ ...prev, data: records, loading: false }));
        } catch (error) {
            showToast({ icon: 'error', title: `Failed to load ${title}` });
            setListModal(prev => ({ ...prev, loading: false, isOpen: false }));
        }
    };

    const openCareerModal = async (userId) => {
        try {
            const res = await axiosInstance.get(`/admin/user/${userId}`);
            setCareerModal({
                isOpen: true,
                profile: res.data.data.user,
                history: res.data.data.history || {},
                view: 'OVERVIEW',
                selectedCategory: '',
                issueList: []
            });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load user profile' });
        }
    };

    const openIssueModal = async (issueId) => {
        try {
            const res = await axiosInstance.get(`/admin/issue/${issueId}`);
            setIssueModal({ isOpen: true, issue: res.data.data });
            setCurrentMediaIndex(0);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load issue details' });
        }
    };

    // --- UI HELPERS ---
    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    // 🟢 INITIAL FULL PAGE SHIMMER EFFECT
    if (statsLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8 flex flex-col min-h-full pb-10 w-full animate-pulse">
                <div className="flex flex-col gap-2 pt-2">
                    <div className="h-10 w-64 bg-muted rounded-lg"></div>
                    <div className="h-4 w-96 bg-muted/50 rounded"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-card/40 border border-border/50 h-[104px] flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className="h-3 w-24 bg-muted rounded"></div>
                                <div className="h-3 w-3 bg-muted rounded-full"></div>
                            </div>
                            <div className="h-8 w-16 bg-muted rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="w-full h-px bg-border/50 my-4 hidden md:block"></div>
                <div className="h-16 w-full bg-card/60 border border-border/60 rounded-2xl hidden md:block mt-4"></div>
                <div className="h-64 w-full bg-card/40 border border-border/60 rounded-2xl mt-4"></div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8 flex flex-col min-h-full pb-10">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm">
                        Command Center
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Click on metric cards to view lists, or use the table below to browse issues.</p>
                </div>
            </div>

            {/* --- TOP METRICS GRID --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-[45]">
                <MetricCard
                    icon={Users} title="Standard Users" count={stats?.totalUsers || 0} color="text-blue-500" bg="from-blue-500/20"
                    onClick={() => handleCardClick('Standard Citizens', 'USER', '/admin/users', { role: 'user' })}
                />
                <MetricCard
                    icon={ShieldCheck} title="Verified Officials" count={stats?.totalOfficials || 0} color="text-emerald-500" bg="from-emerald-500/20"
                    onClick={() => handleCardClick('Verified Officials', 'USER', '/admin/users', { role: 'official' })}
                />
                <MetricCard
                    icon={Briefcase} title="Verified NGOs" count={stats?.totalNGOs || 0} color="text-indigo-500" bg="from-indigo-500/20"
                    onClick={() => handleCardClick('Verified NGOs', 'USER', '/admin/users', { role: 'ngo' })}
                />
                <MetricCard
                    icon={Clock} title="Pending Requests" count={stats?.pendingRequests || 0} color="text-amber-500" bg="from-amber-500/20"
                    onClick={() => handleCardClick('Pending Verifications', 'USER', '/admin/pending-authorities')}
                />

                <MetricCard
                    icon={FileText} title="Total Issues" count={stats?.totalIssues || 0} color="text-purple-500" bg="from-purple-500/20"
                    onClick={() => handleCardClick('All Issues', 'ISSUE', '/admin/issues')}
                />
                <MetricCard
                    icon={AlertTriangle} title="Open Issues" count={stats?.issueStats?.OPEN || 0} color="text-yellow-500" bg="from-yellow-500/20"
                    onClick={() => handleCardClick('Open Issues', 'ISSUE', '/admin/issues', { status: 'OPEN' })}
                />
                <MetricCard
                    icon={CheckSquare} title="Resolved Issues" count={stats?.issueStats?.RESOLVED || 0} color="text-emerald-500" bg="from-emerald-500/20"
                    onClick={() => handleCardClick('Resolved Issues', 'ISSUE', '/admin/issues', { status: 'RESOLVED' })}
                />
                <MetricCard
                    icon={X} title="Rejected Issues" count={stats?.issueStats?.REJECTED || 0} color="text-red-500" bg="from-red-500/20"
                    onClick={() => handleCardClick('Rejected Issues', 'ISSUE', '/admin/issues', { status: 'REJECTED' })}
                />
            </div>

            {/* --- SEPARATOR --- */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-4 hidden md:block"></div>

            {/* --- BOTTOM ISSUES DATA TABLE --- */}
            <div className="flex flex-col gap-4">

                {/* Mobile & Desktop Browse Header with Funnel Button */}
                <div className="flex justify-between items-center mt-2 md:mt-0">
                    <h3 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                        <Search className="text-primary" size={20} /> Browse All Issues
                    </h3>
                    <button
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className={`md:hidden p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                    >
                        <Filter size={18} />
                    </button>
                </div>

                {/* Filters */}
                <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]`}>
                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search title, pincode, or ID..."
                                value={filters.search}
                                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                                className="w-full pl-11 pr-4 py-2.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3 flex-col sm:flex-row flex-wrap xl:flex-nowrap relative z-[70]">
                            <div className="w-full sm:w-36 relative z-[74]"><CustomSelect options={stateOptions} value={filters.state} onChange={v => { setFilters({ ...filters, state: v, city: '' }); setPage(1); }} /></div>
                            <div className="w-full sm:w-36 relative z-[73]"><CustomSelect options={districtOptions} value={filters.city} onChange={v => { setFilters({ ...filters, city: v }); setPage(1); }} /></div>
                            <div className="w-full sm:w-40 relative z-[72]"><CustomSelect options={CATEGORIES} value={filters.category} onChange={v => { setFilters({ ...filters, category: v }); setPage(1); }} /></div>
                            <div className="w-full sm:w-40 relative z-[71]"><CustomSelect options={STATUSES} value={filters.status} onChange={v => { setFilters({ ...filters, status: v }); setPage(1); }} /></div>
                        </div>
                    </div>
                </div>

                {/* 🟢 Mobile Card View Wrapper (Hidden on md+) */}
                <div className="md:hidden flex flex-col gap-3 relative z-[10]">
                    <AnimatePresence>
                        {issuesLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="bg-card/60 border border-border/60 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-muted rounded"></div>
                                            <div className="h-3 w-1/4 bg-muted/50 rounded"></div>
                                        </div>
                                        <div className="h-5 w-16 bg-muted rounded"></div>
                                    </div>
                                    <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                        <div className="space-y-2">
                                            <div className="h-3 w-24 bg-muted rounded"></div>
                                            <div className="h-2 w-16 bg-muted/50 rounded"></div>
                                        </div>
                                        <div className="h-4 w-12 bg-muted rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : issues.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                                <Search className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">No issues found matching your filters.</p>
                            </motion.div>
                        ) : (
                            issues.map((issue) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={issue._id}
                                    onClick={() => openIssueModal(issue._id)}
                                    className="bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                                                {issue.title}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">{issue.category}</p>
                                        </div>
                                        <span className={`shrink-0 text-[9px] border px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground flex items-center gap-1"><MapPin size={12} className="opacity-50" />{issue.location?.city || issue.location?.district || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">{issue.location?.state || 'Unknown'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="inline-flex items-center justify-end gap-1 text-xs font-black text-yellow-500">
                                                <Zap size={12} className="fill-yellow-500/20" /> {issue.impactScore || 0}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* 🟢 Desktop Table Wrapper (Hidden on mobile) */}
                <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col min-h-[400px] relative z-[10]">
                    <div className="overflow-x-auto thin-scrollbar flex-1 bg-background/20">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-muted/40 backdrop-blur-md border-b border-border/50 sticky top-0 z-10 shadow-sm">
                                <tr className="text-muted-foreground text-[11px] uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Issue Detail</th>
                                    <th className="py-4 px-6 font-bold">Location</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Impact Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                <AnimatePresence>
                                    {issuesLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse border-b border-border/30">
                                                <td className="py-4 px-6"><div className="h-4 w-48 bg-muted rounded mb-2"></div><div className="h-3 w-24 bg-muted/50 rounded"></div></td>
                                                <td className="py-4 px-6"><div className="h-4 w-32 bg-muted rounded mb-2"></div><div className="h-3 w-20 bg-muted/50 rounded"></div></td>
                                                <td className="py-4 px-6"><div className="h-6 w-20 bg-muted rounded-md"></div></td>
                                                <td className="py-4 px-6 flex justify-end"><div className="h-6 w-16 bg-muted rounded-lg"></div></td>
                                            </tr>
                                        ))
                                    ) : issues.length === 0 ? (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan="4" className="p-12 text-center text-sm font-medium text-muted-foreground">
                                                <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                                <p>No issues found matching your filters.</p>
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        issues.map((issue) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                key={issue._id}
                                                onClick={() => openIssueModal(issue._id)}
                                                className="hover:bg-primary/5 transition-all cursor-pointer group"
                                            >
                                                <td className="py-4 px-6">
                                                    <h5 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors max-w-sm truncate">{issue.title}</h5>
                                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{issue.category}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm font-semibold">{issue.location?.city || issue.location?.district || 'Unknown'}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{issue.location?.state || 'Unknown'}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-[10px] border px-2.5 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                        {issue.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="inline-flex items-center justify-end gap-1.5 text-sm font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                                        <Zap size={14} className="fill-yellow-500/20" /> {issue.impactScore || 0}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination (Visible for both desktop and mobile) */}
                {!issuesLoading && totalPages > 1 && (
                    <div className="p-4 border border-border/50 rounded-2xl md:rounded-b-2xl md:border-t-0 md:rounded-t-none bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground shadow-sm mt-4 md:mt-0">
                        <span className="tracking-widest uppercase">Page {page} of {totalPages}</span>
                        <div className="space-x-2 flex">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* PORTAL MODALS (Rendered outside the DOM hierarchy to escape Sidebar) */}
            {/* ========================================================= */}

            {isMounted && createPortal(
                <>
                    {/* 1. LIST MODAL */}
                    <AnimatePresence>
                        {listModal.isOpen && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setListModal({ ...listModal, isOpen: false })} />
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card/95 backdrop-blur-2xl w-full max-w-4xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] relative z-10">
                                    <div className="p-5 border-b border-border/50 flex justify-between items-center bg-background/50 shrink-0">
                                        <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                                            <ListIcon size={20} className="text-primary" /> {listModal.title}
                                        </h3>
                                        <button onClick={() => setListModal({ ...listModal, isOpen: false })} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"><X size={20} /></button>
                                    </div>
                                    <div className="overflow-y-auto thin-scrollbar flex-1 p-4 md:p-6 space-y-3 bg-background/30">
                                        {listModal.loading ? (
                                            [...Array(4)].map((_, i) => (
                                                <div key={i} className="bg-card border border-border/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                                                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                                                        <div className="w-12 h-12 rounded-full bg-muted shrink-0"></div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 w-3/4 sm:w-48 bg-muted rounded"></div>
                                                            <div className="h-3 w-1/2 sm:w-32 bg-muted/50 rounded"></div>
                                                        </div>
                                                    </div>
                                                    <div className="h-6 w-20 bg-muted rounded-lg shrink-0 self-end sm:self-auto"></div>
                                                </div>
                                            ))
                                        ) : listModal.data.length === 0 ? (
                                            <div className="text-center py-20 text-muted-foreground font-medium">No records found.</div>
                                        ) : (
                                            listModal.data.map((item, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                                    key={item._id}
                                                    onClick={() => {
                                                        if (listModal.type === 'USER') {
                                                            setListModal({ ...listModal, isOpen: false });
                                                            openCareerModal(item._id);
                                                        } else {
                                                            setListModal({ ...listModal, isOpen: false });
                                                            openIssueModal(item._id);
                                                        }
                                                    }}
                                                    className="bg-card border border-border/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm group"
                                                >
                                                    {listModal.type === 'USER' ? (
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <img src={getCorsSafeUrl(item.profilePic) || getAvatar(item.name)} alt="pfp" className="w-12 h-12 rounded-full border border-border/50 object-cover shrink-0" />
                                                            <div className="min-w-0">
                                                                <h5 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.name}</h5>
                                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.contact?.email || 'No Email'} • <span className="uppercase font-bold text-primary/80">{item.role}</span></p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <h5 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</h5>
                                                            <p className="text-xs text-muted-foreground truncate mt-1 uppercase tracking-wider">{item.category} • {item.location?.city}</p>
                                                        </div>
                                                    )}
                                                    <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
                                                        {listModal.type === 'ISSUE' && (
                                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest ${statusColors[item.status] || statusColors.OPEN}`}>{item.status}</span>
                                                        )}
                                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 2. CAREER PAGE MODAL */}
                    <AnimatePresence>
                        {careerModal.isOpen && careerModal.profile && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCareerModal({ ...careerModal, isOpen: false })} />

                                <motion.div
                                    initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="bg-card border border-border/50 rounded-3xl w-full max-w-5xl h-[90dvh] shadow-2xl flex flex-col relative z-10 overflow-hidden"
                                >
                                    {/* Modal Header */}
                                    <div className="p-4 md:p-5 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center gap-4 shrink-0">
                                        {careerModal.view === 'ISSUE_LIST' && (
                                            <button onClick={() => setCareerModal({ ...careerModal, view: 'OVERVIEW' })} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors shrink-0">
                                                <ChevronLeft size={20} />
                                            </button>
                                        )}
                                        <img src={getCorsSafeUrl(careerModal.profile.profilePic) || getAvatar(careerModal.profile.name)} alt="pfp" className="w-12 h-12 rounded-full border border-border/50 object-cover bg-muted shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-foreground truncate">{careerModal.profile.name}</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold mt-0.5 truncate">
                                                {['official', 'ngo'].includes(careerModal.profile.role) ? 'Verified Authority Profile' : 'Citizen Civic Profile'}
                                            </p>
                                        </div>
                                        <button onClick={() => setCareerModal({ ...careerModal, isOpen: false })} className="p-2 bg-muted border border-border/50 rounded-full hover:bg-muted/80 transition-colors shrink-0"><X size={20} /></button>
                                    </div>

                                    {/* View Router */}
                                    {careerModal.view === 'OVERVIEW' ? (
                                        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 bg-background/30">

                                            {/* Core Details Box */}
                                            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm mb-6">
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2"><Shield size={14} /> Profile Information</h4>
                                                {['official', 'ngo'].includes(careerModal.profile.role) && careerModal.profile.authorityProfile ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Designation</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.designation || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Department/Org</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.departmentName || careerModal.profile.authorityProfile.org || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Area</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.assignedDistrict || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${careerModal.profile.authorityProfile.verificationStatus === 'APPROVED' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'}`}>{careerModal.profile.authorityProfile.verificationStatus}</p></div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Rank</p><p className="font-bold text-sm text-foreground">{careerModal.profile.rank || 'Citizen'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Civil Score</p><p className="font-bold text-sm text-foreground flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> {careerModal.profile.civilScore || 10}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Badges Earned</p><p className="font-bold text-sm text-amber-500">{careerModal.profile.badges?.length || 0}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Account Status</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${careerModal.profile.accountStatus === 'ACTIVE' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>{careerModal.profile.accountStatus || 'ACTIVE'}</p></div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Clickable Platform History Metrics */}
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mb-4">Platform History (Click to View)</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                                                {['official', 'ngo'].includes(careerModal.profile.role) ? (
                                                    <>
                                                        <StatBox
                                                            icon={<Clock className="text-indigo-500" />} title="Jobs Active" count={careerModal.history?.ASSIGNED?.length || 0}
                                                            color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Active Jobs', issueList: careerModal.history?.ASSIGNED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<CheckSquare className="text-emerald-500" />} title="Jobs Completed" count={careerModal.history?.COMPLETED?.length || 0}
                                                            color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Completed Jobs', issueList: careerModal.history?.COMPLETED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<Briefcase className="text-amber-500" />} title="Jobs Released" count={careerModal.history?.RELEASED?.length || 0}
                                                            color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Released Jobs', issueList: careerModal.history?.RELEASED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<AlertTriangle className="text-rose-500" />} title="Jobs Failed" count={careerModal.history?.FAILED?.length || careerModal.profile.authorityProfile?.jobsFailed || 0}
                                                            color="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Failed Jobs', issueList: careerModal.history?.FAILED || [] })}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <StatBox
                                                            icon={<AlertTriangle className="text-amber-500" />} title="Issues Reported" count={careerModal.history?.REPORTED?.length || 0}
                                                            color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Reported Issues', issueList: careerModal.history?.REPORTED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<CheckSquare className="text-emerald-500" />} title="Verifications" count={careerModal.history?.CONFIRMED?.length || 0}
                                                            color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Confirmed Verifications', issueList: careerModal.history?.CONFIRMED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<Shield className="text-indigo-500" />} title="Flags Cast" count={careerModal.history?.FLAGGED?.length || 0}
                                                            color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10"
                                                            onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Flagged Issues', issueList: careerModal.history?.FLAGGED || [] })}
                                                        />
                                                        <StatBox
                                                            icon={<Zap className="text-yellow-500" />} title="Impact Score" count={careerModal.profile.civilScore || 10}
                                                            color="border-yellow-500/30 bg-yellow-500/5 cursor-default"
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            {/* Leaderboard Rankings History */}
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mb-4 mt-8">Leaderboard History</h4>
                                            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                                                {careerModal.history?.RANKINGS && careerModal.history.RANKINGS.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {careerModal.history.RANKINGS.map((rankEntry, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center shadow-sm shrink-0">
                                                                        {rankEntry.rank === 1 ? <Trophy size={18} className="text-yellow-500" /> :
                                                                            rankEntry.rank === 2 ? <Medal size={18} className="text-slate-300" /> :
                                                                                rankEntry.rank === 3 ? <Medal size={18} className="text-amber-600" /> :
                                                                                    <Star size={16} className="text-primary" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-foreground">Rank #{rankEntry.rank}</p>
                                                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{rankEntry.type || 'Weekly'} Leaderboard</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">{new Date(rankEntry.date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                                        <p className="text-sm font-medium text-muted-foreground">No leaderboard rankings achieved yet.</p>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    ) : (
                                        /* Issue List View inside Career Modal */
                                        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 bg-background/30">
                                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary mb-6 flex items-center gap-2">
                                                <ListIcon size={18} /> Showing {careerModal.selectedCategory} for {careerModal.profile.name}
                                            </div>

                                            <div className="space-y-3">
                                                {careerModal.issueList.length === 0 ? (
                                                    <div className="text-center py-20 text-muted-foreground font-medium">No records found.</div>
                                                ) : (
                                                    careerModal.issueList.map((issue, i) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                                            key={issue._id}
                                                            onClick={() => openIssueModal(issue._id)}
                                                            className="bg-card border border-border/50 p-4 rounded-xl flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm"
                                                        >
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <h5 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{issue.title}</h5>
                                                                <p className="text-[11px] text-muted-foreground mt-1 font-medium"><MapPin size={10} className="inline mr-1" /> {issue.location?.city || 'Unknown'}</p>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
                                                                <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${statusColors[issue.status] || statusColors.OPEN}`}>{issue.status}</span>
                                                                <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 3. ISSUE VIEWER MODAL (Deep Dive, opens ON TOP of everything else) */}
                    <AnimatePresence>
                        {issueModal.isOpen && issueModal.issue && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeIssueModal} />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden z-10"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[issueModal.issue.status] || statusColors.OPEN}`}>
                                                {issueModal.issue.status}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {issueModal.issue._id}</span>
                                        </div>
                                        <button onClick={closeIssueModal} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors"><X size={20} /></button>
                                    </div>

                                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">
                                        {/* Left Side: Media and Core Data */}
                                        <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/50">
                                            <h3 className="text-2xl font-black text-foreground leading-tight">{issueModal.issue.title}</h3>

                                            {/* Media Carousel */}
                                            <div className="w-full bg-black/40 rounded-2xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[250px] sm:h-[350px] shrink-0 group shadow-inner">
                                                {issueModal.issue.media && issueModal.issue.media.length > 0 ? (
                                                    <>
                                                        {issueModal.issue.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                            <video ref={videoRef} src={issueModal.issue.media[currentMediaIndex].url} className="w-full h-full object-contain bg-black" controls playsInline />
                                                        ) : (
                                                            <img src={issueModal.issue.media[currentMediaIndex].url} alt="issue" className="w-full h-full object-contain" />
                                                        )}
                                                        {issueModal.issue.media.length > 1 && (
                                                            <>
                                                                <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + issueModal.issue.media.length) % issueModal.issue.media.length)} className="absolute left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                                                                <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % issueModal.issue.media.length)} className="absolute right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-40"><Camera size={36} className="mb-3" /><p className="text-sm font-bold">No Media Attached</p></div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12} /> Location</p>
                                                    <p className="text-sm font-bold text-foreground">{issueModal.issue.location?.city}, {issueModal.issue.location?.state}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{issueModal.issue.location?.address} • PIN: {issueModal.issue.location?.pinCode}</p>
                                                </div>
                                                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                                    <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {issueModal.issue.impactScore || 0}</p>
                                                </div>
                                            </div>

                                            <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{issueModal.issue.description}</p>
                                            </div>
                                        </div>

                                        {/* Right Side: The Players & Timeline */}
                                        <div className="w-full lg:w-1/2 flex flex-col bg-card/40 shrink-0 lg:shrink relative">
                                            <div className="p-4 md:p-6 border-b border-border/50 shrink-0 bg-background/50">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Reported By</p>
                                                        <p className="text-sm font-bold truncate text-foreground">{issueModal.issue.isAnonymous ? 'Anonymous Citizen' : issueModal.issue.reportedBy?.name || 'Unknown'}</p>
                                                    </div>
                                                    <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl shadow-sm">
                                                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">Assigned Official</p>
                                                        {issueModal.issue.bidding?.winningBid?.authorityId ? (
                                                            <div>
                                                                <p className="text-sm font-black text-indigo-500 truncate">{issueModal.issue.bidding.winningBid.authorityId.name || 'ID Linked'}</p>
                                                                <p className="text-[10px] text-indigo-500/80 font-bold mt-0.5">Committed Time: {issueModal.issue.bidding.winningBid.commitmentTimeHours} hrs</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-bold text-muted-foreground mt-1">Pending Auction</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="flex-1 p-4 md:p-6 lg:overflow-y-auto thin-scrollbar relative">
                                                <h4 className="text-xs font-black uppercase text-muted-foreground mb-6 tracking-widest pl-2 border-l-2 border-primary">Audit Log & Timeline</h4>
                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/50 before:to-transparent pb-4">
                                                    {generateTimeline(issueModal.issue).map((event, i) => (
                                                        <div key={i} className="relative flex items-start gap-4">
                                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-md ${event.color} z-10`}>
                                                                {event.icon}
                                                            </div>
                                                            <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1">
                                                                <h5 className="font-black text-[11px] md:text-xs uppercase tracking-wider">{event.label}</h5>
                                                                <div className="text-[10px] font-bold text-muted-foreground font-mono mt-1 mb-2">{event.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                {event.detail && <p className="text-[11px] text-foreground/80 bg-muted/40 border border-border/40 p-2.5 rounded-xl leading-relaxed">{event.detail}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                </>,
                document.body
            )}
        </motion.div>
    );
};

// --- SUB-COMPONENTS ---
const MetricCard = ({ icon: Icon, title, count, color, bg, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="relative overflow-hidden text-left p-4 sm:p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg group"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${bg} to-transparent opacity-20 group-hover:opacity-40 transition-opacity`} />
        <div className="relative z-10 flex flex-col h-full justify-between gap-3">
            <div className="flex items-center justify-between min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 truncate">
                    <Icon size={14} className={`shrink-0 ${color}`} /> <span className="truncate">{title}</span>
                </p>
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${color}`}><Search size={14} /></div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground drop-shadow-sm truncate">{count}</h3>
        </div>
    </motion.button>
);

const StatBox = ({ icon, title, count, color, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 border rounded-2xl flex flex-col items-start gap-3 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default'} ${color}`}
    >
        <div className="p-2 bg-background/80 rounded-xl shadow-inner border border-border/50 shrink-0">{icon}</div>
        <div className="text-left w-full min-w-0">
            <h4 className="text-2xl font-black text-foreground truncate">{count}</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 truncate">{title}</p>
        </div>
    </div>
);

const ListIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export default AdminAnalytics;