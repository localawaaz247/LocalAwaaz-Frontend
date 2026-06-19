import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { Send, MapPin, AlignLeft, Users, Radio, Megaphone, AlertCircle } from 'lucide-react';
import MiniLoader from '../MiniLoader';
import { showToast } from '../../utils/toast';
import CustomSelect from '../CustomSelect';
import { cscApi } from '../../utils/cscAPI';
import { motion } from 'framer-motion';

const AdminBroadcast = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetState: '',
        targetCity: '',
        targetRole: ''
    });

    const [loading, setLoading] = useState(false);
    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);

    // Fetch States on component mount
    useEffect(() => {
        cscApi.get("/countries/IN/states")
            .then(res => setStatesList(res.data))
            .catch(console.error);
    }, []);

    // Fetch Districts when State changes
    useEffect(() => {
        if (!formData.targetState) {
            setDistrictsList([]);
            return;
        }
        const stateObj = statesList.find(s => s.name === formData.targetState);
        if (stateObj) {
            cscApi.get(`/countries/IN/states/${stateObj.iso2}/cities`)
                .then(res => setDistrictsList(res.data))
                .catch(console.error);
        }
    }, [formData.targetState, statesList]);

    const stateOptions = [{ value: '', label: 'All States' }, ...statesList.map(s => ({ value: s.name, label: s.name }))];
    const districtOptions = [{ value: '', label: 'All Districts/Cities' }, ...districtsList.map(d => ({ value: d.name, label: d.name }))];

    const roleOptions = [
        { value: '', label: 'All Users (Global)' },
        { value: 'user', label: 'Citizens Only' },
        { value: 'official', label: 'Officials Only' },
        { value: 'ngo', label: 'NGOs Only' },
        { value: 'admin', label: 'Admins Only' },
        { value: 'other', label: 'Other Authorities' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axiosInstance.post(`/admin/broadcast`, formData);
            showToast({ icon: 'success', title: 'Broadcast Transmitted Successfully!' });
            setFormData({ title: '', message: '', targetState: '', targetCity: '', targetRole: '' });
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Transmission failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-4 md:space-y-8 pb-10"
        >
            {/* --- HEADER --- */}
            <div className="flex flex-col gap-1 relative z-50">
                <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 drop-shadow-sm flex items-center gap-3">
                    <Radio className="text-primary w-6 h-6 md:w-8 md:h-8" /> System Broadcast
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                    Push high-priority alerts to user devices. Use demographic filters to limit the blast radius.
                </p>
            </div>

            {/* --- MAIN CARD --- */}
            <div className="bg-card/40 backdrop-blur-2xl border border-border/60 rounded-2xl md:rounded-3xl shadow-xl flex-1 flex flex-col relative z-40 overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 thin-scrollbar">

                        {/* Target Filters Grid */}
                        <div className="space-y-3 md:space-y-4 relative z-40">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-l-2 border-primary pl-2">
                                Target Audience
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 md:p-5 shadow-sm relative">

                                <div className="space-y-1.5 md:space-y-2 relative z-[60]">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Users size={14} className="text-primary" /> Target Role
                                    </label>
                                    <CustomSelect
                                        options={roleOptions}
                                        value={formData.targetRole}
                                        onChange={(val) => setFormData({ ...formData, targetRole: val })}
                                        placeholder="Select Target Role"
                                    />
                                </div>

                                <div className="space-y-1.5 md:space-y-2 relative z-[50]">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary" /> Target State
                                    </label>
                                    <CustomSelect
                                        options={stateOptions}
                                        value={formData.targetState}
                                        onChange={(val) => setFormData({ ...formData, targetState: val, targetCity: '' })}
                                        placeholder="Select State"
                                    />
                                </div>

                                <div className="space-y-1.5 md:space-y-2 relative z-[40]">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary" /> Target District
                                    </label>
                                    <CustomSelect
                                        options={districtOptions}
                                        value={formData.targetCity}
                                        onChange={(val) => setFormData({ ...formData, targetCity: val })}
                                        placeholder="Select District"
                                        disabled={!formData.targetState}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Area - FIXED Z-INDEX BUG HERE */}
                        <div className="space-y-3 md:space-y-4 relative z-30">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-l-2 border-primary pl-2">
                                Payload Configuration
                            </h3>

                            <div className="space-y-4 md:space-y-6 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
                                <div className="space-y-1.5 md:space-y-2 relative">
                                    <label className="text-[10px] sm:text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Megaphone size={14} className="text-primary" /> Notification Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 md:px-4 py-3 md:py-3.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner text-foreground placeholder:text-muted-foreground/50"
                                        placeholder="e.g., Heavy Rainfall Alert / System Maintenance..."
                                    />
                                </div>

                                <div className="space-y-1.5 md:space-y-2 relative">
                                    <label className="text-[10px] sm:text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                        <AlignLeft size={14} className="text-primary" /> Broadcast Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows="6"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-3 md:px-4 py-3 md:py-3.5 bg-background/50 border border-border/60 rounded-xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner text-foreground placeholder:text-muted-foreground/50 resize-none thin-scrollbar leading-relaxed"
                                        placeholder="Type the full alert message here. This will be sent directly to user devices..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex-shrink-0 p-4 md:p-5 lg:p-8 pt-4 md:pt-6 border-t border-border/50 bg-muted/20 backdrop-blur-md z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-muted-foreground bg-background/50 px-4 py-2.5 rounded-xl border border-border/50 shadow-sm w-full sm:w-auto">
                            <AlertCircle size={14} className="text-amber-500 shrink-0" />
                            Double check filters before transmitting.
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.message}
                            className="w-full sm:w-auto px-6 md:px-8 py-3.5 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                        >
                            {loading ? (
                                <MiniLoader className="w-5 h-5 border-primary-foreground border-t-transparent" />
                            ) : (
                                <>
                                    <Send size={18} /> Transmit Broadcast
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminBroadcast;