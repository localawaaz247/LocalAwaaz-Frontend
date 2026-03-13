import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { Search } from 'lucide-react';
import { showToast } from '../../utils/toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await axiosInstance.patch(`/admin/user/${id}/role`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            showToast({ icon: 'success', title: `Role updated to ${newRole}` });
        } catch (error) { showToast({ icon: 'error', title: 'Failed to update role' }); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axiosInstance.patch(`/admin/user/${id}/status`, { accountStatus: newStatus });
            setUsers(users.map(u => u._id === id ? { ...u, accountStatus: newStatus } : u));
            showToast({ icon: 'success', title: `Account ${newStatus.toLowerCase()}` });
        } catch (error) { showToast({ icon: 'error', title: 'Failed to update status' }); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this user?")) return;
        try {
            await axiosInstance.delete(`/admin/user/${id}`);
            setUsers(users.filter(u => u._id !== id));
            showToast({ icon: 'success', title: 'User deleted' });
        } catch (error) { showToast({ icon: 'error', title: 'Failed to delete user' }); }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full">
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

            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto thin-scrollbar flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-muted/30 border-b border-border/50 sticky top-0 z-10">
                            <tr className="text-muted-foreground text-xs md:text-sm">
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Name</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden sm:table-cell">Email</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium">Role</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium hidden md:table-cell">Status</th>
                                <th className="py-3 px-4 md:py-4 md:px-6 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-sm text-muted-foreground">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="p-6 md:p-8 text-center text-sm text-muted-foreground">No users found.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-primary/5 transition-colors">
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm font-medium text-foreground">{user.name}</td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm text-muted-foreground hidden sm:table-cell">{user.contact?.email}</td>
                                        <td className="py-3 px-4 md:py-4 md:px-6">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="bg-background border border-border/50 text-foreground text-[10px] md:text-xs rounded-md md:rounded-lg px-2 md:px-3 py-1 md:py-1.5 focus:border-primary outline-none transition-colors cursor-pointer"
                                            >
                                                <option value="user">User</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="official">Official</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 hidden md:table-cell">
                                            <select
                                                value={user.accountStatus || 'ACTIVE'}
                                                onChange={(e) => handleStatusChange(user._id, e.target.value)}
                                                className={`text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg font-semibold border outline-none cursor-pointer transition-colors ${user.accountStatus === 'BANNED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        user.accountStatus === 'SUSPENDED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}
                                            >
                                                <option value="ACTIVE" className="bg-card text-foreground">Active</option>
                                                <option value="SUSPENDED" className="bg-card text-foreground">Suspend</option>
                                                <option value="BANNED" className="bg-card text-foreground">Ban</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 md:py-4 md:px-6 text-right">
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md md:rounded-lg hover:bg-red-500/20 transition-colors font-medium"
                                            >
                                                Delete
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
        </div>
    );
};

export default AdminUsers;