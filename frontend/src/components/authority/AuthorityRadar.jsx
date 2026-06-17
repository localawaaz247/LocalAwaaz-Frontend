import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    Clock, AlertTriangle, ShieldAlert, CheckCircle,
    XCircle, Zap, MapPin, Calendar, Search, Timer, Check, X, RotateCcw, User
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../../components/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../utils/socket';

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

    useEffect(() => {
        fetchRadarIssues();
        const timerId = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timerId);
    }, [activeTab]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (bidModal.isOpen || rejectModal.isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [bidModal.isOpen, rejectModal.isOpen]);

    useEffect(() => {
        fetchRadarIssues();
        const timerId = setInterval(() => setTick(t => t + 1), 1000);

        // 🟢 NEW: Listen for real-time socket updates to refresh the data automatically
        if (socket) {
            socket.on('receive_notification', (notification) => {
                // If the notification is related to an auction or bid, refresh the radar!
                if (['UPDATE', 'URGENT', 'CRITICAL', 'SYSTEM_BROADCAST'].includes(notification.type)) {
                    fetchRadarIssues();
                }
            });
        }

        return () => {
            clearInterval(timerId);
            if (socket) socket.off('receive_notification'); // Clean up listener
        };
    }, [activeTab, socket]);

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

    // --- ACTIONS ---
    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!bidModal.timeValue || bidModal.timeValue <= 0) return showToast({ icon: 'error', title: 'Enter a valid time.' });

        setSubmitting(true);
        try {
            const res = await axiosInstance.post(`/authority/radar/bid/${bidModal.issue._id}`, {
                proposedTimeValue: Number(bidModal.timeValue),
                proposedTimeUnit: bidModal.timeUnit
            });
            showToast({ icon: 'success', title: res.data.message });
            setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' });
            fetchRadarIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to submit bid.' });
        } finally {
            setSubmitting(false);
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full relative pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <Timer className="text-primary" size={36} /> Local Radar
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Monitor open issues, beat the clock, and claim jobs in your jurisdiction.</p>
                </div>

                {/* 🟢 NEW: Real-Time Live Clock */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 px-5 py-2.5 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm shrink-0"
                >
                    {/* Pulsing indicator */}
                    <div className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Date Section */}
                        <div className="flex flex-col pr-4 border-r border-border/50">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Today's Date</span>
                            <span className="font-mono text-sm font-black tracking-wider text-foreground">
                                {currentTime.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>

                        {/* Time Section */}
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Live Server Time</span>
                            <span className="font-mono text-sm font-black tracking-wider text-foreground flex items-center gap-1.5 w-[100px]">
                                {currentTime.toLocaleTimeString('en-US', {
                                    hour12: true,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Glossy Modern Tabs */}
            <div className="flex gap-2 p-1.5 bg-card/60 backdrop-blur-md border border-border/60 rounded-2xl w-max shadow-sm relative z-10">
                <button
                    onClick={() => setActiveTab('OPEN')}
                    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === 'OPEN' ? 'text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    {activeTab === 'OPEN' && (
                        <motion.div layoutId="radarTab" className="absolute inset-0 bg-primary rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-2"><Check size={16} /> Open Auctions</span>
                </button>
                <button
                    onClick={() => setActiveTab('REJECTED')}
                    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === 'REJECTED' ? 'text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                    {activeTab === 'REJECTED' && (
                        <motion.div layoutId="radarTab" className="absolute inset-0 bg-red-500 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-2"><X size={16} /> My Rejected</span>
                </button>
            </div>

            {/* Grid Area */}
            {loading ? (
                <div className="flex h-[40vh] items-center justify-center"><MiniLoader /></div>
            ) : issues.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center shadow-lg">
                    <ShieldAlert size={56} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-2xl font-black text-foreground">{activeTab === 'OPEN' ? 'Radar is Clear' : 'No Rejected Issues'}</h3>
                    <p className="text-muted-foreground font-medium mt-2">
                        {activeTab === 'OPEN' ? 'There are currently no open issues in your assigned district.' : 'You have not dismissed any issues yet.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                    <AnimatePresence>
                        {issues.map((issue, index) => {
                            const hasBids = issue.bidding?.bids?.length > 0;
                            const isAuctionActive = hasBids && new Date(issue.bidding.auctionEndsAt) > Date.now();
                            const currentLowest = issue.bidding?.winningBid?.commitmentTimeHours;
                            const isReverting = revertingId === issue._id;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }}
                                    key={issue._id}
                                    className={`bg-card/80 backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 group hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-1 ${activeTab === 'REJECTED' ? 'border-red-500/30' : 'border-border/60 hover:border-primary/50'} ${isReverting ? 'opacity-50 scale-95 pointer-events-none' : ''}`}
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
                                        <h3 className="font-black text-xl leading-tight mb-3 line-clamp-2 text-foreground">{issue.title}</h3>

                                        <div className="space-y-2 mb-5">
                                            <div className="flex items-start gap-2 text-xs font-medium text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                                                <MapPin size={16} className="shrink-0 text-primary" />
                                                <span className="line-clamp-2">{issue.location?.address}, {issue.location?.city}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
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
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setRejectModal({ isOpen: true, issue, reason: '' })} className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                                                        <XCircle size={16} /> Reject
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setBidModal({ isOpen: true, issue, timeValue: '', timeUnit: 'DAYS' })} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-black flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all">
                                                        <Timer size={16} /> {isAuctionActive ? 'Beat Bid' : 'Place Bid'}
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleRevertDecision(issue._id)} disabled={isReverting} className="w-full px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-sm">
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

            {/* 🟢 BIDDING MODAL */}
            <AnimatePresence>
                {bidModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setBidModal({ isOpen: false, issue: null, timeValue: '', timeUnit: 'DAYS' })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-md border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10"
                        >
                            <div className="p-6 border-b border-border/50 bg-primary/5">
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
                                        <input
                                            type="number" min="1" required
                                            value={bidModal.timeValue}
                                            onChange={(e) => setBidModal({ ...bidModal, timeValue: e.target.value })}
                                            className="flex-1 bg-background/50 border border-border/60 rounded-xl px-4 py-3 text-lg font-black focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                                            placeholder="E.g., 3"
                                        />
                                        <div className="w-40 relative z-50">
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

            {/* 🟢 REJECT MODAL */}
            <AnimatePresence>
                {rejectModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setRejectModal({ isOpen: false, issue: null, reason: '' })} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 backdrop-blur-2xl w-full max-w-md border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10"
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

        </motion.div>
    );
};

export default AuthorityRadar;