import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    Target, CheckSquare, AlertTriangle, AlertCircle, Search,
    MapPin, Zap, Download, X, List, Eye, Briefcase, Clock,
    Star, ChevronLeft, ChevronRight, FileText, History, Shield,
    TrendingUp, TrendingDown, Activity, Info, Filter
} from 'lucide-react';
import CustomSelect from '../CustomSelect';
import MiniLoader from '../MiniLoader';
import { cscApi } from '../../utils/cscAPI';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../utils/socket';

// Helper for Relative Time
const timeAgo = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const AuthorityAnalytics = () => {
    const { user } = useSelector((state) => state.auth);

    const [stats, setStats] = useState(null);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters for the table
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ status: '', category: '', search: '', state: '', city: '', highImpact: false });
    
    // Mobile Filter State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Geographic Data
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);

    // Modals
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef(null);

    const [fetchingIssueId, setFetchingIssueId] = useState(null);

    const [metricModal, setMetricModal] = useState({ isOpen: false, type: '', title: '', issues: [], loading: false });
    const [csiModal, setCsiModal] = useState({ isOpen: false, loading: false, history: [] });

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
        { value: 'PENDING', label: 'Pending (In Review)' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected / Failed' },
        { value: 'RELEASED', label: 'Released' }
    ];

    useEffect(() => {
        cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!filters.state) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === filters.state);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [filters.state, statesList]);

    useEffect(() => {
        fetchData();
    }, [page, filters]);

    // Modal Video Autoplay
    useEffect(() => {
        const isVideo = selectedIssue?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (isModalVisible && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [isModalVisible, currentMediaIndex, selectedIssue]);

    // Lock Body Scroll
    useEffect(() => {
        if (isModalVisible || metricModal.isOpen || csiModal.isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalVisible, metricModal.isOpen, csiModal.isOpen]);

    // 🟢 Real-Time Synchronization Listener
    useEffect(() => {
        if (socket) {
            const handleRealTimeUpdate = (notification) => {
                const relevantTypes = ['UPDATE', 'URGENT', 'CRITICAL', 'SYSTEM_BROADCAST', 'REWARD'];

                if (relevantTypes.includes(notification.type)) {
                    console.log("Real-time event received! Refreshing analytics data...");
                    fetchData();

                    if (csiModal.isOpen) {
                        fetchCsiHistory();
                    }
                }
            };

            socket.on('receive_notification', handleRealTimeUpdate);

            return () => {
                socket.off('receive_notification', handleRealTimeUpdate);
            };
        }
    }, [socket, csiModal.isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, issuesRes] = await Promise.all([
                axiosInstance.get('/authority/analytics/summary'),
                axiosInstance.get('/authority/issues', { params: { page, ...filters } })
            ]);
            setStats(statsRes.data.data);
            setIssues(issuesRes.data.data.issues);
            setTotalPages(issuesRes.data.data.pagination.totalPages);
        } catch (error) {
            console.error("Failed to load authority data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            showToast({ icon: 'loading', title: 'Generating Excel...' });
            const res = await axiosInstance.get('/authority/export', { params: filters, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Authority_Issues_Export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast({ icon: 'success', title: 'Export Complete!' });
        } catch (error) {
            showToast({ icon: 'error', title: 'Export failed' });
        }
    };

    const fetchCsiHistory = async () => {
        setCsiModal({ isOpen: true, loading: true, history: [] });
        try {
            const [completedRes, failedRes] = await Promise.all([
                axiosInstance.get('/authority/issues', { params: { metricType: 'COMPLETED', limit: 50 } }),
                axiosInstance.get('/authority/issues', { params: { metricType: 'FAILED', limit: 50 } })
            ]);

            const completed = completedRes.data.data.issues.map(i => ({ ...i, type: 'EARNED', points: i.impactScore || 50 }));
            const failed = failedRes.data.data.issues.map(i => {
                const isGhost = i.auditLog?.some(log => log.action === 'GHOST_ABANDONMENT' && log.performedBy === user._id);
                return { ...i, type: 'DEDUCTED', points: isGhost ? -100 : -50 };
            });

            const ledger = [...completed, ...failed].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            setCsiModal(prev => ({ ...prev, loading: false, history: ledger }));
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load CSI history' });
            setCsiModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleMetricClick = async (type, title) => {
        if (type === 'CSI') {
            fetchCsiHistory();
            return;
        }
        setMetricModal({ isOpen: true, type, title, issues: [], loading: true });
        try {
            const res = await axiosInstance.get('/authority/issues', { params: { metricType: type, limit: 100 } });
            setMetricModal(prev => ({ ...prev, issues: res.data.data.issues, loading: false }));
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load list' });
            setMetricModal(prev => ({ ...prev, loading: false }));
        }
    };

    const openModal = async (issueId) => {
        try {
            setFetchingIssueId(issueId);
            const res = await axiosInstance.get(`/issue/${issueId}`);
            setSelectedIssue(res.data.data?.issue || res.data.data);
            setCurrentMediaIndex(0);
            setIsModalVisible(true);
        } catch (e) {
            showToast({ icon: 'error', title: 'Failed to load issue details' });
        } finally {
            setFetchingIssueId(null);
        }
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedIssue(null), 300);
    };

    const visibleIssues = issues.filter(issue => {
        if (!issue.auditLog) return true;
        const hasBannedAction = issue.auditLog.some(log =>
            ['RADAR_REJECT', 'GHOST_ABANDONMENT', 'HANDOVER_SUBMITTED', 'JOB_RELEASED'].includes(log.action) &&
            log.performedBy === user?._id
        );
        return !hasBannedAction;
    });

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    const statusColors = {
        OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-500 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
        DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/20"
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

    const metricsData = [
        { id: 'CSI', title: 'CSI Score', value: stats?.csiScore || 0, icon: Target, color: 'text-primary', bgGlow: 'from-primary/20', borderColor: 'border-primary/30', description: 'Your Civil Score Index. Increases upon resolving issues, drops heavily for missed deadlines or ghosting.' },
        { id: 'COMPLETED', title: 'Jobs Finished', value: stats?.jobsCompleted || 0, icon: CheckSquare, color: 'text-emerald-500', bgGlow: 'from-emerald-500/20', borderColor: 'border-emerald-500/30', description: 'Issues you have successfully resolved and submitted to Escrow for verification.' },
        { id: 'RELEASED', title: 'Jobs Released', value: stats?.jobsReleased || 0, icon: Briefcase, color: 'text-amber-500', bgGlow: 'from-amber-500/20', borderColor: 'border-amber-500/30', description: 'Jobs you voluntarily unassigned yourself from before the deadline expired.' },
        { id: 'PENDING', title: 'Jobs Active', value: stats?.jobsPending || 0, icon: Clock, color: 'text-indigo-500', bgGlow: 'from-indigo-500/20', borderColor: 'border-indigo-500/30', description: 'Issues currently locked to you. Be sure to resolve them or request extensions before time runs out!' },
        { id: 'FAILED', title: 'Jobs Failed', value: stats?.jobsFailed || 0, icon: AlertTriangle, color: 'text-rose-500', bgGlow: 'from-rose-500/20', borderColor: 'border-rose-500/30', description: 'Issues where you failed to meet the deadline or completely abandoned the job (Ghost Protocol).' },
        { id: 'OPEN_LOCAL', title: 'Open Issues', value: stats?.openLocalIssues || 0, icon: AlertCircle, color: 'text-cyan-500', bgGlow: 'from-cyan-500/20', borderColor: 'border-cyan-500/30', description: 'Unassigned issues in your assigned district currently waiting for bids on the Radar.' },
    ];

    if (loading && !stats) {
        return <div className="flex h-[80vh] items-center justify-center"><MiniLoader /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex flex-col min-h-full h-auto md:h-full relative"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm">
                        Jurisdiction Analytics
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Monitor performance, CSI history, and active issues.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                    <Download size={18} /> Export Data
                </motion.button>
            </div>

            {/* 🟢 Glossy Metric Cards with Hover Tooltips & Mobile Responsive Text */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0 relative z-[50]">
                {metricsData.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group z-10 hover:z-[60]"
                        >
                            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[220px] p-3 rounded-xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none hidden md:block">
                                <p className="text-[11px] text-muted-foreground leading-relaxed text-center font-medium">
                                    {metric.description}
                                </p>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card/95 border-b border-r border-border/60 rotate-45" />
                            </div>

                            <button
                                onClick={() => handleMetricClick(metric.id, metric.title)}
                                className={`w-full relative overflow-hidden text-left p-4 sm:p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:${metric.borderColor}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGlow} to-transparent opacity-20 group-hover:opacity-40 transition-opacity`} />
                                <div className="absolute -inset-1 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-sm pointer-events-none" />

                                <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                                    <div className="flex items-center justify-between min-w-0">
                                        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 truncate">
                                            <Icon size={14} className={`shrink-0 ${metric.color}`} /> 
                                            <span className="truncate">{metric.title}</span>
                                        </p>
                                        <div className="md:hidden opacity-50 shrink-0"><Info size={12} className={metric.color} /></div>
                                        <div className="hidden md:block shrink-0">
                                            {metric.id === 'CSI' ? (
                                                <Activity size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${metric.color}`} />
                                            ) : (
                                                <List size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${metric.color}`} />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-foreground drop-shadow-sm truncate">{metric.value}</h3>
                                </div>
                            </button>
                        </motion.div>
                    )
                })}
            </div>

            {/* Mobile Issue Browse Header + Funnel Button */}
            <div className="flex md:hidden justify-between items-center mt-6">
                <div className="flex items-center gap-2">
                    <Search className="text-primary" size={20} />
                    <h3 className="text-lg font-bold text-foreground">Browse All Issues</h3>
                </div>
                <button 
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filters */}
            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40] transition-all`}>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search title, pincode, ID..."
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

                <div className="mt-4 flex items-center gap-3 w-max cursor-pointer select-none" onClick={() => { setFilters(prev => ({ ...prev, highImpact: !prev.highImpact })); setPage(1); }}>
                    <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${filters.highImpact ? 'bg-yellow-500' : 'bg-muted/80 border border-border/50'}`}>
                        <motion.div
                            layout
                            animate={{ x: filters.highImpact ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="bg-white w-4 h-4 rounded-full shadow-md"
                        />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${filters.highImpact ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        High Impact Score Only
                    </span>
                </div>
            </div>

            {/* 🟢 Mobile Card View Wrapper (Hidden on md+) */}
            <div className="md:hidden flex flex-col gap-3 relative z-[10] mb-6">
                <AnimatePresence>
                    {visibleIssues.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                            <Search className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">No issues found matching your filters.</p>
                        </motion.div>
                    ) : (
                        visibleIssues.map((issue) => {
                            const isMyJob = issue.bidding?.winningBid?.authorityId === user?._id;
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={issue._id}
                                    onClick={() => openModal(issue._id)}
                                    className="bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                                                {fetchingIssueId === issue._id ? 'Loading...' : issue.title}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">{issue.category}</p>
                                        </div>
                                        <span className={`shrink-0 text-[9px] border px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                            {issue.status}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground flex items-center gap-1"><MapPin size={12} className="opacity-50"/>{issue.location?.city || issue.location?.district}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">{issue.location?.state}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {isMyJob && (
                                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px] font-black uppercase tracking-widest">
                                                    <Star size={8} className="fill-yellow-500" /> My Job
                                                </span>
                                            )}
                                            <span className="inline-flex items-center justify-end gap-1 text-xs font-black text-yellow-500">
                                                <Zap size={12} className="fill-yellow-500/20" /> {issue.impactScore || 0}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* 🟢 Desktop Table Wrapper (Hidden on mobile) */}
            <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col min-h-[400px] relative z-[10] mb-0">                
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
                                {visibleIssues.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan="4" className="p-12 text-center text-sm font-medium text-muted-foreground">
                                            <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                            <p>No issues found matching your filters.</p>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    visibleIssues.map((issue) => {
                                        const isMyJob = issue.bidding?.winningBid?.authorityId === user?._id;
                                        return (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                key={issue._id}
                                                onClick={() => openModal(issue._id)}
                                                className="hover:bg-primary/5 transition-all cursor-pointer group"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                            {fetchingIssueId === issue._id ? 'Loading Details...' : issue.title}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{issue.category}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm font-semibold">{issue.location?.city || issue.location?.district}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{issue.location?.state}</p>
                                                </td>
                                                <td className="py-4 px-6 flex items-center gap-2">
                                                    <span className={`text-[10px] border px-2.5 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                        {issue.status}
                                                    </span>
                                                    {isMyJob && (
                                                        <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                                            <Star size={10} className="fill-yellow-500" /> My Job
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="inline-flex items-center justify-end gap-1.5 text-sm font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                                        <Zap size={14} className="fill-yellow-500/20" /> {issue.impactScore || 0}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination (Visible for both desktop and mobile) */}
            {!loading && totalPages > 1 && (
                <div className="p-4 border border-border/50 rounded-2xl md:rounded-b-2xl md:border-t-0 md:rounded-t-none bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground shadow-sm">
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

            {/* ... Modals remaining identically exactly as original ... */}
            
            {/* 🟢 1. CSI SCORE HISTORY MODAL */}
            <AnimatePresence>
                {csiModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setCsiModal({ ...csiModal, isOpen: false })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85dvh] relative z-10"
                        >
                            <div className="p-5 md:p-6 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black flex items-center gap-3 text-foreground">
                                        <Target className="text-primary w-6 h-6" /> CSI Score Ledger
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">All-time record of your points earned and deducted.</p>
                                </div>
                                <button onClick={() => setCsiModal({ ...csiModal, isOpen: false })} className="text-muted-foreground p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <div className="overflow-y-auto thin-scrollbar flex-1 p-4 md:p-6 space-y-4 bg-background/30">
                                {csiModal.loading ? (
                                    <div className="flex justify-center py-20"><MiniLoader /></div>
                                ) : csiModal.history.length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="font-medium">No CSI history recorded yet.</p>
                                    </div>
                                ) : (
                                    csiModal.history.map((record, index) => {
                                        const isEarned = record.type === 'EARNED';
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                                key={record._id + index}
                                                className={`bg-card border p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 shadow-sm relative overflow-hidden ${isEarned ? 'border-green-500/20' : 'border-red-500/20'}`}
                                            >
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isEarned ? 'bg-green-500' : 'bg-red-500'}`} />

                                                <div className="overflow-hidden w-full sm:flex-1 pl-2">
                                                    <p className="text-base font-bold text-foreground truncate">{record.title}</p>
                                                    <p className="text-xs font-medium text-muted-foreground mt-1">{new Date(record.updatedAt).toLocaleString()}</p>
                                                    <p className="text-[10px] uppercase tracking-wider mt-2 font-bold text-muted-foreground">
                                                        Reason: {isEarned ? 'Successfully Resolved & Verified' : (record.points === -100 ? 'Ghost Abandonment Protocol' : 'Missed Deadline Handover')}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-end shrink-0">
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-lg ${isEarned ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                                        {isEarned ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                        {isEarned ? '+' : ''}{record.points}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🟢 METRIC LIST MODAL */}
            <AnimatePresence>
                {metricModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMetricModal({ ...metricModal, isOpen: false })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85dvh] relative z-10"
                        >
                            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-xl font-black tracking-wide flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 text-primary"><List size={20} /></div>
                                    {metricModal.title}
                                </h3>
                                <button onClick={() => setMetricModal({ isOpen: false, type: '', title: '', issues: [], loading: false })} className="text-muted-foreground p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <div className="overflow-y-auto thin-scrollbar flex-1 p-4 md:p-6 space-y-3 bg-background/30">
                                {metricModal.loading ? (
                                    <div className="flex justify-center py-20"><MiniLoader /></div>
                                ) : metricModal.issues.length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="font-medium">No issues found for this metric.</p>
                                    </div>
                                ) : (
                                    metricModal.issues.map((issue, index) => {
                                        const isMyJob = issue.bidding?.winningBid?.authorityId === user?._id;
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                                                key={issue._id}
                                                onClick={() => { setMetricModal({ ...metricModal, isOpen: false }); openModal(issue._id); }}
                                                className="bg-card border border-border/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm group"
                                            >
                                                <div className="overflow-hidden w-full sm:flex-1 pr-0 sm:pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{issue.title}</p>
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground truncate">{issue.location?.city} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest ${statusColors[issue.status] || statusColors.OPEN}`}>{issue.status}</span>
                                                        {isMyJob && <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Star size={10} className="fill-yellow-500" /> My Job</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🟢 2. ADMIN-STYLE SPLIT SCREEN DETAIL MODAL */}
            <AnimatePresence>
                {isModalVisible && selectedIssue && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] my-4 overflow-hidden z-10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                        {selectedIssue.status}
                                    </span>
                                    <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {selectedIssue._id}</span>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors"><X size={20} /></button>
                            </div>

                            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">
                                {/* LEFT COLUMN: Media & Core Data */}
                                <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/50">
                                    <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{selectedIssue.title}</h3>

                                    <div className="w-full bg-black/40 rounded-2xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[250px] sm:h-[350px] shrink-0 group shadow-inner">
                                        {selectedIssue.media && selectedIssue.media.length > 0 ? (
                                            <>
                                                {selectedIssue.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video ref={videoRef} src={selectedIssue.media[currentMediaIndex].url} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                                                ) : (
                                                    <img src={selectedIssue.media[currentMediaIndex].url} alt="issue" className="w-full h-full object-contain" />
                                                )}
                                                {selectedIssue.media.length > 1 && (
                                                    <>
                                                        <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + selectedIssue.media.length) % selectedIssue.media.length)} className="absolute left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                                                        <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % selectedIssue.media.length)} className="absolute right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center opacity-40"><AlertTriangle size={36} className="mb-3" /><p className="text-sm font-bold">No Media Attached</p></div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12} /> Location</p>
                                            <p className="text-sm font-bold text-foreground">{selectedIssue.location?.city}, {selectedIssue.location?.state}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1 truncate">{selectedIssue.location?.address} • PIN: {selectedIssue.location?.pinCode}</p>
                                        </div>
                                        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                            <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {selectedIssue.impactScore || 0}</p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{selectedIssue.description}</p>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: The Players & Timeline */}
                                <div className="w-full lg:w-1/2 flex flex-col bg-card/40 shrink-0 lg:shrink relative">
                                    <div className="p-4 md:p-6 border-b border-border/50 shrink-0 bg-background/50">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Reported By</p>
                                                <p className="text-sm font-bold truncate text-foreground">{selectedIssue.isAnonymous ? 'Anonymous Citizen' : selectedIssue.reportedBy?.name || 'Unknown'}</p>
                                            </div>
                                            <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl shadow-sm">
                                                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">Assigned Official</p>
                                                {selectedIssue.bidding?.winningBid?.authorityId ? (
                                                    <div>
                                                        <p className="text-sm font-black text-indigo-500 truncate">{selectedIssue.bidding.winningBid.authorityId.name || 'ID Linked'}</p>
                                                        <p className="text-[10px] text-indigo-500/80 font-bold mt-0.5">Committed Time: {selectedIssue.bidding.winningBid.commitmentTimeHours} hrs</p>
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
                                            {generateTimeline(selectedIssue).map((event, i) => (
                                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="relative flex items-start gap-4">
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-md ${event.color} z-10`}>
                                                        {event.icon}
                                                    </div>
                                                    <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1">
                                                        <h5 className="font-black text-[11px] md:text-xs uppercase tracking-wider">{event.label}</h5>
                                                        <div className="text-[10px] font-bold text-muted-foreground font-mono mt-1 mb-2">{event.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                        {event.detail && <p className="text-[11px] text-foreground/80 bg-muted/40 border border-border/40 p-2.5 rounded-xl leading-relaxed">{event.detail}</p>}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default AuthorityAnalytics;