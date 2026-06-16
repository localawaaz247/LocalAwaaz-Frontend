import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { Search, X, User as UserIcon, Shield, Activity, AlertCircle, Clock, Trash2, FileSignature, Target, AlertTriangle, Download, Plus, Minus, UserCog, ArrowRight, ShieldAlert, CheckSquare, Briefcase } from 'lucide-react';
import IssueDetail from '../IssueDetail';
import CustomSelect from '../CustomSelect';
import MiniLoader from '../MiniLoader';
import { cscApi } from '../../utils/cscAPI';

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
    return <img src={src} alt={name || "User"} onError={() => setImageError(true)} referrerPolicy="no-referrer" className={`${size} shrink-0 rounded-full object-cover border border-border/50`} />;
};

const AdminUsers = () => {
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState('REPORTED');

    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
    const [fetchingIssueId, setFetchingIssueId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // God-Mode State Management
    const [pointsModal, setPointsModal] = useState({ isOpen: false, points: '', reason: '' });
    const [editProfileModal, setEditProfileModal] = useState({ isOpen: false, formData: {} });

    // Dispute Media Upload State
    const [disputeMedia, setDisputeMedia] = useState(null);
    const [updateData, setUpdateData] = useState({ status: '', adminRemark: '' });

    const [forceAssignModal, setForceAssignModal] = useState({ isOpen: false, issues: [], selectedIssue: '', commitmentTimeHours: '' });
    const [forceUnassignModal, setForceUnassignModal] = useState({ isOpen: false, issueId: '', reason: '', penalty: 0 });

    // Location States for Edit Modal
    const [modalDistrictsList, setModalDistrictsList] = useState([]);
    const [modalAssignedDistrictsList, setModalAssignedDistrictsList] = useState([]);

    const ROLE_OPTIONS = [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }, { value: 'official', label: 'Official' }, { value: 'ngo', label: 'NGO' }];
    const FILTER_ROLE_OPTIONS = [{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS];
    const STATUS_OPTIONS = [{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'BANNED', label: 'Banned' }];

    // Fetch Global States List (used everywhere)
    useEffect(() => { cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error); }, []);

    // Fetch Districts for Main Filter
    useEffect(() => {
        if (!stateFilter) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === stateFilter);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [stateFilter, statesList]);

    // Fetch Districts for Edit Modal (Contact Location)
    useEffect(() => {
        if (editProfileModal.isOpen && editProfileModal.formData.state) {
            const stateObj = statesList.find(s => s.name === editProfileModal.formData.state);
            if (stateObj) {
                cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`)
                    .then(res => setModalDistrictsList(res.data))
                    .catch(console.error);
            }
        } else {
            setModalDistrictsList([]);
        }
    }, [editProfileModal.formData.state, editProfileModal.isOpen, statesList]);

    // Fetch Districts for Edit Modal (Authority Assigned Location)
    useEffect(() => {
        if (editProfileModal.isOpen && editProfileModal.formData.assignedState) {
            const stateObj = statesList.find(s => s.name === editProfileModal.formData.assignedState);
            if (stateObj) {
                cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`)
                    .then(res => setModalAssignedDistrictsList(res.data))
                    .catch(console.error);
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

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/users', { params: { page, limit: 15, search, role: roleFilter, state: stateFilter, district: districtFilter } });
            setUsers(res.data.data.users);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchUserFullDetails = async (id) => {
        try {
            setModalLoading(true);
            setIsModalOpen(true);
            const res = await axiosInstance.get(`/admin/user/${id}`);
            setSelectedUserDetails(res.data.data);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load user details' });
            setIsModalOpen(false);
        } finally { setModalLoading(false); }
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

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {};
            // Only send filled fields to prevent overwriting with blanks 
            // unless the admin explicitly wants to clear a field (handled dynamically by backend)
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

    const openForceAssignModal = async () => {
        try {
            const res = await axiosInstance.get(`/admin/issues/assignable`);
            if (res.data.data.length === 0) return showToast({ icon: 'error', title: `No active assignable issues globally` });

            setForceAssignModal({ isOpen: true, issues: res.data.data, selectedIssue: '', commitmentTimeHours: '' });
        } catch (error) { showToast({ icon: 'error', title: 'Failed to fetch issues' }); }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            let payload = updateData;
            let headers = {};

            if (updateData.status === 'DISPUTED' && disputeMedia) {
                payload = new FormData();
                payload.append('status', updateData.status);
                payload.append('adminRemark', updateData.adminRemark);
                payload.append('media', disputeMedia);
                headers = { 'Content-Type': 'multipart/form-data' };
            }

            await axiosInstance.patch(`/admin/issue/${selectedIssueForDetail._id}`, payload, { headers });

            showToast({ icon: 'success', title: 'Status updated and users notified' });
            setDisputeMedia(null);
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Update failed' });
        } finally { setIsUpdating(false); }
    };

    const handleForceAssign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${forceAssignModal.selectedIssue}/force-assign`, {
                authorityId: selectedUserDetails.user._id,
                commitmentTimeHours: Number(forceAssignModal.commitmentTimeHours)
            });

            const assignedIssue = forceAssignModal.issues.find(i => i._id === forceAssignModal.selectedIssue);
            const userDistrict = selectedUserDetails.user.authorityProfile?.assignedDistrict || selectedUserDetails.user.contact?.city;
            const issueDistrict = assignedIssue?.location?.city || assignedIssue?.location?.district;

            const isMismatch = userDistrict?.toLowerCase() !== issueDistrict?.toLowerCase();

            if (isMismatch) {
                showToast({ icon: 'info', title: `Assigned! Note: Issue is in ${issueDistrict || 'another area'}.` });
            } else {
                showToast({ icon: 'success', title: 'Issue Forcibly Locked!' });
            }

            setForceAssignModal({ isOpen: false, issues: [], selectedIssue: '', commitmentTimeHours: '' });
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) { showToast({ icon: 'error', title: 'Assignment failed' }); }
        finally { setIsUpdating(false); }
    };

    const handleForceUnassign = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await axiosInstance.patch(`/admin/issue/${forceUnassignModal.issueId}/force-unassign`, {
                reason: forceUnassignModal.reason,
                penaltyPoints: Number(forceUnassignModal.penalty)
            });
            showToast({ icon: 'success', title: 'Authority stripped from issue' });
            setForceUnassignModal({ isOpen: false, issueId: '', reason: '', penalty: 0 });
            fetchUserFullDetails(selectedUserDetails.user._id);
        } catch (error) { showToast({ icon: 'error', title: 'Failed to unassign' }); }
        finally { setIsUpdating(false); }
    };

    const handleRoleChange = async (id, newRole) => {
        try { await axiosInstance.patch(`/admin/user/${id}/role`, { role: newRole }); setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u)); showToast({ icon: 'success', title: `Role updated` }); } catch (e) { showToast({ icon: 'error', title: 'Failed to update' }); }
    };
    const handleStatusChange = async (id, newStatus) => {
        try { await axiosInstance.patch(`/admin/user/${id}/status`, { accountStatus: newStatus }); setUsers(users.map(u => u._id === id ? { ...u, accountStatus: newStatus } : u)); if (selectedUserDetails?.user?._id === id) setSelectedUserDetails(prev => ({ ...prev, user: { ...prev.user, accountStatus: newStatus } })); showToast({ icon: 'success', title: `Status updated` }); } catch (e) { showToast({ icon: 'error', title: 'Failed to update' }); }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this user?")) return;
        setIsDeleting(true);
        try { await axiosInstance.delete(`/admin/user/${id}`); setUsers(users.filter(u => u._id !== id)); if (selectedUserDetails?.user?._id === id) setIsModalOpen(false); showToast({ icon: 'success', title: 'User deleted' }); } catch (e) { showToast({ icon: 'error', title: 'Failed to delete' }); } finally { setIsDeleting(false); }
    };

    const handleIssueDetailsClick = async (issue) => {
        try {
            setFetchingIssueId(issue._id);
            const res = await axiosInstance.get(`/admin/issue/${issue._id}`);
            setSelectedIssueForDetail(res.data.data?.issue || res.data.data || issue);
            setUpdateData({ status: issue.status, adminRemark: '' });
            setIsIssueModalOpen(true);
        } catch (e) { setSelectedIssueForDetail(issue); setIsIssueModalOpen(true); } finally { setFetchingIssueId(null); }
    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setDisputeMedia(null);
        setTimeout(() => setSelectedIssueForDetail(null), 300);
    };

    const isAuthority = selectedUserDetails?.user?.role === 'official' || selectedUserDetails?.user?.role === 'ngo';
    const activeList = selectedUserDetails?.history?.[activeHistoryTab] || [];

    const UPDATE_STATUS_OPTIONS = [
        { value: 'OPEN', label: 'OPEN (Attention)' },
        { value: 'IN_REVIEW', label: 'IN REVIEW (Initiated)' },
        { value: 'RESOLVED', label: 'RESOLVED (Fixed)' },
        { value: 'REJECTED', label: 'REJECTED (Spam)' },
        { value: 'DISPUTED', label: 'DISPUTED (Conflict)' },
        { value: 'ORPHANED', label: 'ORPHANED (Stagnant)' }
    ];

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

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full relative">

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex flex-wrap items-center justify-between w-full xl:w-auto gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground shrink-0">User Management</h2>
                    <button onClick={handleGlobalExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold transition-colors shrink-0">
                        <Download size={14} /> Export Users
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto flex-1 xl:justify-end">
                    <div className="w-full"><CustomSelect options={FILTER_ROLE_OPTIONS} value={roleFilter} onChange={(val) => { setRoleFilter(val); setPage(1); }} /></div>
                    <div className="w-full"><CustomSelect options={stateOptions} value={stateFilter} onChange={handleStateChange} /></div>
                    <div className="w-full"><CustomSelect options={districtOptions} value={districtFilter} onChange={(val) => { setDistrictFilter(val); setPage(1); }} /></div>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground shadow-sm" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : users.length === 0 ? (
                <div className="flex-1 flex justify-center items-center text-muted-foreground bg-card glass-card border border-border/50 rounded-2xl p-8">No users found.</div>
            ) : (
                <>
                    {/* Mobile View */}
                    <div className="md:hidden grid grid-cols-1 gap-4 overflow-y-auto thin-scrollbar pb-4">
                        {users.map((user, index) => (
                            <div key={user._id} className="bg-card glass-card border border-border/50 rounded-xl p-4 flex flex-col gap-4 shadow-sm relative" style={{ zIndex: users.length - index }}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Avatar src={user.profilePic} name={user.name} size="w-12 h-12" iconSize="w-6 h-6" />
                                        <div className="flex flex-col overflow-hidden">
                                            <button onClick={() => fetchUserFullDetails(user._id)} className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate text-sm">{user.name || user.userName}</button>
                                            <span className="text-xs text-muted-foreground truncate">{user.contact?.email}</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5 truncate">{user.authorityProfile?.assignedDistrict || user.contact?.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border/30 relative z-10">
                                    <div className="flex flex-col gap-1 w-full"><CustomSelect options={ROLE_OPTIONS} value={user.role} onChange={(val) => handleRoleChange(user._id, val)} /></div>
                                    <div className="flex flex-col gap-1 w-full"><CustomSelect options={STATUS_OPTIONS} value={user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(user._id, val)} /></div>
                                </div>
                                <button onClick={() => handleDelete(user._id)} disabled={isDeleting} className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /> Delete</button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:flex bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-lg flex-1 flex-col min-h-0">
                        <div className="overflow-y-auto thin-scrollbar flex-1">
                            <table className="w-full text-left whitespace-nowrap table-fixed">
                                <thead className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                                    <tr className="text-muted-foreground text-sm">
                                        <th className="py-4 px-6 font-medium w-[30%]">User Profile</th>
                                        <th className="py-4 px-6 font-medium w-[20%]">Location</th>
                                        <th className="py-4 px-6 font-medium w-[20%]">Role</th>
                                        <th className="py-4 px-6 font-medium w-[20%]">Status</th>
                                        <th className="py-4 px-6 font-medium w-[10%] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {users.map((user, index) => (
                                        <tr key={user._id} className="hover:bg-primary/5 transition-colors relative" style={{ zIndex: users.length - index }}>
                                            <td className="py-4 px-6 truncate">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.profilePic} name={user.name} size="w-10 h-10" iconSize="w-5 h-5" />
                                                    <div className="flex flex-col min-w-0">
                                                        <button onClick={() => fetchUserFullDetails(user._id)} className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left text-sm truncate">{user.name || user.userName}</button>
                                                        <span className="text-xs text-muted-foreground truncate">{user.contact?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 truncate"><span className="text-sm text-foreground">{user.authorityProfile?.assignedDistrict || user.contact?.city || '-'}</span></td>
                                            <td className="py-4 px-6 pr-2"><CustomSelect options={ROLE_OPTIONS} value={user.role} onChange={(val) => handleRoleChange(user._id, val)} /></td>
                                            <td className="py-4 px-6 pr-2"><CustomSelect options={STATUS_OPTIONS} value={user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(user._id, val)} /></td>
                                            <td className="py-4 px-6 text-right"><button onClick={() => handleDelete(user._id)} disabled={isDeleting} className="text-xs px-4 py-2 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-1.5 ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground pt-2">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-1.5 md:space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-card glass-card border border-border/50 rounded-lg">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-card glass-card border border-border/50 rounded-lg">Next</button>
                    </div>
                </div>
            )}

            {/* MAIN USER PROFILE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in transition-all duration-300 ease-in-out">
                    <div className="bg-card w-full max-w-4xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] my-4 relative">
                        <div className="p-4 md:p-6 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0">
                            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" /> User Profile & Audit
                            </h3>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar flex-1 min-h-0">
                            {modalLoading ? (
                                <div className="flex justify-center items-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                            ) : !selectedUserDetails ? (
                                <div className="flex justify-center items-center py-12 text-muted-foreground">User details not found</div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left relative">
                                        <Avatar src={selectedUserDetails.user.profilePic} name={selectedUserDetails.user.name} size="w-20 h-20" iconSize="w-10 h-10" />
                                        <div className="flex-1 space-y-1 w-full">
                                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                                <h4 className="text-xl font-bold text-foreground">{selectedUserDetails.user.name}</h4>
                                                {isAuthority && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md border border-primary/20">{selectedUserDetails.user.role}</span>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">@{selectedUserDetails.user.userName} • {selectedUserDetails.user.contact?.email}</p>

                                            <button
                                                onClick={triggerEditProfile}
                                                className="text-[11px] font-bold text-blue-500 flex items-center gap-1 justify-center sm:justify-start mt-1 hover:underline"
                                            >
                                                <UserCog size={12} /> Edit Profile Data
                                            </button>

                                            <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                                <span><span className="font-medium text-foreground">Joined:</span> {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span><span className="font-medium text-foreground">Last Login:</span> {selectedUserDetails.user.lastLoginAt ? new Date(selectedUserDetails.user.lastLoginAt).toLocaleString() : 'Never'}</span>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto bg-muted/20 p-3 rounded-xl border border-border/50 shrink-0">
                                            <label className="block text-xs text-muted-foreground mb-1 font-medium sm:text-left text-center">Account Status</label>
                                            <CustomSelect options={STATUS_OPTIONS} value={selectedUserDetails.user.accountStatus || 'ACTIVE'} onChange={(val) => handleStatusChange(selectedUserDetails.user._id, val)} />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center relative group">
                                            <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Civil Score</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <p className="text-base sm:text-lg font-bold text-foreground">{selectedUserDetails.user.civilScore}</p>
                                                {!isAuthority && (
                                                    <button onClick={() => setPointsModal({ isOpen: true, points: '', reason: '' })} className="p-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20"><div className="flex items-center gap-0.5">
                                                        <Plus size={12} />
                                                        <span className="text-[8px]">/</span>
                                                        <Minus size={12} />
                                                    </div></button>
                                                )}
                                            </div>
                                        </div>
                                        {isAuthority && (
                                            <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 text-center relative">
                                                <Target className="w-5 h-5 mx-auto text-primary mb-1" />
                                                <p className="text-[10px] sm:text-xs text-primary font-medium">CSI Score</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <p className="text-base sm:text-lg font-bold text-primary">{selectedUserDetails.user.authorityProfile?.csiScore || 0}</p>
                                                    <button onClick={() => setPointsModal({ isOpen: true, points: '', reason: '' })} className="p-1 bg-primary/20 text-primary rounded-full hover:bg-primary/30"><div className="flex items-center gap-0.5">
                                                        <Plus size={12} />
                                                        <span className="text-[8px]">/</span>
                                                        <Minus size={12} />
                                                    </div></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-3 uppercase text-xs tracking-wider">Civic History</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button onClick={() => { setActiveHistoryTab('REPORTED'); setIsListModalOpen(true); }} className="bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/50 flex flex-col items-center">
                                                <Activity className="w-5 h-5 text-blue-500 mb-1" />
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reported</p>
                                                <span className="text-xl font-bold">{selectedUserDetails.history?.REPORTED?.length || 0}</span>
                                            </button>
                                            <button onClick={() => { setActiveHistoryTab('CONFIRMED'); setIsListModalOpen(true); }} className="bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/50 flex flex-col items-center">
                                                <CheckSquare className="w-5 h-5 text-green-500 mb-1" />
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confirmed</p>
                                                <span className="text-xl font-bold">{selectedUserDetails.history?.CONFIRMED?.length || 0}</span>
                                            </button>
                                            <button onClick={() => { setActiveHistoryTab('FLAGGED'); setIsListModalOpen(true); }} className="bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-border/50 flex flex-col items-center">
                                                <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Flagged</p>
                                                <span className="text-xl font-bold">{selectedUserDetails.history?.FLAGGED?.length || 0}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {isAuthority && (
                                        <div>
                                            <div className="flex justify-between items-center mb-3 mt-6">
                                                <h4 className="font-semibold text-foreground uppercase text-xs tracking-wider">Authority Operations</h4>
                                                <button onClick={openForceAssignModal} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/90 flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5"><Plus size={12} /><span className="text-[8px]">/</span><Minus size={12} /></div> Force Assign Job
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-4">
                                                <button onClick={() => { setActiveHistoryTab('ASSIGNED'); setIsListModalOpen(true); }} className="bg-indigo-500/5 hover:bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 flex flex-col items-center"><Briefcase className="w-5 h-5 text-indigo-500 mb-1" /><p className="text-[10px] text-indigo-500">Assigned</p><span className="text-lg font-bold text-indigo-500">{selectedUserDetails.history?.ASSIGNED?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('BIDS'); setIsListModalOpen(true); }} className="bg-yellow-500/5 hover:bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 flex flex-col items-center"><FileSignature className="w-5 h-5 text-yellow-500 mb-1" /><p className="text-[10px] text-yellow-500">Bids</p><span className="text-lg font-bold text-yellow-500">{selectedUserDetails.history?.BIDS?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('COMPLETED'); setIsListModalOpen(true); }} className="bg-blue-500/5 hover:bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 flex flex-col items-center"><CheckSquare className="w-5 h-5 text-blue-500 mb-1" /><p className="text-[10px] text-blue-500">Completed</p><span className="text-lg font-bold text-blue-500">{selectedUserDetails.history?.COMPLETED?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('RELEASED'); setIsListModalOpen(true); }} className="bg-orange-500/5 hover:bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 flex flex-col items-center"><AlertTriangle className="w-5 h-5 text-orange-500 mb-1" /><p className="text-[10px] text-orange-500">Released</p><span className="text-lg font-bold text-orange-500">{selectedUserDetails.history?.RELEASED?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('DISPUTED'); setIsListModalOpen(true); }} className="bg-red-500/5 hover:bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex flex-col items-center"><ShieldAlert className="w-5 h-5 text-red-500 mb-1" /><p className="text-[10px] text-red-500">Disputed</p><span className="text-lg font-bold text-red-500">{selectedUserDetails.history?.DISPUTED?.length || 0}</span></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* NESTED HISTORY LIST MODAL */}
            {isListModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in transition-all duration-300 ease-in-out">
                    <div className="bg-card w-full max-w-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] my-4">
                        <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0"><h3 className="text-lg font-bold flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary" /> {activeHistoryTab} History</h3><button onClick={() => setIsListModalOpen(false)} className="text-muted-foreground p-1.5"><X size={20} /></button></div>
                        <div className="overflow-y-auto thin-scrollbar flex-1 p-3 sm:p-4 space-y-3 bg-muted/5">
                            {activeList.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No issues found.</p></div> :
                                activeList.map(issue => (
                                    <div key={issue._id} onClick={() => handleIssueDetailsClick(issue)} className="bg-background border border-border/50 p-3 rounded-xl flex flex-col sm:flex-row items-start justify-between gap-3 cursor-pointer hover:border-primary/50 relative">
                                        <div className="overflow-hidden w-full sm:flex-1 pr-0 sm:pr-2">
                                            <p className="text-sm font-bold text-foreground truncate">{issue.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{issue.location?.city} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border">{issue.status}</span>
                                            {activeHistoryTab === 'ASSIGNED' && issue.status !== 'RESOLVED' && (
                                                <button onClick={(e) => { e.stopPropagation(); setForceUnassignModal({ isOpen: true, issueId: issue._id, reason: '', penalty: 0 }); }} className="text-[10px] px-2 py-1 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500/20 font-bold z-10">Revoke</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* NESTED ISSUE DETAIL MODAL (FOR AUDIT ACTION ZONE) */}
            {isIssueModalOpen && selectedIssueForDetail && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card w-full max-w-md border border-border/50 rounded-2xl shadow-2xl overflow-visible flex flex-col relative my-4">
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/10">
                            <h3 className="text-base font-bold flex items-center gap-2">Update Issue Status</h3>
                            <button onClick={closeIssueModal} className="text-muted-foreground p-1.5"><X size={18} /></button>
                        </div>
                        <div className="p-5">
                            <form onSubmit={handleUpdateStatus} className="flex flex-col gap-4 relative z-50">
                                <div className="relative z-50">
                                    <label className="text-xs text-muted-foreground mb-1 block font-semibold">Change Status</label>
                                    <CustomSelect options={UPDATE_STATUS_OPTIONS} value={updateData.status} onChange={(val) => setUpdateData({ ...updateData, status: val })} />
                                </div>
                                <div className="relative z-10">
                                    <label className="text-xs text-muted-foreground mb-1 block font-semibold">Audit Remark (Required)</label>
                                    <input type="text" value={updateData.adminRemark} onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })} placeholder="State the reason for this action..." className="w-full px-3 py-2.5 bg-muted border border-border/50 rounded-xl text-sm focus:border-primary outline-none" required />
                                </div>

                                {updateData.status === 'DISPUTED' && (
                                    <div className="relative z-10 p-3 bg-red-500/5 border border-red-500/20 rounded-xl animate-fade-in">
                                        <label className="text-xs text-red-500 mb-2 block font-bold flex items-center gap-1"><ShieldAlert size={12} /> Attach Dispute Evidence</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setDisputeMedia(e.target.files[0])}
                                            className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20 text-muted-foreground cursor-pointer"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Optional: Provide photographic evidence to support the official's dispute claim. This will be visible to the citizen.</p>
                                    </div>
                                )}

                                <button type="submit" disabled={isUpdating} className="w-full mt-2 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:bg-primary/90">
                                    {isUpdating ? <MiniLoader className="w-4 h-4" /> : <>Log Administrative Action <ArrowRight size={16} /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION MODALS */}
            {pointsModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handlePointAdjustment} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">Adjust User Score</h3>
                        <input type="number" placeholder="Points (+50 or -20)" required value={pointsModal.points} onChange={e => setPointsModal({ ...pointsModal, points: e.target.value })} className="w-full mb-3 p-3 bg-muted border border-border rounded-xl text-sm" />
                        <textarea placeholder="Mandatory Reason for Audit Log" required value={pointsModal.reason} onChange={e => setPointsModal({ ...pointsModal, reason: e.target.value })} className="w-full mb-4 p-3 bg-muted border border-border rounded-xl text-sm resize-none" rows="3"></textarea>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setPointsModal({ isOpen: false, points: '', reason: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90">Apply Points</button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {editProfileModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handleEditProfileSubmit} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCog className="text-primary w-5 h-5" /> Edit Profile Data</h3>
                        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto thin-scrollbar pr-2">

                            <div className="space-y-2 relative z-50">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Basic Information</label>
                                <input type="text" placeholder="Full Name" value={editProfileModal.formData.name || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, name: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                                <input type="text" placeholder="Username (Unique)" value={editProfileModal.formData.userName || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, userName: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                                <input type="email" placeholder="Email Address" value={editProfileModal.formData.email || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, email: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                                <input type="text" placeholder="New Password (Leave blank to keep current)" value={editProfileModal.formData.password || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, password: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm placeholder:text-muted-foreground/50" />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50 relative z-40">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location (Contact)</label>
                                <div className="relative z-40">
                                    <CustomSelect
                                        options={modalStateOptions}
                                        value={editProfileModal.formData.state || ''}
                                        onChange={v => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, state: v, city: '' } })}
                                        placeholder="Select State"
                                    />
                                </div>
                                <div className="relative z-30">
                                    <CustomSelect
                                        options={modalDistrictOptions}
                                        value={editProfileModal.formData.city || ''}
                                        onChange={v => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, city: v } })}
                                        placeholder="Select District/City"
                                    />
                                </div>
                                <input type="text" placeholder="Pincode" value={editProfileModal.formData['contact.pinCode'] || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, 'contact.pinCode': e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                            </div>

                            {['official', 'ngo'].includes(selectedUserDetails?.user?.role) && (
                                <div className="space-y-2 pt-2 border-t border-border/50 relative z-20">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Authority Profile</label>
                                    <input type="text" placeholder="Department / NGO Name" value={editProfileModal.formData.departmentName || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, departmentName: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                                    <div className="relative z-20">
                                        <CustomSelect
                                            options={modalStateOptions}
                                            value={editProfileModal.formData.assignedState || ''}
                                            onChange={v => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, assignedState: v, assignedDistrict: '' } })}
                                            placeholder="Select Assigned State"
                                        />
                                    </div>
                                    <div className="relative z-10">
                                        <CustomSelect
                                            options={modalAssignedDistrictOptions}
                                            value={editProfileModal.formData.assignedDistrict || ''}
                                            onChange={v => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, assignedDistrict: v } })}
                                            placeholder="Select Assigned District"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                            <button type="button" onClick={() => setEditProfileModal({ isOpen: false, formData: {} })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90 transition-all">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* FORCE ASSIGN MODAL */}
            {forceAssignModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handleForceAssign} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-md overflow-visible">
                        <h3 className="font-bold text-lg mb-2">Force Assign Issue</h3>
                        <p className="text-xs text-muted-foreground mb-4">Showing ALL active issues globally</p>

                        <div className="mb-3 relative z-50">
                            <CustomSelect
                                options={forceAssignModal.issues.map(issue => ({
                                    value: issue._id,
                                    label: `${issue.title} - ${issue.location?.city || issue.location?.district || 'Unknown'}`
                                }))}
                                value={forceAssignModal.selectedIssue}
                                onChange={(val) => setForceAssignModal({ ...forceAssignModal, selectedIssue: val })}
                                placeholder="Select an Issue to lock..."
                            />
                        </div>

                        <input type="number" min="1" placeholder="Mandatory Hrs (e.g. 24)" required value={forceAssignModal.commitmentTimeHours} onChange={e => setForceAssignModal({ ...forceAssignModal, commitmentTimeHours: e.target.value })} className="w-full mb-4 p-3 bg-muted border border-border rounded-xl text-sm" />

                        <div className="flex gap-3 justify-end relative z-10">
                            <button type="button" onClick={() => setForceAssignModal({ isOpen: false, issues: [], selectedIssue: '', commitmentTimeHours: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" disabled={isUpdating || !forceAssignModal.selectedIssue || !forceAssignModal.commitmentTimeHours} className="px-4 py-2 text-sm bg-indigo-500 text-white font-bold rounded-xl shadow hover:bg-indigo-600 flex items-center gap-1">
                                Lock Job <ArrowRight size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* FORCE UNASSIGN MODAL */}
            {forceUnassignModal.isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handleForceUnassign} className="bg-card p-6 rounded-2xl border border-red-500/30 shadow-2xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4 text-red-500">Revoke Assignment</h3>
                        <input type="number" placeholder="Penalty Points (e.g. 50)" required min="0" value={forceUnassignModal.penalty || ''} onChange={e => setForceUnassignModal({ ...forceUnassignModal, penalty: e.target.value })} className="w-full mb-3 p-3 bg-muted border border-border rounded-xl text-sm" />
                        <textarea placeholder="Reason for revocation" required value={forceUnassignModal.reason} onChange={e => setForceUnassignModal({ ...forceUnassignModal, reason: e.target.value })} className="w-full mb-4 p-3 bg-muted border border-border rounded-xl text-sm resize-none" rows="3"></textarea>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setForceUnassignModal({ isOpen: false, issueId: '', reason: '', penalty: 0 })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-red-500 text-white font-bold rounded-xl shadow hover:bg-red-600">Revoke & Penalize</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default AdminUsers;