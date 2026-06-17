import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    Briefcase, Clock, AlertTriangle, ChevronRight, X, MapPin,
    Calendar, User, Zap, ChevronLeft, History, Shield, FileText,
    Search
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import JobManagerModal from './JobManagerModal';
import { motion, AnimatePresence } from 'framer-motion';

const AuthorityActiveJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedJob, setSelectedJob] = useState(null);
    const [viewingJob, setViewingJob] = useState(null);

    // Viewer Media State
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef(null);

    // Live Timer State
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        fetchActiveJobs();
        const timerId = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timerId);
    }, []);

    // Autoplay video in viewer if applicable
    useEffect(() => {
        const isVideo = viewingJob?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (viewingJob && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [viewingJob, currentMediaIndex]);

    // Lock body scroll when viewing
    useEffect(() => {
        if (viewingJob || selectedJob) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [viewingJob, selectedJob]);

    const fetchActiveJobs = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/authority/my-jobs');
            setJobs(res.data.data);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load active jobs' });
        } finally {
            setLoading(false);
        }
    };

    const formatDetailedTimeLeft = (job) => {
        if (job.status === 'AWAITING_HANDOVER') return "TIME EXPIRED";
        if (job.workCycle?.isClockPaused) return "CLOCK PAUSED";

        const deadline = job.workCycle?.commitmentDeadline;
        if (!deadline) return "NO DEADLINE";

        const diff = new Date(deadline).getTime() - now;
        if (diff <= 0) return "0s (EXPIRED)";

        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 7);
        const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));

        let timeStr = "";
        if (weeks > 0) timeStr += `${weeks}w `;
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0) timeStr += `${hours}h `;
        if (minutes > 0) timeStr += `${minutes}m `;
        timeStr += `${seconds}s`;

        return timeStr.trim();
    };

    const statusColors = {
        OPEN: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
        LOCKED: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10",
        PENDING_EXTENSION: "text-amber-500 border-amber-500/30 bg-amber-500/10",
        AWAITING_HANDOVER: "text-red-500 border-red-500/30 bg-red-500/10",
        RESOLVED: "text-green-500 border-green-500/30 bg-green-500/10"
    };

    const generateTimeline = (issue) => {
        if (!issue) return [];
        const combined = [];
        combined.push({ type: 'create', label: 'Issue Reported', time: new Date(issue.createdAt), icon: <FileText size={14} />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' });

        if (issue.statusHistory) {
            issue.statusHistory.forEach(sh => {
                combined.push({ type: 'status', label: `Status: ${sh.status}`, time: new Date(sh.changedAt), detail: sh.remark, icon: <History size={14} />, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' });
            });
        }
        if (issue.auditLog) {
            issue.auditLog.forEach(al => {
                combined.push({ type: 'audit', label: al.action.replace(/_/g, ' '), time: new Date(al.timestamp), detail: al.details, icon: <Shield size={14} />, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' });
            });
        }
        return combined.sort((a, b) => b.time - a.time);
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><MiniLoader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full relative pb-12">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                    <Briefcase className="text-primary" size={36} /> My Active Jobs
                </h2>
                <p className="text-sm font-medium text-muted-foreground">Manage your current commitments, resolve issues, and track deadlines.</p>
            </div>

            {jobs.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center shadow-lg mt-8">
                    <Briefcase size={56} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-2xl font-black text-foreground">No Active Commitments</h3>
                    <p className="text-muted-foreground font-medium mt-2">Check the Radar to place bids and claim new jobs in your district.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {jobs.map((job, index) => {
                            const isAwaitingHandover = job.status === 'AWAITING_HANDOVER';
                            const isPaused = job.workCycle?.isClockPaused;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}
                                    key={job._id}
                                    onClick={() => { setCurrentMediaIndex(0); setViewingJob(job); }}
                                    className={`group bg-card/60 backdrop-blur-xl border p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isAwaitingHandover ? 'border-destructive/40 bg-destructive/5' : 'border-border/60 hover:border-primary/50'}`}
                                >
                                    {/* Image Thumbnail */}
                                    <div className="w-full md:w-20 h-40 md:h-20 bg-background/50 rounded-2xl overflow-hidden shrink-0 relative border border-border/50 shadow-inner group-hover:shadow-md transition-shadow">
                                        {job.media?.[0] ?
                                            <img src={job.media[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Issue" /> :
                                            <div className="w-full h-full flex items-center justify-center"><Search size={24} className="text-muted-foreground/30" /></div>
                                        }
                                        {/* Mobile-only category badge overlay */}
                                        <div className="absolute top-2 left-2 md:hidden bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-md border border-white/10">
                                            {job.category}
                                        </div>
                                    </div>

                                    {/* Core Data */}
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                            <h4 className="font-black text-lg text-foreground truncate group-hover:text-primary transition-colors">{job.title}</h4>
                                            {isAwaitingHandover && (
                                                <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] px-2 py-1 rounded-md font-black flex items-center gap-1 shadow-sm uppercase tracking-widest">
                                                    <AlertTriangle size={12} /> Handover Req
                                                </span>
                                            )}
                                            {isPaused && !isAwaitingHandover && (
                                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-1 rounded-md font-black flex items-center gap-1 shadow-sm uppercase tracking-widest">
                                                    <Clock size={12} /> Extension Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 hidden md:flex"><span className="uppercase tracking-widest font-bold text-[10px]">{job.category}</span> • <MapPin size={12} /> {job.location?.city}</p>
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 md:hidden"><MapPin size={12} /> {job.location?.city}</p>
                                    </div>

                                    {/* Live Deadline & Action */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1 mb-0.5">
                                                <Clock size={12} /> Time Left
                                            </p>
                                            <p className={`font-mono font-black text-base tracking-tight ${isAwaitingHandover ? 'text-destructive' : isPaused ? 'text-amber-500' : 'text-primary'}`}>
                                                {formatDetailedTimeLeft(job)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                                            className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]
                                                ${isAwaitingHandover ? 'bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'}`}
                                        >
                                            Manage <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ============================================================== */}
            {/* 🟢 ADMIN-STYLE SPLIT SCREEN VIEWER */}
            {/* ============================================================== */}
            <AnimatePresence>
                {viewingJob && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setViewingJob(null)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-card/95 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-6xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85dvh] my-4 overflow-hidden z-10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-background/30 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[viewingJob.status] || statusColors.OPEN}`}>
                                        {viewingJob.status}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-muted-foreground hidden sm:block">ID: {viewingJob._id}</span>
                                </div>
                                <button onClick={() => setViewingJob(null)} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors">
                                    <X size={20} className="text-foreground" />
                                </button>
                            </div>

                            {/* Split Body */}
                            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">

                                {/* LEFT COLUMN: Media & Core Context */}
                                <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/40">
                                    <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{viewingJob.title}</h3>

                                    {/* Media Carousel */}
                                    <div className="w-full bg-black/40 rounded-2xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[250px] sm:h-[350px] shrink-0 group shadow-inner">
                                        {viewingJob.media && viewingJob.media.length > 0 ? (
                                            <>
                                                {viewingJob.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video ref={videoRef} src={viewingJob.media[currentMediaIndex].url} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                                                ) : (
                                                    <img src={viewingJob.media[currentMediaIndex].url} alt="issue" className="w-full h-full object-contain" />
                                                )}

                                                {viewingJob.media.length > 1 && (
                                                    <>
                                                        <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + viewingJob.media.length) % viewingJob.media.length)} className="absolute left-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"><ChevronLeft size={20} /></button>
                                                        <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % viewingJob.media.length)} className="absolute right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"><ChevronRight size={20} /></button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center opacity-40"><AlertTriangle size={36} className="mb-3" /><p className="text-sm font-bold">No Media Attached</p></div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12} /> Location</p>
                                            <p className="text-sm font-bold text-foreground">{viewingJob.location?.city}, {viewingJob.location?.state}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1 truncate">{viewingJob.location?.address} • PIN: {viewingJob.location?.pinCode}</p>
                                        </div>
                                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                            <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {viewingJob.impactScore || 0}</p>
                                        </div>
                                    </div>

                                    <div className="bg-background border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{viewingJob.description}</p>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: The Players, Deadlines & Timeline */}
                                <div className="w-full lg:w-1/2 flex flex-col bg-card/30 shrink-0 lg:shrink relative">
                                    <div className="p-4 md:p-6 border-b border-border/50 shrink-0 bg-background/30">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Reporter</p>
                                                <p className="text-sm font-bold truncate text-foreground">{viewingJob.isAnonymous ? 'Anonymous Citizen' : viewingJob.reportedBy?.name || 'Unknown'}</p>
                                            </div>
                                            <div className={`border p-4 rounded-2xl shadow-sm ${viewingJob.status === 'AWAITING_HANDOVER' ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${viewingJob.status === 'AWAITING_HANDOVER' ? 'text-destructive' : 'text-primary'}`}>Live Deadline</p>
                                                <p className="text-sm font-mono font-black truncate text-foreground">{formatDetailedTimeLeft(viewingJob)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="flex-1 p-4 md:p-6 lg:overflow-y-auto thin-scrollbar relative">
                                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-6 tracking-widest pl-2 border-l-2 border-primary">Audit Log & Timeline</h4>
                                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/50 before:to-transparent pb-4">
                                            {generateTimeline(viewingJob).map((event, i) => (
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

                                    {/* Bottom Fixed Action Button */}
                                    <div className="p-5 border-t border-border/50 bg-background/50 backdrop-blur-xl shrink-0 flex justify-end">
                                        <button
                                            onClick={() => {
                                                const jobToManage = viewingJob;
                                                setViewingJob(null);
                                                setTimeout(() => setSelectedJob(jobToManage), 200);
                                            }}
                                            className="px-8 py-3 w-full md:w-auto bg-primary text-primary-foreground font-black text-sm rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Take Action (Manage) <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================== */}
            {/* MANAGE JOB MODAL (Resolution / Handover / Extension) */}
            {/* ============================================================== */}
            <AnimatePresence>
                {selectedJob && (
                    <JobManagerModal
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                        onSuccess={() => {
                            setSelectedJob(null);
                            fetchActiveJobs();
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AuthorityActiveJobs;