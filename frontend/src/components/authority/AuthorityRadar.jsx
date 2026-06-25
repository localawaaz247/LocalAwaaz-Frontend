import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    Clock, AlertTriangle, ShieldAlert, CheckCircle,
    XCircle, Zap, MapPin, Calendar, Search, Timer, Check, X, RotateCcw, User, Plus, Minus,
    Navigation, ChevronLeft, ChevronRight, FileText, History, Shield
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../../components/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../utils/socket';

// Helper: Haversine formula to calculate distance in KM
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

const statusColors = {
    OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    RESOLVED: "bg-green-500/10 text-green-500 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
    DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

// 🟢 YouTube-style Shimmer Skeleton Card
const ShimmerCard = () => (
    <div className="bg-card/40 backdrop-blur-xl border border-border/30 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[460px]">
        {/* Image Skeleton */}
        <div className="h-44 bg-muted/30 animate-pulse relative">
            <div className="absolute top-3 left-3 w-16 h-6 bg-muted/40 rounded-lg"></div>
            <div className="absolute top-3 right-3 w-12 h-6 bg-muted/40 rounded-lg"></div>
        </div>

        {/* Body Skeleton */}
        <div className="p-5 flex-1 flex flex-col gap-4">
            <div>
                <div className="h-6 w-3/4 bg-muted/30 rounded-md animate-pulse mb-2"></div>
                <div className="h-6 w-1/2 bg-muted/30 rounded-md animate-pulse"></div>
            </div>

            <div className="space-y-2 mb-2">
                <div className="h-10 w-full bg-muted/20 rounded-xl animate-pulse"></div>
                <div className="h-8 w-2/3 bg-muted/20 rounded-lg animate-pulse"></div>
            </div>

            {/* Status Area Skeleton */}
            <div className="mt-auto pt-4 border-t border-border/30 flex justify-between items-center">
                <div className="h-12 w-1/3 bg-muted/20 rounded-xl animate-pulse"></div>
                <div className="h-12 w-1/4 bg-muted/20 rounded-xl animate-pulse"></div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="h-11 bg-muted/20 rounded-xl animate-pulse"></div>
                <div className="h-11 bg-muted/20 rounded-xl animate-pulse"></div>
            </div>
        </div>
    </div>
);

const AuthorityRadar = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('OPEN');
    const [tick, setTick] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Modal & Action States
    const [bidModal, setBidModal] = useState({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, issue: null, reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [revertingId, setRevertingId] = useState(null);

    // Detail Modal States
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [detailBidTime, setDetailBidTime] = useState("");
    const [detailBidUnit, setDetailBidUnit] = useState("HOURS");
    const [detailBiddingLoader, setDetailBiddingLoader] = useState(false);
    const videoRef = useRef(null);

    const [currentLocation, setCurrentLocation] = useState(null);

    // 1. Fetch data when the tab changes
    useEffect(() => {
        fetchRadarIssues();
    }, [activeTab]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("Location access denied", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // 2. Handle the live clocks
    useEffect(() => {
        const tickId = setInterval(() => setTick(t => t + 1), 1000);
        const clockId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            clearInterval(tickId);
            clearInterval(clockId);
        };
    }, []);

    // Autoplay Video in Detail Modal
    useEffect(() => {
        const isVideo = selectedIssue?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (selectedIssue && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [selectedIssue, currentMediaIndex]);

    // 3. Modal body scroll locks
    useEffect(() => {
        if (bidModal.isOpen || rejectModal.isOpen || selectedIssue) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [bidModal.isOpen, rejectModal.isOpen, selectedIssue]);

    // 4. Real-Time Radar Sync
    useEffect(() => {
        if (!socket) return;

        const handleIssueUpdate = (data) => {
            const incomingStatus = data.newStatus || data.updatedData?.status;

            setIssues((prevIssues) => {
                const exists = prevIssues.some((i) => i._id === data.issueId);
                if (!exists) return prevIssues;

                if (activeTab === 'OPEN' && incomingStatus && incomingStatus !== 'OPEN') {
                    if (bidModal.issue?._id === data.issueId) {
                        setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' });
                        showToast({ icon: 'info', title: 'Auction Closed', message: 'Another official was assigned to this job.' });
                    }
                    if (selectedIssue?._id === data.issueId) {
                        setSelectedIssue(null);
                        showToast({ icon: 'info', title: 'Auction Closed', message: 'This issue is no longer available.' });
                    }
                    return prevIssues.filter((i) => i._id !== data.issueId);
                }

                return prevIssues.map((i) =>
                    i._id === data.issueId ? (data.updatedData || { ...i, status: incomingStatus }) : i
                );
            });
        };

        const handleIssueDelete = (data) => {
            setIssues((prev) => prev.filter((i) => i._id !== data.issueId));
            if (bidModal.issue?._id === data.issueId) setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' });
            if (selectedIssue?._id === data.issueId) setSelectedIssue(null);
        };

        socket.on('issue_updated', handleIssueUpdate);
        socket.on('issue_status_updated', handleIssueUpdate);
        socket.on('issue_deleted', handleIssueDelete);

        return () => {
            socket.off('issue_updated', handleIssueUpdate);
            socket.off('issue_status_updated', handleIssueUpdate);
            socket.off('issue_deleted', handleIssueDelete);
        };
    }, [activeTab, bidModal.issue, selectedIssue]);

    const fetchRadarIssues = async () => {
        setLoading(true);
        setIssues([]);
        try {
            const endpoint = activeTab === 'OPEN' ? '/authority/radar/open' : '/authority/radar/rejected';
            const res = await axiosInstance.get(endpoint);
            setIssues(res.data.data);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load Radar' });
        } finally {
            setLoading(false);
        }
    };

    const openGoogleMaps = (e, coordinates) => {
        e.stopPropagation();
        if (!coordinates || coordinates.length < 2) return;
        const [lng, lat] = coordinates;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    };

    const formatTimeRemaining = (endTimeStr) => {
        const diff = new Date(endTimeStr).getTime() - Date.now();
        if (diff <= 0) return "Auction Closed";
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        return `${h}h ${m}m ${s}s`;
    };

    const formatAge = (startTimeStr) => {
        const diff = Date.now() - new Date(startTimeStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days} Days old`;
        return `${hours} Hours old`;
    };

    const generateTimeline = (issue) => {
        if (!issue) return [];
        const combined = [];
        combined.push({ type: 'create', label: 'Issue Reported', time: new Date(issue.createdAt), icon: <FileText size={14} />, color: 'text-blue-500 bg-blue-500/10' });

        if (issue.statusHistory) {
            issue.statusHistory.forEach(sh => {
                combined.push({ type: 'status', label: `Status: ${sh.status}`, time: new Date(sh.changedAt), detail: sh.remark, icon: <History size={14} />, color: 'text-yellow-500 bg-yellow-500/10' });
            });
        }
        if (issue.auditLog) {
            issue.auditLog.forEach(al => {
                combined.push({ type: 'audit', label: al.action.replace(/_/g, ' '), time: new Date(al.timestamp), detail: al.details, icon: <Shield size={14} />, color: 'text-indigo-500 bg-indigo-500/10' });
            });
        }
        return combined.sort((a, b) => b.time - a.time);
    };

    // --- ACTIONS ---
    const executeBid = async (issueId, timeValue, timeUnit) => {
        const res = await axiosInstance.post(`/authority/radar/bid/${issueId}`, {
            proposedTimeValue: Number(timeValue),
            proposedTimeUnit: timeUnit
        });
        return res;
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!bidModal.timeValue || bidModal.timeValue <= 0) return showToast({ icon: 'error', title: 'Enter a valid time.' });

        setSubmitting(true);
        try {
            const res = await executeBid(bidModal.issue._id, bidModal.timeValue, bidModal.timeUnit);
            showToast({ icon: 'success', title: res.data.message });
            setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' });
            fetchRadarIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to submit bid.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDetailBidSubmit = async (e) => {
        e.preventDefault();
        if (!detailBidTime || isNaN(detailBidTime)) return showToast({ icon: 'error', title: 'Enter a valid time' });

        setDetailBiddingLoader(true);
        try {
            const res = await executeBid(selectedIssue._id, detailBidTime, detailBidUnit);
            showToast({ icon: 'success', title: res.data.message });
            setSelectedIssue(null);
            setDetailBidTime("");
            fetchRadarIssues();
        } catch (err) {
            showToast({ icon: 'error', title: err.response?.data?.message || 'Failed to place bid' });
        } finally {
            setDetailBiddingLoader(false);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosInstance.post(`/authority/radar/reject/${rejectModal.issue._id}`, { reason: rejectModal.reason });
            showToast({ icon: 'success', title: 'Issue moved to Rejected section.' });
            setIssues(prev => prev.filter(i => i._id !== rejectModal.issue._id));
            setRejectModal({ isOpen: false, issue: null, reason: '' });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to reject issue.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevertDecision = async (issueId) => {
        setRevertingId(issueId);
        try {
            await axiosInstance.post(`/authority/radar/revert/${issueId}`);
            showToast({ icon: 'success', title: 'Issue moved back to Open Auctions!' });
            setIssues(prev => prev.filter(i => i._id !== issueId));
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to revert decision.' });
        } finally {
            setRevertingId(null);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col p-4 md:p-6 pb-24 space-y-6 overflow-y-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <Timer className="text-primary" size={36} /> Local Radar
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Monitor open issues, beat the clock, and claim jobs in your jurisdiction.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 px-5 py-2.5 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm shrink-0"
                >
                    <div className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col pr-4 border-r border-border/50">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Today's Date</span>
                            <span className="font-mono text-sm font-black tracking-wider text-foreground">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Live Server Time</span>
                            <span className="font-mono text-sm font-black tracking-wider text-foreground flex items-center gap-1.5 w-[100px]">
                                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Glossy Modern Tabs */}
            <div className="flex w-full sm:w-max gap-2 p-1.5 bg-card/60 backdrop-blur-md border border-border/60 rounded-2xl shadow-sm relative z-10">
                <button
                    onClick={() => setActiveTab('OPEN')}
                    className={`relative flex-1 sm:flex-none px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'OPEN' ? 'text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    {activeTab === 'OPEN' && (
                        <motion.div layoutId="radarTab" className="absolute inset-0 bg-primary rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5"><Check size={16} className="shrink-0" /> <span className="truncate">Open Auctions</span></span>
                </button>
                <button
                    onClick={() => setActiveTab('REJECTED')}
                    className={`relative flex-1 sm:flex-none px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === 'REJECTED' ? 'text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    {activeTab === 'REJECTED' && (
                        <motion.div layoutId="radarTab" className="absolute inset-0 bg-red-500 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5"><X size={16} className="shrink-0" /> <span className="truncate">My Rejected</span></span>
                </button>
            </div>

            {/* Grid Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 pb-8">
                    {[...Array(6)].map((_, i) => (
                        <ShimmerCard key={i} />
                    ))}
                </div>
            ) : issues.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center shadow-lg">
                    <ShieldAlert size={56} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-2xl font-black text-foreground">{activeTab === 'OPEN' ? 'Radar is Clear' : 'No Rejected Issues'}</h3>
                    <p className="text-muted-foreground font-medium mt-2">
                        {activeTab === 'OPEN' ? 'There are currently no open issues in your assigned district.' : 'You have not dismissed any issues yet.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 pb-8">
                    <AnimatePresence>
                        {issues.map((issue, index) => {
                            const hasBids = issue.bidding?.bids?.length > 0;
                            const isAuctionActive = hasBids && new Date(issue.bidding.auctionEndsAt) > Date.now();
                            const currentLowest = issue.bidding?.winningBid?.commitmentTimeHours;
                            const isReverting = revertingId === issue._id;

                            // Distance Logic
                            const coords = issue.location?.geoData?.coordinates;
                            const hasCoords = coords && coords.length === 2;
                            let distance = null;
                            if (currentLocation && hasCoords) {
                                distance = calculateDistance(currentLocation.lat, currentLocation.lng, coords[1], coords[0]);
                            }

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }}
                                    key={issue._id}
                                    onClick={() => { setSelectedIssue(issue); setCurrentMediaIndex(0); }}
                                    className={`bg-card/80 backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 group hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 cursor-pointer ${activeTab === 'REJECTED' ? 'border-red-500/30' : 'border-border/60 hover:border-primary/50'} ${isReverting ? 'opacity-50 scale-95 pointer-events-none' : ''}`}
                                >
                                    {/* Image Header */}
                                    <div className="h-44 bg-muted relative overflow-hidden">
                                        {issue.media && issue.media.length > 0 ? (
                                            <img src={issue.media[0].url} alt="Issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-background/50"><Search size={32} className="text-muted-foreground/30" /></div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                                            {issue.category}
                                        </div>
                                        <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[11px] font-black tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                            <Zap size={14} className="fill-black" /> {issue.impactScore || 0}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-transparent to-background/50">
                                        <h3 className="font-black text-xl leading-tight mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">{issue.title}</h3>

                                        <div className="space-y-2 mb-5">
                                            <div className="flex items-start gap-2 text-xs font-medium text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                                                <MapPin size={16} className="shrink-0 text-primary" />
                                                <span className="line-clamp-2">{issue.location?.address}, {issue.location?.city}</span>
                                            </div>

                                            {/* Live Distance Tag */}
                                            <button
                                                onClick={(e) => hasCoords ? openGoogleMaps(e, coords) : e.stopPropagation()}
                                                disabled={!hasCoords}
                                                className={`flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-colors shadow-sm ${hasCoords
                                                    ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-500/20'
                                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                    }`}
                                            >
                                                <Navigation size={12} />
                                                {distance ? `${distance} km away` : 'Locating...'}
                                            </button>

                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 mt-2">
                                                <User size={16} className="shrink-0 text-amber-500" />
                                                <span className="truncate">Reported by: <span className="font-bold text-foreground">{issue.isAnonymous ? 'Anonymous' : issue.reportedBy?.name || 'Citizen'}</span></span>
                                            </div>
                                        </div>

                                        {/* Status Area */}
                                        <div className="mt-auto pt-4 border-t border-border/50">
                                            {isAuctionActive ? (
                                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex justify-between items-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow"></div>
                                                    <div className="relative z-10">
                                                        <p className="text-[10px] uppercase font-black tracking-widest text-red-500 flex items-center gap-1 mb-0.5"><Clock size={12} /> Ends In</p>
                                                        <p className="font-black text-foreground font-mono text-lg">{formatTimeRemaining(issue.bidding.auctionEndsAt)}</p>
                                                    </div>
                                                    <div className="text-right relative z-10">
                                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Lowest Bid</p>
                                                        <p className="font-black text-primary text-xl">{currentLowest}h</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-background/80 border border-border/50 rounded-2xl p-3 flex justify-between items-center shadow-inner">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1 mb-0.5"><Calendar size={12} /> Stagnancy</p>
                                                        <p className="font-bold text-foreground text-sm">{formatAge(issue.createdAt)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Status</p>
                                                        <p className="font-black text-green-500 text-sm tracking-wider">AWAITING BIDS</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4">
                                            {activeTab === 'OPEN' ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setRejectModal({ isOpen: true, issue, reason: '' }); }} className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                                                        <XCircle size={16} /> Reject
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); setBidModal({ isOpen: true, issue, timeValue: '', timeUnit: 'DAYS' }); }} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-black flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all">
                                                        <Timer size={16} /> {isAuctionActive ? 'Beat Bid' : 'Place Bid'}
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); handleRevertDecision(issue._id); }} disabled={isReverting} className="w-full px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-sm">
                                                    <RotateCcw size={16} className={isReverting ? 'animate-spin' : ''} />
                                                    {isReverting ? 'Reverting...' : 'Revert Decision'}
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* 🟢 BIDDING MODAL (Triggered via Action Button) */}
            <AnimatePresence>
                {bidModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-md border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-visible flex flex-col relative z-10"
                        >
                            <div className="p-6 border-b border-border/50 bg-primary/5 rounded-t-3xl">
                                <h3 className="text-2xl font-black flex items-center gap-3"><Timer className="text-primary" size={28} /> Place Your Bid</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-2">Commit to resolving this issue. Bids cannot be revoked.</p>
                            </div>

                            <form onSubmit={handleBidSubmit} className="p-6 space-y-6">
                                {bidModal.issue?.bidding?.bids?.length > 0 && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-inner">
                                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Auction Active</p>
                                            <p className="text-sm text-foreground/90 leading-relaxed">You must commit to completing this job in less than <strong className="font-black text-yellow-500">{bidModal.issue.bidding.winningBid.commitmentTimeHours} Hours</strong> to win.</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Committed Resolution Time</label>
                                    <div className="flex gap-3">
                                        <div className="flex flex-1 min-w-0 items-center bg-background/50 border border-border/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setBidModal(prev => ({ ...prev, timeValue: Math.max(1, Number(prev.timeValue) - 1) }))}
                                                className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <Minus size={18} />
                                            </button>

                                            <input
                                                type="number" min="1" required
                                                value={bidModal.timeValue}
                                                onChange={(e) => setBidModal({ ...bidModal, timeValue: e.target.value })}
                                                className="w-full text-center bg-transparent text-lg font-black outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0"
                                                placeholder="3"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setBidModal(prev => ({ ...prev, timeValue: Number(prev.timeValue) + 1 }))}
                                                className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="w-28 sm:w-36 shrink-0 relative z-50">
                                            <CustomSelect
                                                options={[{ label: 'Hours', value: 'HOURS' }, { label: 'Days', value: 'DAYS' }, { label: 'Weeks', value: 'WEEKS' }, { label: 'Months', value: 'MONTHS' }]}
                                                value={bidModal.timeUnit}
                                                onChange={(val) => setBidModal({ ...bidModal, timeUnit: val })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' })} className="flex-1 px-4 py-3 rounded-xl border border-border/60 font-bold hover:bg-muted/50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                                        {submitting ? 'Submitting...' : 'Lock Bid'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🟢 REJECT MODAL (Triggered via Action Button) */}
            <AnimatePresence>
                {rejectModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setRejectModal({ isOpen: false, issue: null, reason: '' })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-md border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-visible flex flex-col relative z-10"
                        >
                            <div className="p-6 border-b border-border/50 bg-red-500/5">
                                <h3 className="text-2xl font-black text-red-500 flex items-center gap-3"><XCircle size={28} /> Dismiss Issue</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-2">This will hide the issue from your radar completely.</p>
                            </div>
                            <form onSubmit={handleRejectSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Reason (Optional)</label>
                                    <textarea
                                        rows="3"
                                        value={rejectModal.reason}
                                        onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                        placeholder="Why are you ignoring this issue? (e.g., Outside my expertise)"
                                        className="w-full bg-background/50 border border-border/60 rounded-xl p-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none resize-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setRejectModal({ isOpen: false, issue: null, reason: '' })} className="flex-1 px-4 py-3 rounded-xl border border-border/60 font-bold hover:bg-muted/50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-black hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                                        {submitting ? 'Removing...' : 'Confirm Reject'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🟢 SPLIT SCREEN DETAIL MODAL (Triggered via Card Click) */}
            <AnimatePresence>
                {selectedIssue && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedIssue(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85dvh] overflow-hidden z-10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                        {selectedIssue.status}
                                    </span>
                                    <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {selectedIssue._id}</span>
                                </div>
                                <button onClick={() => setSelectedIssue(null)} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors"><X size={20} /></button>
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
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                            <p className="text-2xl font-black text-primary flex items-center gap-1 justify-center"><Zap size={20} className="fill-primary" /> {selectedIssue.impactScore || 0}</p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{selectedIssue.description}</p>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: The Players, Timeline & Bidding Form */}
                                <div className="w-full lg:w-1/2 flex flex-col bg-card/40 shrink-0 lg:shrink relative">

                                    {/* Reporter Card */}
                                    <div className="p-4 md:p-6 border-b border-border/50 shrink-0 bg-background/50">
                                        <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Reported By</p>
                                            <p className="text-sm font-bold truncate text-foreground">{selectedIssue.isAnonymous ? 'Anonymous Citizen' : selectedIssue.reportedBy?.name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="flex-1 p-4 md:p-6 lg:overflow-y-auto thin-scrollbar relative min-h-[150px]">
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

                                    {/* Bidding Controls anchored at bottom */}
                                    {activeTab === 'OPEN' && (
                                        <div className="p-4 md:p-6 border-t border-border/50 bg-background/50 backdrop-blur-xl shrink-0">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Place Your Bid</h4>
                                            <form onSubmit={handleDetailBidSubmit} className="flex flex-col gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-muted-foreground block mb-2">How fast can you resolve this?</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number" min="1" required
                                                            value={detailBidTime}
                                                            onChange={e => setDetailBidTime(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                                                            placeholder="e.g. 24"
                                                        />
                                                        <select
                                                            value={detailBidUnit}
                                                            onChange={e => setDetailBidUnit(e.target.value)}
                                                            className="bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="HOURS">Hours</option>
                                                            <option value="DAYS">Days</option>
                                                            <option value="WEEKS">Weeks</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={detailBiddingLoader}
                                                    className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20"
                                                >
                                                    {detailBiddingLoader ? <MiniLoader color="#fff" /> : <><Clock size={18} /> Submit Bid</>}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default AuthorityRadar;