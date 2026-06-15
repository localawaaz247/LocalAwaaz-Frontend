import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    MapPin, X, User, FileText, ChevronLeft, ChevronRight,
    CheckCircle, AlertTriangle, Trash2, Search, Shield,
    Leaf, Flame, Clock, History, Briefcase, Download, ArrowRight, RotateCcw
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../CustomSelect';
import { cscApi } from '../../utils/cscAPI';

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

const AdminIssues = () => {
    const [issues, setIssues] = useState([]);
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({ search: '', status: '', state: '', city: '', reporterRole: '' });
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);

    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Modal Action States
    const [actionTab, setActionTab] = useState('STATUS');
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '' });
    const [assignData, setAssignData] = useState({ authorityId: '', commitmentTimeHours: '' });
    const [revokeData, setRevokeData] = useState({ reason: '', penaltyPoints: 0 });
    const [isUpdating, setIsUpdating] = useState(false);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const videoRef = useRef(null);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    const FILTER_STATUS_OPTIONS = [
        { value: '', label: 'All Statuses' },
        { value: 'OPEN', label: 'Open' },
        { value: 'LOCKED', label: 'Locked (Assigned)' },
        { value: 'IN_REVIEW', label: 'In Review' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DISPUTED', label: 'Disputed' }
    ];

    const REPORTER_ROLE_OPTIONS = [
        { value: '', label: 'All Sources' },
        { value: 'citizen', label: 'Citizens' },
        { value: 'official', label: 'Officials' },
        { value: 'ngo', label: 'NGOs' }
    ];

    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Attention)' },
        { value: 'IN_REVIEW', label: 'IN REVIEW (Initiated)' },
        { value: 'RESOLVED', label: 'RESOLVED (Fixed)' },
        { value: 'REJECTED', label: 'REJECTED (Spam)' }
    ];

    useEffect(() => {
        cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error);
        fetchAuthorities();
    }, []);

    useEffect(() => {
        if (!filters.state) {
            setDistrictsList([]);
            return;
        }
        const stateObj = statesList.find(s => s.name === filters.state);
        if (stateObj) {
            cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
        }
    }, [filters.state, statesList]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchIssues(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters, page]);

    useEffect(() => {
        if (selectedIssue || showDeleteConfirm) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedIssue, showDeleteConfirm]);

    useEffect(() => {
        const isVideo = selectedIssue?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (isModalVisible && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [isModalVisible, currentMediaIndex, selectedIssue]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/issues', { params: { page, limit: 15, ...filters } });
            setIssues(res.data.data.issues);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchAuthorities = async () => {
        try {
            const res = await axiosInstance.get('/admin/authorities?status=APPROVED');
            setAuthorities(res.data.data.map(auth => ({
                value: auth._id,
                label: `${auth.name} (${auth.role.toUpperCase()}) - ${auth.authorityProfile?.assignedDistrict || 'N/A'}`,
                district: auth.authorityProfile?.assignedDistrict || auth.contact?.city
            })));
        } catch (error) { console.error(error); }
    };

    const handleGlobalExport = async () => {
        try {
            showToast({ icon: 'loading', title: 'Generating Excel...' });
            const res = await axiosInstance.get('/admin/export/issues', { params: filters, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'LocalAwaaz_Issues.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast({ icon: 'success', title: 'Export Complete!' });
        } catch (error) { showToast({ icon: 'error', title: 'Export failed' }); }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssue._id}`, updateData);
            showToast({ icon: 'success', title: 'Status updated and users notified' });
            closeModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Update failed' });
        } finally { setIsUpdating(false); }
    };

    const handleForceAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssue._id}/force-assign`, assignData);

            const assignedAuth = authorities.find(a => a.value === assignData.authorityId);
            const issueDistrict = selectedIssue.location?.city || selectedIssue.location?.district;
            const authDistrict = assignedAuth?.district;

            const isMismatch = issueDistrict?.toLowerCase() !== authDistrict?.toLowerCase();

            if (isMismatch) {
                showToast({ icon: 'info', title: `Assigned! Note: Official is from ${authDistrict || 'another district'}.` });
            } else {
                showToast({ icon: 'success', title: 'Issue forcefully assigned!' });
            }

            closeModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Assignment failed' });
        } finally { setIsUpdating(false); }
    };

    const handleRevokeAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssue._id}/force-unassign`, {
                reason: revokeData.reason,
                penaltyPoints: Number(revokeData.penaltyPoints)
            });
            showToast({ icon: 'success', title: 'Assignment revoked. Issue is OPEN.' });
            closeModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Revocation failed' });
        } finally { setIsUpdating(false); }
    };

    const handleDeleteIssue = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/admin/issue/${selectedIssue._id}`);
            setIssues(issues.filter(iss => iss._id !== selectedIssue._id));
            showToast({ icon: 'success', title: 'Issue permanently deleted' });
            closeModal();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Delete failed' });
        } finally { setIsDeleting(false); }
    };

    const openModal = async (issue) => {
        setSelectedIssue(issue);
        setUpdateData({ status: issue.status, adminRemark: issue.adminRemark || '' });
        setAssignData({ authorityId: '', commitmentTimeHours: '' });
        setRevokeData({ reason: '', penaltyPoints: 0 });
        setActionTab('STATUS');

        const vMedia = Array.isArray(issue.media) ? issue.media : [];
        const firstVideoIndex = vMedia.findIndex(m => m.url?.match(/\.(mp4|webm|ogg)$/i));
        setCurrentMediaIndex(firstVideoIndex !== -1 ? firstVideoIndex : 0);

        setTimeout(() => setIsModalVisible(true), 10);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setShowDeleteConfirm(false);
        setDragY(0);
        setTimeout(() => { setSelectedIssue(null); setIsDragging(false); }, 300);
    };

    const handleTouchStart = (e) => {
        if (e.target.closest('button') || e.target.closest('.overflow-y-auto')) return;
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };
    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].clientY - touchStartY.current;
        if (deltaY > 0) setDragY(deltaY);
    };
    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 150) closeModal();
        else setDragY(0);
    };

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    const statusColors = {
        OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-500 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
        DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/20"
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

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full">

            {/* Control Deck */}
            <div className="bg-card glass-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-4 relative z-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" /> Issue Center
                        </h2>
                        <button onClick={handleGlobalExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold transition-colors shrink-0">
                            <Download size={14} /> Export
                        </button>
                    </div>

                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search Title, Pincode, ID..."
                            value={filters.search}
                            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground shadow-inner"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <CustomSelect options={stateOptions} value={filters.state} onChange={(val) => { setFilters({ ...filters, state: val, city: '' }); setPage(1); }} />
                    <CustomSelect options={districtOptions} value={filters.city} onChange={(val) => { setFilters({ ...filters, city: val }); setPage(1); }} />
                    <CustomSelect options={REPORTER_ROLE_OPTIONS} value={filters.reporterRole} onChange={(val) => { setFilters({ ...filters, reporterRole: val }); setPage(1); }} />
                    <CustomSelect options={FILTER_STATUS_OPTIONS} value={filters.status} onChange={(val) => { setFilters({ ...filters, status: val }); setPage(1); }} />
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0 relative z-10">
                <div className="overflow-x-auto thin-scrollbar overscroll-x-contain flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
                            <tr className="text-muted-foreground text-[10px] md:text-sm">
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Issue Detail</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden md:table-cell">Source</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Status & Assignment</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden lg:table-cell">Location</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-sm text-muted-foreground">Loading forensic database...</td></tr>
                            ) : issues.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-sm text-muted-foreground">No issues found matching parameters.</td></tr>
                            ) : (
                                issues.map((issue, index) => (
                                    <tr key={issue._id} className="hover:bg-primary/5 transition-colors relative" style={{ zIndex: issues.length - index }}>
                                        <td className="py-3 px-4 md:py-4 md:px-6">
                                            <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                                                <div className="flex items-center gap-2">
                                                    {issue.priority === 'CRITICAL' && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                                    <span className="text-[11px] md:text-sm font-medium text-foreground truncate">{issue.title}</span>
                                                </div>
                                                <span className="text-[9px] md:text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{issue.category}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 w-max px-2 py-1 rounded-md border border-border/50">
                                                {issue.isAnonymous ? <User size={12} className="opacity-50" /> :
                                                    issue.reportedBy?.role === 'official' ? <Shield size={12} className="text-blue-500" /> :
                                                        issue.reportedBy?.role === 'ngo' ? <Leaf size={12} className="text-green-500" /> :
                                                            <User size={12} className="text-foreground" />}
                                                <span className="capitalize font-medium">{issue.isAnonymous ? 'Anonymous' : issue.reportedBy?.role || 'Citizen'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6">
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                        {issue.status}
                                                    </span>
                                                    <span className="text-[9px] md:text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> {timeAgo(issue.createdAt)}</span>
                                                </div>

                                                {/* Assigned Official Details */}
                                                {issue.bidding?.winningBid?.authorityId && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 flex flex-col">
                                                        <span className="font-semibold text-indigo-500 truncate max-w-[150px]">
                                                            Assigned: {issue.bidding.winningBid.authorityId.name || 'ID Linked'}
                                                        </span>
                                                        <span>Time: {issue.bidding.winningBid.commitmentTimeHours} hrs</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 hidden lg:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">{issue.location?.city}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{issue.location?.state}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-right">
                                            <button onClick={() => openModal(issue)} className="text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-md md:rounded-lg shadow hover:bg-primary/90 transition-all font-bold">
                                                Audit Log
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
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-card glass-card border border-border/50 rounded-lg">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-card glass-card border border-border/50 rounded-lg">Next</button>
                    </div>
                </div>
            )}

            {/* Forensic Modal Overlay */}
            {selectedIssue && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeModal} />

                    <div
                        className={`relative bg-background border border-border/50 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] my-4 overflow-hidden transition-all duration-300 ${isModalVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-3 md:p-4 border-b border-border/50 bg-muted/20 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                    {selectedIssue.status}
                                </span>
                                <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {selectedIssue._id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowDeleteConfirm(true)} title="Delete Issue" className="p-1.5 rounded-full text-red-500 hover:bg-red-500/20 transition-colors"><Trash2 size={18} /></button>
                                <button onClick={closeModal} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"><X size={20} /></button>
                            </div>
                        </div>

                        {/* 🚀 FIXED: Inner Flex Layout handles Mobile Scroll smoothly */}
                        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">

                            {/* LEFT COLUMN: Media & Core Data */}
                            <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-4 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar">
                                <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{selectedIssue.title}</h3>

                                <div className="w-full bg-black/10 dark:bg-black/30 rounded-xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[200px] sm:h-[300px] shrink-0">
                                    {selectedIssue.media && selectedIssue.media.length > 0 ? (
                                        <>
                                            {selectedIssue.media[currentMediaIndex].url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video ref={videoRef} src={selectedIssue.media[currentMediaIndex].url} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                                            ) : (
                                                <img src={selectedIssue.media[currentMediaIndex].url} alt="issue" className="w-full h-full object-contain" />
                                            )}
                                            {selectedIssue.media.length > 1 && (
                                                <>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + selectedIssue.media.length) % selectedIssue.media.length)} className="absolute left-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"><ChevronLeft size={16} /></button>
                                                    <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % selectedIssue.media.length)} className="absolute right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"><ChevronRight size={16} /></button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-50"><AlertTriangle size={28} className="mb-2" /><p className="text-sm">No Media Attached</p></div>
                                    )}
                                </div>

                                <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-foreground"><MapPin size={12} className="inline mr-1" /> {selectedIssue.location?.city}, {selectedIssue.location?.state}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1">{selectedIssue.location?.address} • PIN: {selectedIssue.location?.pinCode}</p>
                                </div>
                                <div className="bg-muted/10 border border-border/50 rounded-xl p-4 mb-2 lg:mb-0">
                                    <p className="text-[11px] md:text-sm text-muted-foreground whitespace-pre-wrap">{selectedIssue.description}</p>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: The Players, ACTION ZONE & Timeline */}
                            <div className="w-full lg:w-1/2 flex flex-col bg-muted/5 shrink-0 lg:shrink relative z-30">

                                {/* The Players */}
                                <div className="p-4 md:p-5 border-b border-border/50 shrink-0">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-card border border-border/50 p-3 rounded-xl">
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Reporter</p>
                                            <p className="text-sm font-bold truncate text-foreground">{selectedIssue.isAnonymous ? 'Anonymous' : selectedIssue.reportedBy?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="bg-card border border-border/50 p-3 rounded-xl">
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Assigned Official</p>
                                            {selectedIssue.bidding?.winningBid?.authorityId ? (
                                                <div>
                                                    <p className="text-sm font-bold text-indigo-500 truncate">{selectedIssue.bidding.winningBid.authorityId.name || 'ID Linked'}</p>
                                                    <p className="text-[10px] text-muted-foreground">Hrs: {selectedIssue.bidding.winningBid.commitmentTimeHours}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic mt-1">Pending</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION ZONE: Guaranteed visible Dropdown */}
                                <div className="p-4 md:p-5 border-b border-border/50 shrink-0 bg-background relative z-50">
                                    <div className="flex gap-4 mb-3 border-b border-border/50">
                                        <button onClick={() => setActionTab('STATUS')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'STATUS' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>Update Status</button>

                                        {selectedIssue.bidding?.winningBid?.authorityId ? (
                                            <button onClick={() => setActionTab('REVOKE')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'REVOKE' ? 'text-red-500 border-b-2 border-red-500' : 'text-muted-foreground'}`}>Revoke Assignment</button>
                                        ) : (
                                            <button onClick={() => setActionTab('ASSIGN')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'ASSIGN' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-muted-foreground'}`}>Force Assign</button>
                                        )}
                                    </div>

                                    {actionTab === 'STATUS' && (
                                        <form onSubmit={handleUpdateStatus} className="flex flex-col gap-2 relative">
                                            <div className="flex gap-2 relative">
                                                <div className="w-1/2">
                                                    <CustomSelect options={UPDATE_STATUS_OPTIONS} value={updateData.status} onChange={(val) => setUpdateData({ ...updateData, status: val })} />
                                                </div>
                                                <input type="text" value={updateData.adminRemark} onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })} placeholder="Audit Remark..." className="w-1/2 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs focus:border-primary outline-none" required />
                                            </div>
                                            <button type="submit" disabled={isUpdating} className="w-full py-2.5 mt-1 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5">
                                                {isUpdating ? <MiniLoader className="w-3.5 h-3.5" /> : <>Log Action <CheckCircle size={14} /></>}
                                            </button>
                                        </form>
                                    )}

                                    {actionTab === 'ASSIGN' && (
                                        <form onSubmit={handleForceAssign} className="flex flex-col gap-2 relative z-50">
                                            <div className="flex gap-2 relative">
                                                <div className="w-1/2 relative z-50">
                                                    <CustomSelect options={authorities} value={assignData.authorityId} onChange={(val) => setAssignData({ ...assignData, authorityId: val })} placeholder="Select Official..." />
                                                </div>
                                                <input type="number" min="1" value={assignData.commitmentTimeHours} onChange={(e) => setAssignData({ ...assignData, commitmentTimeHours: e.target.value })} placeholder="Hrs (e.g. 24)" className="w-1/2 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs focus:border-indigo-500 outline-none relative z-10" required />
                                            </div>
                                            <button type="submit" disabled={isUpdating || !assignData.authorityId || !assignData.commitmentTimeHours} className="w-full mt-1 py-2.5 bg-indigo-500 text-white disabled:bg-indigo-500/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 relative z-10">
                                                {isUpdating ? <MiniLoader className="w-3.5 h-3.5" /> : <>Lock Job <ArrowRight size={14} /></>}
                                            </button>
                                        </form>
                                    )}

                                    {actionTab === 'REVOKE' && (
                                        <form onSubmit={handleRevokeAssign} className="flex flex-col gap-2">
                                            <div className="flex gap-2 relative">
                                                <input type="number" min="0" value={revokeData.penaltyPoints} onChange={(e) => setRevokeData({ ...revokeData, penaltyPoints: e.target.value })} placeholder="Penalty Points" className="w-1/3 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs focus:border-red-500 outline-none" required />
                                                <input type="text" value={revokeData.reason} onChange={(e) => setRevokeData({ ...revokeData, reason: e.target.value })} placeholder="Reason for revocation..." className="w-2/3 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs focus:border-red-500 outline-none" required />
                                            </div>
                                            <button type="submit" disabled={isUpdating || !revokeData.reason} className="w-full py-2.5 mt-1 bg-red-500 text-white disabled:bg-red-500/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5">
                                                {isUpdating ? <MiniLoader className="w-3.5 h-3.5" /> : <>Revoke <RotateCcw size={14} /></>}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Audit Timeline Section */}
                                <div className="flex-1 p-4 md:p-5 lg:overflow-y-auto thin-scrollbar relative z-10">
                                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent pb-4">
                                        {generateTimeline(selectedIssue).map((event, i) => (
                                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${event.color} z-10`}>
                                                    {event.icon}
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                                                    <h5 className="font-bold text-[11px] md:text-xs uppercase">{event.label}</h5>
                                                    <div className="text-[9px] text-muted-foreground font-mono mb-1.5">{event.time.toLocaleString()}</div>
                                                    {event.detail && <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">{event.detail}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Nuclear Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border border-red-500/30 rounded-2xl p-5 md:p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Nuclear Delete
                        </h3>
                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                            This will permanently wipe this issue, all associated bids, and scrub all related notifications from existence. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-medium bg-muted/50 hover:bg-muted transition-colors">Cancel</button>
                            <button onClick={handleDeleteIssue} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center min-w-[80px]">
                                {isDeleting ? <MiniLoader className="w-4 h-4 text-white" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIssues;