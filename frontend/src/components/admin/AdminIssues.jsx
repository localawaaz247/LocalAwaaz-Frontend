import React, { useState, useEffect } from 'react';
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

    const FILTER_STATUS_OPTIONS = [
        { value: '', label: 'All Statuses' },
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_REVIEW', label: 'In Review' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Requires Attention)' },
        { value: 'IN_REVIEW', label: 'IN REVIEW (Action Initiated)' },
        { value: 'RESOLVED', label: 'RESOLVED (Issue Fixed)' },
        { value: 'REJECTED', label: 'REJECTED (Invalid/Spam)' }
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
        setCurrentMediaIndex(0);
        setTimeout(() => setIsModalVisible(true), 10);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setShowDeleteConfirm(false);
        setTimeout(() => setSelectedIssue(null), 300);
    };

    const statusColors = {
        OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-500 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border-red-500/20"
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in relative flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Issue Management</h2>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter by City"
                            value={filters.city}
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-card border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <CustomSelect
                            options={FILTER_STATUS_OPTIONS}
                            value={filters.status}
                            onChange={(val) => setFilters({ ...filters, status: val })}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto thin-scrollbar flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
                            <tr className="text-muted-foreground text-xs md:text-sm">
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Title</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden sm:table-cell">Category</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Status</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden md:table-cell">Location</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-sm text-muted-foreground">Loading issues...</td></tr>
                            ) : issues.length === 0 ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-sm text-muted-foreground">No issues found.</td></tr>
                            ) : (
                                issues.map((issue) => (
                                    <tr key={issue._id} className="hover:bg-primary/5 transition-colors">
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm font-medium text-foreground max-w-[150px] md:max-w-[250px] truncate">{issue.title}</td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm text-muted-foreground hidden sm:table-cell">{issue.category}</td>
                                        <td className="py-3 px-4 md:py-4 md:px-6">
                                            <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm text-muted-foreground hidden md:table-cell">{issue.location?.city}</td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-right">
                                            <button onClick={() => openModal(issue)} className="text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/20 text-primary rounded-md md:rounded-lg hover:bg-primary/20 transition-colors font-medium">
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

            {totalPages > 1 && (
                <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground pt-2">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-1.5 md:space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
                    </div>
                </div>
            )}

            {selectedIssue && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
                    <div
                        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    />

                    <div
                        className={`relative bg-card border-t sm:border border-border/50 rounded-t-3xl sm:rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[82vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out ${isModalVisible
                            ? 'translate-y-0 sm:scale-100 opacity-100'
                            : 'translate-y-full sm:translate-y-8 sm:scale-95 opacity-0'
                            }`}
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                    {selectedIssue.status}
                                </span>
                                <span className="px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                                    {selectedIssue.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    title="Delete Issue"
                                    className="p-2 md:p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button onClick={closeModal} className="p-2 md:p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto thin-scrollbar">
                            <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold text-foreground">{selectedIssue.title}</h3>

                                <div className="w-full bg-black/20 rounded-xl border border-border/50 overflow-hidden relative flex items-center justify-center">
                                    {selectedIssue.media && selectedIssue.media.length > 0 ? (
                                        <>
                                            {selectedIssue.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video src={selectedIssue.media[currentMediaIndex].url} className="w-full max-h-[300px] md:max-h-[400px] object-contain" controls />
                                            ) : (
                                                <img src={selectedIssue.media[currentMediaIndex].url} alt="issue" className="w-full max-h-[300px] md:max-h-[400px] object-contain" />
                                            )}
                                            {selectedIssue.media.length > 1 && (
                                                <>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + selectedIssue.media.length) % selectedIssue.media.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><ChevronLeft size={18} /></button>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % selectedIssue.media.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><ChevronRight size={18} /></button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center opacity-50 text-muted-foreground">
                                            <AlertTriangle size={32} className="mb-2" />
                                            <p className="text-sm font-medium">No Media Attached</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-background/40 border border-border/50 rounded-xl p-4">
                                        <h4 className="text-[11px] font-bold text-blue-400 mb-1.5 uppercase flex items-center gap-1.5"><MapPin size={14} /> Location</h4>
                                        <p className="text-sm font-semibold text-foreground">{selectedIssue.location?.city || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{selectedIssue.location?.address || 'Address not provided'}</p>
                                    </div>
                                    <div className="bg-background/40 border border-border/50 rounded-xl p-4">
                                        <h4 className="text-[11px] font-bold text-blue-400 mb-1.5 uppercase flex items-center gap-1.5"><User size={14} /> Reported By</h4>
                                        <p className="text-sm font-semibold text-foreground">{selectedIssue.isAnonymous ? 'Anonymous' : selectedIssue.reportedBy?.name || 'Unknown'}</p>
                                        {!selectedIssue.isAnonymous && selectedIssue.reportedBy && (
                                            <p className="text-xs text-muted-foreground mt-1">@{selectedIssue.reportedBy.userName} • Score: {selectedIssue.reportedBy.civilScore}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-background/40 border border-border/50 rounded-xl p-4">
                                    <h4 className="text-[11px] font-bold text-blue-400 mb-1.5 uppercase flex items-center gap-1.5"><FileText size={14} /> Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedIssue.description}</p>
                                </div>
                            </div>

                            <div className="w-full lg:w-[350px] shrink-0 p-4 md:p-6 bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col">
                                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                                    <div className="bg-card border border-border/50 rounded-xl p-3 md:p-4 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-xl md:text-2xl font-bold text-red-500">{selectedIssue.flagCount || 0}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Flags</span>
                                    </div>
                                    <div className="bg-card border border-border/50 rounded-xl p-3 md:p-4 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-xl md:text-2xl font-bold text-blue-400">{selectedIssue.shareCount || 0}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Shares</span>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateIssue} className="flex flex-col space-y-4 md:space-y-5 flex-1">
                                    <div>
                                        <label className="text-sm font-bold text-foreground mb-1.5 block">Update Status</label>
                                        <CustomSelect
                                            options={UPDATE_STATUS_OPTIONS}
                                            value={updateData.status}
                                            onChange={(val) => setUpdateData({ ...updateData, status: val })}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <label className="text-sm font-bold text-foreground mb-1.5 block">Official Remark</label>
                                        <textarea
                                            value={updateData.adminRemark}
                                            onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })}
                                            className="w-full flex-1 min-h-[120px] p-4 bg-card border border-border/50 rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none thin-scrollbar shadow-sm"
                                            placeholder="Write a public remark detailing the action taken. This will notify the user."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="w-full btn-gradient py-3.5 rounded-xl font-bold text-white text-sm md:text-base flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all mt-2 mb-4 md:mb-0"
                                    >
                                        {isUpdating ? <MiniLoader className="w-5 h-5" /> : <>Update & Notify <CheckCircle size={16} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                            <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-xl font-bold text-foreground mb-2">Delete Issue?</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Are you sure you want to permanently delete this issue? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-muted/50 text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteIssue}
                                        disabled={isDeleting}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center min-w-[80px]"
                                    >
                                        {isDeleting ? <MiniLoader className="w-4 h-4 text-white" /> : 'Delete'}
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