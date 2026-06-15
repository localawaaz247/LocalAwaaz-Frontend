import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { Building2, MapPin, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import MiniLoader from '../MiniLoader';
import AuthorityDetailModal from '../modals/AuthorityDetailModal';

const AdminVerification = () => {
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED'
    const [search, setSearch] = useState('');

    const [selectedAuthority, setSelectedAuthority] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAuthorities();
    }, [activeTab]);

    const fetchAuthorities = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/authorities', {
                params: { status: activeTab }
            });
            setAuthorities(res.data.data);
        } catch (error) {
            console.error("Failed to fetch authorities:", error);
            showToast({ icon: 'error', title: 'Failed to load verification queue' });
        } finally {
            setLoading(false);
        }
    };

    const handleActionComplete = () => {
        fetchAuthorities(); // Refresh the list after an Approve/Reject/Revert action
    };

    const openModal = (auth) => {
        setSelectedAuthority(auth);
        setIsModalOpen(true);
    };

    const filteredAuthorities = authorities.filter(auth => {
        const orgName = auth.authorityProfile?.departmentName?.toLowerCase() || '';
        const email = auth.contact?.email?.toLowerCase() || '';
        const searchLower = search.toLowerCase();
        return orgName.includes(searchLower) || email.includes(searchLower);
    });

    return (
        <div className="flex flex-col h-full space-y-4 md:space-y-6 animate-fade-in relative">

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Authority Gatekeeper</h2>
                    <p className="text-sm text-muted-foreground mt-1">Review and manage official & NGO accounts.</p>
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground shadow-sm"
                    />
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-muted/30 p-1 rounded-xl w-full sm:w-fit shrink-0">
                {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 sm:px-6 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${activeTab === tab
                                ? 'bg-background shadow text-primary border border-primary/20'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab === 'PENDING' && <Clock className="inline-block w-4 h-4 mr-1.5 mb-0.5" />}
                        {tab === 'APPROVED' && <CheckCircle className="inline-block w-4 h-4 mr-1.5 mb-0.5" />}
                        {tab === 'REJECTED' && <XCircle className="inline-block w-4 h-4 mr-1.5 mb-0.5" />}
                        <span className="capitalize">{tab.toLowerCase()}</span>
                    </button>
                ))}
            </div>

            {/* Main List */}
            <div className="bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredAuthorities.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground p-8 text-center">
                        <Building2 className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">No {activeTab.toLowerCase()} requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto thin-scrollbar flex-1 p-2 md:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {filteredAuthorities.map((auth) => (
                                <div
                                    key={auth._id}
                                    onClick={() => openModal(auth)}
                                    className="bg-background border border-border/50 hover:border-primary/50 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md group flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm md:text-base line-clamp-1">
                                                    {auth.authorityProfile?.departmentName || 'Unknown Org'}
                                                </h4>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    {auth.role} Account
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 mt-auto">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            {auth.authorityProfile?.assignedDistrict}, {auth.authorityProfile?.assignedState}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {auth.contact?.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AuthorityDetailModal
                authority={selectedAuthority}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onActionComplete={handleActionComplete}
            />
        </div>
    );
};

export default AdminVerification;