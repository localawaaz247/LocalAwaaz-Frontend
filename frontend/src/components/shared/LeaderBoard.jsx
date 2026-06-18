import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import {
    Trophy, Medal, Award, Camera, X, Download, Share2,
    Instagram, Facebook, ChevronRight, ChevronLeft, MapPin,
    Briefcase, CheckSquare, AlertTriangle, Clock, Zap, Shield, Search, History,
    ShieldCheck, FileSpreadsheet, ListIcon
} from 'lucide-react';

import { Capacitor } from '@capacitor/core';
import { Share as NativeShare } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import MiniLoader from '../MiniLoader';

const WhatsAppIcon = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.459-1.655-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
);

const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&size=128&bold=true`;

const getCorsSafeUrl = (url) => {
    if (!url) return null;
    if (url.includes('ui-avatars.com')) return url;
    const baseUrl = axiosInstance.defaults.baseURL || '';
    return `${baseUrl}/proxy-image?url=${encodeURIComponent(url)}`;
};

const LeaderBoard = () => {
    const { user: currentUser } = useSelector((state) => state.auth);

    // Role Checks
    const userRole = currentUser?.role?.toUpperCase() || 'CITIZEN';
    const isAdmin = userRole === 'ADMIN';
    const canExportExcel = ['ADMIN', 'OFFICIAL', 'NGO'].includes(userRole);

    const [loading, setLoading] = useState(true);
    const [leaderboardData, setLeaderboardData] = useState({ citizens: [], authorities: [] });
    const [activeTab, setActiveTab] = useState('CITIZENS');
    const [lastUpdated, setLastUpdated] = useState(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const captureRef = useRef(null);

    // 🟢 UPDATED: Added history and issueList to state
    const [careerModal, setCareerModal] = useState({
        isOpen: false, profile: null, history: {}, view: 'OVERVIEW', selectedCategory: null, issueList: [], selectedIssue: null
    });

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/current');
            if (res.data.success) {
                setLeaderboardData({
                    citizens: res.data.data.citizens || [],
                    authorities: res.data.data.authorities || []
                });
                setLastUpdated(new Date(res.data.data.createdAt || Date.now()));
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setLeaderboardData({ citizens: [], authorities: [] });
                setLastUpdated(new Date());
            } else {
                console.error("Leaderboard fetch error:", error);
                showToast({ icon: 'error', title: 'Failed to load leaderboard.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // 🟢 NEW: Fetch full user profile and history when clicking on a user
    const openCareerModal = async (userId) => {
        try {
            const res = await axiosInstance.get(`/admin/user/${userId}`);
            if (res.data.success) {
                setCareerModal({
                    isOpen: true,
                    profile: res.data.data.user,
                    history: res.data.data.history || {},
                    view: 'OVERVIEW',
                    selectedCategory: null,
                    issueList: [],
                    selectedIssue: null
                });
            }
        } catch (error) {
            console.error("Failed to fetch user details:", error);
            showToast({ icon: 'error', title: 'Failed to load profile details' });
        }
    };

    const formatTimestamp = (date) => {
        if (!date) return '';
        return date.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const listToExport = activeTab === 'CITIZENS' ? leaderboardData.citizens : leaderboardData.authorities;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`${activeTab} Ranking`);

            if (activeTab === 'CITIZENS') {
                worksheet.columns = [
                    { header: 'Rank', key: 'rank', width: 10 },
                    { header: 'Name', key: 'name', width: 25 },
                    { header: 'CSI Score', key: 'csi', width: 15 },
                    { header: 'Activity Score', key: 'activity', width: 18 },
                    { header: 'Reported Issues', key: 'reported', width: 20 },
                    { header: 'Resolved Issues', key: 'resolved', width: 20 },
                    { header: 'Contribution (Flags/Confirms)', key: 'contribution', width: 30 }
                ];
            } else {
                worksheet.columns = [
                    { header: 'Rank', key: 'rank', width: 10 },
                    { header: 'Name', key: 'name', width: 25 },
                    { header: 'Department', key: 'department', width: 30 },
                    { header: 'Designation', key: 'designation', width: 25 },
                    { header: 'CSI Score', key: 'csi', width: 15 }
                ];
            }

            listToExport.forEach(entry => {
                const profile = entry.userId || {};
                if (activeTab === 'CITIZENS') {
                    worksheet.addRow({
                        rank: entry.rank,
                        name: profile.name || 'Unknown',
                        csi: entry.csi || 0,
                        activity: entry.activeScore || 0,
                        reported: profile.issuesReported || 0,
                        resolved: profile.issuesResolved || 0,
                        contribution: profile.issuesConfirmed || 0
                    });
                } else {
                    const authProfile = profile.authorityProfile || {};
                    worksheet.addRow({
                        rank: entry.rank,
                        name: profile.name || 'Unknown',
                        department: authProfile.departmentName || authProfile.org || 'N/A',
                        designation: authProfile.designation || 'N/A',
                        csi: entry.csi || 0
                    });
                }
            });

            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    row.eachCell((cell) => { cell.alignment = { vertical: 'middle', horizontal: 'center' }; });
                }
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const isNative = Capacitor.isNativePlatform();

            if (isNative) {
                const base64Data = await new Promise((resolve, reject) => {
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                const fileName = `LocalAwaaz_${activeTab}_Leaderboard_${new Date().getTime()}.xlsx`;
                const fileWriteResult = await Filesystem.writeFile({
                    path: fileName, data: base64Data, directory: Directory.Cache, encoding: 'base64'
                });

                await NativeShare.share({
                    title: 'Leaderboard Data', text: `Here is the exported ${activeTab} leaderboard from LocalAwaaz.`, files: [fileWriteResult.uri]
                });
            } else {
                const url = window.URL.createObjectURL(new Blob([buffer]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `LocalAwaaz_${activeTab}_Leaderboard.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Excel Export failed", error);
            showToast({ icon: 'error', title: 'Export Failed' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleCaptureShare = async () => {
        if (!captureRef.current) return;
        setIsCapturing(true);

        try {
            const element = captureRef.current;
            const originalStyle = element.style.cssText;

            // Lock dimensions to prevent layout shifts during capture
            element.style.height = 'max-content';
            element.style.overflow = 'visible';

            await new Promise(resolve => setTimeout(resolve, 100));

            // 🟢 FIXED: html2canvas configuration to eliminate white bars
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a', // Ensures background is filled
                scale: 2,
                useCORS: true,
                allowTaint: false,
                scrollY: 0, // Ignore scroll position to prevent blank tops
                scrollX: 0,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            element.style.cssText = originalStyle;
            const imgData = canvas.toDataURL('image/png');
            setCapturedImage(imgData);
            setShareModalOpen(true);

            // 🟢 FIXED: Trigger the flash AFTER capture is complete so it doesn't get recorded
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 150);

        } catch (error) {
            console.error("Screenshot failed", error);
            showToast({ icon: 'error', title: 'Failed to capture screenshot.' });
        } finally {
            setIsCapturing(false);
        }
    };

    const shareToPlatform = async (platform) => {
        if (!capturedImage) return;
        const isNative = Capacitor.isNativePlatform();

        try {
            if (isNative) {
                const base64Data = capturedImage.split(',')[1];
                const fileName = `LocalAwaaz_Rank_${Date.now()}.png`;
                const fileWriteResult = await Filesystem.writeFile({
                    path: fileName, data: base64Data, directory: Directory.Cache
                });
                await NativeShare.share({
                    title: 'My LocalAwaaz Rank', text: `Check out my civic impact ranking on LocalAwaaz!`, files: [fileWriteResult.uri]
                });
                return;
            }

            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const file = new File([blob], 'LocalAwaaz_Ranking.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: 'My LocalAwaaz Rank', text: `Check out my civic impact ranking on LocalAwaaz! #${platform}`, files: [file] });
            } else {
                handleDownload();
                const shareText = encodeURIComponent(`Check out my civic impact ranking on LocalAwaaz!`);
                const currentUrl = encodeURIComponent(window.location.origin);
                let shareIntentUrl = '';
                if (platform === 'WhatsApp') shareIntentUrl = `https://api.whatsapp.com/send?text=${shareText}%20${currentUrl}`;
                else if (platform === 'Facebook') shareIntentUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
                else if (platform === 'Instagram') {
                    showToast({ icon: 'success', title: 'Card Downloaded!', subtitle: 'Open Instagram to drop your rank into Stories!' });
                    return;
                }
                if (shareIntentUrl) window.open(shareIntentUrl, '_blank');
            }
        } catch (error) {
            handleDownload();
            showToast({ icon: 'info', title: 'Rank Card Saved', subtitle: 'Image downloaded to local device!' });
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = `LocalAwaaz_Rank_${new Date().toISOString().split('T')[0]}.png`;
        link.href = capturedImage;
        link.click();
    };

    const getPodiumColors = (index) => {
        if (index === 0) return "bg-yellow-500/10 border-yellow-500/50 text-yellow-500";
        if (index === 1) return "bg-slate-300/10 border-slate-300/50 text-slate-300";
        if (index === 2) return "bg-amber-700/10 border-amber-700/50 text-amber-600";
        return "bg-card border-border/50 text-foreground";
    };

    const currentList = activeTab === 'CITIZENS' ? leaderboardData.citizens : leaderboardData.authorities;
    const weeklyHero = currentList.find(u => u.isHero) || currentList[0];

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><MiniLoader /></div>;

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <AnimatePresence>
                {showFlash && (
                    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="fixed inset-0 z-[9999] bg-white pointer-events-none" />
                )}
            </AnimatePresence>

            {/* Scrollable Container (This exact area is captured) */}
            <div className="flex-1 overflow-y-auto thin-scrollbar relative">
                <div id="capture-wrap" ref={captureRef} className="p-4 md:p-8 w-full max-w-4xl mx-auto h-max relative flex flex-col items-center bg-background">

                    {/* Decorative Background Blob inside capture area */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                    {/* --- BEAUTIFUL HEADER (Now visually at the very top of the page!) --- */}
                    <div className="text-center w-full flex flex-col items-center justify-center pt-4 pb-8 relative z-10">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center mb-4 shadow-sm">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>

                        <h1 className={`text-4xl md:text-5xl font-black drop-shadow-sm mb-2 ${isCapturing
                            ? 'text-indigo-400 px-4 pb-2 tracking-normal' // Extra breathing room for the screenshot
                            : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-primary px-2 tracking-tight'
                            }`}>
                            LocalAwaaz Leaderboard
                        </h1>

                        <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">
                            Official {activeTab === 'CITIZENS' ? 'Citizen' : 'Authority'} Ranking
                        </p>

                        {/* Timestamp Pill */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-md border border-border/50 rounded-xl text-xs font-bold text-muted-foreground shadow-sm">
                            <Clock size={14} className="text-primary" />
                            Last Updated: {formatTimestamp(lastUpdated)}
                        </div>
                    </div>

                    {/* Sticky Action Bar - Sticks right under the header when scrolling */}
                    <div data-html2canvas-ignore="true" className="bg-card/60 backdrop-blur-xl sticky top-0 md:top-2 z-40 w-full p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg border border-border/60 flex justify-between items-center gap-4 flex-wrap mb-8">
                        <div className="flex bg-muted/50 p-1 rounded-xl w-max border border-border/50">
                            <button onClick={() => setActiveTab('CITIZENS')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'CITIZENS' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Citizens</button>
                            <button onClick={() => setActiveTab('AUTHORITIES')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'AUTHORITIES' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Authorities</button>
                        </div>

                        <div className="flex items-center gap-2">
                            {canExportExcel && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleExportExcel} disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border/50 text-foreground font-bold text-sm rounded-xl shadow-sm hover:bg-muted transition-all"
                                >
                                    <FileSpreadsheet size={18} className={`text-emerald-500 ${isExporting ? 'animate-pulse' : ''}`} />
                                    <span className="hidden sm:inline">Export CSV</span>
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleCaptureShare} disabled={isCapturing}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all"
                            >
                                <Camera size={18} className={isCapturing ? "animate-pulse" : ""} />
                                <span className="hidden sm:inline">Share Rank</span>
                            </motion.button>
                        </div>
                    </div>

                    <div className="w-full space-y-8 relative z-10">
                        {/* Weekly Hero Card */}
                        {weeklyHero && weeklyHero.userId && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-card/50 border border-amber-500/30 p-6 md:p-8 shadow-xl backdrop-blur-sm overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Award size={140} /></div>
                                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 md:gap-6">
                                    <div className="relative">
                                        <img src={getCorsSafeUrl(weeklyHero.userId.profilePic) || getAvatar(weeklyHero.userId.name)} alt={weeklyHero.userId.name} crossOrigin="anonymous" className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] object-cover bg-muted shrink-0" />
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                                            Rank #1
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-2">
                                        <h2 className="text-3xl md:text-4xl font-black text-foreground break-words leading-tight">{weeklyHero.userId.name}</h2>
                                        {activeTab === 'AUTHORITIES' && weeklyHero.userId.authorityProfile ? (
                                            <p className="text-sm font-bold text-muted-foreground mt-1 break-words">
                                                {weeklyHero.userId.authorityProfile.designation} • {weeklyHero.userId.authorityProfile.departmentName || weeklyHero.userId.authorityProfile.org || 'Authority'}
                                            </p>
                                        ) : (
                                            <p className="text-sm font-bold text-muted-foreground mt-1 break-words">
                                                Top Civic Contributor
                                            </p>
                                        )}
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 flex-wrap">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-border/50 rounded-lg">
                                                <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-bold text-white">{weeklyHero.csi} CSI Score</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Live Rankings List */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2 border-l-2 border-primary pl-2 mb-4">Top 10 Rankings</h3>
                            {currentList.length === 0 ? (
                                <div className="p-12 text-center bg-card/40 border border-border/50 rounded-3xl text-muted-foreground font-medium shadow-inner">
                                    <Trophy className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                    No rankings established for this category yet.
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {currentList.map((entry, index) => {
                                        if (!entry.userId) return null;
                                        const isMe = currentUser && entry.userId._id === currentUser._id;
                                        const podiumStyles = getPodiumColors(index);
                                        const isCitizenTab = activeTab === 'CITIZENS';
                                        const isAuthorityTab = activeTab === 'AUTHORITIES';
                                        const canViewProfile = isAuthorityTab || (isCitizenTab && isAdmin);

                                        return (
                                            <motion.div
                                                key={entry.userId._id}
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                                className={`relative flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all bg-card/60 backdrop-blur-sm group ${podiumStyles} ${isMe ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-primary/10' : 'shadow-sm'}`}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-border/50 font-black text-sm shrink-0 shadow-inner">
                                                        {index === 0 ? <Trophy size={20} className="text-yellow-500" />
                                                            : index === 1 ? <Medal size={20} className="text-slate-300" />
                                                                : index === 2 ? <Medal size={20} className="text-amber-600" />
                                                                    : `#${entry.rank}`}
                                                    </div>
                                                    <img src={getCorsSafeUrl(entry.userId.profilePic) || getAvatar(entry.userId.name)} alt="avatar" crossOrigin="anonymous" className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border/50 shrink-0 object-cover bg-muted" />
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <h4 className={`font-bold text-foreground flex items-center gap-2 text-sm sm:text-base leading-tight m-0 ${isCapturing ? 'pr-1' : 'truncate'}`}>
                                                            <span className={isCapturing ? "whitespace-nowrap pr-2" : "truncate"}>
                                                                {entry.userId.name}
                                                            </span>
                                                            {isMe && <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 leading-none">You</span>}
                                                        </h4>

                                                        {isCitizenTab ? (
                                                            <p className={`text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-1 m-0 ${isCapturing ? 'whitespace-nowrap pb-2 leading-loose' : 'truncate pb-1 leading-normal'
                                                                }`}>
                                                                Score: <span className="font-bold text-foreground">{entry.csi}</span> •
                                                                Reported: <span className="text-foreground/80">{entry.userId.issuesReported?.length ?? entry.userId.issuesReported ?? 0}</span> •
                                                                Resolved: <span className="text-foreground/80">{entry.userId.issuesResolved?.length ?? entry.userId.issuesResolved ?? 0}</span> •
                                                                Contribution: <span className="text-amber-500">{entry.userId.issuesFlagged?.length ?? entry.userId.issuesFlagged ?? 0}</span>
                                                            </p>
                                                        ) : (
                                                            <p className={`text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-1 m-0 ${isCapturing ? 'whitespace-nowrap pb-2 leading-loose' : 'truncate pb-1 leading-normal'}`}>
                                                                Score: <span className="font-bold text-foreground">{entry.csi}</span> •
                                                                {/* 🟢 FIXED: Added Math.max(0, value) to prevent negative database counters from leaking into the UI */}
                                                                Active Jobs: <span className="text-indigo-400">{Math.max(0, entry.userId.authorityProfile?.activeJobsCount || 0)}</span> •
                                                                Completed: <span className="text-emerald-500">{Math.max(0, entry.userId.authorityProfile?.jobsCompleted || 0)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {canViewProfile && (
                                                    <button
                                                        data-html2canvas-ignore="true"
                                                        onClick={() => openCareerModal(entry.userId._id)}
                                                        className="shrink-0 px-3 py-2 rounded-xl bg-background border border-border/50 text-muted-foreground text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-muted transition-colors"
                                                    >
                                                        <Briefcase size={14} className="shrink-0" /> <span className="hidden sm:inline">Profile</span>
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* --- CAPTURE FOOTER --- */}
                    <div className="w-full mt-10 pt-6 border-t border-border/50 flex flex-col items-center justify-center gap-2 relative z-10">
                        <div className="flex items-center gap-2 text-primary">
                            <Shield size={16} />
                            <span className="text-xs font-bold uppercase tracking-[0.15em]">Empowering Local Communities</span>
                        </div>
                        <p className="text-sm font-black text-foreground tracking-wide">www.localawaaz.in</p>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {shareModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShareModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-card border border-white/10 rounded-3xl w-11/12 max-w-lg md:max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-4 md:p-6 border-b border-border/50 bg-primary/5 shrink-0">
                                <h3 className="font-black text-lg md:text-xl flex items-center gap-2"><Share2 size={20} className="text-primary" /> Share Ranking</h3>
                                <button onClick={() => setShareModalOpen(false)} className="p-2 bg-muted rounded-full hover:bg-white/10 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-4 md:p-8 bg-muted/30 flex-1 overflow-y-auto flex items-center justify-center min-h-0">
                                <img src={capturedImage} alt="Rank" className="w-full h-auto rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-border/50 object-contain" />
                            </div>
                            <div className="p-5 md:p-6 grid grid-cols-4 gap-3 md:gap-6 text-center border-t border-border/50 shrink-0">
                                <button onClick={handleDownload} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-card border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"><Download className="w-5 h-5 md:w-6 md:h-6" /></div>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground">Save</span>
                                </button>
                                <button onClick={() => shareToPlatform('WhatsApp')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors border border-green-500/20"><WhatsAppIcon size={20} /></div>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground">WhatsApp</span>
                                </button>
                                <button onClick={() => shareToPlatform('Instagram')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 group-hover:text-white transition-all border border-pink-500/20"><Instagram className="w-5 h-5 md:w-6 md:h-6" /></div>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground">Story</span>
                                </button>
                                <button onClick={() => shareToPlatform('Facebook')} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors border border-blue-500/20"><Facebook className="w-5 h-5 md:w-6 md:h-6" /></div>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground">Facebook</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🟢 Sliding Career Modal (Now with Real Fetched Data) */}
            <AnimatePresence>
                {careerModal.isOpen && careerModal.profile && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCareerModal({ ...careerModal, isOpen: false })} />
                        <motion.div
                            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-card border border-border/50 rounded-3xl w-full max-w-5xl h-[90dvh] shadow-2xl flex flex-col relative z-10 overflow-hidden"
                        >
                            <div className="p-4 md:p-5 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center gap-4 shrink-0">
                                {careerModal.view !== 'OVERVIEW' && (
                                    <button onClick={() => setCareerModal({ ...careerModal, view: careerModal.view === 'ISSUE_DETAIL' ? 'ISSUE_LIST' : 'OVERVIEW' })} className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <img src={getCorsSafeUrl(careerModal.profile.profilePic) || getAvatar(careerModal.profile.name)} alt="pfp" crossOrigin="anonymous" className="w-12 h-12 rounded-full bg-muted border border-border/50 object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-foreground truncate">{careerModal.profile.name}</h3>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold mt-0.5 truncate">
                                        {['official', 'ngo'].includes(careerModal.profile.role) ? 'Official Authority Profile' : 'Citizen Civic Profile'}
                                    </p>
                                </div>
                                <button onClick={() => setCareerModal({ ...careerModal, isOpen: false })} className="p-2 bg-card border border-border/50 rounded-full hover:bg-muted"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto thin-scrollbar relative bg-background/30">
                                {careerModal.view === 'OVERVIEW' && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 md:p-6 space-y-6">
                                        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2">
                                                <Shield size={14} /> {['official', 'ngo'].includes(careerModal.profile.role) ? 'Verified Official Identity' : 'Public Profile'}
                                            </h4>
                                            {['official', 'ngo'].includes(careerModal.profile.role) && careerModal.profile.authorityProfile ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Designation</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.designation || 'N/A'}</p></div>
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Department/Org</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.departmentName || 'N/A'}</p></div>
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned District</p><p className="font-bold text-sm text-foreground">{careerModal.profile.authorityProfile.assignedDistrict || 'N/A'}</p></div>
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p><p className="font-bold text-xs text-green-500 bg-green-500/10 w-max px-2 py-0.5 rounded uppercase">{careerModal.profile.authorityProfile.verificationStatus || 'VERIFIED'}</p></div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Rank</p><p className="font-bold text-sm text-foreground">{careerModal.profile.rank || 'Citizen'}</p></div>
                                                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Badges</p><p className="font-bold text-sm text-amber-500">{careerModal.profile.badges?.length || 0} Earned</p></div>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-1 border-l-2 border-primary">Platform History</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                            {['official', 'ngo'].includes(careerModal.profile.role) ? (
                                                <>
                                                    {/* 🟢 FIXED: Checking the length of the actual history arrays first to guarantee perfect sync */}
                                                    <MetricBox
                                                        icon={<Clock className="text-indigo-500" />}
                                                        title="Jobs Active"
                                                        count={careerModal.history?.ASSIGNED?.length ?? careerModal.profile.authorityProfile?.activeJobsCount ?? 0}
                                                        color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10"
                                                        onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Active Jobs', issueList: careerModal.history?.ASSIGNED || [] })}
                                                    />
                                                    <MetricBox
                                                        icon={<CheckSquare className="text-emerald-500" />}
                                                        title="Jobs Completed"
                                                        count={careerModal.history?.COMPLETED?.length ?? careerModal.profile.authorityProfile?.jobsCompleted ?? 0}
                                                        color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                                                        onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Completed Jobs', issueList: careerModal.history?.COMPLETED || [] })}
                                                    />
                                                    <MetricBox
                                                        icon={<Briefcase className="text-amber-500" />}
                                                        title="Jobs Released"
                                                        count={careerModal.history?.RELEASED?.length ?? careerModal.profile.authorityProfile?.jobsReleased ?? 0}
                                                        color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                                                        onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Released Jobs', issueList: careerModal.history?.RELEASED || [] })}
                                                    />
                                                    <MetricBox
                                                        icon={<AlertTriangle className="text-rose-500" />}
                                                        title="Jobs Failed"
                                                        count={careerModal.history?.FAILED?.length ?? careerModal.profile.authorityProfile?.jobsFailed ?? 0}
                                                        color="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                                                        onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Failed Jobs', issueList: careerModal.history?.FAILED || [] })}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <MetricBox icon={<AlertTriangle className="text-amber-500" />} title="Issues Reported" count={careerModal.profile.issuesReported || 0} color="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Reported Issues', issueList: careerModal.history?.REPORTED || [] })} />
                                                    <MetricBox icon={<CheckSquare className="text-emerald-500" />} title="Issues Resolved" count={careerModal.profile.issuesResolved || 0} color="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Resolved Issues', issueList: careerModal.history?.CONFIRMED || [] })} />
                                                    <MetricBox icon={<Shield className="text-indigo-500" />} title="Flags Cast" count={careerModal.profile.issuesFlagged || 0} color="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_LIST', selectedCategory: 'Flagged Verifications', issueList: careerModal.history?.FLAGGED || [] })} />
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {careerModal.view === 'ISSUE_LIST' && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 md:p-6 space-y-3 h-full">
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-sm font-bold text-muted-foreground mb-4">
                                            Showing <span className="text-primary">{careerModal.selectedCategory}</span> for {careerModal.profile.name}
                                        </div>
                                        {careerModal.issueList.length === 0 ? (
                                            <div className="text-center p-8 bg-card/50 border border-border/50 rounded-2xl text-muted-foreground font-medium">No records found for this category.</div>
                                        ) : (
                                            careerModal.issueList.map((issue) => (
                                                <div key={issue._id} onClick={() => setCareerModal({ ...careerModal, view: 'ISSUE_DETAIL', selectedIssue: issue })} className="bg-card border border-border/50 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-lg group-hover:bg-background transition-colors"><Search size={16} className="text-muted-foreground" /></div>
                                                        <div>
                                                            <h5 className="font-bold text-foreground group-hover:text-primary transition-colors max-w-sm truncate">{issue.title}</h5>
                                                            <p className="text-[11px] text-muted-foreground mt-1 font-medium"><MapPin size={10} className="inline mr-1" /> {issue.location?.city || 'Unknown District'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] uppercase font-bold tracking-widest bg-muted px-2 py-1 rounded border border-border/50 hidden sm:inline">View Details</span>
                                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}

                                {careerModal.view === 'ISSUE_DETAIL' && careerModal.selectedIssue && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col lg:flex-row h-full min-h-0">
                                        <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-border/50 overflow-y-auto thin-scrollbar">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Detail View</span>
                                            </div>
                                            <h3 className="text-2xl font-black mb-4 text-foreground">{careerModal.selectedIssue.title}</h3>

                                            <div className="bg-card border border-border/50 p-5 rounded-2xl shadow-sm mb-4">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Location</p>
                                                <p className="text-sm font-bold text-foreground/90">{careerModal.selectedIssue.location?.city || 'Unknown'}, {careerModal.selectedIssue.location?.state}</p>

                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-2">Category</p>
                                                <p className="text-sm font-bold text-foreground/90">{careerModal.selectedIssue.category}</p>

                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-2">Current Status</p>
                                                <p className="text-xs font-black px-2.5 py-1 w-max bg-muted border border-border/50 rounded-lg text-foreground/90 uppercase tracking-widest">{careerModal.selectedIssue.status}</p>
                                            </div>
                                        </div>
                                        <div className="w-full lg:w-1/2 p-6 overflow-y-auto thin-scrollbar bg-background/50">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 pl-2 border-l-2 border-primary">System Notice</h4>
                                            <div className="bg-card border border-border/50 p-4 rounded-xl shadow-sm">
                                                <p className="text-[11px] font-black uppercase tracking-wider text-foreground mb-2">Access Limited</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    You are currently viewing a brief summary from the user's history profile. To view the full system audit log, media carousel, and administrative controls for this issue, please locate it within the main Command Center dashboard.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MetricBox = ({ icon, title, count, color, onClick }) => (
    <button onClick={onClick} className={`p-4 border rounded-2xl flex flex-col items-start gap-3 transition-all hover:-translate-y-1 shadow-sm ${color}`}>
        <div className="p-2 bg-background/80 rounded-xl shadow-inner backdrop-blur-sm border border-border/50">{icon}</div>
        <div className="text-left w-full">
            <h4 className="text-2xl font-black text-foreground">{count}</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 truncate">{title}</p>
        </div>
    </button>
);

export default LeaderBoard;