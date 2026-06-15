import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { Users, AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, Filter, ShieldAlert, Award, Briefcase, Building2, Hourglass } from 'lucide-react';
import Loader from '../Loader';
import CustomSelect from '../CustomSelect';

const AdminAnalytics = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [locationStats, setLocationStats] = useState([]);
    const [issuesSnapshot, setIssuesSnapshot] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚀 Filters
    const [selectedCity, setSelectedCity] = useState('');
    const [sortBy, setSortBy] = useState('impactScore');

    useEffect(() => { fetchDashboardData(); }, []);
    useEffect(() => { if (!loading) fetchIssuesForSpotlight(); }, [selectedCity]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, locationRes, issuesRes] = await Promise.all([
                axiosInstance.get('/admin/analytics/summary'),
                axiosInstance.get('/admin/analytics/location'),
                axiosInstance.get('/admin/issues', { params: { limit: 100 } })
            ]);
            setGlobalStats(summaryRes.data.data);
            setLocationStats(locationRes.data.data);
            setIssuesSnapshot(issuesRes.data.data.issues);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchIssuesForSpotlight = async () => {
        try {
            const res = await axiosInstance.get('/admin/issues', { params: { city: selectedCity || undefined, limit: 100 } });
            setIssuesSnapshot(res.data.data.issues);
        } catch (error) { console.error(error); }
    };

    const getSortedIssues = () => {
        const sorted = [...issuesSnapshot];
        if (sortBy === 'impactScore') return sorted.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
        if (sortBy === 'confirmationCount') return sorted.sort((a, b) => (b.confirmationCount || 0) - (a.confirmationCount || 0));
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    if (loading || !globalStats) return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader /></div>;

    const topLevelCards = [
        { title: 'Standard Users', value: globalStats.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        { title: 'Pending Requests', value: globalStats.pendingRequests || 0, icon: Hourglass, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
        { title: 'Verified Officials', value: globalStats.totalOfficials || 0, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
        { title: 'Verified NGOs', value: globalStats.totalNGOs || 0, icon: Building2, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
        { title: 'Total Issues', value: globalStats.totalIssues || 0, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { title: 'Open Issues', value: globalStats.issueStats.OPEN || 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
        { title: 'Resolved Issues', value: globalStats.issueStats.RESOLVED || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    ];

    const sortedSpotlightIssues = getSortedIssues().slice(0, 5);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-8">
            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2 md:gap-3">
                    <TrendingUp className="text-primary w-6 h-6 md:w-8 md:h-8" /> Analytics & Insights
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">Global overview and city-level deep dives.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 relative z-10">
                {topLevelCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className={`bg-card glass-card border ${card.border} p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center gap-4 shadow-lg w-full`}>
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${card.bg}`}>
                                <Icon className={`w-6 h-6 md:w-7 md:h-7 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs md:text-sm font-medium">{card.title}</p>
                                <h3 className={`text-2xl md:text-3xl font-bold ${card.color} mt-0.5 md:mt-1`}>{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 relative z-10">
                <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl xl:col-span-1 flex flex-col min-h-[350px] lg:h-[500px]">
                    <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                        <MapPin className="text-primary w-4 h-4 md:w-5 md:h-5" /> City Leaderboard
                    </h3>
                    <div className="overflow-y-auto thin-scrollbar flex-1 pr-1 md:pr-2 space-y-3">
                        {locationStats.map((stat, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedCity(stat._id === selectedCity ? '' : stat._id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedCity === stat._id ? 'bg-primary/10 border-primary/30' : 'bg-background border-border/50 hover:bg-muted/50'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-foreground text-sm">{stat._id || 'Unknown'}</span>
                                    <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-lg text-foreground">{stat.totalIssues} Issues</span>
                                </div>
                                <div className="flex gap-4 text-[10px] font-medium">
                                    <span className="text-yellow-500 flex items-center gap-1"><Clock size={12} /> {stat.openIssues} Open</span>
                                    <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={12} /> {stat.criticalIssues} Critical</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl xl:col-span-2 flex flex-col min-h-[400px] lg:h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                            <AlertCircle className="text-red-500 w-5 h-5" />
                            Top Issues Spotlight {selectedCity && <span className="text-primary text-xs bg-primary/10 px-2 py-1 rounded-md">{selectedCity}</span>}
                        </h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="w-1/2 sm:w-40">
                                <CustomSelect
                                    options={[{ value: '', label: 'All Cities' }, ...locationStats.map(s => ({ value: s._id, label: s._id }))]}
                                    value={selectedCity}
                                    onChange={setSelectedCity}
                                />
                            </div>
                            <div className="w-1/2 sm:w-40">
                                <CustomSelect
                                    options={[{ value: 'impactScore', label: 'Impact' }, { value: 'confirmationCount', label: 'Confirms' }, { value: 'recent', label: 'Recent' }]}
                                    value={sortBy}
                                    onChange={setSortBy}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto thin-scrollbar flex-1 space-y-4">
                        {sortedSpotlightIssues.map(issue => (
                            <div key={issue._id} className="p-4 bg-background border border-border/50 rounded-xl flex justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground text-sm truncate">{issue.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{issue.location?.city} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2 text-xs font-bold">
                                    <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg">{issue.impactScore} Impact</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;