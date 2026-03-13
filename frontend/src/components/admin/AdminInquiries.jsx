import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { X, Mail, User, Calendar, CheckCheck, MessageSquare } from 'lucide-react';
import MiniLoader from '../MiniLoader';

const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal & Animation State
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false); // 🟢 Controls smooth animation
    const [isMarkingAll, setIsMarkingAll] = useState(false);

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

    // 🟢 Smooth Open Engine
    const openModal = (inquiry) => {
        setSelectedInquiry(inquiry);
        setTimeout(() => setIsModalVisible(true), 10);
    };

    // 🟢 Smooth Close Engine
    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedInquiry(null), 300);
    };

    const formatDate = (isoDate) => {
        return new Date(isoDate).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full relative">

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Platform Inquiries</h2>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll || inquiries.every(i => i.status !== 'unread')}
                        className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg md:rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isMarkingAll ? <MiniLoader className="w-4 h-4" /> : <CheckCheck size={16} />}
                        Mark All Read
                    </button>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-2.5 bg-card border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground shadow-sm cursor-pointer"
                    >
                        <option value="">All Inquiries</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto thin-scrollbar flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
                            <tr className="text-muted-foreground text-xs md:text-sm">
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden sm:table-cell">Name</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Contact</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium w-full sm:w-1/2">Message</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="4" className="p-6 md:p-8 text-center text-sm text-muted-foreground">Loading inquiries...</td></tr>
                            ) : inquiries.length === 0 ? (
                                <tr><td colSpan="4" className="p-6 md:p-8 text-center text-sm text-muted-foreground">No inquiries found.</td></tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr
                                        key={inquiry._id}
                                        onClick={() => openModal(inquiry)} // 🟢 Replaced standard state setter
                                        className={`transition-colors group cursor-pointer ${inquiry.status === 'unread' ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'}`}
                                    >
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm font-medium text-foreground hidden sm:table-cell">
                                            {inquiry.name}
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm">
                                            <div className="flex flex-col">
                                                <span className="sm:hidden font-medium text-foreground mb-0.5">{inquiry.name}</span>
                                                <span className="text-muted-foreground">{inquiry.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px] whitespace-normal">
                                            <span className={inquiry.status === 'unread' ? 'font-semibold text-foreground' : ''}>
                                                {inquiry.message}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-right">
                                            <select
                                                value={inquiry.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStatusChange(inquiry._id, e.target.value, e)}
                                                className={`text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg font-semibold border outline-none cursor-pointer transition-colors ${inquiry.status === 'unread' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        inquiry.status === 'read' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}
                                            >
                                                <option value="unread" className="bg-card text-foreground">Unread</option>
                                                <option value="read" className="bg-card text-foreground">Read</option>
                                                <option value="resolved" className="bg-card text-foreground">Resolved</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground pt-2">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-1.5 md:space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
                    </div>
                </div>
            )}

            {/* 🟢 SMOOTH ANIMATED MODAL */}
            {selectedInquiry && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">

                    {/* Animated Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    />

                    {/* Animated Modal Container */}
                    <div
                        className={`relative bg-card border-t sm:border border-border/50 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out ${isModalVisible
                                ? 'translate-y-0 sm:scale-100 opacity-100'
                                : 'translate-y-full sm:translate-y-8 sm:scale-95 opacity-0'
                            }`}
                        onClick={e => e.stopPropagation()}
                    >

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/20">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <MessageSquare className="text-primary w-5 h-5" />
                                Inquiry Details
                            </h3>
                            <button onClick={closeModal} className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar space-y-6 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User size={14} className="text-muted-foreground" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sender</p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{selectedInquiry.name}</p>
                                </div>
                                <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail size={14} className="text-muted-foreground" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                                    </div>
                                    <a href={`mailto:${selectedInquiry.email}`} className="text-sm font-medium text-primary hover:underline">{selectedInquiry.email}</a>
                                </div>
                                <div className="bg-background/50 border border-border/50 rounded-xl p-4 sm:col-span-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-muted-foreground" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Received On</p>
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{formatDate(selectedInquiry.createdAt)}</p>
                                </div>
                            </div>

                            <div className="bg-background/40 border border-border/50 rounded-xl p-4 md:p-5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message Content</p>
                                <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                    {selectedInquiry.message}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm font-medium text-muted-foreground">Current Status:</span>
                            <div className="flex w-full sm:w-auto items-center gap-2">
                                <select
                                    value={selectedInquiry.status}
                                    onChange={(e) => handleStatusChange(selectedInquiry._id, e.target.value)}
                                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold border outline-none cursor-pointer transition-colors appearance-none ${selectedInquiry.status === 'unread' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            selectedInquiry.status === 'read' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                'bg-green-500/10 text-green-500 border-green-500/20'
                                        }`}
                                >
                                    <option value="unread" className="bg-card text-foreground">Mark Unread</option>
                                    <option value="read" className="bg-card text-foreground">Mark Read</option>
                                    <option value="resolved" className="bg-card text-foreground">Mark Resolved</option>
                                </select>

                                <a
                                    href={`mailto:${selectedInquiry.email}?subject=Re: Your Inquiry to LocalAwaaz`}
                                    className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-md text-center hidden sm:block"
                                >
                                    Reply via Email
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInquiries;