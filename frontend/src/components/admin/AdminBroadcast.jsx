import React, { useState } from 'react';
import axiosInstance from '../../utils/axios';
import { Send, MapPin, Type, AlignLeft } from 'lucide-react';
import MiniLoader from '../MiniLoader';
import { showToast } from '../../utils/toast';

const AdminBroadcast = () => {
    const [formData, setFormData] = useState({ title: '', message: '', targetCity: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axiosInstance.post(`${import.meta.env.VITE_BASE_URL}/admin/broadcast`, formData);
            showToast({ icon: 'success', title: 'Broadcast Sent Successfully!' });
            setFormData({ title: '', message: '', targetCity: '' });
        } catch (error) {
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to send broadcast' });
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in py-4 md:py-8 w-full px-2 sm:px-0">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">System Broadcast</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Send high-priority notifications to users. Leave city blank for global scope.
                </p>
            </div>

            <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 relative z-10">
                    <div className="space-y-1.5 md:space-y-2">
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

                    <div className="space-y-1.5 md:space-y-2">
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

                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-2">
                            <MapPin size={16} className="text-primary" /> Target City Filter
                        </label>
                        <input
                            type="text"
                            value={formData.targetCity}
                            onChange={(e) => setFormData({ ...formData, targetCity: e.target.value })}
                            className="w-full px-4 py-2.5 md:py-3 bg-background border border-border/50 rounded-lg md:rounded-xl text-sm focus:border-primary outline-none transition-colors text-foreground placeholder:text-muted-foreground/50"
                            placeholder="Leave empty to notify ALL users (e.g., Mumbai)"
                        />
                    </div>

                    <div className="pt-4 md:pt-6 border-t border-border/50">
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