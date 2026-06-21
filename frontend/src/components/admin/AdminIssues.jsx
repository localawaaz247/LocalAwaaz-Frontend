import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, X, User, FileText, ChevronLeft, ChevronRight,
    CheckCircle, AlertTriangle, Trash2, Search, Shield,
    Leaf, Flame, Clock, History, Briefcase, Download, ArrowRight, RotateCcw,
    ShieldAlert, Zap, MoreVertical, Ban, AlertOctagon, Trophy, Medal, Star, CheckSquare,
    Filter, Camera, Users,
    ListIcon
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../../components/CustomSelect';
import { cscApi } from '../../utils/cscAPI';
import { socket } from '../../utils/socket';

// --- HELPERS ---
const getCorsSafeUrl = (url) => {
    if (!url) return null;
    if (url.includes('ui-avatars.com')) return url;
    const baseUrl = axiosInstance.defaults.baseURL || '';
    return `${baseUrl}/proxy-image?url=${encodeURIComponent(url)}`;
};

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

const generateTimeline = (issue) => {
    if (!issue) return [];
    const combined = [];
    combined.push({ type: 'create', label: 'Issue Reported', time: new Date(issue.createdAt), icon: <FileText size={14} />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' });

    if (issue.statusHistory) {
        issue.statusHistory.forEach(sh => {
            combined.push({ type: 'status', label: `Status changed to ${sh.status}`, time: new Date(sh.changedAt), detail: sh.remark, icon: <History size={14} />, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' });
        });
    }
    if (issue.auditLog) {
        issue.auditLog.forEach(al => {
            combined.push({ type: 'audit', label: al.action.replace(/_/g, ' '), time: new Date(al.timestamp), detail: al.details, icon: <Shield size={14} />, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' });
        });
    }
    return combined.sort((a, b) => b.time - a.time);
};

const statusColors = {
    OPEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    LOCKED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    PENDING_EXTENSION: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    AWAITING_HANDOVER: "bg-red-500/10 text-red-500 border-red-500/30",
    IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    RESOLVED: "bg-green-500/10 text-green-500 border-green-500/30",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/30",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
    DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    RELEASED: "bg-amber-500/10 text-amber-500 border-amber-500/30"
};

const Avatar = ({ src, name, size = "w-10 h-10", iconSize = "w-5 h-5" }) => {
    const [imageError, setImageError] = useState(false);
    useEffect(() => { setImageError(false); }, [src]);
    if (!src || imageError) {
        return (
            <div className={`${size} shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary`}>
                <User className={iconSize} />
            </div>
        );
    }
    return <img src={getCorsSafeUrl(src)} alt={name || "User"} onError={() => setImageError(true)} crossOrigin="anonymous" className={`${size} shrink-0 rounded-full object-cover border border-border/50 bg-muted`} />;
};

const AdminIssues = () => {
    const { user } = useSelector((state) => state.auth);
    const [isMounted, setIsMounted] = useState(false);

    const [issues, setIssues] = useState([]);
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({ search: '', status: '', state: '', city: '', reporterRole: '' });
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // --- MODALS & EXTENDED UI STATES ---
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
    const [careerModal, setCareerModal] = useState({ isOpen: false, profile: null, history: null, view: 'OVERVIEW', selectedCategory: '', issueList: [] });

    // 🟢 Dynamic Z-Index for perfectly stacking modals
    const [modalZ, setModalZ] = useState({ issue: 200, career: 200 });

    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const [actionTab, setActionTab] = useState('STATUS');
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '', resolvedByAuthority: '' });
    const [assignData, setAssignData] = useState({ authorityId: '', commitmentTimeHours: '' });
    const [revokeData, setRevokeData] = useState({ reason: '', penaltyPoints: 0 });
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionMedia, setActionMedia] = useState(null);

    // Media Viewer States
    const [mediaTab, setMediaTab] = useState('REPORTED');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const videoRef = useRef(null);

    const FILTER_STATUS_OPTIONS = [
        { value: '', label: 'All Statuses' },
        { value: 'OPEN', label: 'Open (Auction)' },
        { value: 'LOCKED', label: 'Locked (Assigned)' },
        { value: 'PENDING_EXTENSION', label: 'Pending Extension' },
        { value: 'AWAITING_HANDOVER', label: 'Awaiting Handover' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'FAILED', label: 'Failed (Ghosted/Missed)' },
        { value: 'DISPUTED', label: 'Disputed' },
        { value: 'RELEASED', label: 'Released' },
        { value: 'ORPHANED', label: 'Orphaned' }
    ];

    const REPORTER_ROLE_OPTIONS = [
        { value: '', label: 'All Sources' },
        { value: 'citizen', label: 'Citizens' },
        { value: 'official', label: 'Officials' },
        { value: 'ngo', label: 'NGOs' }
    ];
    const CATEGORIES = [
        { value: '', label: 'All Categories' },
        { value: 'ROAD_&_POTHOLES', label: 'Road & Potholes' },
        { value: 'WATER_SUPPLY', label: 'Water Supply' },
        { value: 'ELECTRICITY', label: 'Electricity' },
        { value: 'SAFETY', label: 'Safety' },
        { value: 'SANITATION', label: 'Sanitation' },
        { value: 'GARBAGE', label: 'Garbage' },
        { value: 'DRAINAGE', label: 'Drainage' },
        { value: 'Other', lablel: 'Other' }
    ];

    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Auction)' },
        { value: 'LOCKED', label: 'LOCKED (Assigned)' },
        { value: 'PENDING_EXTENSION', label: 'PENDING EXTENSION' },
        { value: 'AWAITING_HANDOVER', label: 'AWAITING HANDOVER' },
        { value: 'RESOLVED', label: 'RESOLVED (Fixed)' },
        { value: 'FAILED', label: 'FAILED' },
        { value: 'DISPUTED', label: 'DISPUTED (Conflict)' },
        { value: 'RELEASED', label: 'RELEASED' },
        { value: 'ORPHANED', label: 'ORPHANED (Stagnant)' }
    ];

    useEffect(() => {
        setIsMounted(true);
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
        // 1. Listen for full issue updates (e.g., Force Assign, Triage actions)
        socket.on('issue_updated', (data) => {
            setIssues((prevIssues) =>
                prevIssues.map((issue) =>
                    // Replace the old issue data with the freshly updated data from the backend
                    issue._id === data.issueId ? data.updatedData : issue
                )
            );
        });

        // 2. Listen for simple status changes
        socket.on('issue_status_updated', (data) => {
            setIssues((prevIssues) =>
                prevIssues.map((issue) =>
                    issue._id === data.issueId ? { ...issue, status: data.newStatus } : issue
                )
            );
        });

        // 3. Listen for nuclear deletes
        socket.on('issue_deleted', (data) => {
            setIssues((prevIssues) =>
                prevIssues.filter((issue) => issue._id !== data.issueId)
            );
        });

        // Cleanup: Prevent memory leaks and duplicate listeners when component unmounts
        return () => {
            socket.off('issue_updated');
            socket.off('issue_status_updated');
            socket.off('issue_deleted');
        };
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchIssues(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters, page]);

    // Body Scroll Lock
    useEffect(() => {
        if (isModalVisible || showDeleteConfirm || careerModal.isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalVisible, showDeleteConfirm, careerModal.isOpen]);

    useEffect(() => { setCurrentMediaIndex(0); }, [mediaTab]);

    // Modal Video Autoplay
    useEffect(() => {
        const isVideo = selectedIssueForDetail?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (isModalVisible && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [isModalVisible, currentMediaIndex, selectedIssueForDetail, mediaTab]);

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

    // 🟢 Central Modal Controllers with Dynamic Z-Index
    const openModal = async (issueId) => {
        try {
            showToast({ icon: 'loading', title: 'Loading details...' });
            const res = await axiosInstance.get(`/admin/issue/${issueId}`);

            const fetchedIssue = res.data.data?.issue || res.data.data;
            const currentAssignee = fetchedIssue.bidding?.winningBid?.authorityId;
            const assigneeId = currentAssignee ? (currentAssignee._id || currentAssignee) : '';

            setSelectedIssueForDetail(fetchedIssue);

            setUpdateData({
                status: fetchedIssue.status,
                adminRemark: fetchedIssue.adminRemark || '',
                resolvedByAuthority: fetchedIssue.resolvedByAuthority ||
                    fetchedIssue.resolutionEvidence?.resolvedByAuthority ||
                    assigneeId || ''
            });

            setAssignData({ authorityId: '', commitmentTimeHours: '' });
            setRevokeData({ reason: '', penaltyPoints: 0 });
            setActionMedia(null);
            setActionTab('STATUS');
            setMediaTab('REPORTED');
            setCurrentMediaIndex(0);

            // Pop issue modal above career modal if career modal happens to be open
            setModalZ(prev => ({ ...prev, issue: (prev.career || 200) + 10 }));
            setIsModalVisible(true);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load issue details' });
        }
    };

    const closeIssueModal = () => {
        setIsModalVisible(false);
        setShowDeleteConfirm(false);
        setActionMenuOpen(false);
        setTimeout(() => {
            setSelectedIssueForDetail(null);
            setActionMedia(null);
        }, 300);
    };

    const openCareerModal = async (userId) => {
        if (!userId) return;
        try {
            const res = await axiosInstance.get(`/admin/user/${userId}`);

            // Pop career modal above issue modal
            setModalZ(prev => ({ ...prev, career: prev.issue + 10 }));
            setCareerModal({
                isOpen: true,
                profile: res.data.data.user,
                history: res.data.data.history || {},
                view: 'OVERVIEW',
                selectedCategory: '',
                issueList: []
            });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load user profile' });
        }
    };

    // --- QUICK ACTIONS ---
    const handleQuickSuspend = async (userId) => {
        try {
            await axiosInstance.patch(`/admin/user/${userId}/status`, { accountStatus: 'SUSPENDED' });
            showToast({ icon: 'success', title: 'User account suspended for 24h.' });
            setActionMenuOpen(false);
        } catch (error) { showToast({ icon: 'error', title: 'Failed to suspend user.' }); }
    };

    const handleQuickWarn = async () => {
        showToast({ icon: 'success', title: 'Official warning sent to user.' });
        setActionMenuOpen(false);
    };

    // --- GOD MODE HANDLERS ---
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            let payload = { ...updateData };
            let headers = {};

            if (['DISPUTED', 'RESOLVED'].includes(updateData.status) && actionMedia) {
                payload = new FormData();
                payload.append('status', updateData.status);
                payload.append('adminRemark', updateData.adminRemark);
                if (updateData.resolvedByAuthority) {
                    payload.append('resolvedByAuthority', updateData.resolvedByAuthority);
                }
                payload.append('media', actionMedia);
                headers = { 'Content-Type': 'multipart/form-data' };
            }

            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}`, payload, { headers });
            showToast({ icon: 'success', title: 'Status updated successfully' });
            closeIssueModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Update failed' });
        } finally { setIsUpdating(false); }
    };

    const handleForceAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}/force-assign`, { authorityId: assignData.authorityId, commitmentTimeHours: Number(assignData.commitmentTimeHours) });
            showToast({ icon: 'success', title: 'Issue forcefully assigned!' });
            closeIssueModal();
            fetchIssues();
        } catch (error) { showToast({ icon: 'error', title: 'Assignment failed' }); }
        finally { setIsUpdating(false); }
    };

    const handleRevokeAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}/force-unassign`, {
                reason: revokeData.reason,
                penaltyPoints: Number(revokeData.penaltyPoints)
            });
            showToast({ icon: 'success', title: 'Assignment revoked. Issue is OPEN.' });
            closeIssueModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Revocation failed' });
        } finally { setIsUpdating(false); }
    };

    const handleExtensionAction = async (action, timeValue, timeUnit) => {
        setIsUpdating(true);
        try {
            const payload = { action };
            if (action === 'APPROVED') {
                payload.timeValue = timeValue;
                payload.timeUnit = timeUnit;
            }

            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}/extension`, payload);
            showToast({ icon: 'success', title: `Extension ${action.toLowerCase()}!` });
            closeIssueModal();
            fetchIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to process extension' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteIssue = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/admin/issue/${selectedIssueForDetail._id}`);
            setIssues(issues.filter(iss => iss._id !== selectedIssueForDetail._id));
            showToast({ icon: 'success', title: 'Issue permanently deleted' });
            closeIssueModal();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Delete failed' });
        } finally { setIsDeleting(false); }
    };

    // 🟢 Media Tabs Parsing
    let claimedUrls = [];
    let opposedUrls = [];
    let reportedUrls = [];
    let activeMediaArray = [];

    if (selectedIssueForDetail) {
        claimedUrls = [
            selectedIssueForDetail.resolutionEvidence?.mediaUrl,
            ...(selectedIssueForDetail.workCycle?.handoverReports?.map(h => h.photoUrl) || [])
        ].filter(Boolean);

        opposedUrls = [
            selectedIssueForDetail.disputeEvidence?.mediaUrl,
            selectedIssueForDetail.reportedByVerdictMedia,
            ...(selectedIssueForDetail.confirmations?.map(c => c.verdictMedia) || [])
        ].filter(Boolean);

        reportedUrls = (selectedIssueForDetail.media || [])
            .map(m => m.url)
            .filter(url => !claimedUrls.includes(url) && !opposedUrls.includes(url));

        activeMediaArray = mediaTab === 'REPORTED' ? reportedUrls
            : mediaTab === 'CLAIMED' ? claimedUrls
                : opposedUrls;
    }

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 flex flex-col h-full overflow-y-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <Briefcase className="text-primary w-8 h-8" /> Issue Triage
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Monitor, override, and re-assign civic issues across the platform.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleGlobalExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0"
                >
                    <Download size={18} /> Export Data
                </motion.button>
            </div>

            {/* Mobile Filter Toggle Header */}
            <div className="flex md:hidden justify-between items-center mt-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Search className="text-primary" size={20} /> Browse Issues
                </h3>
                <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filters Section */}
            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]`}>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search Title, Pincode, ID..."
                            value={filters.search}
                            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-3 flex-col sm:flex-row flex-wrap xl:flex-nowrap relative z-[70]">
                        <div className="w-full sm:w-36 relative z-[74]"><CustomSelect options={stateOptions} value={filters.state} onChange={v => { setFilters({ ...filters, state: v, city: '' }); setPage(1); }} /></div>
                        <div className="w-full sm:w-36 relative z-[73]"><CustomSelect options={districtOptions} value={filters.city} onChange={v => { setFilters({ ...filters, city: v }); setPage(1); }} /></div>
                        <div className="w-full sm:w-40 relative z-[72]"><CustomSelect options={CATEGORIES} value={filters.category} onChange={v => { setFilters({ ...filters, category: v }); setPage(1); }} /></div>
                        <div className="w-full sm:w-40 relative z-[71]"><CustomSelect options={FILTER_STATUS_OPTIONS} value={filters.status} onChange={v => { setFilters({ ...filters, status: v }); setPage(1); }} /></div>
                    </div>
                </div>
            </div>

            {/* 🟢 Mobile Card View Wrapper (Hidden on md+) */}
            <div className="md:hidden flex flex-col gap-3 relative z-[10] mb-6">
                <AnimatePresence>
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-card/60 border border-border/60 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                                        <div className="h-3 w-1/2 bg-muted/50 rounded"></div>
                                    </div>
                                    <div className="h-6 w-16 bg-muted rounded-md shrink-0"></div>
                                </div>
                                <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                    <div className="h-3 w-24 bg-muted/50 rounded"></div>
                                    <div className="h-4 w-12 bg-muted rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : issues.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                            <Search className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">No issues found matching your filters.</p>
                        </motion.div>
                    ) : (
                        issues.map((issue) => {
                            const isMyJob = issue.bidding?.winningBid?.authorityId === user?._id;
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={issue._id}
                                    onClick={() => openModal(issue._id)}
                                    className="bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                                                {issue.title}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">{issue.category}</p>
                                        </div>
                                        <span className={`shrink-0 text-[9px] border px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground flex items-center gap-1"><MapPin size={12} className="opacity-50" />{issue.location?.city || issue.location?.district || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">{issue.location?.state || 'Unknown'}</p>
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

            {/* 🟢 Desktop Table Wrapper */}
            <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col min-h-[400px] relative z-10">
                <div className="overflow-x-auto thin-scrollbar flex-1 bg-background/20">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/40 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                            <tr className="text-muted-foreground text-[10px] md:text-sm uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold">Issue Detail</th>
                                <th className="py-4 px-6 font-bold hidden md:table-cell">Source</th>
                                <th className="py-4 px-6 font-bold">Status & Timeline</th>
                                <th className="py-4 px-6 font-bold hidden lg:table-cell">Location</th>
                                <th className="py-4 px-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <AnimatePresence>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-border/30">
                                            <td className="py-4 px-6"><div className="h-4 w-48 bg-muted rounded mb-2"></div><div className="h-3 w-24 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6"><div className="h-6 w-24 bg-muted rounded-md"></div></td>
                                            <td className="py-4 px-6"><div className="h-5 w-20 bg-muted rounded-md mb-2"></div><div className="h-3 w-16 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6"><div className="h-4 w-32 bg-muted rounded mb-2"></div><div className="h-3 w-20 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6 flex justify-end"><div className="h-8 w-20 bg-muted rounded-lg"></div></td>
                                        </tr>
                                    ))
                                ) : issues.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan="5" className="p-12 text-center text-sm font-medium text-muted-foreground">
                                            <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                            <p>No issues found matching parameters.</p>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    issues.map((issue) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            key={issue._id}
                                            onClick={() => openModal(issue._id)}
                                            className="hover:bg-primary/5 transition-all cursor-pointer group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {issue.priority === 'CRITICAL' && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                                    <h5 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors max-w-[200px] sm:max-w-[300px] truncate">{issue.title}</h5>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{issue.category}</p>
                                            </td>
                                            <td className="py-4 px-6 hidden md:table-cell">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 w-max px-2.5 py-1 rounded-md border border-border/50">
                                                    {issue.isAnonymous ? <User size={12} className="opacity-50" /> :
                                                        issue.reportedBy?.role === 'official' ? <Shield size={12} className="text-emerald-500" /> :
                                                            issue.reportedBy?.role === 'ngo' ? <Leaf size={12} className="text-indigo-500" /> :
                                                                <User size={12} className="text-foreground" />}
                                                    <span className="capitalize font-bold">{issue.isAnonymous ? 'Anonymous' : issue.reportedBy?.role || 'Citizen'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border shadow-sm ${statusColors[issue.status] || statusColors.OPEN}`}>
                                                            {issue.status}
                                                        </span>
                                                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 font-medium"><Clock size={10} /> {timeAgo(issue.createdAt)}</span>
                                                    </div>
                                                    {issue.bidding?.winningBid?.authorityId && (
                                                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20 w-max">
                                                            <span className="font-bold text-indigo-500 truncate max-w-[120px]">
                                                                {issue.bidding.winningBid.authorityId.name || 'Assigned'}
                                                            </span>
                                                            <span className="opacity-50">•</span>
                                                            <span className="font-mono">{issue.bidding.winningBid.commitmentTimeHours}h</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 hidden lg:table-cell">
                                                <p className="text-sm font-semibold truncate max-w-[150px]">{issue.location?.city}</p>
                                                <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{issue.location?.state}</p>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); openModal(issue._id); }} className="text-xs px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-lg shadow-sm transition-all font-bold">
                                                    Triage
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="p-4 border border-border/50 rounded-2xl md:rounded-b-2xl md:border-t-0 md:rounded-t-none bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground shadow-sm mt-4 md:mt-0">
                    <span className="tracking-widest uppercase">Page {page} of {totalPages}</span>
                    <div className="space-x-2 flex">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PORTAL MODALS */}
            {/* ========================================================= */}

            {isMounted && createPortal(
                <>
                    {/* 🟢 1. ISSUE VIEWER MODAL (Deep Dive, Opens on top of everything) */}
                    <AnimatePresence>
                        {isModalVisible && selectedIssueForDetail && (
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ zIndex: modalZ.issue }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={closeIssueModal} />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] my-4 overflow-hidden z-10"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[selectedIssueForDetail.status] || statusColors.OPEN}`}>
                                                {selectedIssueForDetail.status}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {selectedIssueForDetail._id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowDeleteConfirm(true)} title="Delete Issue" className="p-2 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
                                            <button onClick={closeIssueModal} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors"><X size={20} /></button>
                                        </div>
                                    </div>

                                    {/* Split Body */}
                                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">

                                        {/* LEFT COLUMN: Media & Core Data */}
                                        <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/50">
                                            <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{selectedIssueForDetail.title}</h3>

                                            {/* 🟢 MEDIA TABS */}
                                            {['DISPUTED', 'RESOLVED', 'REJECTED', 'AWAITING_HANDOVER'].includes(selectedIssueForDetail.status) || claimedUrls.length || opposedUrls.length ? (
                                                <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/50 w-full md:w-max">
                                                    <button onClick={() => setMediaTab('REPORTED')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'REPORTED' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}>
                                                        Reported
                                                    </button>
                                                    <button onClick={() => setMediaTab('CLAIMED')} disabled={!claimedUrls.length} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'CLAIMED' ? 'bg-green-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'} ${!claimedUrls.length && 'opacity-40 cursor-not-allowed'}`}>
                                                        Claimed
                                                    </button>
                                                    <button onClick={() => setMediaTab('OPPOSED')} disabled={!opposedUrls.length} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${mediaTab === 'OPPOSED' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'} ${!opposedUrls.length && 'opacity-40 cursor-not-allowed'}`}>
                                                        Opposed
                                                    </button>
                                                </div>
                                            ) : null}

                                            {/* 🟢 MEDIA VIEWER */}
                                            <div className="w-full bg-black/40 rounded-2xl border border-border/50 overflow-hidden relative flex items-center justify-center h-[250px] sm:h-[350px] shrink-0 group shadow-inner">
                                                {activeMediaArray.length > 0 ? (
                                                    <>
                                                        {activeMediaArray[currentMediaIndex]?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                            <video ref={videoRef} src={activeMediaArray[currentMediaIndex]} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                                                        ) : (
                                                            <img src={activeMediaArray[currentMediaIndex]} alt="issue" className="w-full h-full object-contain" />
                                                        )}

                                                        {activeMediaArray.length > 1 && (
                                                            <>
                                                                <button onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + activeMediaArray.length) % activeMediaArray.length)} className="absolute left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
                                                                <button onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % activeMediaArray.length)} className="absolute right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-40">
                                                        <Camera size={36} className="mb-3" />
                                                        <p className="text-sm font-bold text-center px-4">No {mediaTab.toLowerCase()} evidence attached.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12} /> Location</p>
                                                    <p className="text-sm font-bold text-foreground">{selectedIssueForDetail.location?.city}, {selectedIssueForDetail.location?.state}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{selectedIssueForDetail.location?.address} • PIN: {selectedIssueForDetail.location?.pinCode}</p>
                                                </div>
                                                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                                    <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {selectedIssueForDetail.impactScore || 0}</p>
                                                </div>
                                            </div>

                                            <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{selectedIssueForDetail.description}</p>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN: Players, Actions, Timeline */}
                                        <div className="w-full lg:w-1/2 flex flex-col bg-muted/5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar relative z-30">

                                            {/* Players Section */}
                                            <div className="p-4 md:p-5 border-b border-border/50 shrink-0 relative z-[60]">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-card border border-border/50 p-3 rounded-xl flex justify-between items-center group relative">
                                                        <div className="flex-1 cursor-pointer min-w-0 pr-2" onClick={() => !selectedIssueForDetail.isAnonymous && openCareerModal(selectedIssueForDetail.reportedBy?._id)}>
                                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Reporter</p>
                                                            <p className={`text-sm font-bold truncate ${selectedIssueForDetail.isAnonymous ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>
                                                                {selectedIssueForDetail.isAnonymous ? 'Anonymous' : selectedIssueForDetail.reportedBy?.name || 'Unknown'}
                                                            </p>
                                                        </div>
                                                        {!selectedIssueForDetail.isAnonymous && selectedIssueForDetail.reportedBy?._id && (
                                                            <div className="relative shrink-0">
                                                                <button onClick={() => setActionMenuOpen(!actionMenuOpen)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                                {actionMenuOpen && (
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border/60 rounded-xl shadow-xl z-[100] py-1 overflow-hidden animate-fade-in">
                                                                        <button onClick={handleQuickWarn} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-muted flex items-center gap-2 text-amber-500">
                                                                            <AlertOctagon size={14} /> Send Warning
                                                                        </button>
                                                                        <button onClick={() => handleQuickSuspend(selectedIssueForDetail.reportedBy._id)} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-500/10 flex items-center gap-2 text-red-500">
                                                                            <Ban size={14} /> Suspend (24h)
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`p-3 rounded-xl border transition-colors min-w-0 ${selectedIssueForDetail.bidding?.winningBid?.authorityId ? 'bg-indigo-500/5 border-indigo-500/20 cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/40 group' : 'bg-card border-border/50'}`}
                                                        onClick={() => selectedIssueForDetail.bidding?.winningBid?.authorityId && openCareerModal(selectedIssueForDetail.bidding.winningBid.authorityId._id)}>
                                                        <p className={`text-[9px] font-bold uppercase mb-1 ${selectedIssueForDetail.bidding?.winningBid?.authorityId ? 'text-indigo-500' : 'text-muted-foreground'}`}>Assigned Official</p>
                                                        {selectedIssueForDetail.bidding?.winningBid?.authorityId ? (
                                                            <div>
                                                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate group-hover:underline">{selectedIssueForDetail.bidding.winningBid.authorityId.name || 'ID Linked'}</p>
                                                                <p className="text-[10px] text-indigo-500/80 font-bold mt-0.5 truncate">Commitment: {selectedIssueForDetail.bidding.winningBid.commitmentTimeHours}h</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic mt-1 font-medium truncate">Unassigned</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 🟢 NEW: Pending Extension Request Banner */}
                                                {selectedIssueForDetail.status === 'PENDING_EXTENSION' && (
                                                    <div className="col-span-2 mt-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl relative z-[70]">

                                                        {/* 🟢 NEW: Dedicated background layer just to clip the clock safely */}
                                                        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                                <Clock size={80} className="text-amber-500 -mr-6 -mt-6" />
                                                            </div>
                                                        </div>

                                                        <div className="relative z-10">
                                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12} /> Extension Requested</p>
                                                            <p className="text-sm font-bold text-foreground">
                                                                {selectedIssueForDetail.workCycle?.extensionRequests?.slice(-1)[0]?.hoursRequested} Hours
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 mb-4 border-l-2 border-amber-500/50 pl-2">
                                                                Reason: {selectedIssueForDetail.workCycle?.extensionRequests?.slice(-1)[0]?.reason}
                                                            </p>

                                                            {/* 🟢 FIXED: Inputs are now Pre-filled and Disabled (Read-Only) */}
                                                            <div className="flex gap-2 mb-4 relative z-50">
                                                                <input
                                                                    type="number"
                                                                    className="w-1/3 p-2 rounded-lg bg-background/50 border border-border/50 text-xs font-bold outline-none opacity-70 cursor-not-allowed"
                                                                    value={selectedIssueForDetail.workCycle?.extensionRequests?.slice(-1)[0]?.requestedTimeValue || ''}
                                                                    disabled
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="w-2/3 p-2 rounded-lg bg-background/50 border border-border/50 text-xs font-bold outline-none opacity-70 cursor-not-allowed uppercase"
                                                                    value={selectedIssueForDetail.workCycle?.extensionRequests?.slice(-1)[0]?.requestedTimeUnit || ''}
                                                                    disabled
                                                                />
                                                            </div>

                                                            <div className="flex gap-2 relative z-10">
                                                                <button
                                                                    onClick={() => {
                                                                        const pendingReq = selectedIssueForDetail.workCycle?.extensionRequests?.slice(-1)[0];
                                                                        handleExtensionAction('APPROVED', pendingReq?.requestedTimeValue, pendingReq?.requestedTimeUnit);
                                                                    }}
                                                                    disabled={isUpdating}
                                                                    className="flex-1 bg-amber-500 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-amber-600 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={14} /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExtensionAction('REJECTED')}
                                                                    disabled={isUpdating}
                                                                    className="flex-1 bg-card text-muted-foreground border border-border/50 font-bold text-xs py-2.5 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors shadow-sm flex items-center justify-center gap-2"
                                                                >
                                                                    <X size={14} /> Deny
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* God Mode Action Zone */}
                                            <div className="p-4 md:p-5 border-b border-border/50 shrink-0 bg-background relative z-40">
                                                <div className="flex gap-4 mb-3 border-b border-border/50">
                                                    <button onClick={() => setActionTab('STATUS')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'STATUS' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>Update Status</button>
                                                    {selectedIssueForDetail.bidding?.winningBid?.authorityId ? (
                                                        <button onClick={() => setActionTab('REVOKE')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'REVOKE' ? 'text-red-500 border-b-2 border-red-500' : 'text-muted-foreground'}`}>Revoke Assignment</button>
                                                    ) : (
                                                        <button onClick={() => setActionTab('ASSIGN')} className={`pb-2 text-xs font-bold uppercase tracking-wider ${actionTab === 'ASSIGN' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-muted-foreground'}`}>Force Assign</button>
                                                    )}
                                                </div>

                                                {actionTab === 'STATUS' && (
                                                    <form onSubmit={handleUpdateStatus} className="flex flex-col gap-3 relative z-40">
                                                        <div className="flex gap-2 relative z-50">
                                                            {/* Status Dropdown */}
                                                            <div className="w-1/2 relative z-50">
                                                                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold uppercase">Change Status</label>
                                                                <CustomSelect
                                                                    options={UPDATE_STATUS_OPTIONS.filter(opt => opt.value !== 'PENDING_EXTENSION')}
                                                                    value={updateData.status}
                                                                    onChange={(val) => setUpdateData({ ...updateData, status: val })}
                                                                />
                                                            </div>

                                                            {/* Remark (Now 100% Optional for all statuses) */}
                                                            <div className="w-1/2 relative z-40">
                                                                <label className="text-[10px] text-muted-foreground mb-1 block font-semibold uppercase truncate">
                                                                    Audit Remark (Optional)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={updateData.adminRemark}
                                                                    onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })}
                                                                    placeholder="Add context..."
                                                                    className="w-full px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs font-medium focus:border-primary outline-none transition-colors"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 🟢 DYNAMIC ACTOR DROPDOWN (100% Optional) */}
                                                        {['LOCKED', 'AWAITING_HANDOVER', 'RESOLVED', 'FAILED', 'DISPUTED', 'RELEASED'].includes(updateData.status) && (
                                                            <div className="relative z-40 mb-1 animate-fade-in">
                                                                <label className="text-[10px] text-primary mb-1 block font-bold uppercase flex items-center gap-1">
                                                                    <Users size={12} />
                                                                    {updateData.status === 'LOCKED' ? 'Assign To (Optional)' : 'Action Attributed To (Optional)'}
                                                                </label>
                                                                <CustomSelect
                                                                    options={[{ value: '', label: 'System / Admin (Default)' }, ...authorities]}
                                                                    value={updateData.resolvedByAuthority || ''}
                                                                    onChange={(val) => setUpdateData({ ...updateData, resolvedByAuthority: val })}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* 🟢 EVIDENCE UPLOAD (100% Optional) */}
                                                        {['DISPUTED', 'RESOLVED'].includes(updateData.status) && (
                                                            <div className={`relative z-30 p-3 border rounded-xl animate-fade-in ${updateData.status === 'RESOLVED' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                                <label className={`text-xs mb-2 block font-bold flex items-center gap-1 ${updateData.status === 'RESOLVED' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    <ShieldAlert size={12} /> {updateData.status === 'RESOLVED' ? 'Attach Evidence (Optional)' : 'Dispute Evidence (Optional)'}
                                                                </label>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => setActionMedia(e.target.files[0])}
                                                                    className={`w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-bold cursor-pointer text-muted-foreground ${updateData.status === 'RESOLVED' ? 'file:bg-green-500/10 file:text-green-500 hover:file:bg-green-500/20' : 'file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20'}`}
                                                                />
                                                            </div>
                                                        )}

                                                        <button type="submit" disabled={isUpdating} className="w-full py-2.5 mt-1 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 relative z-10 hover:scale-[1.01] transition-transform">
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
                                                            <input type="number" min="1" value={assignData.commitmentTimeHours} onChange={(e) => setAssignData({ ...assignData, commitmentTimeHours: e.target.value })} placeholder="Hrs (e.g. 24)" className="w-1/2 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none relative z-10 transition-colors" required />
                                                        </div>
                                                        <button type="submit" disabled={isUpdating || !assignData.authorityId || !assignData.commitmentTimeHours} className="w-full mt-1 py-2.5 bg-indigo-500 text-white disabled:bg-indigo-500/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 relative z-10 hover:scale-[1.01] transition-transform">
                                                            {isUpdating ? <MiniLoader className="w-3.5 h-3.5" /> : <>Lock Job <ArrowRight size={14} /></>}
                                                        </button>
                                                    </form>
                                                )}

                                                {actionTab === 'REVOKE' && (
                                                    <form onSubmit={handleRevokeAssign} className="flex flex-col gap-2 relative z-10">
                                                        <div className="flex gap-2 relative">
                                                            <input type="number" min="0" value={revokeData.penaltyPoints} onChange={(e) => setRevokeData({ ...revokeData, penaltyPoints: e.target.value })} placeholder="Penalty Pts" className="w-1/3 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs font-medium focus:border-red-500 outline-none transition-colors" required />
                                                            <input type="text" value={revokeData.reason} onChange={(e) => setRevokeData({ ...revokeData, reason: e.target.value })} placeholder="Reason for revocation..." className="w-2/3 px-3 py-2 bg-muted border border-border/50 rounded-xl text-xs font-medium focus:border-red-500 outline-none transition-colors" required />
                                                        </div>
                                                        <button type="submit" disabled={isUpdating || !revokeData.reason} className="w-full py-2.5 mt-1 bg-red-500 text-white disabled:bg-red-500/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform">
                                                            {isUpdating ? <MiniLoader className="w-3.5 h-3.5" /> : <>Revoke <RotateCcw size={14} /></>}
                                                        </button>
                                                    </form>
                                                )}
                                            </div>

                                            {/* Timeline */}
                                            <div className="flex-1 p-4 md:p-6 relative z-10 bg-card/40 pb-20">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 pl-2 border-l-2 border-primary">System Timeline</h4>
                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/50 before:to-transparent pb-4">
                                                    {generateTimeline(selectedIssueForDetail).map((event, i) => (
                                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="relative flex items-start gap-4 group">
                                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-md ${event.color} z-10 transition-transform group-hover:scale-110`}>
                                                                {event.icon}
                                                            </div>
                                                            <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1 group-hover:border-primary/30 transition-colors">
                                                                <h5 className="font-bold text-[11px] md:text-xs uppercase tracking-wider">{event.label}</h5>
                                                                <div className="text-[10px] text-muted-foreground font-mono mt-1 mb-2 font-medium">{event.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                {event.detail && <p className="text-[11px] text-foreground/80 bg-muted/40 p-2.5 rounded-xl border border-border/40 leading-relaxed font-medium">{event.detail}</p>}
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

                    {/* 🟢 2. CAREER MODAL */}
                    <AnimatePresence>
                        {careerModal.isOpen && careerModal.profile && (
                            <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12 bg-black/60 backdrop-blur-sm" style={{ zIndex: modalZ.career }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setCareerModal({ ...careerModal, isOpen: false })} />
                                <motion.div
                                    initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="bg-card border border-border/50 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col relative z-10 overflow-hidden max-h-[85dvh]"
                                >
                                    <div className="p-4 md:p-5 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center gap-4 shrink-0">
                                        {careerModal.view === 'ISSUE_LIST' && (
                                            <button onClick={() => setCareerModal({ ...careerModal, view: 'OVERVIEW' })} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors shrink-0">
                                                <ChevronLeft size={20} />
                                            </button>
                                        )}
                                        <img src={getCorsSafeUrl(careerModal.profile.profilePic) || getAvatar(careerModal.profile.name)} alt="pfp" className="w-12 h-12 rounded-full border border-border/50 object-cover bg-muted shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-foreground truncate">{careerModal.profile.name}</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold mt-0.5 truncate">
                                                {['official', 'ngo'].includes(careerModal.profile.role) ? 'Verified Authority Profile' : 'Citizen Civic Profile'}
                                            </p>
                                        </div>
                                        <button onClick={() => setCareerModal({ ...careerModal, isOpen: false })} className="p-2 bg-muted border border-border/50 rounded-full hover:bg-muted/80 transition-colors shrink-0"><X size={20} /></button>
                                    </div>

                                    {careerModal.view === 'OVERVIEW' ? (
                                        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 bg-background/30">
                                            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm mb-6">
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2"><Shield size={14} /> Profile Information</h4>
                                                {['official', 'ngo'].includes(careerModal.profile.role) && careerModal.profile.authorityProfile ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Designation</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.designation || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Department/Org</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.departmentName || careerModal.profile.authorityProfile.org || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Area</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.assignedDistrict || 'N/A'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${careerModal.profile.authorityProfile.verificationStatus === 'APPROVED' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'}`}>{careerModal.profile.authorityProfile.verificationStatus}</p></div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Rank</p><p className="font-bold text-sm text-foreground">{careerModal.profile.rank || 'Citizen'}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Civil Score</p><p className="font-bold text-sm text-foreground flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> {careerModal.profile.civilScore || 10}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Badges Earned</p><p className="font-bold text-sm text-amber-500">{careerModal.profile.badges?.length || 0}</p></div>
                                                        <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Account Status</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${careerModal.profile.accountStatus === 'ACTIVE' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>{careerModal.profile.accountStatus || 'ACTIVE'}</p></div>
                                                    </div>
                                                )}
                                            </div>

                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mb-4">Platform History (Click to View)</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                                                {['official', 'ngo'].includes(careerModal.profile.role) ? (
                                                    <>
                                                        <StatBox icon={<Clock className="text-indigo-500" />} title="Jobs Active" count={careerModal.history?.ASSIGNED?.length || 0} color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Active Jobs', issueList: careerModal.history?.ASSIGNED || [] })} />
                                                        <StatBox icon={<CheckSquare className="text-emerald-500" />} title="Jobs Completed" count={careerModal.history?.COMPLETED?.length || 0} color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Completed Jobs', issueList: careerModal.history?.COMPLETED || [] })} />
                                                        <StatBox icon={<Briefcase className="text-amber-500" />} title="Jobs Released" count={careerModal.history?.RELEASED?.length || 0} color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Released Jobs', issueList: careerModal.history?.RELEASED || [] })} />
                                                        <StatBox icon={<AlertTriangle className="text-rose-500" />} title="Jobs Failed" count={careerModal.history?.FAILED?.length || careerModal.profile.authorityProfile?.jobsFailed || 0} color="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Failed Jobs', issueList: careerModal.history?.FAILED || [] })} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <StatBox icon={<AlertTriangle className="text-amber-500" />} title="Issues Reported" count={careerModal.history?.REPORTED?.length || 0} color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Reported Issues', issueList: careerModal.history?.REPORTED || [] })} />
                                                        <StatBox icon={<CheckSquare className="text-emerald-500" />} title="Verifications" count={careerModal.history?.CONFIRMED?.length || 0} color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Confirmed Verifications', issueList: careerModal.history?.CONFIRMED || [] })} />
                                                        <StatBox icon={<Shield className="text-indigo-500" />} title="Flags Cast" count={careerModal.history?.FLAGGED?.length || 0} color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Flagged Issues', issueList: careerModal.history?.FLAGGED || [] })} />
                                                        <StatBox icon={<Zap className="text-yellow-500" />} title="Impact Score" count={careerModal.profile.civilScore || 10} color="border-yellow-500/30 bg-yellow-500/5 cursor-default" />
                                                    </>
                                                )}
                                            </div>

                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mb-4 mt-8">Leaderboard History</h4>
                                            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                                                {careerModal.history?.RANKINGS && careerModal.history.RANKINGS.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {careerModal.history.RANKINGS.map((rankEntry, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center shadow-sm shrink-0">
                                                                        {rankEntry.rank === 1 ? <Trophy size={18} className="text-yellow-500" /> :
                                                                            rankEntry.rank === 2 ? <Medal size={18} className="text-slate-300" /> :
                                                                                rankEntry.rank === 3 ? <Medal size={18} className="text-amber-600" /> :
                                                                                    <Star size={16} className="text-primary" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-foreground">Rank #{rankEntry.rank}</p>
                                                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{rankEntry.type || 'Weekly'} Leaderboard</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">{new Date(rankEntry.date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                                        <p className="text-sm font-medium text-muted-foreground">No leaderboard rankings achieved yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-6 bg-background/30">
                                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary mb-6 flex items-center gap-2">
                                                <ListIcon size={18} /> Showing {careerModal.selectedCategory} for {careerModal.profile.name}
                                            </div>
                                            <div className="space-y-3">
                                                {careerModal.issueList.length === 0 ? (
                                                    <div className="text-center py-20 text-muted-foreground font-medium">No records found.</div>
                                                ) : (
                                                    careerModal.issueList.map((issue, i) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                                            key={issue._id}
                                                            onClick={() => openModal(issue._id)}
                                                            className="bg-card border border-border/50 p-4 rounded-xl flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm"
                                                        >
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <h5 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{issue.title}</h5>
                                                                <p className="text-[11px] text-muted-foreground mt-1 font-medium"><MapPin size={10} className="inline mr-1" /> {issue.location?.city || 'Unknown'}</p>
                                                            </div>
                                                            <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
                                                                <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${statusColors[issue.status] || statusColors.OPEN}`}>{issue.status}</span>
                                                                <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 🟢 4. Delete Confirmation Overlay (Highest Z-Index) */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 10000 }}>
                            <div className="bg-card border border-red-500/30 rounded-2xl p-5 md:p-6 max-w-sm w-full shadow-2xl flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2 shrink-0">
                                    <AlertTriangle className="w-5 h-5" /> Nuclear Delete
                                </h3>
                                <p className="text-xs text-muted-foreground mb-6 leading-relaxed overflow-y-auto thin-scrollbar">
                                    This will permanently wipe this issue, all associated bids, and scrub all related notifications from existence. This cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3 shrink-0">
                                    <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold bg-muted/50 hover:bg-muted transition-colors">Cancel</button>
                                    <button onClick={handleDeleteIssue} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-black bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center min-w-[80px]">
                                        {isDeleting ? <MiniLoader className="w-4 h-4 text-white" /> : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}

        </motion.div>
    );
};

const StatBox = ({ icon, title, count, color, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 border rounded-2xl flex flex-col items-start gap-3 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default'} ${color}`}
    >
        <div className="p-2 bg-background/80 rounded-xl shadow-inner border border-border/50">{icon}</div>
        <div className="text-left w-full">
            <h4 className="text-2xl font-black text-foreground">{count}</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 truncate">{title}</p>
        </div>
    </div>
);

export default AdminIssues;