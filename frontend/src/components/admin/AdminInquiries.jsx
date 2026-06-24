import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, User, Calendar, CheckCheck,
    MessageSquare, Search, Inbox, Reply, ShieldAlert, Filter, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../CustomSelect';

const AdminInquiries = () => {
    // Portal hydration state
    const [isMounted, setIsMounted] = useState(false);

    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    // Custom Confirmation Dialog State
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    // Mobile Filter State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Options arrays for CustomSelect
    const FILTER_STATUS_OPTIONS = [
        { value: '', label: 'All Inquiries' },
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' },
        { value: 'resolved', label: 'Resolved' }
    ];

    const INQUIRY_STATUS_OPTIONS = [
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' },
        { value: 'resolved', label: 'Resolved' }
    ];

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => { fetchInquiries(); }, [statusFilter, page]);

    useEffect(() => {
        if (selectedInquiry || deleteConfirmation) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedInquiry, deleteConfirmation]);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/inquiries', { params: { status: statusFilter || undefined, page, limit: 15 } });
            setInquiries(res.data.data.inquiries);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            console.error(error);
            showToast({ icon: 'error', title: 'Failed to load inquiries' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus, e) => {
        if (e) e.stopPropagation();
        try {
            await axiosInstance.patch(`/admin/inquiry/${id}`, { status: newStatus });
            setInquiries(inquiries.map(i => i._id === id ? { ...i, status: newStatus } : i));

            if (selectedInquiry && selectedInquiry._id === id) {
                setSelectedInquiry({ ...selectedInquiry, status: newStatus });
            }
            showToast({ icon: 'success', title: `Marked as ${newStatus}` });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to update status' });
        }
    };

    const handleMarkAllRead = async () => {
        const unreadInquiries = inquiries.filter(i => i.status === 'unread');

        if (unreadInquiries.length === 0) {
            showToast({ icon: 'info', title: 'No unread inquiries on this page.' });
            return;
        }

        setIsMarkingAll(true);
        try {
            await Promise.all(
                unreadInquiries.map(inq => axiosInstance.patch(`/admin/inquiry/${inq._id}`, { status: 'read' }))
            );

            setInquiries(inquiries.map(i => i.status === 'unread' ? { ...i, status: 'read' } : i));
            showToast({ icon: 'success', title: `Marked ${unreadInquiries.length} inquiries as read.` });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to mark some inquiries as read.' });
        } finally {
            setIsMarkingAll(false);
        }
    };

    // --- Custom Delete Handlers ---
    const triggerDeleteInquiry = (id, e) => {
        if (e) e.stopPropagation();
        setDeleteConfirmation({ type: 'SINGLE', id });
    };

    const triggerDeleteAll = () => {
        setDeleteConfirmation({ type: 'ALL' });
    };

    const executeDelete = async () => {
        if (!deleteConfirmation) return;

        if (deleteConfirmation.type === 'ALL') {
            try {
                await axiosInstance.delete('/admin/inquiries');
                setInquiries([]);
                setSelectedInquiry(null);
                setPage(1);
                setTotalPages(1);
                showToast({ icon: 'success', title: 'All inquiries wiped successfully' });
            } catch (error) {
                showToast({ icon: 'error', title: 'Failed to wipe inquiries' });
            }
        } else if (deleteConfirmation.type === 'SINGLE') {
            const id = deleteConfirmation.id;
            try {
                await axiosInstance.delete(`/admin/inquiry/${id}`);
                setInquiries(inquiries.filter(i => i._id !== id));
                if (selectedInquiry && selectedInquiry._id === id) {
                    setSelectedInquiry(null);
                }
                showToast({ icon: 'success', title: 'Inquiry deleted' });
            } catch (error) {
                showToast({ icon: 'error', title: 'Failed to delete inquiry' });
            }
        }
        setDeleteConfirmation(null); // Close confirmation modal
    };

    const formatDate = (isoDate) => {
        return new Date(isoDate).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'unread': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
            case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
            case 'read': return 'bg-muted/50 text-muted-foreground border-border/50';
            default: return 'bg-muted text-muted-foreground border-border/50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 md:space-y-8 flex flex-col h-full relative pb-10 overflow-y-auto thin-scrollbar"
        >
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <MessageSquare className="text-primary w-8 h-8" /> Platform Inquiries
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Manage incoming questions, feedback, and support tickets from users.
                    </p>
                </div>
            </div>

            {/* Mobile Filter Toggle Header */}
            <div className="flex md:hidden justify-between items-center mt-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Search className="text-primary" size={20} /> Filter Inquiries
                </h3>
                <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* --- FILTER & ACTION BAR --- */}
            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]`}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto text-sm font-bold text-muted-foreground">
                        <Inbox className="w-5 h-5 text-primary" /> Filter Queue:
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
                        <div className="w-full sm:w-48 relative z-[70]">
                            <CustomSelect
                                options={FILTER_STATUS_OPTIONS}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                            />
                        </div>
                        <button
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll || inquiries.every(i => i.status !== 'unread')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                        >
                            {isMarkingAll ? <MiniLoader className="w-4 h-4 border-blue-500 border-t-transparent" /> : <CheckCheck size={16} />}
                            Mark All Read
                        </button>

                        <button
                            onClick={triggerDeleteAll}
                            disabled={inquiries.length === 0}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                        >
                            <Trash2 size={16} /> Delete All
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Card View Wrapper (Hidden on md+) */}
            <div className="md:hidden flex flex-col gap-3 relative z-[10]">
                <AnimatePresence>
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-card/60 border border-border/60 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                                        <div className="h-3 w-1/2 bg-muted/50 rounded"></div>
                                    </div>
                                    <div className="h-5 w-16 bg-muted rounded"></div>
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-3 w-full bg-muted/50 rounded"></div>
                                    <div className="h-3 w-2/3 bg-muted/50 rounded"></div>
                                </div>
                                <div className="flex justify-between items-center mt-1 pt-3 border-t border-border/30">
                                    <div className="h-3 w-24 bg-muted rounded"></div>
                                    <div className="h-6 w-24 bg-muted rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : inquiries.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">No inquiries found for this filter.</p>
                        </motion.div>
                    ) : (
                        inquiries.map((inquiry, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                                key={inquiry._id}
                                onClick={() => setSelectedInquiry(inquiry)}
                                className={`bg-card/60 backdrop-blur-md border rounded-xl p-4 flex flex-col gap-3 shadow-sm transition-all cursor-pointer group ${inquiry.status === 'unread' ? 'border-blue-500/50 bg-blue-500/5' : 'border-border/60 hover:border-primary/50'}`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{inquiry.name}</h4>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{inquiry.email}</p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider uppercase border ${getStatusStyles(inquiry.status)}`}>
                                        {inquiry.status}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                    <span className={inquiry.status === 'unread' ? 'font-bold text-foreground' : 'font-medium'}>
                                        {inquiry.message}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1 pt-3 border-t border-border/30" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                        <Calendar size={10} /> {formatDate(inquiry.createdAt)}
                                    </span>
                                    <div className="w-[110px] relative z-30">
                                        <CustomSelect options={INQUIRY_STATUS_OPTIONS} value={inquiry.status} onChange={(val) => handleStatusChange(inquiry._id, val)} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop Table Wrapper (Hidden on mobile) */}
            <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col relative z-[10] min-h-[400px]">
                <div className="overflow-auto thin-scrollbar flex-1 bg-background/20">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/40 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                            <tr className="text-muted-foreground text-[11px] uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold hidden sm:table-cell w-[25%]">Sender Details</th>
                                <th className="py-4 px-6 font-bold w-[50%]">Message Preview</th>
                                <th className="py-4 px-6 font-bold w-[25%] text-right">Status Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-border/30">
                                        <td className="py-4 px-6 hidden sm:table-cell">
                                            <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                                            <div className="h-3 w-48 bg-muted/50 rounded"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-3 w-full bg-muted rounded mb-2"></div>
                                            <div className="h-3 w-2/3 bg-muted/50 rounded"></div>
                                        </td>
                                        <td className="py-4 px-6 flex justify-end">
                                            <div className="h-8 w-32 bg-muted rounded-lg"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <ShieldAlert className="w-12 h-12 opacity-20 mb-3" />
                                            <p className="font-medium text-sm">No inquiries found for this filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {inquiries.map((inquiry, index) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                                            key={inquiry._id}
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            className={`transition-all group cursor-pointer ${inquiry.status === 'unread' ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/30 border-l-4 border-l-transparent'}`}
                                        >
                                            <td className="py-4 px-6 hidden sm:table-cell">
                                                <h5 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">{inquiry.name}</h5>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium truncate max-w-[200px]">{inquiry.email}</p>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] md:max-w-[350px] whitespace-normal">
                                                <span className={inquiry.status === 'unread' ? 'font-bold text-foreground' : 'font-medium'}>
                                                    {inquiry.message}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right [&>div]:min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                                                <div className="ml-auto flex justify-end relative z-30 w-[140px]">
                                                    <CustomSelect options={INQUIRY_STATUS_OPTIONS} value={inquiry.status} onChange={(val) => handleStatusChange(inquiry._id, val)} />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="p-4 border border-border/50 rounded-2xl md:rounded-b-2xl md:border-t-0 md:rounded-t-none bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground mt-4 md:mt-0 shadow-sm">
                    <span className="tracking-widest uppercase">Page {page} of {totalPages}</span>
                    <div className="space-x-2 flex">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* --- PORTAL MODALS --- */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {/* Inquiry Details Modal */}
                    {selectedInquiry && (
                        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6">
                            {/* Backdrop */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)} />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, y: '100%', scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: '100%', scale: 0.95 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative bg-card sm:border border-border/50 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Modal Header - FIXED LAYOUT */}
                                <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 bg-background/50 shrink-0">
                                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                        <MessageSquare className="text-primary w-5 h-5" /> Inquiry Record
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(selectedInquiry.status)}`}>
                                            {selectedInquiry.status}
                                        </span>

                                        <button
                                            onClick={() => triggerDeleteInquiry(selectedInquiry._id)}
                                            className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full hover:bg-red-500/20 transition-colors"
                                            title="Delete Inquiry"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <button onClick={() => setSelectedInquiry(null)} className="p-2 bg-muted border border-border/50 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-5 md:p-6 overflow-y-auto thin-scrollbar space-y-6 flex-1 bg-background/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><User size={16} /></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Sender Identity</p>
                                                <p className="text-sm font-black text-foreground truncate">{selectedInquiry.name}</p>
                                            </div>
                                        </div>
                                        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><Mail size={16} /></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Contact Email</p>
                                                <a href={`mailto:${selectedInquiry.email}`} className="text-sm font-bold text-primary hover:underline truncate block">{selectedInquiry.email}</a>
                                            </div>
                                        </div>
                                        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm md:col-span-2 flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><Calendar size={16} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Timestamp</p>
                                                <p className="text-sm font-bold text-foreground">{formatDate(selectedInquiry.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message Content - FIXED OVERFLOW */}
                                    <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 shadow-inner">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 border-l-2 border-primary pl-2">Message Body</p>
                                        <p className="text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-all md:break-words font-medium">
                                            {selectedInquiry.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-5 border-t border-border/50 bg-muted/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 relative z-30">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">Update:</span>
                                        <div className="w-full sm:w-48 relative z-50">
                                            <CustomSelect options={INQUIRY_STATUS_OPTIONS} value={selectedInquiry.status} onChange={(val) => handleStatusChange(selectedInquiry._id, val)} />
                                        </div>
                                    </div>

                                    <a
                                        href={`mailto:${selectedInquiry.email}?subject=Re: Your Inquiry to LocalAwaaz`}
                                        className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)] text-center flex items-center justify-center gap-2"
                                    >
                                        <Reply size={16} /> Reply via Email
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Custom Delete Confirmation Modal */}
                    {deleteConfirmation && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setDeleteConfirmation(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-card border border-border/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center z-10"
                            >
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                                    <Trash2 className="w-7 h-7 text-red-500" />
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    {deleteConfirmation.type === 'ALL' ? 'Delete All Inquiries?' : 'Delete Inquiry?'}
                                </h3>

                                <p className="text-sm text-muted-foreground mb-8">
                                    {deleteConfirmation.type === 'ALL'
                                        ? "This action is permanent and will completely wipe all inquiries from the database. This cannot be undone."
                                        : "Are you sure you want to delete this inquiry? This cannot be undone."}
                                </p>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setDeleteConfirmation(null)}
                                        className="flex-1 py-3 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

export default AdminInquiries;