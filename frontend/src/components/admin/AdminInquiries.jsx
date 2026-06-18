import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, User, Calendar, CheckCheck,
    MessageSquare, Search, Inbox, Reply, ShieldAlert
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../CustomSelect';

const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

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

    useEffect(() => { fetchInquiries(); }, [statusFilter, page]);

    useEffect(() => {
        if (selectedInquiry) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedInquiry]);

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
            className="space-y-6 md:space-y-8 flex flex-col h-full relative pb-10"
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

            {/* --- FILTER & ACTION BAR --- */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]">
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
                    </div>
                </div>
            </div>

            {/* --- MAIN TABLE AREA --- */}
            <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col relative z-[10] min-h-[400px]">
                <div className="overflow-x-auto thin-scrollbar flex-1 bg-background/20">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/40 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                            <tr className="text-muted-foreground text-[11px] uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold hidden sm:table-cell">Sender Details</th>
                                <th className="py-4 px-6 font-bold sm:hidden">Contact</th>
                                <th className="py-4 px-6 font-bold w-full sm:w-1/2">Message Preview</th>
                                <th className="py-4 px-6 font-bold text-right">Status Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
                                        <div className="flex justify-center"><MiniLoader /></div>
                                    </td>
                                </tr>
                            ) : inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            key={inquiry._id}
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            className={`transition-all group cursor-pointer ${inquiry.status === 'unread'
                                                    ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                                                    : 'hover:bg-muted/30 border-l-4 border-l-transparent'
                                                }`}
                                        >
                                            <td className="py-4 px-6 hidden sm:table-cell">
                                                <h5 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{inquiry.name}</h5>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{inquiry.email}</p>
                                            </td>
                                            {/* Mobile only column */}
                                            <td className="py-4 px-6 sm:hidden">
                                                <h5 className="font-bold text-sm text-foreground truncate max-w-[120px]">{inquiry.name}</h5>
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{inquiry.email}</p>
                                            </td>

                                            <td className="py-4 px-6 text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] md:max-w-[350px] whitespace-normal">
                                                <span className={inquiry.status === 'unread' ? 'font-bold text-foreground' : 'font-medium'}>
                                                    {inquiry.message}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-right [&>div]:min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                                                <div className="ml-auto flex justify-end relative z-30">
                                                    <CustomSelect
                                                        options={INQUIRY_STATUS_OPTIONS}
                                                        value={inquiry.status}
                                                        onChange={(val) => handleStatusChange(inquiry._id, val)}
                                                    />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-border/50 bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span className="tracking-widest uppercase">Page {page} of {totalPages}</span>
                        <div className="space-x-2 flex">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-card border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm">Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-card border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- DETAIL MODAL --- */}
            <AnimatePresence>
                {selectedInquiry && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">

                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedInquiry(null)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, y: '100%', scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative bg-card/95 backdrop-blur-2xl border-t sm:border border-border/50 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-5 border-b border-border/50 bg-background/50 shrink-0">
                                <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                                    <MessageSquare className="text-primary w-5 h-5" /> Inquiry Record
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(selectedInquiry.status)}`}>
                                        {selectedInquiry.status}
                                    </span>
                                    <button onClick={() => setSelectedInquiry(null)} className="p-2 bg-muted border border-border/50 rounded-full hover:bg-muted/80 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 md:p-6 overflow-y-auto thin-scrollbar space-y-6 flex-1 bg-background/30">

                                {/* Top Meta Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><User size={16} /></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Sender Identity</p>
                                            <p className="text-sm font-black text-foreground">{selectedInquiry.name}</p>
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

                                {/* Message Content */}
                                <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 shadow-inner">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 border-l-2 border-primary pl-2">Message Body</p>
                                    <p className="text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                                        {selectedInquiry.message}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-border/50 bg-muted/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 relative z-30">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">Update:</span>
                                    <div className="w-full sm:w-48 relative z-50">
                                        <CustomSelect
                                            options={INQUIRY_STATUS_OPTIONS}
                                            value={selectedInquiry.status}
                                            onChange={(val) => handleStatusChange(selectedInquiry._id, val)}
                                        />
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
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminInquiries;