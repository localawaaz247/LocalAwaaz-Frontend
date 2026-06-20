import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertOctagon, Zap, Megaphone, Edit3, Briefcase,
    MapPin, Clock, ArrowRight, ShieldAlert, Download, Eye, X, Search, Flame, Filter,
    Camera, ChevronLeft, ChevronRight, FileText, History, Shield, Trash2, AlertTriangle,
    CheckCircle, RotateCcw, Users, Trophy, Medal, Star,
    MoreVertical
} from 'lucide-react';
import CustomSelect from '../CustomSelect';
import MiniLoader from '../MiniLoader';
import { cscApi } from '../../utils/cscAPI';

// Helper for Timeline
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
    IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    RESOLVED: "bg-green-500/10 text-green-500 border-green-500/30",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/30",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
    DISPUTED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    ORPHANED: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    RELEASED: "bg-amber-500/10 text-amber-500 border-amber-500/30"
};

const getCorsSafeUrl = (url) => {
    if (!url) return null;
    if (url.includes('ui-avatars.com')) return url;
    const baseUrl = axiosInstance.defaults.baseURL || '';
    return `${baseUrl}/proxy-image?url=${encodeURIComponent(url)}`;
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

const AdminTriage = () => {
    const [isMounted, setIsMounted] = useState(false);

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [actionMenuOpen, setActionMenuOpen] = useState(false);

    const [filters, setFilters] = useState({ state: '', city: '', status: '' });
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [authorities, setAuthorities] = useState([]);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Modal States
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
    const [fetchingIssueId, setFetchingIssueId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 🟢 Media Viewer States
    const [mediaTab, setMediaTab] = useState('REPORTED');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = useRef(null);

    // 🟢 Action Zone (God Mode) States
    const [actionTab, setActionTab] = useState('STATUS');
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '', resolvedByAuthority: '' });
    const [assignData, setAssignData] = useState({ authorityId: '', commitmentTimeHours: '' });
    const [revokeData, setRevokeData] = useState({ reason: '', penaltyPoints: 0 });
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionMedia, setActionMedia] = useState(null);

    // Minor Modal States
    const [boostModal, setBoostModal] = useState({ isOpen: false, issueId: '', amount: '' });
    const [categoryModal, setCategoryModal] = useState({ isOpen: false, issueId: '', category: '', priority: '' });
    const [assignModal, setAssignModal] = useState({ isOpen: false, issueId: '', authorityId: '', hours: '' });
    const [sosModal, setSosModal] = useState({ isOpen: false, issueId: '' });
    const [isActionLoading, setIsActionLoading] = useState(false);

    // 🟢 Dynamic Z-Index for perfectly stacking modals
    const [modalZ, setModalZ] = useState({ issue: 200, career: 200 });
    const [careerModal, setCareerModal] = useState({ isOpen: false, profile: null, history: null, view: 'OVERVIEW', selectedCategory: '', issueList: [] });

    const CATEGORIES = [
        { value: '', label: 'All Categories' },
        { value: 'ROAD_DAMAGE', label: 'Road Damage & Potholes' },
        { value: 'WATER_SUPPLY', label: 'Water & Plumbing' },
        { value: 'ELECTRICITY', label: 'Electricity & Power' },
        { value: 'WASTE_MANAGEMENT', label: 'Sanitation & Waste' },
        { value: 'PUBLIC_SAFETY', label: 'Public Safety' }
    ];
    const PRIORITIES = [
        { value: '', label: 'All Priorities' },
        { value: 'LOW', label: 'LOW' },
        { value: 'MEDIUM', label: 'MEDIUM' },
        { value: 'HIGH', label: 'HIGH' },
        { value: 'CRITICAL', label: 'CRITICAL' }
    ];
    const ESCALATION_STATUSES = [
        { value: '', label: 'All Escalations' },
        { value: 'ORPHANED', label: 'Orphaned (>7 Days)' },
        { value: 'DISPUTED', label: 'Disputed (Conflicts)' }
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
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [filters.state, statesList]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchTriageIssues(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [page, filters]);

    useEffect(() => {
        if (boostModal.isOpen || categoryModal.isOpen || assignModal.isOpen || sosModal.isOpen || isIssueModalOpen || showDeleteConfirm || careerModal.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [boostModal.isOpen, categoryModal.isOpen, assignModal.isOpen, sosModal.isOpen, isIssueModalOpen, showDeleteConfirm, careerModal.isOpen]);

    useEffect(() => { setCurrentMediaIndex(0); }, [mediaTab]);

    useEffect(() => {
        if (isIssueModalOpen && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
        }
    }, [isIssueModalOpen, currentMediaIndex, mediaTab]);

    const fetchTriageIssues = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/triage', { params: { page, limit: 15, ...filters } });
            setIssues(res.data.data.issues);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to fetch triage issues' });
        } finally { setLoading(false); }
    };

    const fetchAuthorities = async () => {
        try {
            const res = await axiosInstance.get('/admin/authorities?status=APPROVED');
            setAuthorities(res.data.data.map(auth => ({
                value: auth._id,
                label: `${auth.name} (${auth.role.toUpperCase()}) - ${auth.authorityProfile?.assignedDistrict || 'N/A'}`
            })));
        } catch (error) { console.error(error); }
    };

    const handleGlobalExport = async () => {
        try {
            showToast({ icon: 'loading', title: 'Generating Triage Excel...' });
            const res = await axiosInstance.get('/admin/export/triage', { params: filters, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Triage_Escalations.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast({ icon: 'success', title: 'Export Complete!' });
        } catch (error) { showToast({ icon: 'error', title: 'Export failed' }); }
    };

    const handleIssueClick = async (issueId) => {
        try {
            setFetchingIssueId(issueId);
            const res = await axiosInstance.get(`/admin/issue/${issueId}`);
            const issueData = res.data.data;

            // 🟢 Safely extract the assignee ID if assigned
            const currentAssignee = issueData.bidding?.winningBid?.authorityId;
            const assigneeId = currentAssignee ? (currentAssignee._id || currentAssignee) : '';

            setSelectedIssueForDetail(issueData);

            // 🟢 Inject the assigneeId into the dropdown state
            setUpdateData({
                status: issueData.status,
                adminRemark: issueData.adminRemark || '',
                resolvedByAuthority: issueData.resolvedByAuthority ||
                    issueData.resolutionEvidence?.resolvedByAuthority ||
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
            setIsIssueModalOpen(true);
        } catch (e) {
            showToast({ icon: 'error', title: 'Failed to load full issue details' });
        } finally {
            setFetchingIssueId(null);
        }
    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setShowDeleteConfirm(false);
        setTimeout(() => setSelectedIssueForDetail(null), 300);
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

    const getDaysStagnant = (dateInput) => {
        return Math.floor((new Date() - new Date(dateInput)) / (1000 * 60 * 60 * 24));
    };

    const handleBoost = async (e) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            await axiosInstance.patch(`/admin/issue/${boostModal.issueId}/boost`, { bonusPoints: boostModal.amount });
            showToast({ icon: 'success', title: 'Bounty applied successfully!' });
            setBoostModal({ isOpen: false, issueId: '', amount: '' });
            fetchTriageIssues();
        } catch (error) { showToast({ icon: 'error', title: 'Failed to apply bounty' }); }
        finally { setIsActionLoading(false); }
    };

    const handleReCategorize = async (e) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            await axiosInstance.patch(`/admin/issue/${categoryModal.issueId}/recategorize`, { category: categoryModal.category, priority: categoryModal.priority });
            showToast({ icon: 'success', title: 'Issue re-categorized!' });
            setCategoryModal({ isOpen: false, issueId: '', category: '', priority: '' });
            fetchTriageIssues();
        } catch (error) { showToast({ icon: 'error', title: 'Failed to re-categorize' }); }
        finally { setIsActionLoading(false); }
    };

    const handleForceAssignTable = async (e) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            await axiosInstance.patch(`/admin/issue/${assignModal.issueId}/force-assign`, { authorityId: assignModal.authorityId, commitmentTimeHours: Number(assignModal.hours) });
            showToast({ icon: 'success', title: 'Issue forcefully locked to official!' });
            setAssignModal({ isOpen: false, issueId: '', authorityId: '', hours: '' });
            fetchTriageIssues();
        } catch (error) { showToast({ icon: 'error', title: 'Assignment failed' }); }
        finally { setIsActionLoading(false); }
    };

    const triggerSOSModal = (issueId) => {
        setSosModal({ isOpen: true, issueId });
    };

    const confirmSOSPing = async () => {
        setIsActionLoading(true);
        try {
            await axiosInstance.post(`/admin/issue/${sosModal.issueId}/sos`);
            showToast({ icon: 'success', title: 'SOS Broadcast Fired!' });
            setSosModal({ isOpen: false, issueId: '' });
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to send SOS' });
        } finally { setIsActionLoading(false); }
    };

    // 🟢 Action Zone Submit Handlers (Inside Modal)
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
            fetchTriageIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Update failed' });
        } finally { setIsUpdating(false); }
    };

    const handleInlineForceAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}/force-assign`, { authorityId: assignData.authorityId, commitmentTimeHours: Number(assignData.commitmentTimeHours) });
            showToast({ icon: 'success', title: 'Issue forcefully assigned!' });
            closeIssueModal();
            fetchTriageIssues();
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
            fetchTriageIssues();
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
            fetchTriageIssues();
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to process extension' });
        } finally {
            setIsUpdating(false);
        }
    };

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    // 🟢 Calculate Media Tabs for the Modal
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

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 flex flex-col h-full overflow-y-auto relative pb-10">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-red-500/5 p-6 rounded-2xl border border-red-500/20 relative z-[50]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between w-full xl:w-auto">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-red-500 flex items-center gap-3 drop-shadow-sm">
                            <ShieldAlert className="w-8 h-8" /> Triage Center
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground mt-1">Issues ignored for <span className="font-bold text-red-400">&gt; 7 Days</span> or marked as <span className="font-bold text-orange-400">DISPUTED</span>.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleGlobalExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] shrink-0"
                    >
                        <Download size={18} /> Export Triage
                    </motion.button>
                </div>
            </div>

            {/* Mobile Filter Toggle Header */}
            <div className="flex xl:hidden justify-between items-center mt-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Search className="text-primary" size={20} /> Triage Filters
                </h3>
                <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filters Section */}
            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} xl:block bg-card/60 xl:bg-transparent backdrop-blur-xl xl:backdrop-blur-none border border-border/60 xl:border-none rounded-2xl p-4 xl:p-0 shadow-lg xl:shadow-none relative z-[40]`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full relative z-[60]">
                    <CustomSelect options={ESCALATION_STATUSES} value={filters.status} onChange={(val) => { setFilters({ ...filters, status: val }); setPage(1); }} />
                    <CustomSelect options={stateOptions} value={filters.state} onChange={(val) => { setFilters({ ...filters, state: val, city: '' }); setPage(1); }} />
                    <CustomSelect options={districtOptions} value={filters.city} onChange={(val) => { setFilters({ ...filters, city: val }); setPage(1); }} />
                </div>
            </div>

            {/* 🟢 Mobile Card View Wrapper (Hidden on md+) */}
            <div className="md:hidden flex flex-col gap-3 relative z-[10]">
                <AnimatePresence>
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-card/60 border border-border/60 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                                        <div className="h-3 w-1/4 bg-muted/50 rounded"></div>
                                    </div>
                                    <div className="h-5 w-16 bg-muted rounded"></div>
                                </div>
                                <div className="flex justify-between items-end mt-1 pt-3 border-t border-border/30">
                                    <div className="space-y-2">
                                        <div className="h-3 w-24 bg-muted rounded"></div>
                                        <div className="h-2 w-16 bg-muted/50 rounded"></div>
                                    </div>
                                    <div className="h-4 w-12 bg-muted rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : issues.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                            <AlertOctagon className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                            <p className="font-bold text-sm text-muted-foreground">No critical escalations found.</p>
                        </motion.div>
                    ) : (
                        issues.map((issue) => {
                            const stagnantDays = getDaysStagnant(issue.createdAt);
                            const isDisputed = issue.status === 'DISPUTED';

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={issue._id}
                                    className="bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                            <Clock className="text-red-500 w-3 h-3 shrink-0" />
                                            <span className="text-sm font-black text-red-500">{stagnantDays}d</span>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider uppercase border ${isDisputed ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                            {isDisputed ? 'DISPUTED' : 'ORPHANED'}
                                        </span>
                                    </div>

                                    <button onClick={() => handleIssueClick(issue._id)} disabled={fetchingIssueId === issue._id} className="text-left w-full">
                                        <div className="flex items-center gap-1.5 w-full mb-1">
                                            {issue.priority === 'CRITICAL' && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                            <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                {fetchingIssueId === issue._id ? 'Loading...' : issue.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{issue.category}</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${issue.priority === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-orange-500 border-orange-500/30 bg-orange-500/10'}`}>{issue.priority}</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground mt-1.5 flex items-center gap-1 truncate w-full"><MapPin size={10} className="shrink-0" /> {issue.location?.city}, {issue.location?.state}</span>
                                    </button>

                                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-border/30">
                                        <div className="flex items-center gap-1 text-xs font-black text-yellow-500">
                                            <Zap size={12} className="fill-yellow-500/20" /> {issue.impactScore || 0}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setBoostModal({ isOpen: true, issueId: issue._id, amount: '' })} className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-md"><Zap size={14} /></button>
                                            <button onClick={() => setCategoryModal({ isOpen: true, issueId: issue._id, category: issue.category, priority: issue.priority || 'LOW' })} className="p-1.5 bg-muted/50 text-muted-foreground rounded-md"><Edit3 size={14} /></button>
                                            <button onClick={() => triggerSOSModal(issue._id)} className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md"><Megaphone size={14} /></button>
                                            <button onClick={() => setAssignModal({ isOpen: true, issueId: issue._id, authorityId: '', hours: '' })} className="px-2 py-1.5 bg-indigo-500 text-white font-bold text-[10px] rounded-md"><Briefcase size={12} className="inline mr-1" />Assign</button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* 🟢 Desktop Table Wrapper (Hidden on mobile) */}
            <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col min-h-[400px] relative z-10">
                <div className="overflow-x-auto thin-scrollbar flex-1 bg-background/20">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-red-500/10 backdrop-blur-md border-b border-red-500/20 sticky top-0 z-20 shadow-sm">
                            <tr className="text-red-400 text-[10px] md:text-sm uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold">Stagnant Time</th>
                                <th className="py-4 px-6 font-bold">Escalation State</th>
                                <th className="py-4 px-6 font-bold">Issue Details</th>
                                <th className="py-4 px-6 font-bold hidden lg:table-cell">Impact / Bounty</th>
                                <th className="py-4 px-6 font-bold text-right">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <AnimatePresence>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-border/30">
                                            <td className="py-4 px-6"><div className="h-6 w-16 bg-muted rounded mb-1"></div><div className="h-3 w-10 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6"><div className="h-5 w-24 bg-muted rounded-md mb-2"></div><div className="h-3 w-32 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6"><div className="h-4 w-48 bg-muted rounded mb-2"></div><div className="h-3 w-24 bg-muted/50 rounded"></div></td>
                                            <td className="py-4 px-6 hidden lg:table-cell"><div className="h-8 w-16 bg-muted rounded-xl"></div></td>
                                            <td className="py-4 px-6 flex justify-end"><div className="h-8 w-32 bg-muted rounded-lg"></div></td>
                                        </tr>
                                    ))
                                ) : issues.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan="5" className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertOctagon className="w-10 h-10 opacity-20" />
                                                <p className="font-bold text-sm">No critical escalations found.</p>
                                                <p className="text-xs">The platform is healthy.</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    issues.map((issue) => {
                                        const stagnantDays = getDaysStagnant(issue.createdAt);
                                        const isDisputed = issue.status === 'DISPUTED';

                                        return (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                key={issue._id}
                                                className="hover:bg-red-500/5 transition-colors group"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="text-red-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                                        <span className="text-xl md:text-2xl font-black text-red-500">{stagnantDays}</span>
                                                        <span className="text-[10px] text-red-500/70 font-bold uppercase mt-1">Days</span>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-bold tracking-wider uppercase border shadow-sm ${isDisputed ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                                            {isDisputed ? 'DISPUTED' : 'ORPHANED'}
                                                        </span>
                                                        {isDisputed && issue.disputeEvidence?.adminRemark && (
                                                            <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]" title={issue.disputeEvidence.adminRemark}>
                                                                {issue.disputeEvidence.adminRemark}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <button onClick={() => handleIssueClick(issue._id)} disabled={fetchingIssueId === issue._id} className="flex flex-col items-start max-w-[200px] sm:max-w-[250px] text-left group/btn relative">
                                                        <div className="flex items-center gap-1.5 w-full">
                                                            {issue.priority === 'CRITICAL' && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                                            <span className="font-bold text-sm text-foreground truncate group-hover/btn:text-primary transition-colors">
                                                                {fetchingIssueId === issue._id ? 'Loading...' : issue.title}
                                                            </span>
                                                            <Eye size={14} className="text-muted-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{issue.category}</span>
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${issue.priority === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-orange-500 border-orange-500/30 bg-orange-500/10'}`}>{issue.priority}</span>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-muted-foreground mt-1.5 flex items-center gap-1 truncate w-full"><MapPin size={10} className="shrink-0" /> {issue.location?.city}, {issue.location?.state}</span>
                                                    </button>
                                                </td>

                                                <td className="py-4 px-6 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 px-3 py-1.5 rounded-xl w-max">
                                                        <span className="text-lg font-black text-yellow-500 flex items-center gap-1"><Zap size={16} className="fill-yellow-500/20" /> {issue.impactScore || 0}</span>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                                        <button onClick={() => setBoostModal({ isOpen: true, issueId: issue._id, amount: '' })} title="Boost Bounty" className="p-2 md:p-2.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-xl transition-all shadow-sm">
                                                            <Zap size={16} />
                                                        </button>
                                                        <button onClick={() => setCategoryModal({ isOpen: true, issueId: issue._id, category: issue.category, priority: issue.priority || 'LOW' })} title="Re-Categorize" className="p-2 md:p-2.5 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all shadow-sm">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => triggerSOSModal(issue._id)} title="Blast SOS" className="p-2 md:p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
                                                            <Megaphone size={16} />
                                                        </button>
                                                        <button onClick={() => setAssignModal({ isOpen: true, issueId: issue._id, authorityId: '', hours: '' })} className="px-3 md:px-4 py-2 bg-indigo-500 text-white font-bold text-[10px] md:text-xs rounded-xl flex items-center gap-1.5 hover:bg-indigo-600 shadow-md hover:shadow-indigo-500/30 transition-all">
                                                            <Briefcase size={14} className="hidden sm:block" /> Assign
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
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

            {/* ========================================================= */}
            {/* PORTAL MODALS */}
            {/* ========================================================= */}

            {isMounted && createPortal(
                <>
                    {/* Minor Action Modals */}
                    <AnimatePresence>
                        {boostModal.isOpen && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBoostModal({ isOpen: false, issueId: '', amount: '' })} />
                                <motion.form
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    onSubmit={handleBoost}
                                    className="bg-card p-6 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] w-full max-w-sm relative z-10 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Zap size={100} className="text-yellow-500 -mr-6 -mt-6" /></div>
                                    <div className="flex items-center gap-3 mb-2 text-yellow-500 relative z-10">
                                        <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><Zap className="w-5 h-5" /></div>
                                        <h3 className="font-black text-xl">Inject Bounty</h3>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mb-6 relative z-10">Increase the impact score to push this issue to the top of the local marketplace.</p>
                                    <div className="relative z-10 mb-6">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Bonus Points</label>
                                        <input type="number" min="1" placeholder="e.g. 50, 100" required value={boostModal.amount} onChange={e => setBoostModal({ ...boostModal, amount: e.target.value })} className="w-full p-4 bg-background border border-border/60 rounded-xl text-sm font-bold focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div className="flex justify-end gap-3 relative z-10">
                                        <button type="button" onClick={() => setBoostModal({ isOpen: false, issueId: '', amount: '' })} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" disabled={isActionLoading} className="px-5 py-2.5 text-sm bg-yellow-500 text-black font-black rounded-xl flex items-center justify-center min-w-[120px] shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:bg-yellow-400 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {isActionLoading ? <MiniLoader className="border-black border-t-transparent" /> : 'Apply Boost'}
                                        </button>
                                    </div>
                                </motion.form>
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {categoryModal.isOpen && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCategoryModal({ isOpen: false, issueId: '', category: '', priority: '' })} />
                                <motion.form
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    onSubmit={handleReCategorize}
                                    className="bg-card p-6 rounded-3xl border border-border/50 shadow-2xl w-full max-w-sm relative z-10"
                                >
                                    <div className="flex items-center gap-3 mb-2 text-primary">
                                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20"><Edit3 className="w-5 h-5" /></div>
                                        <h3 className="font-black text-xl text-foreground">Fix Classification</h3>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mb-6">Override the user's initial category and priority settings.</p>

                                    <div className="space-y-4 mb-8">
                                        <div className="relative z-50">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Category</label>
                                            <CustomSelect options={CATEGORIES.filter(c => c.value !== '')} value={categoryModal.category} onChange={v => setCategoryModal({ ...categoryModal, category: v })} />
                                        </div>
                                        <div className="relative z-40">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Priority Level</label>
                                            <CustomSelect options={PRIORITIES.filter(p => p.value !== '')} value={categoryModal.priority} onChange={v => setCategoryModal({ ...categoryModal, priority: v })} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setCategoryModal({ isOpen: false, issueId: '', category: '', priority: '' })} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" disabled={isActionLoading} className="px-5 py-2.5 text-sm bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center min-w-[120px] shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {isActionLoading ? <MiniLoader /> : 'Update Meta'}
                                        </button>
                                    </div>
                                </motion.form>
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {assignModal.isOpen && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal({ isOpen: false, issueId: '', authorityId: '', hours: '' })} />
                                <motion.form
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    onSubmit={handleForceAssignTable}
                                    className="bg-card p-6 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] w-full max-w-md relative z-10"
                                >
                                    <div className="flex items-center gap-3 mb-2 text-indigo-500">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><Briefcase className="w-5 h-5" /></div>
                                        <h3 className="font-black text-xl">Force Assignment</h3>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mb-6">Lock this stagnant issue directly to an official. It will immediately leave the triage dashboard.</p>

                                    <div className="space-y-4 mb-8">
                                        <div className="relative z-50">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Target Official</label>
                                            <CustomSelect options={authorities} value={assignModal.authorityId} onChange={v => setAssignModal({ ...assignModal, authorityId: v })} placeholder="Select Official to assign..." />
                                        </div>
                                        <div className="relative z-40">
                                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Mandatory Resolution Window (Hours)</label>
                                            <input type="number" min="1" placeholder="e.g. 12, 24, 48" required value={assignModal.hours} onChange={e => setAssignModal({ ...assignModal, hours: e.target.value })} className="w-full p-4 bg-background border border-border/60 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setAssignModal({ isOpen: false, issueId: '', authorityId: '', hours: '' })} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                                        <button type="submit" disabled={isActionLoading || !assignModal.authorityId || !assignModal.hours} className="px-5 py-2.5 text-sm bg-indigo-500 text-white font-black rounded-xl flex items-center justify-center min-w-[140px] shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {isActionLoading ? <MiniLoader className="text-white" /> : <>Lock & Warn <ArrowRight size={14} className="ml-1" /></>}
                                        </button>
                                    </div>
                                </motion.form>
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {sosModal.isOpen && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSosModal({ isOpen: false, issueId: '' })} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-card p-6 md:p-8 rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] w-full max-w-sm relative z-10 text-center"
                                >
                                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Megaphone className="w-8 h-8 text-red-500 animate-pulse" />
                                    </div>
                                    <h3 className="font-black text-2xl text-foreground mb-2">Blast SOS?</h3>
                                    <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed">
                                        Are you sure you want to blast an urgent SOS push notification to <strong className="text-foreground">every verified official</strong> in this district?
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <button type="button" onClick={() => setSosModal({ isOpen: false, issueId: '' })} className="px-5 py-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors w-full">Cancel</button>
                                        <button type="button" onClick={confirmSOSPing} disabled={isActionLoading} className="px-5 py-3 text-sm bg-red-500 text-white font-black rounded-xl flex items-center justify-center w-full shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            {isActionLoading ? <MiniLoader className="text-white" /> : 'Yes, Blast SOS'}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 🟢 5. NEW CUSTOM INLINE ISSUE DETAIL, MEDIA & ACTION (GOD MODE) MODAL */}
                    <AnimatePresence>
                        {isIssueModalOpen && selectedIssueForDetail && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeIssueModal} />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden z-10"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Modal Header */}
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

                                            {/* 🟢 MEDIA TABS (Only shown if Disputed, to match your logic request) */}
                                            {selectedIssueForDetail.status === 'DISPUTED' ? (
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

                                            {/* --- PLAYERS SECTION --- */}
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

                                            {/* --- ACTIONS SECTION (GOD MODE) --- */}
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
                                                    <form onSubmit={handleInlineForceAssign} className="flex flex-col gap-2 relative z-50">
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

                                            {/* --- TIMELINE SECTION --- */}
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

                    {/* 🟢 6. Delete Confirmation Overlay (Placed Last, absolute top) */}
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

export default AdminTriage;