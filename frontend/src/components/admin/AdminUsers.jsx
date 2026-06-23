import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, X, User as UserIcon, FileText, ChevronLeft, ChevronRight,
    CheckCircle, AlertTriangle, Trash2, Search, Shield,
    Leaf, Flame, Clock, History, Briefcase, Download, ArrowRight, RotateCcw,
    ShieldAlert, Zap, MoreVertical, Ban, AlertOctagon, Trophy, Medal, Star, CheckSquare,
    UserCog, FileSignature, Target, Filter, Camera, ListIcon, Users
} from 'lucide-react';
import MiniLoader from '../MiniLoader';
import CustomSelect from '../../components/CustomSelect';
import { cscApi } from '../../utils/cscAPI';
import { socket } from '../../utils/socket';

// --- HELPERS ---
const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&size=128&bold=true`;
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

const Avatar = ({ src, name, size = "w-10 h-10", iconSize = "w-5 h-5" }) => {
    const [imageError, setImageError] = useState(false);
    useEffect(() => { setImageError(false); }, [src]);
    if (!src || imageError) {
        return (
            <div className={`${size} shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary`}>
                <UserIcon className={iconSize} />
            </div>
        );
    }
    return <img src={getCorsSafeUrl(src)} alt={name || "User"} onError={() => setImageError(true)} crossOrigin="anonymous" className={`${size} shrink-0 rounded-full object-cover border border-border/50 bg-muted`} />;
};

const AdminUsers = () => {
    const [isMounted, setIsMounted] = useState(false);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [stateFilter, setStateFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('');
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [authorities, setAuthorities] = useState([]);

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // 🟢 DYNAMIC Z-INDEX MANAGER
    const [modalZ, setModalZ] = useState({ profile: 200, list: 200, issue: 200 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState('REPORTED');

    // 🟢 ISSUE VIEWER STATES
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [fetchingIssueId, setFetchingIssueId] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mediaTab, setMediaTab] = useState('REPORTED');
    const videoRef = useRef(null);

    // 🟢 CSI HISTORY MODAL STATE
    const [csiModalOpen, setCsiModalOpen] = useState(false);

    // Action States
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const [actionTab, setActionTab] = useState('STATUS');

    // God-Mode Form States
    const [pointsModal, setPointsModal] = useState({ isOpen: false, points: '', reason: '' });
    const [editProfileModal, setEditProfileModal] = useState({ isOpen: false, formData: {} });
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '', resolvedByAuthority: '' });
    const [assignData, setAssignData] = useState({ authorityId: '', commitmentTimeHours: '' });
    const [revokeData, setRevokeData] = useState({ reason: '', penaltyPoints: 0 });
    const [disputeMedia, setDisputeMedia] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [forceAssignModal, setForceAssignModal] = useState({ isOpen: false, issues: [], selectedIssue: '', commitmentTimeHours: '' });
    const [forceUnassignModal, setForceUnassignModal] = useState({ isOpen: false, issueId: '', reason: '', penalty: 0 });

    // Location States for Edit Modal
    const [modalDistrictsList, setModalDistrictsList] = useState([]);
    const [modalAssignedDistrictsList, setModalAssignedDistrictsList] = useState([]);

    const ROLE_OPTIONS = [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
        { value: 'official', label: 'Official' },
        { value: 'ngo', label: 'NGO' },
        { value: 'other', label: 'Other' }
    ];
    const FILTER_ROLE_OPTIONS = [{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS];
    const STATUS_OPTIONS = [{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'BANNED', label: 'Banned' }];

    // 🟢 ALL 9 GOD-MODE STATUSES
    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Auction)' },
        { value: 'LOCKED', label: 'LOCKED (Assigned)' },
        { value: 'PENDING_EXTENSION', label: 'PENDING EXTENSION' },
        { value: 'AWAITING_HANDOVER', label: 'AWAITING HANDOVER' },
        { value: 'RESOLVED', label: 'RESOLVED (Fixed)' },
        { value: 'FAILED', label: 'FAILED' },
        { value: 'DISPUTED', label: 'DISPUTED (Conflict)' },
        { value: 'RELEASED', label: 'RELEASED' },
        { value: 'ORPHANED', label: 'ORPHANED (Stagnant)' },
        { value: 'REJECTED', label: 'REJECTED (Nuclear Reject)' } // 🟢 ADDED THIS
    ];

    useEffect(() => {
        setIsMounted(true);
        cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error);
        fetchAuthorities();
    }, []);

    useEffect(() => {
        if (!stateFilter) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === stateFilter);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [stateFilter, statesList]);

    useEffect(() => {
        if (editProfileModal.isOpen && editProfileModal.formData.state) {
            const stateObj = statesList.find(s => s.name === editProfileModal.formData.state);
            if (stateObj) {
                cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setModalDistrictsList(res.data)).catch(console.error);
            }
        } else {
            setModalDistrictsList([]);
        }
    }, [editProfileModal.formData.state, editProfileModal.isOpen, statesList]);

    useEffect(() => {
        if (editProfileModal.isOpen && editProfileModal.formData.assignedState) {
            const stateObj = statesList.find(s => s.name === editProfileModal.formData.assignedState);
            if (stateObj) {
                cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setModalAssignedDistrictsList(res.data)).catch(console.error);
            }
        } else {
            setModalAssignedDistrictsList([]);
        }
    }, [editProfileModal.formData.assignedState, editProfileModal.isOpen, statesList]);

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];
    const modalStateOptions = [{ value: '', label: 'Select State' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const modalDistrictOptions = [{ value: '', label: 'Select District/City' }, ...modalDistrictsList.map(d => ({ value: d.name, label: d.name }))];
    const modalAssignedDistrictOptions = [{ value: '', label: 'Select Assigned District' }, ...modalAssignedDistrictsList.map(d => ({ value: d.name, label: d.name }))];

    const handleStateChange = (val) => { setStateFilter(val); setDistrictFilter(''); setPage(1); };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchUsers(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, page, roleFilter, stateFilter, districtFilter]);

    // Scroll Lock
    useEffect(() => {
        if (isModalOpen || isListModalOpen || isIssueModalOpen || editProfileModal.isOpen || pointsModal.isOpen || csiModalOpen || showDeleteConfirm || forceAssignModal.isOpen || forceUnassignModal.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen, isListModalOpen, isIssueModalOpen, editProfileModal.isOpen, pointsModal.isOpen, csiModalOpen, showDeleteConfirm, forceAssignModal.isOpen, forceUnassignModal.isOpen]);

    // Autoplay Video
    useEffect(() => {
        const isVideo = selectedIssue?.media?.[currentMediaIndex]?.url?.match(/\.(mp4|webm|ogg)$/i);
        if (isIssueModalOpen && isVideo && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
        }
    }, [isIssueModalOpen, currentMediaIndex, selectedIssue, mediaTab]);

    useEffect(() => {
        // 1. Listen for full issue updates
        socket.on('issue_updated', (data) => {
            setSelectedIssue((prev) =>
                prev && prev._id === data.issueId ? data.updatedData : prev
            );
        });

        // 2. Listen for status changes
        socket.on('issue_status_updated', (data) => {
            setSelectedIssue((prev) =>
                prev && prev._id === data.issueId ? { ...prev, status: data.newStatus } : prev
            );
        });

        // 3. Listen for nuclear deletions
        socket.on('issue_deleted', (data) => {
            // Close the issue modal if the admin is currently looking at the deleted issue
            setSelectedIssue((prev) => {
                if (prev && prev._id === data.issueId) {
                    setIsIssueModalOpen(false);
                    return null;
                }
                return prev;
            });

            // FIXED: Update selectedUserDetails instead of the undefined careerModal
            setSelectedUserDetails((prev) => {
                if (!prev || !prev.history) return prev;

                // Copy the history object
                const updatedHistory = { ...prev.history };

                // If there's an active tab array, filter the deleted issue out of it
                if (updatedHistory[activeHistoryTab]) {
                    updatedHistory[activeHistoryTab] = updatedHistory[activeHistoryTab].filter(
                        (issue) => issue._id !== data.issueId
                    );
                }

                return {
                    ...prev,
                    history: updatedHistory
                };
            });
        });

        // Cleanup listeners
        return () => {
            socket.off('issue_updated');
            socket.off('issue_status_updated');
            socket.off('issue_deleted');
        };
    }, [activeHistoryTab]); // removed undefined careerModal.isOpen from dependencies
    // --- FETCHERS ---
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/users', { params: { page, limit: 15, search, role: roleFilter, state: stateFilter, district: districtFilter } });
            setUsers(res.data.data.users);
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

    const fetchUserFullDetails = async (id) => {
        try {
            setModalLoading(true);
            setModalZ(prev => ({ ...prev, profile: Math.max(prev.list, prev.issue) + 10 }));
            setIsModalOpen(true);
            const res = await axiosInstance.get(`/admin/user/${id}`);
            setSelectedUserDetails(res.data.data);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load user details' });
            setIsModalOpen(false);
        } finally { setModalLoading(false); }
    };

    // --- MODAL CONTROLLERS ---
    const openListModal = (tabName) => {
        setActiveHistoryTab(tabName);
        setModalZ(prev => ({ ...prev, list: prev.profile + 10 }));
        setIsListModalOpen(true);
    };

    const fetchAndOpenIssue = async (issueId) => {
        try {
            setFetchingIssueId(issueId);
            setModalZ(prev => ({ ...prev, issue: Math.max(prev.profile, prev.list) + 10 }));

            const res = await axiosInstance.get(`/admin/issue/${issueId}`);
            const issueData = res.data.data?.issue || res.data.data;

            // 🟢 THE FIX: Safely extract the assignee ID if assigned
            const currentAssignee = issueData.bidding?.winningBid?.authorityId;
            const assigneeId = currentAssignee ? (currentAssignee._id || currentAssignee) : '';

            setSelectedIssue(issueData);

            // 🟢 Inject the assigneeId into the updateData state for the dropdown
            setUpdateData({
                status: issueData.status,
                adminRemark: issueData.adminRemark || '',
                resolvedByAuthority: issueData.resolvedByAuthority ||
                    issueData.resolutionEvidence?.resolvedByAuthority ||
                    assigneeId || ''
            });

            setAssignData({ authorityId: '', commitmentTimeHours: '' }); // Reset assign form
            setRevokeData({ reason: '', penaltyPoints: 0 });
            setDisputeMedia(null);
            setActionTab('STATUS');
            setActionMenuOpen(false);

            setMediaTab('REPORTED');
            setCurrentMediaIndex(0);

            setIsIssueModalOpen(true);
        } catch (e) {
            showToast({ icon: 'error', title: 'Failed to fetch issue details' });
        } finally { setFetchingIssueId(null); }
    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setShowDeleteConfirm(false);
        setActionMenuOpen(false);
        setTimeout(() => {
            setSelectedIssue(null);
            setDisputeMedia(null);
        }, 300);
    };

    const getCsiLedger = () => {
        if (!selectedUserDetails?.history) return [];
        const completed = (selectedUserDetails.history.COMPLETED || []).map(i => ({ ...i, type: 'EARNED', points: i.impactScore || 50 }));
        const failed = (selectedUserDetails.history.FAILED || []).map(i => {
            const isGhost = i.auditLog?.some(log => log.action === 'GHOST_ABANDONMENT' && log.performedBy === selectedUserDetails.user._id);
            return { ...i, type: 'DEDUCTED', points: isGhost ? -100 : -50 };
        });
        return [...completed, ...failed].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    };

    const handleGlobalExport = async () => {
        try {
            showToast({ icon: 'loading', title: 'Generating Global Excel...' });
            const res = await axiosInstance.get('/admin/export/users', { params: { search, role: roleFilter, state: stateFilter, district: districtFilter }, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'LocalAwaaz_Users.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast({ icon: 'success', title: 'Export Complete!' });
        } catch (error) { showToast({ icon: 'error', title: 'Export failed' }); }
    };

    const handlePointAdjustment = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(`/admin/user/${selectedUserDetails.user._id}/points`, { points: Number(pointsModal.points), reason: pointsModal.reason });
            showToast({ icon: 'success', title: 'Points adjusted' });
            setPointsModal({ isOpen: false, points: '', reason: '' });
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) { showToast({ icon: 'error', title: 'Failed to adjust points' }); }
    };

    // 🟢 EXTENSION REQUEST HANDLER
    const handleExtensionAction = async (action, timeValue, timeUnit) => {
        setIsUpdating(true);
        try {
            const payload = { action };
            if (action === 'APPROVED') {
                payload.timeValue = timeValue;
                payload.timeUnit = timeUnit;
            }

            await axiosInstance.patch(`/admin/issue/${selectedIssue._id}/extension`, payload);
            showToast({ icon: 'success', title: `Extension ${action.toLowerCase()}!` });
            closeIssueModal();
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to process extension' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {};
            Object.keys(editProfileModal.formData).forEach(key => {
                const val = editProfileModal.formData[key];
                if (val !== '' && val !== null && val !== undefined) {
                    payload[key] = val;
                }
            });

            await axiosInstance.patch(`/admin/user/${selectedUserDetails.user._id}/edit`, payload);
            showToast({ icon: 'success', title: 'Profile Updated' });
            setEditProfileModal({ isOpen: false, formData: {} });
            fetchUserFullDetails(selectedUserDetails.user._id);
            fetchUsers();
        } catch (error) { showToast({ icon: 'error', title: 'Failed to update profile' }); }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            // 🟢 Intercept logic for God-Mode Reject
            if (updateData.status === 'REJECTED') {
                await axiosInstance.patch(`/admin/issue/${selectedIssue._id}/force-reject`, {
                    reason: updateData.adminRemark
                });
            } else {
                // 🟢 Standard Status Update Logic
                let payload = updateData;
                let headers = {};

                if (['DISPUTED', 'RESOLVED'].includes(updateData.status) && disputeMedia) {
                    payload = new FormData();
                    payload.append('status', updateData.status);
                    payload.append('adminRemark', updateData.adminRemark);
                    if (updateData.resolvedByAuthority) {
                        payload.append('resolvedByAuthority', updateData.resolvedByAuthority);
                    }
                    payload.append('media', disputeMedia);
                    headers = { 'Content-Type': 'multipart/form-data' };
                }

                await axiosInstance.patch(`/admin/issue/${selectedIssue._id}`, payload, { headers });
            }

            showToast({
                icon: 'success',
                title: updateData.status === 'REJECTED' ? 'Issue Forcefully Rejected' : 'Status updated and users notified'
            });
            setDisputeMedia(null);
            closeIssueModal();
            fetchUserFullDetails(selectedUserDetails.user._id);
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
                showToast({ icon: 'info', title: `Assigned! Note: Issue is in ${issueDistrict || 'another area'}.` });
            } else {
                showToast({ icon: 'success', title: 'Issue Forcibly Locked!' });
            }

            closeIssueModal();
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) { showToast({ icon: 'error', title: 'Assignment failed' }); }
        finally { setIsUpdating(false); }
    };

    const handleRevokeAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${selectedIssue._id}/force-unassign`, {
                reason: revokeData.reason,
                penaltyPoints: Number(revokeData.penaltyPoints)
            });
            showToast({ icon: 'success', title: 'Authority stripped from issue' });
            closeIssueModal();
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) { showToast({ icon: 'error', title: 'Failed to unassign' }); }
        finally { setIsUpdating(false); }
    };

    const handleDeleteIssue = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/admin/issue/${selectedIssue._id}`);
            showToast({ icon: 'success', title: 'Issue permanently deleted' });
            closeIssueModal();
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Delete failed' });
        } finally { setIsDeleting(false); }
    };

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

    const handleRoleChange = async (id, newRole) => {
        try { await axiosInstance.patch(`/admin/user/${id}/edit`, { role: newRole }); setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u)); showToast({ icon: 'success', title: `Role updated` }); } catch (e) { showToast({ icon: 'error', title: 'Failed to update' }); }
    };
    const handleStatusChange = async (id, newStatus) => {
        try { await axiosInstance.patch(`/admin/user/${id}/status`, { accountStatus: newStatus }); setUsers(users.map(u => u._id === id ? { ...u, accountStatus: newStatus } : u)); if (selectedUserDetails?.user?._id === id) setSelectedUserDetails(prev => ({ ...prev, user: { ...prev.user, accountStatus: newStatus } })); showToast({ icon: 'success', title: `Status updated` }); } catch (e) { showToast({ icon: 'error', title: 'Failed to update' }); }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this user?")) return;
        setIsDeleting(true);
        try { await axiosInstance.delete(`/admin/user/${id}`); setUsers(users.filter(u => u._id !== id)); if (selectedUserDetails?.user?._id === id) setIsModalOpen(false); showToast({ icon: 'success', title: 'User deleted' }); } catch (e) { showToast({ icon: 'error', title: 'Failed to delete' }); } finally { setIsDeleting(false); }
    };

    const isAuthority = ['official', 'ngo', 'other'].includes(selectedUserDetails?.user?.role);
    const activeList = selectedUserDetails?.history?.[activeHistoryTab] || [];

    const triggerEditProfile = () => {
        const u = selectedUserDetails.user;
        setEditProfileModal({
            isOpen: true,
            formData: {
                name: u.name || '',
                userName: u.userName || '',
                email: u.contact?.email || '',
                password: '',
                state: u.contact?.state || '',
                city: u.contact?.city || '',
                'contact.pinCode': u.contact?.pinCode || '',
                departmentName: u.authorityProfile?.departmentName || '',
                assignedState: u.authorityProfile?.assignedState || '',
                assignedDistrict: u.authorityProfile?.assignedDistrict || ''
            }
        });
    };

    // 🟢 MEDIA TABS LOGIC
    let claimedUrls = [];
    let opposedUrls = [];
    let reportedUrls = [];
    let activeMediaArray = [];

    if (selectedIssue) {
        claimedUrls = [
            selectedIssue.resolutionEvidence?.mediaUrl,
            ...(selectedIssue.workCycle?.handoverReports?.map(h => h.photoUrl) || [])
        ].filter(Boolean);

        opposedUrls = [
            selectedIssue.disputeEvidence?.mediaUrl,
            selectedIssue.reportedByVerdictMedia,
            ...(selectedIssue.confirmations?.map(c => c.verdictMedia) || [])
        ].filter(Boolean);

        reportedUrls = (selectedIssue.media || [])
            .map(m => m.url)
            .filter(url => !claimedUrls.includes(url) && !opposedUrls.includes(url));

        activeMediaArray = mediaTab === 'REPORTED' ? reportedUrls
            : mediaTab === 'CLAIMED' ? claimedUrls
                : opposedUrls;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 flex flex-col h-full overflow-y-auto pb-10">            {/* HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-[50]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                        <UserIcon className="text-primary w-8 h-8" /> User Management
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Manage citizens, verify officials, and audit platform activities.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleGlobalExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0"
                >
                    <Download size={18} /> Export Users
                </motion.button>
            </div>

            {/* Mobile Filter Toggle Header */}
            <div className="flex xl:hidden justify-between items-center mt-2">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Search className="text-primary" size={20} /> User Filters
                </h3>
                <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`p-2.5 rounded-xl border transition-colors ${isMobileFilterOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground'}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* FILTERS */}
            <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} xl:block bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-lg relative z-[40]`}>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input type="text" placeholder="Search by name, email, username..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner" />
                    </div>
                    <div className="flex gap-3 flex-wrap xl:flex-nowrap relative z-[70]">
                        <div className="w-full sm:w-36 relative z-[74]"><CustomSelect options={FILTER_ROLE_OPTIONS} value={roleFilter} onChange={(val) => { setRoleFilter(val); setPage(1); }} /></div>
                        <div className="w-full sm:w-36 relative z-[73]"><CustomSelect options={stateOptions} value={stateFilter} onChange={handleStateChange} /></div>
                        <div className="w-full sm:w-40 relative z-[72]"><CustomSelect options={districtOptions} value={districtFilter} onChange={(val) => { setDistrictFilter(val); setPage(1); }} /></div>
                    </div>
                </div>
            </div>

            {/* 🟢 Mobile Card View Wrapper (Hidden on md+) */}
            <div className="md:hidden flex flex-col gap-3 relative z-[10]">
                <AnimatePresence>
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-card/60 border border-border/60 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-muted shrink-0"></div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-muted rounded"></div>
                                            <div className="h-3 w-1/2 bg-muted/50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-7 w-7 bg-muted rounded-md shrink-0"></div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="h-3 w-4 bg-muted rounded"></div>
                                    <div className="h-3 w-2/3 bg-muted/50 rounded"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/30">
                                    <div className="h-9 w-full bg-muted rounded-xl"></div>
                                    <div className="h-9 w-full bg-muted rounded-xl"></div>
                                </div>
                            </div>
                        ))
                    ) : users.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 text-center bg-card/40 border border-border/50 rounded-2xl">
                            <Search className="w-8 h-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">No users found matching parameters.</p>
                        </motion.div>
                    ) : (
                        users.map((user, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                key={user._id}
                                className="relative bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-all cursor-pointer group"
                                style={{ zIndex: users.length - index }}
                                onClick={() => fetchUserFullDetails(user._id)}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Avatar src={user.profilePic} name={user.name} size="w-10 h-10" iconSize="w-5 h-5" />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{user.name || user.userName}</h4>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user.contact?.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }} disabled={isDeleting} className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all shrink-0">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin size={12} className="opacity-50" />
                                    <span className="truncate">{user.authorityProfile?.assignedDistrict || user.contact?.city || 'Unknown'}, {user.authorityProfile?.assignedState || user.contact?.state || 'Unknown'}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/30" onClick={e => e.stopPropagation()}>
                                    <CustomSelect options={ROLE_OPTIONS} value={user.role} onChange={(val) => handleRoleChange(user._id, val)} />
                                    <CustomSelect options={STATUS_OPTIONS} value={user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(user._id, val)} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* 🟢 Desktop Table Wrapper (Hidden on mobile) */}
            <div className="hidden md:flex bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex-col min-h-[400px] relative z-10">
                <div className="overflow-x-auto thin-scrollbar bg-background/20 flex-1">
                    <table className="w-full text-left whitespace-nowrap table-fixed min-w-[800px]">
                        <thead className="bg-muted/40 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                            <tr className="text-muted-foreground text-[10px] md:text-sm uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold w-[35%]">User Profile</th>
                                <th className="py-4 px-6 font-bold w-[25%]">Location</th>
                                <th className="py-4 px-6 font-bold w-[15%]">Role</th>
                                <th className="py-4 px-6 font-bold w-[15%]">Status</th>
                                <th className="py-4 px-6 font-bold w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <AnimatePresence>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-border/30">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-muted shrink-0"></div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="h-4 w-32 bg-muted rounded"></div>
                                                        <div className="h-3 w-48 bg-muted/50 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-2">
                                                    <div className="h-4 w-24 bg-muted rounded"></div>
                                                    <div className="h-3 w-32 bg-muted/50 rounded"></div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 pr-2"><div className="h-9 w-full bg-muted rounded-xl"></div></td>
                                            <td className="py-4 px-6 pr-2"><div className="h-9 w-full bg-muted rounded-xl"></div></td>
                                            <td className="py-4 px-6 flex justify-end items-center h-full pt-6"><div className="h-8 w-20 bg-muted rounded-lg"></div></td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan="5" className="p-12 text-center text-sm font-medium text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                <Search className="w-8 h-8 opacity-20 mb-2" />
                                                <p className="font-medium">No users found matching parameters.</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    users.map((user, index) => (
                                        <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={user._id} className="hover:bg-primary/5 transition-all group" style={{ zIndex: users.length - index }}>
                                            <td className="py-4 px-6 truncate cursor-pointer" onClick={() => fetchUserFullDetails(user._id)}>
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.profilePic} name={user.name} size="w-10 h-10" iconSize="w-5 h-5" />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors text-left truncate">{user.name || user.userName}</span>
                                                        <span className="text-[11px] font-medium text-muted-foreground truncate">{user.contact?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 truncate">
                                                <p className="text-sm font-semibold">{user.authorityProfile?.assignedDistrict || user.contact?.city || 'Unknown'}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{user.authorityProfile?.assignedState || user.contact?.state || 'Unknown'}</p>
                                            </td>
                                            <td className="py-4 px-6 pr-2"><CustomSelect options={ROLE_OPTIONS} value={user.role} onChange={(val) => handleRoleChange(user._id, val)} /></td>
                                            <td className="py-4 px-6 pr-2"><CustomSelect options={STATUS_OPTIONS} value={user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(user._id, val)} /></td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => handleDelete(user._id)} disabled={isDeleting} className="text-[10px] md:text-xs px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-1.5 ml-auto hover:bg-red-500 hover:text-white transition-all font-bold">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
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
            {/* PORTAL MODALS (Rendered completely outside DOM flow) */}
            {/* ========================================================= */}

            {isMounted && createPortal(
                <>
                    {/* 1. MAIN USER PROFILE MODAL */}
                    <AnimatePresence>
                        {isModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in transition-all duration-300 ease-in-out" style={{ zIndex: modalZ.profile }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

                                <motion.div
                                    initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="bg-card border border-border/50 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col relative overflow-hidden max-h-full"
                                >
                                    <div className="p-4 md:p-6 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0">
                                        <h3 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                                            <UserIcon className="w-5 h-5 text-primary" /> User Profile & Audit
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar flex-1 min-h-0 bg-background/30">
                                        {modalLoading ? (
                                            <div className="space-y-6 animate-pulse">
                                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start relative bg-card border border-border/50 p-5 rounded-2xl shadow-sm">
                                                    <div className="w-20 h-20 rounded-full bg-muted shrink-0"></div>
                                                    <div className="flex-1 space-y-3 w-full min-w-0">
                                                        <div className="h-6 w-48 bg-muted rounded mx-auto sm:mx-0"></div>
                                                        <div className="h-4 w-64 bg-muted/50 rounded mx-auto sm:mx-0"></div>
                                                        <div className="h-8 w-32 bg-muted rounded-lg mx-auto sm:mx-0 mt-2"></div>
                                                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                                                            <div className="h-3 w-32 bg-muted rounded"></div>
                                                            <div className="h-3 w-32 bg-muted rounded"></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-40 h-14 bg-muted rounded-xl shrink-0"></div>
                                                </div>
                                                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
                                                    <div className="h-4 w-32 bg-muted rounded"></div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="h-10 w-full bg-muted/50 rounded"></div>
                                                        <div className="h-10 w-full bg-muted/50 rounded"></div>
                                                        <div className="h-10 w-full bg-muted/50 rounded"></div>
                                                        <div className="h-10 w-full bg-muted/50 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="h-4 w-32 bg-muted rounded mt-6"></div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                                    <div className="h-24 bg-card rounded-2xl border border-border/50"></div>
                                                    <div className="h-24 bg-card rounded-2xl border border-border/50"></div>
                                                    <div className="h-24 bg-card rounded-2xl border border-border/50"></div>
                                                    <div className="h-24 bg-card rounded-2xl border border-border/50"></div>
                                                </div>
                                            </div>
                                        ) : !selectedUserDetails ? (
                                            <div className="flex justify-center items-center py-12 text-muted-foreground font-medium">User details not found</div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left relative bg-card border border-border/50 p-5 rounded-2xl shadow-sm">
                                                    <Avatar src={selectedUserDetails.user.profilePic} name={selectedUserDetails.user.name} size="w-20 h-20" iconSize="w-10 h-10" />
                                                    <div className="flex-1 space-y-1 w-full min-w-0">
                                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                                            <h4 className="text-2xl font-black text-foreground truncate">{selectedUserDetails.user.name}</h4>
                                                            {isAuthority && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md border border-primary/20 shrink-0">{selectedUserDetails.user.role}</span>}
                                                        </div>
                                                        <p className="text-sm font-medium text-muted-foreground truncate">@{selectedUserDetails.user.userName} • {selectedUserDetails.user.contact?.email}</p>

                                                        <button onClick={triggerEditProfile} className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 justify-center sm:justify-start mt-2 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors w-max mx-auto sm:mx-0">
                                                            <UserCog size={12} /> Edit Profile Data
                                                        </button>

                                                        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-border/50 text-xs font-medium text-muted-foreground">
                                                            <span><span className="font-bold text-foreground">Joined:</span> {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}</span>
                                                            <span className="hidden sm:inline text-border">•</span>
                                                            <span><span className="font-bold text-foreground">Last Login:</span> {selectedUserDetails.user.lastLoginAt ? new Date(selectedUserDetails.user.lastLoginAt).toLocaleString() : 'Never'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-40 bg-muted/20 p-3 rounded-xl border border-border/50 shrink-0">
                                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 sm:text-left text-center">Account Status</label>
                                                        <CustomSelect options={STATUS_OPTIONS} value={selectedUserDetails.user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(selectedUserDetails.user._id, val)} />
                                                    </div>
                                                </div>

                                                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2"><Shield size={14} /> Profile Information</h4>
                                                    {isAuthority && selectedUserDetails.user.authorityProfile ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Designation</p><p className="font-bold text-sm text-foreground truncate">{selectedUserDetails.user.authorityProfile.designation || 'N/A'}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Department/Org</p><p className="font-bold text-sm text-foreground truncate">{selectedUserDetails.user.authorityProfile.departmentName || selectedUserDetails.user.authorityProfile.org || 'N/A'}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Area</p><p className="font-bold text-sm text-foreground truncate">{selectedUserDetails.user.authorityProfile.assignedDistrict || 'N/A'}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Verification</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${selectedUserDetails.user.authorityProfile.verificationStatus === 'APPROVED' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'}`}>{selectedUserDetails.user.authorityProfile.verificationStatus}</p></div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Rank</p><p className="font-bold text-sm text-foreground truncate">{selectedUserDetails.user.rank || 'Citizen'}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Civil Score</p><p className="font-bold text-sm text-foreground flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> {selectedUserDetails.user.civilScore || 10}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Badges Earned</p><p className="font-bold text-sm text-amber-500">{selectedUserDetails.user.badges?.length || 0}</p></div>
                                                            <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Account Status</p><p className={`font-bold text-xs w-max px-2 py-0.5 rounded uppercase mt-0.5 ${selectedUserDetails.user.accountStatus === 'ACTIVE' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>{selectedUserDetails.user.accountStatus || 'ACTIVE'}</p></div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center pl-1">
                                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-l-2 border-primary pl-2">Platform Metrics</h4>
                                                    <button onClick={() => setPointsModal({ isOpen: true, points: '', reason: '' })} className="text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-yellow-500/20 transition-colors uppercase tracking-wider shadow-sm">
                                                        <Zap size={12} /> Adjust Points
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                                    {isAuthority ? (
                                                        <>
                                                            <StatBox icon={<Clock className="text-indigo-500" />} title="Jobs Active" count={selectedUserDetails.history?.ASSIGNED?.length || 0} color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('ASSIGNED')} />
                                                            <StatBox icon={<CheckSquare className="text-emerald-500" />} title="Jobs Completed" count={selectedUserDetails.history?.COMPLETED?.length || 0} color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('COMPLETED')} />
                                                            <StatBox icon={<Briefcase className="text-amber-500" />} title="Jobs Released" count={selectedUserDetails.history?.RELEASED?.length || 0} color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('RELEASED')} />
                                                            <StatBox icon={<AlertTriangle className="text-rose-500" />} title="Jobs Failed" count={selectedUserDetails.history?.FAILED?.length || 0} color="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('FAILED')} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <StatBox icon={<AlertTriangle className="text-amber-500" />} title="Issues Reported" count={selectedUserDetails.history?.REPORTED?.length || 0} color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('REPORTED')} />
                                                            <StatBox icon={<CheckSquare className="text-emerald-500" />} title="Verifications" count={selectedUserDetails.history?.CONFIRMED?.length || 0} color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('CONFIRMED')} />
                                                            <StatBox icon={<Shield className="text-indigo-500" />} title="Flags Cast" count={selectedUserDetails.history?.FLAGGED?.length || 0} color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-md" onClick={() => openListModal('FLAGGED')} />
                                                            <StatBox icon={<Zap className="text-yellow-500" />} title="Civil Score" count={selectedUserDetails.user.civilScore || 10} color="border-yellow-500/30 bg-yellow-500/5" />
                                                        </>
                                                    )}
                                                </div>

                                                {isAuthority && (
                                                    <>
                                                        <div className="flex justify-between items-center pl-1 mt-6">
                                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-l-2 border-primary pl-2">Authority Rating & Control</h4>
                                                            <button onClick={() => setCsiModalOpen(true)} className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/20 transition-colors uppercase tracking-wider shadow-sm">
                                                                <Target size={12} /> View CSI Ledger
                                                            </button>
                                                        </div>
                                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-center shadow-sm relative group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setCsiModalOpen(true)}>
                                                            <Target className="w-6 h-6 mx-auto text-primary mb-2" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">CSI Score</p>
                                                            <div className="flex items-center justify-center mt-1">
                                                                <p className="text-2xl font-black text-primary">{selectedUserDetails.user.authorityProfile?.csiScore || 0}</p>
                                                            </div>
                                                        </div>

                                                        <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mt-6 mb-4">Operations</h4>
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <button onClick={() => setForceAssignModal({ isOpen: true, issues: [], selectedIssue: '', commitmentTimeHours: '' })} className="flex-1 px-5 py-3.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                                                <Briefcase size={16} /> Force Assign Job to Official
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary mb-4 mt-8">Leaderboard History</h4>
                                                <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                                                    {selectedUserDetails.history?.RANKINGS && selectedUserDetails.history.RANKINGS.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {selectedUserDetails.history.RANKINGS.map((rankEntry, idx) => (
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
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 2. NESTED HISTORY LIST MODAL */}
                    <AnimatePresence>
                        {isListModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in transition-all duration-300 ease-in-out" style={{ zIndex: modalZ.list }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setIsListModalOpen(false)} />

                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-3xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full relative">
                                    <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0">
                                        <h3 className="text-lg font-black flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary" /> {activeHistoryTab} History</h3>
                                        <button onClick={() => setIsListModalOpen(false)} className="text-muted-foreground p-1.5 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                                    </div>
                                    <div className="overflow-y-auto thin-scrollbar flex-1 p-4 md:p-6 space-y-3 bg-background/30">
                                        {activeList.length === 0 ? (
                                            <div className="text-center py-16 text-muted-foreground font-medium">
                                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No records found.</p>
                                            </div>
                                        ) : (
                                            activeList.map((issue, i) => (
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} key={issue._id} onClick={() => fetchAndOpenIssue(issue._id)} className="bg-card border border-border/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm group">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <h5 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{issue.title}</h5>
                                                        <p className="text-[11px] text-muted-foreground mt-1 font-medium tracking-wide uppercase truncate"><MapPin size={10} className="inline mr-1 shrink-0" /> <span className="truncate">{issue.location?.city}</span> • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-widest ${statusColors[issue.status] || statusColors.OPEN}`}>{issue.status}</span>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 3. NESTED ISSUE DETAIL MODAL (FULL VIEWER) */}
                    <AnimatePresence>
                        {isIssueModalOpen && selectedIssue && (
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in" style={{ zIndex: modalZ.issue }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={closeIssueModal} />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden z-10"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${statusColors[selectedIssue.status] || statusColors.OPEN}`}>
                                                {selectedIssue.status}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground hidden sm:block">ID: {selectedIssue._id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowDeleteConfirm(true)} title="Delete Issue" className="p-2 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
                                            <button onClick={closeIssueModal} className="p-2 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors"><X size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden thin-scrollbar">
                                        {/* Left Side: Media and Core Data */}
                                        <div className="w-full lg:w-1/2 p-4 md:p-6 lg:border-r border-border/50 flex flex-col gap-5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar bg-background/50">
                                            <h3 className="text-2xl font-black text-foreground leading-tight">{selectedIssue.title}</h3>

                                            {/* 🟢 MEDIA TABS */}
                                            {['DISPUTED', 'RESOLVED', 'REJECTED', 'AWAITING_HANDOVER'].includes(selectedIssue.status) || claimedUrls.length || opposedUrls.length ? (
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
                                                    <p className="text-sm font-bold text-foreground">{selectedIssue.location?.city}, {selectedIssue.location?.state}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{selectedIssue.location?.address} • PIN: {selectedIssue.location?.pinCode}</p>
                                                </div>
                                                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Impact Score</p>
                                                    <p className="text-2xl font-black text-yellow-500 flex items-center gap-1 justify-center"><Zap size={20} className="fill-yellow-500" /> {selectedIssue.impactScore || 0}</p>
                                                </div>
                                            </div>

                                            <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-4 lg:mb-0 shadow-inner">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Description</p>
                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{selectedIssue.description}</p>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN: Players, Actions, Timeline */}
                                        <div className="w-full lg:w-1/2 flex flex-col bg-muted/5 shrink-0 lg:shrink lg:overflow-y-auto thin-scrollbar relative z-30">

                                            {/* --- PLAYERS SECTION --- */}
                                            <div className="p-4 md:p-5 border-b border-border/50 shrink-0 relative z-[60]">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-card border border-border/50 p-3 rounded-xl flex justify-between items-center group relative">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Reporter</p>
                                                            <p className="text-sm font-bold truncate text-foreground">
                                                                {selectedIssue.isAnonymous ? 'Anonymous' : selectedIssue.reportedBy?.name || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={`p-3 rounded-xl border transition-colors min-w-0 ${selectedIssue.bidding?.winningBid?.authorityId ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-card border-border/50'}`}>
                                                        <p className={`text-[9px] font-bold uppercase mb-1 ${selectedIssue.bidding?.winningBid?.authorityId ? 'text-indigo-500' : 'text-muted-foreground'}`}>Assigned Official</p>
                                                        {selectedIssue.bidding?.winningBid?.authorityId ? (
                                                            <div>
                                                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">{selectedIssue.bidding.winningBid.authorityId.name || 'ID Linked'}</p>
                                                                <p className="text-[10px] text-indigo-500/80 font-bold mt-0.5 truncate">Commitment: {selectedIssue.bidding.winningBid.commitmentTimeHours}h</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic mt-1 font-medium truncate">Unassigned</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 🟢 PENDING EXTENSION BANNER */}
                                                {selectedIssue.status === 'PENDING_EXTENSION' && (
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
                                                                {selectedIssue.workCycle?.extensionRequests?.slice(-1)[0]?.hoursRequested} Hours
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 mb-4 border-l-2 border-amber-500/50 pl-2">
                                                                Reason: {selectedIssue.workCycle?.extensionRequests?.slice(-1)[0]?.reason}
                                                            </p>

                                                            {/* 🟢 FIXED: Inputs are now Pre-filled and Disabled (Read-Only) */}
                                                            <div className="flex gap-2 mb-4 relative z-50">
                                                                <input
                                                                    type="number"
                                                                    className="w-1/3 p-2 rounded-lg bg-background/50 border border-border/50 text-xs font-bold outline-none opacity-70 cursor-not-allowed"
                                                                    value={selectedIssue.workCycle?.extensionRequests?.slice(-1)[0]?.requestedTimeValue || ''}
                                                                    disabled
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="w-2/3 p-2 rounded-lg bg-background/50 border border-border/50 text-xs font-bold outline-none opacity-70 cursor-not-allowed uppercase"
                                                                    value={selectedIssue.workCycle?.extensionRequests?.slice(-1)[0]?.requestedTimeUnit || ''}
                                                                    disabled
                                                                />
                                                            </div>

                                                            <div className="flex gap-2 relative z-10">
                                                                <button
                                                                    onClick={() => {
                                                                        const pendingReq = selectedIssue.workCycle?.extensionRequests?.slice(-1)[0];
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
                                                    {selectedIssue.bidding?.winningBid?.authorityId ? (
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
                                                                <label className={`text-[10px] mb-1 block font-semibold uppercase truncate ${updateData.status === 'REJECTED' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                                    {updateData.status === 'REJECTED' ? 'Rejection Reason (Required)' : 'Audit Remark (Optional)'}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    required={updateData.status === 'REJECTED'}
                                                                    value={updateData.adminRemark}
                                                                    onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })}
                                                                    placeholder={updateData.status === 'REJECTED' ? "Why is this being rejected?" : "Add context..."}
                                                                    className={`w-full px-3 py-2 bg-muted border rounded-xl text-xs font-medium outline-none transition-colors ${updateData.status === 'REJECTED' ? 'border-red-500/50 focus:border-red-500' : 'border-border/50 focus:border-primary'}`}
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
                                                                    onChange={(e) => setDisputeMedia(e.target.files[0])}
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
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 pl-2 border-l-2 border-primary">System Timeline & Audit Log</h4>
                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent pb-4">
                                                    {generateTimeline(selectedIssue).map((event, i) => (
                                                        <div key={i} className="relative flex items-start gap-4">
                                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-sm ${event.color} z-10`}>
                                                                {event.icon}
                                                            </div>
                                                            <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1">
                                                                <h5 className="font-black text-[11px] md:text-xs uppercase tracking-wider">{event.label}</h5>
                                                                <div className="text-[10px] font-bold text-muted-foreground font-mono mt-1 mb-2">{event.time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                {event.detail && <p className="text-[11px] text-foreground/80 bg-muted/40 p-2.5 border border-border/40 rounded-xl leading-relaxed">{event.detail}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 4. CSI HISTORY MODAL */}
                    <AnimatePresence>
                        {csiModalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in" style={{ zIndex: Math.max(modalZ.profile, modalZ.list, modalZ.issue) + 20 }}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setCsiModalOpen(false)} />
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-2xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] relative z-10">
                                    <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0">
                                        <h3 className="text-xl font-black text-primary flex items-center gap-2">
                                            <Target size={20} /> CSI Ledger
                                        </h3>
                                        <button onClick={() => setCsiModalOpen(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"><X size={20} /></button>
                                    </div>
                                    <div className="overflow-y-auto thin-scrollbar flex-1 p-4 md:p-6 space-y-3 bg-background/30">
                                        {getCsiLedger().length === 0 ? (
                                            <div className="text-center py-20 text-muted-foreground font-medium"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />No points history recorded yet.</div>
                                        ) : (
                                            getCsiLedger().map((record, i) => (
                                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={record._id + i} className={`bg-card border p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 shadow-sm relative overflow-hidden ${record.type === 'EARNED' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${record.type === 'EARNED' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <div className="overflow-hidden w-full sm:flex-1 pl-2">
                                                        <p className="text-sm font-bold text-foreground truncate">{record.title}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground mt-1">{new Date(record.updatedAt || record.createdAt).toLocaleString()}</p>
                                                        <p className="text-[9px] uppercase tracking-wider mt-2 font-bold text-muted-foreground">
                                                            Reason: {record.type === 'EARNED' ? 'Successfully Resolved & Verified' : (record.points === -100 ? 'Ghost Abandonment Protocol' : 'Missed Deadline / Handover')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-end shrink-0">
                                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-sm ${record.type === 'EARNED' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                                            {record.type === 'EARNED' ? '+' : ''}{record.points}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* 🟢 5. Delete Confirmation Overlay */}
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
    <div onClick={onClick} className={`p-4 border rounded-2xl flex flex-col items-start gap-3 shadow-sm transition-all min-w-0 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default'} ${color}`}>
        <div className="p-2 bg-background/80 rounded-xl shadow-inner border border-border/50 shrink-0">{icon}</div>
        <div className="text-left w-full min-w-0">
            <h4 className="text-2xl font-black text-foreground truncate">{count}</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 truncate">{title}</p>
        </div>
    </div>
);

export default AdminUsers;