import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { Search, X, User as UserIcon, Shield, Activity, AlertCircle, Calendar, Trash2, Play, Image as ImageIcon } from 'lucide-react';
import IssueDetail from '../IssueDetail';
import CustomSelect from '../CustomSelect';

const Avatar = ({ src, name, size = "w-10 h-10", iconSize = "w-5 h-5" }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [src]);

    if (!src || imageError) {
        return (
            <div className={`${size} shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary`}>
                <UserIcon className={iconSize} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name || "User"}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className={`${size} shrink-0 rounded-full object-cover border border-border/50`}
        />
    );
};

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);

    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
    const [fetchingIssueId, setFetchingIssueId] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const ROLE_OPTIONS = [
        { value: 'user', label: 'User' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'official', label: 'Official' }
    ];

    const STATUS_OPTIONS = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'BANNED', label: 'Banned' }
    ];

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchUsers(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/users', { params: { page, limit: 15, search } });
            setUsers(res.data.data.users);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserFullDetails = async (id) => {
        try {
            setModalLoading(true);
            setIsModalOpen(true);

            const res = await axiosInstance.get(`/admin/user/${id}`);
            const userData = res.data.data;
            setSelectedUserDetails(userData); 
            setModalLoading(false); 

            if (userData.recentIssues && userData.recentIssues.length > 0) {
                const issuesWithMediaPromises = userData.recentIssues.map(async (issue) => {
                    try {
                        const issueRes = await axiosInstance.get(`/issue/${issue._id}`);
                        const fullIssue = issueRes.data.data?.issue || issueRes.data.data;
                        return { ...issue, media: fullIssue.media };
                    } catch (err) {
                        return issue; 
                    }
                });

                const updatedRecentIssues = await Promise.all(issuesWithMediaPromises);

                setSelectedUserDetails(prev => ({
                    ...prev,
                    recentIssues: updatedRecentIssues
                }));
            }

        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to load user details' });
            setIsModalOpen(false);
            setModalLoading(false);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await axiosInstance.patch(`/admin/user/${id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            showToast({ icon: 'success', title: `Role updated to ${newRole}` });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to update role' });
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axiosInstance.patch(`/admin/user/${id}/status`, { accountStatus: newStatus });

            setUsers(users.map(u => u._id === id ? { ...u, accountStatus: newStatus } : u));

            if (selectedUserDetails?.user?._id === id) {
                setSelectedUserDetails(prev => ({
                    ...prev,
                    user: { ...prev.user, accountStatus: newStatus }
                }));
            }

            showToast({ icon: 'success', title: `Account ${newStatus.toLowerCase()}` });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to update status' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this user? This action cannot be undone.")) return;
        try {
            await axiosInstance.delete(`/admin/user/${id}`);
            setUsers(users.filter(u => u._id !== id));
            if (selectedUserDetails?.user?._id === id) setIsModalOpen(false);
            showToast({ icon: 'success', title: 'User deleted' });
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to delete user' });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedUserDetails(null), 200);
    };

    const handleIssueClick = async (issue) => {
        try {
            setFetchingIssueId(issue._id);
            const res = await axiosInstance.get(`/issue/${issue._id}`);
            const fullIssueData = res.data.data?.issue || res.data.data || issue;

            setSelectedIssueForDetail(fullIssueData);
            setIsIssueModalOpen(true);
        } catch (error) {
            console.error("Failed to load full issue details", error);
            setSelectedIssueForDetail(issue);
            setIsIssueModalOpen(true);
        } finally {
            setFetchingIssueId(null);
        }
    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setTimeout(() => setSelectedIssueForDetail(null), 300);
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">User Management</h2>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-card border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : users.length === 0 ? (
                <div className="flex-1 flex justify-center items-center text-muted-foreground bg-card glass-card border border-border/50 rounded-2xl p-8">
                    No users found matching your search.
                </div>
            ) : (
                <>
                    <div className="md:hidden grid grid-cols-1 gap-4 overflow-y-auto thin-scrollbar pb-4">
                        {users.map((user) => (
                            <div key={user._id} className="bg-card glass-card border border-border/50 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Avatar src={user.profilePic} name={user.name} size="w-12 h-12" iconSize="w-6 h-6" />
                                        <div className="flex flex-col overflow-hidden">
                                            <button
                                                onClick={() => fetchUserFullDetails(user._id)}
                                                className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate text-sm"
                                            >
                                                {user.name || user.userName || 'Unknown User'}
                                            </button>
                                            <span className="text-xs text-muted-foreground truncate">{user.contact?.email || 'No email provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border/30 [&>div>div]:min-w-0">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Role</span>
                                        <CustomSelect
                                            options={ROLE_OPTIONS}
                                            value={user.role}
                                            onChange={(val) => handleRoleChange(user._id, val)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
                                        <CustomSelect
                                            options={STATUS_OPTIONS}
                                            value={user.accountStatus || 'ACTIVE'}
                                            onChange={(val) => handleStatusChange(user._id, val)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(user._id)}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete User
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:flex bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-lg flex-1 flex-col min-h-0">
                        <div className="overflow-y-auto thin-scrollbar flex-1">
                            <table className="w-full text-left whitespace-nowrap">
                                {/* CSS FIXED HERE: Changed transparent bg-muted/30 to opaque bg-card/95 with backdrop-blur and a higher z-index to block the text from bleeding through */}
                                <thead className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-20 shadow-sm">
                                    <tr className="text-muted-foreground text-sm">
                                        <th className="py-4 px-6 font-medium">User Profile</th>
                                        <th className="py-4 px-6 font-medium">Role</th>
                                        <th className="py-4 px-6 font-medium">Status</th>
                                        <th className="py-4 px-6 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-primary/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.profilePic} name={user.name} size="w-10 h-10" iconSize="w-5 h-5" />
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() => fetchUserFullDetails(user._id)}
                                                            className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left text-sm"
                                                        >
                                                            {user.name || user.userName || 'Unknown'}
                                                        </button>
                                                        <span className="text-xs text-muted-foreground">{user.contact?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 [&>div]:min-w-0">
                                                <CustomSelect
                                                    options={ROLE_OPTIONS}
                                                    value={user.role}
                                                    onChange={(val) => handleRoleChange(user._id, val)}
                                                />
                                            </td>
                                            <td className="py-4 px-6 [&>div]:min-w-0">
                                                <CustomSelect
                                                    options={STATUS_OPTIONS}
                                                    value={user.accountStatus || 'ACTIVE'}
                                                    onChange={(val) => handleStatusChange(user._id, val)}
                                                />
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="text-xs px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-medium flex items-center justify-center gap-1.5 ml-auto"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </td>
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
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-card glass-card border border-border/50 rounded-lg md:rounded-xl disabled:opacity-50 hover:bg-muted transition-colors">Next</button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in ${isIssueModalOpen ? 'hidden' : 'flex'}`}>
                    <div className="bg-card w-full max-w-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] relative">
                        <div className="p-4 md:p-6 border-b border-border/50 flex justify-between items-center bg-muted/10 shrink-0">
                            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                User Details
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 bg-background rounded-full hover:bg-muted">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar flex-1 min-h-0">
                            {modalLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : !selectedUserDetails ? (
                                <div className="flex justify-center items-center py-12 text-muted-foreground">User details not found</div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
                                        <Avatar
                                            src={selectedUserDetails.user.profilePic}
                                            name={selectedUserDetails.user.name}
                                            size="w-20 h-20"
                                            iconSize="w-10 h-10"
                                        />
                                        <div className="flex-1 space-y-1 w-full">
                                            <h4 className="text-xl font-bold text-foreground">{selectedUserDetails.user.name || 'No Name Provided'}</h4>
                                            <p className="text-sm text-muted-foreground">@{selectedUserDetails.user.userName}</p>
                                            <p className="text-sm text-muted-foreground break-all">{selectedUserDetails.user.contact?.email}</p>
                                        </div>

                                        <div className="w-full sm:w-auto bg-muted/20 p-3 rounded-xl border border-border/50 shrink-0 [&>div]:min-w-0">
                                            <label className="block text-xs text-muted-foreground mb-1 font-medium sm:text-left text-center">Account Status</label>
                                            <CustomSelect
                                                options={STATUS_OPTIONS}
                                                value={selectedUserDetails.user.accountStatus || 'ACTIVE'}
                                                onChange={(val) => handleStatusChange(selectedUserDetails.user._id, val)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                                            <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Civil Score</p>
                                            <p className="text-base sm:text-lg font-bold text-foreground">{selectedUserDetails.user.civilScore}</p>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                                            <Activity className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Issues Reported</p>
                                            <p className="text-base sm:text-lg font-bold text-foreground">{selectedUserDetails.totalIssuesReported}</p>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                                            <Calendar className="w-5 h-5 mx-auto text-green-500 mb-1" />
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Joined</p>
                                            <p className="text-xs sm:text-sm font-bold text-foreground mt-1 truncate">
                                                {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-center">
                                            <AlertCircle className="w-5 h-5 mx-auto text-red-500 mb-1" />
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Flags Received</p>
                                            <p className="text-base sm:text-lg font-bold text-foreground">{selectedUserDetails.user.issuesFlagged || 0}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            Recent Issues <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{selectedUserDetails.recentIssues?.length || 0}</span>
                                        </h4>
                                        <div className="space-y-2 max-h-[30vh] sm:max-h-48 overflow-y-auto thin-scrollbar pr-1">
                                            {selectedUserDetails.recentIssues?.length === 0 ? (
                                                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border/50 text-center">No issues reported yet.</p>
                                            ) : (
                                                selectedUserDetails.recentIssues.map(issue => {
                                                    let thumbnail = null;
                                                    if (issue.media && Array.isArray(issue.media) && issue.media.length > 0) {
                                                        const firstMedia = issue.media[0];
                                                        thumbnail = typeof firstMedia === 'string' ? firstMedia : firstMedia?.url;
                                                    } else if (typeof issue.media === 'string') {
                                                        thumbnail = issue.media;
                                                    }

                                                    const isVideo = thumbnail && typeof thumbnail === 'string' && thumbnail.match(/\.(mp4|webm|ogg)$/i);

                                                    return (
                                                        <div
                                                            key={issue._id}
                                                            onClick={() => !fetchingIssueId && handleIssueClick(issue)}
                                                            className={`bg-background border border-border/50 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors cursor-pointer ${fetchingIssueId === issue._id ? 'opacity-50' : 'hover:border-primary/50'}`}
                                                        >
                                                            <div className="overflow-hidden w-full sm:flex-1 pr-0 sm:pr-2">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
                                                                    {fetchingIssueId === issue._id && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1 truncate">{issue.location?.city || 'Unknown Location'} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                                            </div>

                                                            <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0 mt-2 sm:mt-0">
                                                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ${issue.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500' :
                                                                    issue.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                                                                        issue.status === 'IN_REVIEW' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                            'bg-red-500/10 text-red-500'
                                                                    }`}>
                                                                    {issue.status}
                                                                </span>

                                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-border/50 bg-muted shrink-0 relative flex items-center justify-center">
                                                                    {thumbnail ? (
                                                                        <>
                                                                            {isVideo ? (
                                                                                <video src={thumbnail} className="w-full h-full object-cover" muted playsInline />
                                                                            ) : (
                                                                                <img src={thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                                                                            )}
                                                                            {isVideo && (
                                                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                                    <Play size={14} className="text-white fill-white sm:w-4 sm:h-4" />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <IssueDetail
                issue={selectedIssueForDetail}
                isOpen={isIssueModalOpen}
                onClose={closeIssueModal}
                hideConfirm={true}
                isAdminView={true}
            />

        </div>
    );
};

export default AdminUsers;