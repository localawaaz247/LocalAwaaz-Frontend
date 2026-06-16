import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { Send, MapPin, Type, AlignLeft, Users } from 'lucide-react';
import MiniLoader from '../MiniLoader';
import { showToast } from '../../utils/toast';
import CustomSelect from '../CustomSelect';
import { cscApi } from '../../utils/cscAPI';

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
        { value: '', label: 'All Users' },
        { value: 'user', label: 'Citizens (Users)' },
        { value: 'official', label: 'Officials' },
        { value: 'ngo', label: 'NGOs' },
        { value: 'admin', label: 'Admins' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axiosInstance.post(`/admin/broadcast`, formData);
            showToast({ icon: 'success', title: 'Broadcast Sent Successfully!' });
            setFormData({ title: '', message: '', targetState: '', targetCity: '', targetRole: '' });
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to send broadcast' });
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col p-4 sm:p-6 animate-fade-in">
            <div className="flex-shrink-0 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">System Broadcast</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Send high-priority notifications to users. Use the filters below to target specific demographics.
                </p>
            </div>

            <div className="flex-1 min-h-0 bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl shadow-xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10 pt-5 md:pt-8">

                    <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-6 space-y-5 md:space-y-6 thin-scrollbar">

                        {/* Target Filters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/20 border border-border/50 rounded-xl">

                            <div className="space-y-1.5 md:space-y-2 relative z-50">
                                <label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Users size={14} className="text-primary" /> Target Role
                                </label>
                                <CustomSelect
                                    options={roleOptions}
                                    value={formData.targetRole}
                                    onChange={(val) => setFormData({ ...formData, targetRole: val })}
                                    placeholder="Select Role"
                                />
                            </div>

                            <div className="space-y-1.5 md:space-y-2 relative z-40">
                                <label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin size={14} className="text-primary" /> Target State
                                </label>
                                <CustomSelect
                                    options={stateOptions}
                                    value={formData.targetState}
                                    onChange={(val) => setFormData({ ...formData, targetState: val, targetCity: '' })}
                                    placeholder="Select State"
                                />
                            </div>

                            <div className="space-y-1.5 md:space-y-2 relative z-30">
                                <label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin size={14} className="text-primary" /> Target District
                                </label>
                                <CustomSelect
                                    options={districtOptions}
                                    value={formData.targetCity}
                                    onChange={(val) => setFormData({ ...formData, targetCity: val })}
                                    placeholder="Select District"
                                />
                            </div>

                        </div>

                        <div className="space-y-1.5 md:space-y-2 relative z-20">
                            <label className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-2">
                                <Type size={16} className="text-primary" /> Notification Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2.5 md:py-3 bg-background border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/50"
                                placeholder="e.g., App Maintenance Update"
                            />
                        </div>

                        <div className="space-y-1.5 md:space-y-2 relative z-10">
                            <label className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-2">
                                <AlignLeft size={16} className="text-primary" /> Broadcast Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows="5"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-2.5 md:py-3 bg-background border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/50 resize-none thin-scrollbar"
                                placeholder="Type your alert message here..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex-shrink-0 p-5 md:p-8 pt-4 md:pt-6 border-t border-border/50 bg-card/95 backdrop-blur-sm z-20">
                        <button
                            type="submit"
                            disabled={loading || !formData.message}
                            className="w-full sm:w-auto px-6 md:px-8 py-3 btn-gradient rounded-lg md:rounded-xl font-semibold text-white text-sm md:text-base flex justify-center items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                        >
                            {loading ? <MiniLoader className="w-5 h-5" /> : <><Send size={18} /> Transmit Broadcast</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminBroadcast;