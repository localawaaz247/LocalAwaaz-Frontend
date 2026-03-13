import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { Users, AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, Filter, ShieldAlert, Award } from 'lucide-react';
import Loader from '../Loader';

const AdminAnalytics = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [locationStats, setLocationStats] = useState([]);
    const [issuesSnapshot, setIssuesSnapshot] = useState([]);
    const [loading, setLoading] = useState(true);
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
        { title: 'Total Users', value: globalStats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        { title: 'Total Issues', value: globalStats.totalIssues, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { title: 'Open Issues', value: globalStats.issueStats.OPEN || 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
        { title: 'Resolved Issues', value: globalStats.issueStats.RESOLVED || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    ];

    const sortedSpotlightIssues = getSortedIssues().slice(0, 5);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-8">
            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground text-gradient flex items-center gap-2 md:gap-3">
                    <TrendingUp className="text-primary w-6 h-6 md:w-8 md:h-8" /> Analytics & Insights
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">Global overview and city-level deep dives.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 relative z-10">
                {topLevelCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className={`bg-card glass-card border ${card.border} p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] shadow-lg w-full`}>
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
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                            <MapPin className="text-primary w-4 h-4 md:w-5 md:h-5" /> City Leaderboard
                        </h3>
                    </div>

                    <div className="overflow-y-auto thin-scrollbar flex-1 pr-1 md:pr-2 space-y-2 md:space-y-3">
                        {locationStats.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-10">No location data available.</p>
                        ) : (
                            locationStats.map((stat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedCity(stat._id === selectedCity ? '' : stat._id)}
                                    className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all ${selectedCity === stat._id
                                            ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(45,212,191,0.15)]'
                                            : 'bg-background border-border/50 hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1.5 md:mb-2">
                                        <span className="font-semibold text-foreground text-sm md:text-base">{stat._id || 'Unknown'}</span>
                                        <span className="text-[10px] md:text-xs font-bold px-2 py-1 bg-muted rounded-lg text-foreground">{stat.totalIssues} Issues</span>
                                    </div>
                                    <div className="flex gap-3 md:gap-4 text-[10px] md:text-xs font-medium">
                                        <span className="text-yellow-500 flex items-center gap-1"><Clock size={12} /> {stat.openIssues} Open</span>
                                        <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={12} /> {stat.criticalIssues} Critical</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-card glass-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl xl:col-span-2 flex flex-col min-h-[400px] lg:h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 flex-wrap">
                            <AlertCircle className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
                            Top Issues Spotlight {selectedCity && <span className="text-primary text-[10px] md:text-xs bg-primary/10 px-2 py-1 rounded-md">{selectedCity}</span>}
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-36 md:w-40">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-background border border-border/50 rounded-lg md:rounded-xl text-xs font-medium focus:border-primary outline-none text-foreground appearance-none cursor-pointer"
                                >
                                    <option value="">All Cities</option>
                                    {locationStats.map(stat => <option key={stat._id} value={stat._id}>{stat._id}</option>)}
                                </select>
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full sm:w-auto px-3 py-2 bg-background border border-border/50 rounded-lg md:rounded-xl text-xs font-medium focus:border-primary outline-none text-foreground cursor-pointer"
                            >
                                <option value="impactScore">Most Impacted</option>
                                <option value="confirmationCount">Most Confirmed</option>
                                <option value="recent">Most Recent</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-y-auto thin-scrollbar flex-1 pr-1 md:pr-2 space-y-3 md:space-y-4">
                        {sortedSpotlightIssues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mb-2 opacity-20" />
                                <p className="text-sm">No issues found.</p>
                            </div>
                        ) : (
                            sortedSpotlightIssues.map(issue => (
                                <div key={issue._id} className="p-3 md:p-4 bg-background border border-border/50 rounded-xl hover:border-primary/30 transition-colors flex flex-col sm:flex-row justify-between gap-3 md:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 flex-wrap">
                                            <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${issue.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' : issue.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                                                {issue.priority || 'LOW'} Priority
                                            </span>
                                            <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${issue.status === 'OPEN' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-foreground text-sm mb-1 truncate">{issue.title}</h4>
                                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <MapPin size={10} className="md:w-3 md:h-3" /> {issue.location?.city || 'Unknown Location'} • {new Date(issue.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex sm:flex-col justify-start sm:justify-end items-center sm:items-end gap-2 shrink-0">
                                        <div className="flex items-center gap-1 text-[10px] md:text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                                            <TrendingUp size={12} className="md:w-3.5 md:h-3.5" /> {issue.impactScore || 0} Impact
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                            <Award size={12} className="md:w-3.5 md:h-3.5" /> {issue.confirmationCount || 0} Confirms
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;