import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { Search, X, User as UserIcon, Shield, Activity, AlertCircle, Calendar, Trash2, Play, Image as ImageIcon, Briefcase, Flag, CheckSquare, FileSignature, Target, AlertTriangle, Clock, Download, Edit2, Plus, Minus, UserCog } from 'lucide-react';
import IssueDetail from '../IssueDetail';
import CustomSelect from '../CustomSelect';
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

const getDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    if (diffMs < 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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

    // 🟢 God-Mode State Management
    const [pointsModal, setPointsModal] = useState({ isOpen: false, points: '', reason: '' });
    const [editProfileModal, setEditProfileModal] = useState({ isOpen: false, formData: {} });
    const [forceAssignModal, setForceAssignModal] = useState({ isOpen: false, issues: [], selectedIssue: '', reason: '' });
    const [forceUnassignModal, setForceUnassignModal] = useState({ isOpen: false, issueId: '', reason: '', penalty: 0 });

    const ROLE_OPTIONS = [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }, { value: 'official', label: 'Official' }, { value: 'ngo', label: 'NGO' }];
    const FILTER_ROLE_OPTIONS = [{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS];
    const STATUS_OPTIONS = [{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'BANNED', label: 'Banned' }];

    useEffect(() => { cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error); }, []);
    useEffect(() => {
        if (!stateFilter) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === stateFilter);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [stateFilter, statesList]);

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];
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

    // 🟢 1. Global Excel Export
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

    // 🟢 2. Manual Point Adjustment
    const handlePointAdjustment = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(`/admin/user/${selectedUserDetails.user._id}/points`, { points: Number(pointsModal.points), reason: pointsModal.reason });
            showToast({ icon: 'success', title: 'Points adjusted' });
            setPointsModal({ isOpen: false, points: '', reason: '' });
            fetchUserFullDetails(selectedUserDetails.user._id); // Refresh
        } catch (error) { showToast({ icon: 'error', title: 'Failed to adjust points' }); }
    };

    // 🟢 3. Edit Profile Save
    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(`/admin/user/${selectedUserDetails.user._id}/edit`, editProfileModal.formData);
            showToast({ icon: 'success', title: 'Profile Updated' });
            setEditProfileModal({ isOpen: false, formData: {} });
            fetchUserFullDetails(selectedUserDetails.user._id); // Refresh
            fetchUsers(); // Refresh background list
        } catch (error) { showToast({ icon: 'error', title: 'Failed to update profile' }); }
    };

    // 🟢 4. Force Assign Logic
    const openForceAssignModal = async () => {
        try {
            const district = selectedUserDetails.user.authorityProfile?.assignedDistrict || selectedUserDetails.user.contact?.city;
            if (!district) return showToast({ icon: 'error', title: 'User has no district assigned' });

            const res = await axiosInstance.get(`/admin/issues/open/${district}`);
            if (res.data.data.length === 0) return showToast({ icon: 'error', title: `No OPEN issues in ${district}` });

            setForceAssignModal({ isOpen: true, issues: res.data.data, selectedIssue: '', reason: '' });
        } catch (error) { showToast({ icon: 'error', title: 'Failed to fetch issues' }); }
    };

    const handleForceAssign = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(`/admin/issue/${forceAssignModal.selectedIssue}/force-assign`, {
                authorityId: selectedUserDetails.user._id,
                reason: forceAssignModal.reason
            });
            showToast({ icon: 'success', title: 'Issue Forcibly Assigned!' });
            setForceAssignModal({ isOpen: false, issues: [], selectedIssue: '', reason: '' });
            fetchUserFullDetails(selectedUserDetails.user._id); // Refresh
        } catch (error) { showToast({ icon: 'error', title: 'Failed to assign issue' }); }
    };

    // 🟢 5. Force Unassign Logic
    const handleForceUnassign = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.patch(`/admin/issue/${forceUnassignModal.issueId}/force-unassign`, {
                reason: forceUnassignModal.reason,
                penaltyPoints: Number(forceUnassignModal.penalty)
            });
            showToast({ icon: 'success', title: 'Authority stripped from issue' });
            setForceUnassignModal({ isOpen: false, issueId: '', reason: '', penalty: 0 });
            fetchUserFullDetails(selectedUserDetails.user._id); // Refresh
        } catch (error) { showToast({ icon: 'error', title: 'Failed to unassign' }); }
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

    const handleIssueClick = async (issue) => {
        try {
            setFetchingIssueId(issue._id);
            const res = await axiosInstance.get(`/issue/${issue._id}`);
            setSelectedIssueForDetail(res.data.data?.issue || res.data.data || issue);
            setIsIssueModalOpen(true);
        } catch (e) { setSelectedIssueForDetail(issue); setIsIssueModalOpen(true); } finally { setFetchingIssueId(null); }

    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setTimeout(() => setSelectedIssueForDetail(null), 300);
    };

    const isAuthority = selectedUserDetails?.user?.role === 'official' || selectedUserDetails?.user?.role === 'ngo';
    const activeList = selectedUserDetails?.history?.[activeHistoryTab] || [];

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full relative">

            {/* Top Bar with Global Export */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground shrink-0">User Management</h2>
                    <button onClick={handleGlobalExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold transition-colors">
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
                    <div className="bg-card w-full max-w-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] relative">
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

                                            {/* Edit Profile Button */}
                                            <button
                                                onClick={() => setEditProfileModal({ isOpen: true, formData: { name: selectedUserDetails.user.name, email: selectedUserDetails.user.contact?.email, password: '' } })}
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
                                                {/* Force Assign Button */}
                                                <button onClick={openForceAssignModal} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/90 flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        <Plus size={12} />
                                                        <span className="text-[8px]">/</span>
                                                        <Minus size={12} />
                                                    </div> Force Assign Job
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <button onClick={() => { setActiveHistoryTab('ASSIGNED'); setIsListModalOpen(true); }} className="bg-indigo-500/5 hover:bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 flex flex-col items-center"><Briefcase className="w-5 h-5 text-indigo-500 mb-1" /><p className="text-[10px] text-indigo-500">Assigned</p><span className="text-lg font-bold text-indigo-500">{selectedUserDetails.history?.ASSIGNED?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('BIDS'); setIsListModalOpen(true); }} className="bg-yellow-500/5 hover:bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 flex flex-col items-center"><FileSignature className="w-5 h-5 text-yellow-500 mb-1" /><p className="text-[10px] text-yellow-500">Bids</p><span className="text-lg font-bold text-yellow-500">{selectedUserDetails.history?.BIDS?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('COMPLETED'); setIsListModalOpen(true); }} className="bg-blue-500/5 hover:bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 flex flex-col items-center"><CheckSquare className="w-5 h-5 text-blue-500 mb-1" /><p className="text-[10px] text-blue-500">Completed</p><span className="text-lg font-bold text-blue-500">{selectedUserDetails.history?.COMPLETED?.length || 0}</span></button>
                                                <button onClick={() => { setActiveHistoryTab('RELEASED'); setIsListModalOpen(true); }} className="bg-orange-500/5 hover:bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 flex flex-col items-center"><AlertTriangle className="w-5 h-5 text-orange-500 mb-1" /><p className="text-[10px] text-orange-500">Released</p><span className="text-lg font-bold text-orange-500">{selectedUserDetails.history?.RELEASED?.length || 0}</span></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* NESTED HISTORY LIST MODAL (Includes Force Unassign) */}
            {isListModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in transition-all duration-300 ease-in-out">
                    <div className="bg-card w-full max-w-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
                        <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center bg-muted/10"><h3 className="text-lg font-bold flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary" /> {activeHistoryTab} History</h3><button onClick={() => setIsListModalOpen(false)} className="text-muted-foreground p-1.5"><X size={20} /></button></div>
                        <div className="overflow-y-auto thin-scrollbar flex-1 p-3 sm:p-4 space-y-3 bg-muted/5">
                            {activeList.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No issues found.</p></div> :
                                activeList.map(issue => (
                                    <div key={issue._id} onClick={() => handleIssueClick(issue)} className="bg-background border border-border/50 p-3 rounded-xl flex flex-col sm:flex-row items-start justify-between gap-3 cursor-pointer hover:border-primary/50 relative">
                                        <div className="overflow-hidden w-full sm:flex-1 pr-0 sm:pr-2">
                                            <p className="text-sm font-bold text-foreground truncate">{issue.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{issue.location?.city} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border">{issue.status}</span>
                                            {/* Force Unassign Button inside Assigned Tab */}
                                            {activeHistoryTab === 'ASSIGNED' && issue.status !== 'RESOLVED' && (
                                                <button onClick={(e) => { e.stopPropagation(); setForceUnassignModal({ isOpen: true, issueId: issue._id, reason: '', penalty: 0 }); }} className="text-[10px] px-2 py-1 bg-red-500/10 text-red-500 rounded border border-red-500/20 hover:bg-red-500/20 font-bold z-10">Unassign</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* GOD-MODE ACTION MODALS */}

            {/* A. Point Adjustment Overlay */}
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

            {/* B. Edit Profile Overlay */}
            {editProfileModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handleEditProfileSubmit} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">Edit Profile Data</h3>
                        <div className="space-y-3 mb-6">
                            <input type="text" placeholder="Full Name" value={editProfileModal.formData.name || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, name: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                            <input type="email" placeholder="Email" value={editProfileModal.formData.email || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, email: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm" />
                            <input type="text" placeholder="New Password (Leave blank to keep current)" value={editProfileModal.formData.password || ''} onChange={e => setEditProfileModal({ ...editProfileModal, formData: { ...editProfileModal.formData, password: e.target.value } })} className="w-full p-3 bg-muted border border-border rounded-xl text-sm placeholder:text-muted-foreground/50" />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setEditProfileModal({ isOpen: false, formData: {} })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground font-bold rounded-xl shadow hover:bg-primary/90">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* C. Force Assign Overlay */}
            {forceAssignModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in transition-all duration-300">
                    <form onSubmit={handleForceAssign} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-md">
                        <h3 className="font-bold text-lg mb-2">Force Assign Issue</h3>
                        <p className="text-xs text-muted-foreground mb-4">Showing OPEN issues in {selectedUserDetails?.user?.authorityProfile?.assignedDistrict}</p>

                        <select required value={forceAssignModal.selectedIssue} onChange={e => setForceAssignModal({ ...forceAssignModal, selectedIssue: e.target.value })} className="w-full mb-3 p-3 bg-muted border border-border rounded-xl text-sm outline-none">
                            <option value="" disabled>Select an Issue to lock...</option>
                            {forceAssignModal.issues.map(issue => <option key={issue._id} value={issue._id}>{issue.title}</option>)}
                        </select>
                        <textarea placeholder="Mandatory Reason for overriding bidding" required value={forceAssignModal.reason} onChange={e => setForceAssignModal({ ...forceAssignModal, reason: e.target.value })} className="w-full mb-4 p-3 bg-muted border border-border rounded-xl text-sm resize-none" rows="3"></textarea>

                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setForceAssignModal({ isOpen: false, issues: [], selectedIssue: '', reason: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-indigo-500 text-white font-bold rounded-xl shadow hover:bg-indigo-600">Assign Job</button>
                        </div>
                    </form>
                </div>
            )}

            {/* D. Force Unassign Overlay */}
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

            <IssueDetail issue={selectedIssueForDetail} isOpen={isIssueModalOpen} onClose={closeIssueModal} hideConfirm={true} isAdminView={true} />
        </div>
    );
};

export default AdminUsers;