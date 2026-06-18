import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertOctagon, Zap, Megaphone, Edit3, Briefcase,
    MapPin, Clock, ArrowRight, ShieldAlert, Download, Eye, X, Search, Flame
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
    const [sosModal, setSosModal] = useState({ isOpen: false, issueId: '' });
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Filter Options
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
        if (stateObj) cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`).then(res => setDistrictsList(res.data)).catch(console.error);
    }, [filters.state, statesList]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchTriageIssues(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [page, filters]);

    // Lock Body Scroll for Modals
    useEffect(() => {
        if (boostModal.isOpen || categoryModal.isOpen || assignModal.isOpen || sosModal.isOpen || isIssueModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [boostModal.isOpen, categoryModal.isOpen, assignModal.isOpen, sosModal.isOpen, isIssueModalOpen]);

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
        } finally {
            setIsActionLoading(false);
        }
    };

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 flex flex-col h-full relative pb-10">

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

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full xl:w-auto relative z-[60]">
                    <CustomSelect options={ESCALATION_STATUSES} value={filters.status} onChange={(val) => { setFilters({ ...filters, status: val }); setPage(1); }} />
                    <CustomSelect options={stateOptions} value={filters.state} onChange={(val) => { setFilters({ ...filters, state: val, city: '' }); setPage(1); }} />
                    <CustomSelect options={districtOptions} value={filters.city} onChange={(val) => { setFilters({ ...filters, city: val }); setPage(1); }} />
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-[400px] relative z-10">
                <div className="overflow-x-auto thin-scrollbar flex-1 bg-background/20">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-red-500/10 backdrop-blur-md border-b border-red-500/20 sticky top-0 z-20 shadow-sm">
                            <tr className="text-red-400 text-[10px] md:text-sm uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold">Stagnant Time</th>
                                <th className="py-4 px-6 font-bold hidden md:table-cell">Escalation State</th>
                                <th className="py-4 px-6 font-bold">Issue Details</th>
                                <th className="py-4 px-6 font-bold hidden lg:table-cell">Impact / Bounty</th>
                                <th className="py-4 px-6 font-bold text-right">Triage Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            <AnimatePresence>
                                {loading ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td colSpan="5" className="p-12 text-center text-sm font-medium text-muted-foreground">
                                            <div className="flex justify-center"><MiniLoader /></div>
                                        </td>
                                    </motion.tr>
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
                                                {/* Stagnant Time */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="text-red-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                                        <span className="text-xl md:text-2xl font-black text-red-500">{stagnantDays}</span>
                                                        <span className="text-[10px] text-red-500/70 font-bold uppercase mt-1">Days</span>
                                                    </div>
                                                    {/* Mobile Only Status Badge */}
                                                    <div className="md:hidden mt-2">
                                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider uppercase border ${isDisputed ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                                            {isDisputed ? 'DISPUTED' : 'ORPHANED'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Escalation State (Desktop) */}
                                                <td className="py-4 px-6 hidden md:table-cell">
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

                                                {/* Details */}
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

                                                {/* Impact */}
                                                <td className="py-4 px-6 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 px-3 py-1.5 rounded-xl w-max">
                                                        <span className="text-lg font-black text-yellow-500 flex items-center gap-1"><Zap size={16} className="fill-yellow-500/20" /> {issue.impactScore || 0}</span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
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

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-border/50 bg-background/40 backdrop-blur-md flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span className="tracking-widest uppercase">Page {page} of {totalPages}</span>
                        <div className="space-x-2 flex">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-card/80 border border-border/50 rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* ACTION MODALS */}
            {/* ========================================================= */}

            {/* 1. Boost Modal */}
            <AnimatePresence>
                {boostModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

            {/* 2. Re-Categorize Modal */}
            <AnimatePresence>
                {categoryModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

            {/* 3. Force Assign Modal */}
            <AnimatePresence>
                {assignModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal({ isOpen: false, issueId: '', authorityId: '', hours: '' })} />
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onSubmit={handleForceAssign}
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
                                <button type="submit" disabled={isActionLoading || !assignModal.authorityId} className="px-5 py-2.5 text-sm bg-indigo-500 text-white font-black rounded-xl flex items-center justify-center min-w-[140px] shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    {isActionLoading ? <MiniLoader className="text-white" /> : <>Lock & Warn <ArrowRight size={14} className="ml-1" /></>}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* 4. SOS Confirmation Modal */}
            <AnimatePresence>
                {sosModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

            {/* 5. Issue Detail (Reusing the citizen viewer for deep dive reading without actions) */}
            <IssueDetail
                issue={selectedIssueForDetail}
                isOpen={isIssueModalOpen}
                onClose={closeIssueModal}
                hideConfirm={true}
                isAdminView={true}
            />

        </motion.div>
    );
};

export default AdminTriage;