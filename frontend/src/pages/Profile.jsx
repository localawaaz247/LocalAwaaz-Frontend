import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfileDetails } from "../reducer/profileReducer";
import Loader from "../components/Loader";
import EditProfileModal from "../components/modals/EditProfileModal";
import SettingsModal from "../components/modals/SettingsModal";
import IssuesPosted from "../components/IssuesPosted";
import ConfirmedIssues from "../components/ConfirmedIssues";
import SavedIssues from "../components/SavedIssues";

const Profile = () => {
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('posted');

  useEffect(() => {
    if (!profileData) {
      dispatch(getProfileDetails());
    }
  }, []);

  return (
    <div className="w-full bg-texture min-h-[100dvh] pb-20 md:pb-8">
      {!profileData ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Cover */}
          <div className="h-32 md:h-48 w-full bg-gradient-to-r from-slate-900 to-cyan-800 rounded-b-lg md:rounded-none" />

          {/* Profile Card */}
          <div className="max-w-6xl mx-auto -mt-12 md:-mt-16 px-3 md:px-6 relative z-10">
            <div className="glass-card rounded-xl p-4 md:p-6">

              {/* Top Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                <div className="flex gap-3 md:gap-4 items-start w-full">

                  {/* Profile Picture or Initials Badge */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0 overflow-hidden">
                    {profileData?.profilePic ? (
                      <img
                        src={profileData.profilePic}
                        alt={`${profileData.name}'s profile`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-primary font-semibold text-base md:text-lg">
                        {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg md:text-xl font-bold text-foreground line-clamp-1">
                        {profileData?.name || 'Loading...'}
                      </h2>
                      {profileData?.isEmailVerified && (
                        <span className="text-accent text-xs md:text-sm">✔</span>
                      )}
                    </div>

                    <p className="text-muted-foreground text-xs md:text-sm">@{profileData?.userName || 'username'}</p>

                    <p className="mt-1.5 md:mt-2 text-muted-foreground text-xs md:text-sm max-w-md leading-relaxed line-clamp-3 md:line-clamp-none">
                      {profileData?.bio || 'No bio available'}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 md:mt-3 text-[11px] md:text-sm text-muted-foreground">
                      <span>📍 {profileData?.contact?.city || 'Unknown'}, {profileData?.contact?.state || 'Unknown'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>📅 Joined {new Date(profileData?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-gradient flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-9 h-9 md:w-10 md:h-10 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
                {[
                  { label: "Issues Reported", value: profileData?.issuesReported || 0 },
                  { label: "Issues Resolved", value: profileData?.issuesResolved || 0 },
                  { label: "Issues Confirmed", value: profileData?.issuesConfirmed || 0 },
                  { label: "Civil Score", value: profileData?.civilScore || 0 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-lg p-3 md:p-4 text-center hover:shadow-lg transition-all"
                  >
                    <p className="text-xl md:text-2xl font-bold text-primary">
                      {item.value}
                    </p>
                    <p className="text-[11px] md:text-sm text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div className="mt-6 md:mt-8">
                <h3 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">
                  Contribution Badges
                </h3>
                <div className="flex gap-2 md:gap-3 flex-wrap">
                  <span className="px-2.5 py-1 md:px-3 md:py-1 text-[11px] md:text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg">
                    ⭐ Top Reporter
                  </span>
                  <span className="px-2.5 py-1 md:px-3 md:py-1 text-[11px] md:text-sm bg-secondary/20 text-secondary border border-secondary/30 rounded-lg">
                    ✔ Active Citizen
                  </span>
                  <span className="px-2.5 py-1 md:px-3 md:py-1 text-[11px] md:text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg">
                    💙 Community Helper
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 md:mt-8 border-b border-border flex gap-4 md:gap-6 text-xs md:text-sm overflow-x-auto no-scrollbar whitespace-nowrap">
                <button
                  onClick={() => setActiveTab('posted')}
                  className={`pb-2.5 md:pb-3 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'posted'
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Issues Posted
                </button>
                <button
                  onClick={() => setActiveTab('confirmed')}
                  className={`pb-2.5 md:pb-3 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'confirmed'
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Issues Confirmed
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`pb-2.5 md:pb-3 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'saved'
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Saved Issues
                </button>
              </div>

              {/* Tab Content */}
              <div className="mt-4 md:mt-6">
                {activeTab === 'posted' && <IssuesPosted />}
                {activeTab === 'confirmed' && <ConfirmedIssues />}
                {activeTab === 'saved' && <SavedIssues />}
              </div>
            </div>
          </div>
        </>
      )}

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Profile;