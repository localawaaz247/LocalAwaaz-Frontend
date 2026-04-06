import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { MapPin, X, User, FileText, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../CustomSelect';

const AdminIssues = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', status: '', city: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const videoRef = useRef(null);

    // 🚀 Swipe-to-Dismiss State & Refs
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const FILTER_STATUS_OPTIONS = [
        { value: '', label: 'All Statuses' },
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_REVIEW', label: 'In Review' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Attention)' },
        { value: 'IN_REVIEW', label: 'IN REVIEW (Initiated)' },
        { value: 'RESOLVED', label: 'RESOLVED (Fixed)' },
        { value: 'REJECTED', label: 'REJECTED (Spam)' }
    ];

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchIssues(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters, page]);

    useEffect(() => {
        if (selectedIssue || showDeleteConfirm) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedIssue, showDeleteConfirm]);

    const currentMedia = selectedIssue?.media?.[currentMediaIndex];
    const isVideo = currentMedia?.url?.match(/\.(mp4|webm|ogg)$/i);

    useEffect(() => {
        if (isModalVisible && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [isModalVisible, currentMediaIndex, isVideo]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/issues', { params: { page, limit: 15, status: filters.status, city: filters.city } });
            setIssues(res.data.data.issues);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleUpdateIssue = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await axiosInstance.patch(`/admin/issue/${selectedIssue._id}`, updateData);
            setIssues(issues.map(iss => iss._id === selectedIssue._id ? res.data.data : iss));
            showToast({ icon: 'success', title: 'Issue updated successfully' });
            closeModal();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Update failed' });
        } finally { setIsUpdating(false); }
    };

    const handleDeleteIssue = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/admin/issue/${selectedIssue._id}`);
            setIssues(issues.filter(iss => iss._id !== selectedIssue._id));
            showToast({ icon: 'success', title: 'Issue deleted successfully' });
            closeModal();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Delete failed' });
        } finally {
            setIsDeleting(false);
        }
    };

    const openModal = (issue) => {
        setSelectedIssue(issue);
        setUpdateData({ status: issue.status, adminRemark: issue.adminRemark || '' });
        setDragY(0);

        const vMedia = Array.isArray(issue.media) ? issue.media : [];
        const firstVideoIndex = vMedia.findIndex(m => m.url?.match(/\.(mp4|webm|ogg)$/i));
        setCurrentMediaIndex(firstVideoIndex !== -1 ? firstVideoIndex : 0);

        setTimeout(() => setIsModalVisible(true), 10);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setShowDeleteConfirm(false);
        setDragY(0);
        setTimeout(() => {
            setSelectedIssue(null);
            setIsDragging(false);
        }, 300);
    };

    // 🚀 Swipe-to-Dismiss Handlers
    const handleTouchStart = (e) => {
        if (e.target.closest('button')) return;
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;

        if (deltaY > 0) {
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (dragY > 150) {
            closeModal();
        } else {
            setDragY(0);
        }
    };

    const statusColors = {
        OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-500 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border-red-500/20"
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in relative flex flex-col h-full">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <h2 className="text-lg md:text-2xl font-bold text-foreground">Issue Management</h2>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                    <div className="relative w-full sm:w-48">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter by City"
                            value={filters.city}
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-card border border-border/50 rounded-lg md:rounded-xl text-[11px] md:text-sm focus:border-primary outline-none transition-colors text-foreground"
                        />
                    </div>
                    <div className="w-full sm:w-40 md:w-48">
                        <CustomSelect
                            options={FILTER_STATUS_OPTIONS}
                            value={filters.status}
                            onChange={(val) => setFilters({ ...filters, status: val })}
                        />
                    </div>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto thin-scrollbar overscroll-x-contain flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        {/* 🚀 FIXED: Changed transparent bg-muted/30 to bg-card/95 backdrop-blur-md and increased z-index */}
                        <thead className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
                            <tr className="text-muted-foreground text-[10px] md:text-sm">
                                <th className="py-2.5 px-3 md:py-4 md:px-6 font-medium">Title</th>
                                <th className="py-2.5 px-3 md:py-4 md:px-6 font-medium hidden sm:table-cell">Category</th>
                                <th className="py-2.5 px-3 md:py-4 md:px-6 font-medium">Status</th>
                                <th className="py-2.5 px-3 md:py-4 md:px-6 font-medium hidden md:table-cell">Location</th>
                                <th className="py-2.5 px-3 md:py-4 md:px-6 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-xs md:text-sm text-muted-foreground">Loading issues...</td></tr>
                            ) : issues.length === 0 ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-xs md:text-sm text-muted-foreground">No issues found.</td></tr>
                            ) : (
                                issues.map((issue) => (
                                    <tr key={issue._id} className="hover:bg-primary/5 transition-colors">
                                        <td className="py-3 px-3 md:py-4 md:px-6 text-[11px] md:text-sm font-medium text-foreground max-w-[120px] sm:max-w-[200px] md:max-w-[250px] truncate">{issue.title}</td>
                                        <td className="py-3 px-3 md:py-4 md:px-6 text-[11px] md:text-sm text-muted-foreground hidden sm:table-cell">{issue.category}</td>
                                        <td className="py-3 px-3 md:py-4 md:px-6">
                                            <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-xs font-semibold border ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 md:py-4 md:px-6 text-[11px] md:text-sm text-muted-foreground hidden md:table-cell">{issue.location?.city}</td>
                                        <td className="py-3 px-3 md:py-4 md:px-6 text-right">
                                            <button onClick={() => openModal(issue)} className="text-[10px] md:text-xs px-2.5 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/20 text-primary rounded-md md:rounded-lg hover:bg-primary/20 transition-colors font-medium">
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center text-[10px] md:text-sm text-muted-foreground pt-1 md:pt-2">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-1.5 md:space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-md md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-md md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
                    </div>
                </div>
            )}

            {/* Modal Overlay */}
            {selectedIssue && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 md:p-6">
                    <div
                        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    />

                    {/* Modal Container */}
                    <div
                        className={`relative bg-background sm:border border-border/50 rounded-t-3xl sm:rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] h-full sm:h-[85vh] overflow-hidden ${isDragging ? '' : 'transform transition-all duration-300 ease-out'
                            } ${isModalVisible
                                ? (dragY > 0 ? 'opacity-100' : 'translate-y-0 sm:scale-100 opacity-100')
                                : 'translate-y-full sm:translate-y-8 sm:scale-95 opacity-0'
                            }`}
                        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : {}}
                        onClick={e => e.stopPropagation()}
                    >

                        {/* Interactive Drag Header Wrapper */}
                        <div
                            className="shrink-0 touch-none select-none sm:cursor-default"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="w-10 h-1.5 bg-border/80 rounded-full mx-auto mt-3 sm:hidden cursor-grab active:cursor-grabbing"></div>

                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-3 px-4 md:p-5 border-b border-border/50 sm:bg-muted/20">
                                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                    <span className={`px-2.5 py-1 md:px-2.5 md:py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                        {selectedIssue.status}
                                    </span>
                                    <span className="px-2.5 py-1 md:px-2.5 md:py-1 rounded-full border border-border/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                                        {selectedIssue.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        title="Delete Issue"
                                        className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 size={18} className="md:w-[18px] md:h-[18px]" />
                                    </button>
                                    <button onClick={closeModal} className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10">
                                        <X size={20} className="md:w-[20px] md:h-[20px]" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar pb-6 sm:pb-0">

                            {/* LEFT SIDE (Details) */}
                            <div className="flex-1 p-4 md:p-6 space-y-4 lg:overflow-y-auto thin-scrollbar">
                                <h3 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{selectedIssue.title}</h3>

                                <div className="w-full bg-black/10 dark:bg-black/30 rounded-xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[220px] sm:h-[350px] lg:h-[400px]">
                                    {selectedIssue.media && selectedIssue.media.length > 0 ? (
                                        <>
                                            {selectedIssue.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video
                                                    ref={videoRef}
                                                    src={selectedIssue.media[currentMediaIndex].url}
                                                    className="w-full h-full object-contain bg-black"
                                                    controls autoPlay muted playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={selectedIssue.media[currentMediaIndex].url}
                                                    alt="issue"
                                                    className="w-full h-full object-contain"
                                                />
                                            )}

                                            {selectedIssue.media.length > 1 && (
                                                <>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + selectedIssue.media.length) % selectedIssue.media.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors shadow-lg"><ChevronLeft size={16} /></button>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % selectedIssue.media.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors shadow-lg"><ChevronRight size={16} /></button>
                                                    <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm">
                                                        {currentMediaIndex + 1} / {selectedIssue.media.length}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center opacity-50 text-muted-foreground">
                                            <AlertTriangle size={28} className="mb-2" />
                                            <p className="text-[11px] md:text-sm font-medium">No Media Attached</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-card border border-border/50 rounded-xl p-3.5 md:p-4">
                                        <h4 className="text-[10px] md:text-[11px] font-bold text-blue-400 mb-1 md:mb-1.5 uppercase flex items-center gap-1.5"><MapPin size={12} className="md:w-3.5 md:h-3.5" /> Location</h4>
                                        <p className="text-xs md:text-sm font-semibold text-foreground">{selectedIssue.location?.city || 'Unknown'}</p>
                                        <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{selectedIssue.location?.address || 'Address not provided'}</p>
                                    </div>
                                    <div className="bg-card border border-border/50 rounded-xl p-3.5 md:p-4">
                                        <h4 className="text-[10px] md:text-[11px] font-bold text-blue-400 mb-1 md:mb-1.5 uppercase flex items-center gap-1.5"><User size={12} className="md:w-3.5 md:h-3.5" /> Reported By</h4>
                                        <p className="text-xs md:text-sm font-semibold text-foreground">{selectedIssue.isAnonymous ? 'Anonymous' : selectedIssue.reportedBy?.name || 'Unknown'}</p>
                                        {!selectedIssue.isAnonymous && selectedIssue.reportedBy && (
                                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">@{selectedIssue.reportedBy.userName} • Score: {selectedIssue.reportedBy.civilScore}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-card border border-border/50 rounded-xl p-3.5 md:p-4 mb-4 lg:mb-0">
                                    <h4 className="text-[10px] md:text-[11px] font-bold text-blue-400 mb-1 md:mb-1.5 uppercase flex items-center gap-1.5"><FileText size={12} className="md:w-3.5 md:h-3.5" /> Description</h4>
                                    <p className="text-[11px] md:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedIssue.description}</p>
                                </div>
                            </div>

                            {/* RIGHT SIDE (Admin Controls) */}
                            <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 p-4 md:p-6 pb-6 md:pb-8 bg-muted/5 lg:bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col lg:overflow-y-auto thin-scrollbar">
                                <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
                                    <div className="bg-card border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-lg md:text-2xl font-bold text-red-500">{selectedIssue.flagCount || 0}</span>
                                        <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase mt-0.5 md:mt-1">Flags</span>
                                    </div>
                                    <div className="bg-card border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-lg md:text-2xl font-bold text-blue-400">{selectedIssue.shareCount || 0}</span>
                                        <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase mt-0.5 md:mt-1">Shares</span>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateIssue} className="flex flex-col flex-1 min-h-0">
                                    <div className="shrink-0 mb-4">
                                        <label className="text-xs md:text-sm font-bold text-foreground mb-1 block">Update Status</label>
                                        <CustomSelect
                                            options={UPDATE_STATUS_OPTIONS}
                                            value={updateData.status}
                                            onChange={(val) => setUpdateData({ ...updateData, status: val })}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-[120px] mb-4">
                                        <label className="text-xs md:text-sm font-bold text-foreground mb-1 block">Official Remark</label>
                                        <textarea
                                            value={updateData.adminRemark}
                                            onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })}
                                            className="w-full flex-1 p-3 bg-card border border-border/50 rounded-xl text-[11px] md:text-sm focus:border-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none thin-scrollbar shadow-sm"
                                            placeholder="Write a public remark detailing the action taken. This will notify the user."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="w-full shrink-0 btn-gradient py-2.5 md:py-3 rounded-xl font-bold text-white text-xs md:text-sm flex justify-center items-center gap-1.5 md:gap-2 shadow-md hover:shadow-lg transition-all mt-auto"
                                    >
                                        {isUpdating ? <MiniLoader className="w-4 h-4" /> : <>Update & Notify <CheckCircle size={14} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                            <div className="bg-card border border-border/50 rounded-2xl p-5 md:p-6 max-w-[320px] md:max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg md:text-xl font-bold text-foreground mb-1.5 md:mb-2">Delete Issue?</h3>
                                <p className="text-[11px] md:text-sm text-muted-foreground mb-5 md:mb-6 leading-relaxed">
                                    Are you sure you want to permanently delete this issue? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-2.5 md:gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium bg-muted/50 text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteIssue}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center min-w-[70px] md:min-w-[80px]"
                                    >
                                        {isDeleting ? <MiniLoader className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminIssues;