import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import {
    AlertOctagon, Zap, Megaphone, Edit3, Briefcase,
    MapPin, Clock, ArrowRight, ShieldAlert, Download, Eye
} from 'lucide-react';
import CustomSelect from '../CustomSelect';
import MiniLoader from '../MiniLoader';
import { cscApi } from '../../utils/cscAPI';
import IssueDetail from '../IssueDetail';

const AdminTriage = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({ state: '', city: '', status: '' });
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [authorities, setAuthorities] = useState([]);

    // Issue Detail Modal State
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
    const [fetchingIssueId, setFetchingIssueId] = useState(null);

    // Action Modal States
    const [boostModal, setBoostModal] = useState({ isOpen: false, issueId: '', amount: '' });
    const [categoryModal, setCategoryModal] = useState({ isOpen: false, issueId: '', category: '', priority: '' });
    const [assignModal, setAssignModal] = useState({ isOpen: false, issueId: '', authorityId: '', hours: '' });
    const [sosModal, setSosModal] = useState({ isOpen: false, issueId: '' }); // 🟢 Added SOS Modal state
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Filter Options
    const CATEGORIES = [
        { value: 'ROAD_DAMAGE', label: 'Road Damage & Potholes' },
        { value: 'WATER_SUPPLY', label: 'Water & Plumbing' },
        { value: 'ELECTRICITY', label: 'Electricity & Power' },
        { value: 'WASTE_MANAGEMENT', label: 'Sanitation & Waste' },
        { value: 'PUBLIC_SAFETY', label: 'Public Safety' }
    ];
    const PRIORITIES = [
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

    useEffect(() => {
        cscApi.get("/countries/IN/states").then(res => setStatesList(res.data)).catch(console.error);
        fetchAuthorities();
    }, []);

    useEffect(() => {
        if (!filters.state) return setDistrictsList([]);
        const stateObj = statesList.find(s => s.name === filters.state);
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [filters.state, statesList]);

    useEffect(() => {
        fetchTriageIssues();
    }, [page, filters]);

    const fetchTriageIssues = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/triage', { params: { page, limit: 15, ...filters } });
            setIssues(res.data.data.issues);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            showToast({ icon: 'error', title: 'Failed to fetch triage issues' });
        } finally {
            setLoading(false);
        }
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
            setSelectedIssueForDetail(res.data.data);
            setIsIssueModalOpen(true);
        } catch (e) {
            showToast({ icon: 'error', title: 'Failed to load full issue details' });
        } finally {
            setFetchingIssueId(null);
        }
    };

    const closeIssueModal = () => {
        setIsIssueModalOpen(false);
        setTimeout(() => setSelectedIssueForDetail(null), 300);
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

    const handleForceAssign = async (e) => {
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

    // 🟢 Updated to trigger the modal instead of window.confirm
    const triggerSOSModal = (issueId) => {
        setSosModal({ isOpen: true, issueId });
    };

    // 🟢 New function to execute the SOS API call from the modal
    const confirmSOSPing = async () => {
        setIsActionLoading(true);
        try {
            await axiosInstance.post(`/admin/issue/${sosModal.issueId}/sos`);
            showToast({ icon: 'success', title: 'SOS Broadcast Fired!' });
            setSosModal({ isOpen: false, issueId: '' });
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to send SOS' });
        } finally {
            setIsActionLoading(false);
        }
    };

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in flex flex-col h-full relative">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between w-full xl:w-auto">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-red-500 flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8" /> Triage & Escalations
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Issues ignored for <span className="font-bold text-red-400">&gt; 7 Days</span> or marked as <span className="font-bold text-orange-400">DISPUTED</span>.</p>
                    </div>
                    <button onClick={handleGlobalExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold transition-colors shrink-0">
                        <Download size={14} /> Export Triage
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
                    <div className="w-full sm:w-40"><CustomSelect options={ESCALATION_STATUSES} value={filters.status} onChange={(val) => { setFilters({ ...filters, status: val }); setPage(1); }} /></div>
                    <div className="w-full sm:w-40"><CustomSelect options={stateOptions} value={filters.state} onChange={(val) => { setFilters({ ...filters, state: val, city: '' }); setPage(1); }} /></div>
                    <div className="w-full sm:w-40"><CustomSelect options={districtOptions} value={filters.city} onChange={(val) => { setFilters({ ...filters, city: val }); setPage(1); }} /></div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0 relative z-10">
                <div className="overflow-x-auto thin-scrollbar flex-1">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-red-500/10 backdrop-blur-md border-b border-red-500/20 sticky top-0 z-20">
                            <tr className="text-red-400 text-xs uppercase tracking-wider">
                                <th className="py-4 px-6 font-bold">Stagnant Time</th>
                                <th className="py-4 px-6 font-bold">Escalation State</th>
                                <th className="py-4 px-6 font-bold">Issue Details</th>
                                <th className="py-4 px-6 font-bold">Impact / Bounty</th>
                                <th className="py-4 px-6 font-bold text-right">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-sm text-muted-foreground">Scanning for escalations...</td></tr>
                            ) : issues.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertOctagon className="w-10 h-10 opacity-20" />
                                            <p>No critical escalations found. The platform is healthy.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                issues.map((issue) => {
                                    const stagnantDays = getDaysStagnant(issue.createdAt);
                                    const isDisputed = issue.status === 'DISPUTED';

                                    return (
                                        <tr key={issue._id} className="hover:bg-red-500/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="text-red-500 w-5 h-5" />
                                                    <span className="text-2xl font-black text-red-500">{stagnantDays}</span>
                                                    <span className="text-xs text-red-500/70 font-bold uppercase mt-1">Days</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-bold tracking-wider uppercase border ${isDisputed ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                                    {isDisputed ? 'DISPUTED' : 'ORPHANED'}
                                                </span>
                                                {isDisputed && issue.disputeEvidence?.adminRemark && (
                                                    <p className="text-[10px] text-muted-foreground mt-2 truncate max-w-[150px]" title={issue.disputeEvidence.adminRemark}>
                                                        {issue.disputeEvidence.adminRemark}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleIssueClick(issue._id)}
                                                    className="flex flex-col items-start max-w-[250px] text-left group"
                                                    disabled={fetchingIssueId === issue._id}
                                                >
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={issue.title}>
                                                            {fetchingIssueId === issue._id ? 'Loading...' : issue.title}
                                                        </span>
                                                        <Eye size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{issue.category}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${issue.priority === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-orange-500 border-orange-500/30 bg-orange-500/10'}`}>{issue.priority}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1"><MapPin size={10} /> {issue.location?.city}, {issue.location?.state}</span>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-foreground">{issue.impactScore || 0}</span>
                                                    <button onClick={() => setBoostModal({ isOpen: true, issueId: issue._id, amount: '' })} className="flex items-center gap-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-md hover:bg-yellow-500/20 transition-colors">
                                                        <Zap size={12} /> Add Bounty
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setCategoryModal({ isOpen: true, issueId: issue._id, category: issue.category, priority: issue.priority || 'LOW' })} title="Re-Categorize" className="p-2 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    {/* 🟢 Updated onClick handler to open modal */}
                                                    <button onClick={() => triggerSOSModal(issue._id)} title="Blast SOS to District" className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                                        <Megaphone size={16} />
                                                    </button>
                                                    <button onClick={() => setAssignModal({ isOpen: true, issueId: issue._id, authorityId: '', hours: '' })} className="px-3 py-1.5 bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 hover:bg-indigo-600 shadow-md">
                                                        <Briefcase size={14} /> Force Assign
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Page {page} of {totalPages}</span>
                    <div className="space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-card border border-border/50 rounded-lg hover:bg-muted">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-card border border-border/50 rounded-lg hover:bg-muted">Next</button>
                    </div>
                </div>
            )}

            {/* --- ACTION MODALS --- */}
            {/* Boost Modal */}
            {boostModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <form onSubmit={handleBoost} className="bg-card p-6 rounded-2xl border border-yellow-500/30 shadow-2xl w-full max-w-sm relative overflow-visible">
                        <div className="flex items-center gap-2 mb-4 text-yellow-500">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Add Bounty (Boost Score)</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Increase the impact score to push this issue to the top of the local marketplace.</p>
                        <input type="number" min="1" placeholder="Bonus Points (e.g. 50, 100)" required value={boostModal.amount} onChange={e => setBoostModal({ ...boostModal, amount: e.target.value })} className="w-full mb-4 p-3 bg-muted border border-border rounded-xl text-sm focus:border-yellow-500 outline-none" />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setBoostModal({ isOpen: false, issueId: '', amount: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" disabled={isActionLoading} className="px-4 py-2 text-sm bg-yellow-500 text-black font-bold rounded-xl flex items-center gap-2 hover:bg-yellow-600">
                                {isActionLoading ? <MiniLoader /> : 'Inject Bounty'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Re-Categorize Modal */}
            {categoryModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <form onSubmit={handleReCategorize} className="bg-card p-6 rounded-2xl border border-border/50 shadow-2xl w-full max-w-sm relative overflow-visible">
                        <div className="flex items-center gap-2 mb-4">
                            <Edit3 className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-lg">Fix Classification</h3>
                        </div>
                        <div className="space-y-4 mb-6 relative z-50">
                            <div>
                                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Category</label>
                                <CustomSelect options={CATEGORIES} value={categoryModal.category} onChange={v => setCategoryModal({ ...categoryModal, category: v })} />
                            </div>
                            <div className="relative z-40">
                                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Priority</label>
                                <CustomSelect options={PRIORITIES} value={categoryModal.priority} onChange={v => setCategoryModal({ ...categoryModal, priority: v })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 relative z-10">
                            <button type="button" onClick={() => setCategoryModal({ isOpen: false, issueId: '', category: '', priority: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" disabled={isActionLoading} className="px-4 py-2 text-sm bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90">
                                {isActionLoading ? <MiniLoader /> : 'Update Meta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Force Assign Modal */}
            {assignModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <form onSubmit={handleForceAssign} className="bg-card p-6 rounded-2xl border border-indigo-500/30 shadow-2xl w-full max-w-md relative overflow-visible">
                        <div className="flex items-center gap-2 mb-4 text-indigo-500">
                            <Briefcase className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Force Triage Assignment</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Lock this stagnant issue directly to an official. It will immediately leave this dashboard.</p>
                        <div className="mb-4 relative z-50">
                            <CustomSelect options={authorities} value={assignModal.authorityId} onChange={v => setAssignModal({ ...assignModal, authorityId: v })} placeholder="Select Official to penalize/assign..." />
                        </div>
                        <input type="number" min="1" placeholder="Mandatory Resolution Hrs (e.g. 12)" required value={assignModal.hours} onChange={e => setAssignModal({ ...assignModal, hours: e.target.value })} className="w-full mb-6 p-3 bg-muted border border-border rounded-xl text-sm focus:border-indigo-500 outline-none relative z-10" />
                        <div className="flex justify-end gap-3 relative z-10">
                            <button type="button" onClick={() => setAssignModal({ isOpen: false, issueId: '', authorityId: '', hours: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
                            <button type="submit" disabled={isActionLoading || !assignModal.authorityId} className="px-4 py-2 text-sm bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-600 disabled:opacity-50">
                                {isActionLoading ? <MiniLoader /> : <>Lock & Warn <ArrowRight size={14} /></>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🟢 SOS Confirmation Modal */}
            {sosModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-card p-6 rounded-2xl border border-red-500/30 shadow-2xl w-full max-w-sm relative overflow-visible">
                        <div className="flex items-center gap-2 mb-4 text-red-500">
                            <Megaphone className="w-6 h-6 animate-pulse" />
                            <h3 className="font-bold text-lg">Blast SOS Notification</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Are you sure you want to blast an urgent SOS notification to all officials in this district? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setSosModal({ isOpen: false, issueId: '' })} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="button" onClick={confirmSOSPing} disabled={isActionLoading} className="px-4 py-2 text-sm bg-red-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                                {isActionLoading ? <MiniLoader /> : 'Yes, Blast SOS'}
                            </button>
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

export default AdminTriage;