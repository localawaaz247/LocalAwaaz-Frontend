import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfileDetails } from "../reducer/profileReducer";
import Loader from "../components/Loader";
import EditProfileModal from "../components/modals/EditProfileModal";
import SettingsModal from "../components/modals/SettingsModal";
import IssuesPosted from "../components/IssuesPosted";
import ConfirmedIssues from "../components/ConfirmedIssues";
import Comments from "../components/Comments";
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
    <div className="w-full bg-texture min-h-screen">
      {!profileData ? (
        <div className="flex items-center justify-center min-h-screen"> 
            <p className="text-muted-foreground">Loading profile...</p>
          
        </div>
      ) : (
        <>
          {/* Cover */}
          <div className="h-48 w-full bg-gradient-to-r from-slate-900 to-cyan-800 rounded-lg" />

          {/* Profile Card */}
          <div className="max-w-6xl mx-auto -mt-16 px-6">
            <div className="glass-card rounded-xl p-6">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-start">
              {/* Initials Badge */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-primary font-semibold text-lg">
                  {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {profileData?.name || 'Loading...'}
                  </h2>
                  {profileData?.isEmailVerified && (
                    <span className="text-accent text-sm">✔</span>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">@{profileData?.userName || 'username'}</p>

                <p className="mt-2 text-muted-foreground text-sm max-w-md leading-relaxed">
                  {profileData?.bio || 'No bio available'}
                </p>

                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span>📍 {profileData?.contact?.city}, {profileData?.contact?.state}</span>
                  <span>📅 Joined {new Date(profileData?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-sm"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: "Issues Reported", value: profileData?.issuesReported || 0 },
              { label: "Issues Resolved", value: profileData?.issuesResolved || 0 },
              { label: "Issues Confirmed", value: profileData?.issuesConfirmed || 0 },
              { label: "Civil Score", value: profileData?.civilScore || 0 },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card rounded-lg p-4 text-center hover:shadow-lg transition-all"
              >
                <p className="text-2xl font-bold text-primary">
                  {item.value}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Contribution Badges
            </h3>
            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg">
                ⭐ Top Reporter
              </span>
              <span className="px-3 py-1 text-sm bg-secondary/20 text-secondary border border-secondary/30 rounded-lg">
                ✔ Active Citizen
              </span>
              <span className="px-3 py-1 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg">
                💙 Community Helper
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-border flex gap-6 text-sm">
            <button 
              onClick={() => setActiveTab('posted')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'posted' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Issues Posted
            </button>
            <button 
              onClick={() => setActiveTab('confirmed')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'confirmed' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Issues Confirmed
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'comments' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Comments
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'saved' 
                  ? 'border-primary text-primary font-semibold' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Issues
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posted' && <IssuesPosted />}
            {activeTab === 'confirmed' && <ConfirmedIssues />}
            {activeTab === 'comments' && <Comments />}
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
