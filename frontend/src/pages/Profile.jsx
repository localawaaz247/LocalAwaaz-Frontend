import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfileDetails } from "../reducer/profileReducer";
import EditProfileModal from "../components/modals/EditProfileModal";
import SettingsModal from "../components/modals/SettingsModal";
import IssueDetail from "../components/IssueDetail";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from 'framer-motion';
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import {
  MapPin, Calendar, Settings, Edit3, ShieldCheck,
  FileText, CheckCircle, Bookmark, TrendingUp, BadgeCheck, Trophy, Camera, X, Loader2, ChevronRight, History
} from "lucide-react";

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);

  // Base Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Interactive Stat Modals State
  const [listModalConfig, setListModalConfig] = useState({ isOpen: false, title: "", data: [], icon: null, color: "", loading: false });
  const [isScoreTimelineOpen, setIsScoreTimelineOpen] = useState(false);

  // Issue Detail State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!profileData) {
      dispatch(getProfileDetails());
    }
  }, [dispatch, profileData]);

  // Handle Direct Avatar Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:1111';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${backendUrl}/upload-avatar`, {
        method: 'POST',
        body: uploadData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('image_upload_failed'));
      }

      const data = await response.json();
      const newImageUrl = data.publicUrl || data.url || data.profilePic;

      await axiosInstance.patch('/me/profile', { profilePic: newImageUrl });
      toast.success(data.message || t('image_uploaded_success'));
      dispatch(getProfileDetails());

    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(error.message || t('image_upload_failed'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchAndOpenList = async (type, title, IconComponent, colorClass) => {
    setListModalConfig({
      isOpen: true,
      title,
      data: [],
      loading: true,
      icon: <IconComponent className={`w-6 h-6 ${colorClass}`} />,
      color: colorClass
    });

    try {
      let res;
      if (type === 'reported') {
        res = await axiosInstance.get('/me/issues?limit=50');
        setListModalConfig(prev => ({ ...prev, data: res.data.data, loading: false }));
      } else if (type === 'resolved') {
        res = await axiosInstance.get('/me/issues?status=RESOLVED&limit=50');
        setListModalConfig(prev => ({ ...prev, data: res.data.data, loading: false }));
      } else if (type === 'confirmed') {
        res = await axiosInstance.get('/me/issues/confirmed?limit=50');
        setListModalConfig(prev => ({ ...prev, data: res.data.data, loading: false }));
      } else if (type === 'saved') {
        res = await axiosInstance.get('/saved-issues');
        setListModalConfig(prev => ({ ...prev, data: res.data.savedIssues || [], loading: false }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} issues:`, error);
      toast.error(t('failed_to_load_issues', 'Failed to load issues.'));
      setListModalConfig(prev => ({ ...prev, loading: false }));
    }
  };

  const openIssueDetail = (issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  return (
    <div className="w-full bg-texture min-h-[100dvh] pb-20 md:pb-8 relative">
      <AnimatePresence mode="wait">
        {!profileData ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen space-y-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">{t('loading_profile')}</p>
          </motion.div>
        ) : (
          <motion.div
            key="profile-content"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Hidden File Input for Avatar */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

            {/* Cover Banner */}
            <div className="h-40 md:h-56 w-full bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 rounded-b-3xl md:rounded-none relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Main Profile Container */}
            <div className="max-w-5xl mx-auto -mt-16 md:-mt-24 px-4 sm:px-6 relative z-10">
              <div className="glass-card rounded-3xl p-5 md:p-8 shadow-2xl border border-border/50 mb-10">

                {/* Header Section: Avatar & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div className="flex items-end gap-4 md:gap-5">
                    {/* Clickable Avatar Container */}
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative z-20 group cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                          <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
                          <span className="text-[10px] text-white font-bold tracking-widest uppercase">Uploading</span>
                        </div>
                      ) : null}

                      {profileData?.profilePic ? (
                        <img
                          src={profileData.profilePic}
                          alt={`${profileData.name}'s profile`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-primary font-black text-4xl md:text-5xl">
                          {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 backdrop-blur-sm">
                        <Camera className="text-white w-6 h-6 md:w-8 md:h-8" />
                        <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-wider">{t('change')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full sm:w-auto pt-2 sm:pt-0 shrink-0">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="btn-gradient flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/20"
                    >
                      <Edit3 size={16} />
                      {t('edit_profile')}
                    </button>
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="w-10 h-10 md:w-11 md:h-11 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
                    >
                      <Settings size={20} />
                    </button>
                  </div>
                </div>

                {/* User Info & Badges */}
                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                      {profileData?.name || t('loading')}
                    </h1>

                    {profileData?.isEmailVerified && (
                      <BadgeCheck className="text-blue-500 w-6 h-6 shrink-0" />
                    )}

                    <div className="flex items-center gap-2 ml-1">
                      {profileData?.rank && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-lg font-bold shadow-sm uppercase tracking-wide">
                          <Trophy size={12} /> {profileData.rank}
                        </span>
                      )}
                      {profileData?.badges?.map((badge, index) => (
                        <span
                          key={badge._id || index}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-card text-foreground border border-border shadow-sm rounded-lg cursor-help transition-all hover:border-primary/50"
                          title={badge.description || t('earned_badge')}
                        >
                          {badge.icon || '⭐'} <span className="font-medium whitespace-nowrap">{badge.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-muted-foreground font-medium text-sm md:text-base mb-4">
                    @{profileData?.userName || t('username')}
                  </p>

                  {/* ONLY SHOW BIO IF IT EXISTS */}
                  {profileData?.bio && (
                    <p className="text-foreground/80 text-sm md:text-base max-w-2xl leading-relaxed mb-5 bg-muted/30 p-4 rounded-xl border border-border/30">
                      {profileData.bio}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-primary" />
                      <span>{profileData?.contact?.city || t('unknown')}, {profileData?.contact?.state || t('unknown')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-primary" />
                      <span>{t('joined')} {new Date(profileData?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4">
                  <div
                    onClick={() => fetchAndOpenList('reported', t('issues_reported'), FileText, "text-blue-500")}
                    className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:border-blue-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{profileData?.issuesReported || 0}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{t('issues_reported')}</p>
                  </div>

                  <div
                    onClick={() => fetchAndOpenList('resolved', t('issues_resolved'), CheckCircle, "text-emerald-500")}
                    className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:border-emerald-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CheckCircle size={20} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{profileData?.issuesResolved || 0}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{t('issues_resolved')}</p>
                  </div>

                  <div
                    onClick={() => fetchAndOpenList('confirmed', t('issues_confirmed'), ShieldCheck, "text-amber-500")}
                    className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:border-amber-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{profileData?.issuesConfirmed || 0}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{t('issues_confirmed')}</p>
                  </div>

                  <div
                    onClick={() => fetchAndOpenList('saved', t('saved_issues'), Bookmark, "text-purple-500")}
                    className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-muted/50 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:border-purple-500/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Bookmark size={20} />
                    </div>
                    <p className="text-2xl font-black text-foreground">
                      {Array.isArray(profileData?.savedIssues)
                        ? profileData.savedIssues.length
                        : (profileData?.savedIssuesList?.length || profileData?.savedIssues || 0)}
                    </p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{t('saved_issues')}</p>
                  </div>

                  {/* 5. Civil Score (Static for now, pointer events removed) */}
                  <div className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-muted/50 transition-all duration-300 group md:col-span-1 col-span-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{profileData?.civilScore || 0}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{t('civil_score')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Detail Modal (Sits on top at z-[60]) */}
      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedIssue(null); }}
        />
      )}

      {/* ISSUE LIST MODAL (Lowered to z-[50]) */}
      <AnimatePresence>
        {listModalConfig.isOpen && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setListModalConfig({ ...listModalConfig, isOpen: false })} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border/50 rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-background border border-border shadow-sm`}>
                    {listModalConfig.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{listModalConfig.title}</h3>
                </div>
                <button onClick={() => setListModalConfig({ ...listModalConfig, isOpen: false })} className="p-2 bg-muted rounded-full hover:bg-white/10 transition-colors text-muted-foreground"><X size={18} /></button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto thin-scrollbar flex-1 bg-background/50">
                {listModalConfig.loading ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-70">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="font-bold text-muted-foreground">{t('loading')}...</p>
                  </div>
                ) : listModalConfig.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-50">
                    {listModalConfig.icon}
                    <p className="mt-4 font-bold text-muted-foreground">{t('no_issues_found', 'No issues found in this category.')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listModalConfig.data.map((issue) => (
                      <div
                        key={issue._id}
                        onClick={() => openIssueDetail(issue)}
                        className="bg-card border border-border/50 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group shadow-sm"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-sm md:text-base">{issue.title || "Untitled Issue"}</h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {issue.location?.city || 'Unknown'}</span>
                            <span className="px-2 py-0.5 rounded bg-muted uppercase tracking-wider text-[10px]">{issue.status}</span>
                          </div>
                        </div>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" size={20} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CIVIL SCORE TIMELINE MODAL (Lowered to z-[50]) */}
      <AnimatePresence>
        {isScoreTimelineOpen && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsScoreTimelineOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border/50 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm text-primary">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Civil Score History</h3>
                    <p className="text-xs text-primary font-bold tracking-widest uppercase mt-0.5">Current: {profileData?.civilScore || 0}</p>
                  </div>
                </div>
                <button onClick={() => setIsScoreTimelineOpen(false)} className="p-2 bg-muted rounded-full hover:bg-white/10 transition-colors text-muted-foreground"><X size={18} /></button>
              </div>

              <div className="p-6 overflow-y-auto thin-scrollbar flex-1 bg-background/50 relative">
                {(!profileData?.scoreHistory || profileData.scoreHistory.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-50 text-center">
                    <History size={40} className="mb-4 text-muted-foreground" />
                    <p className="font-bold text-muted-foreground">No score history available yet.</p>
                    <p className="text-xs mt-2 max-w-xs">Participate in the community by reporting or confirming issues to earn your first points!</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-border/50 before:to-transparent">
                    {profileData.scoreHistory.map((record, i) => {
                      const isPositive = record.amount > 0;
                      return (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i} className="relative flex items-start gap-4 group">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-md z-10 transition-transform group-hover:scale-110 ${isPositive ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                            {isPositive ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />}
                          </div>
                          <div className="w-full p-4 rounded-2xl bg-card border border-border/50 shadow-sm mt-1 group-hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-bold text-sm text-foreground">{record.reason || "Community Contribution"}</h5>
                              <span className={`font-black text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{record.amount}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              {new Date(record.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;