import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import Loader from "../components/Loader"

const Profile = () => {
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const getUserInfo = async () => {
      try {
        const res = await axiosInstance.get(`/me/profile`);
        if (isMounted) {
          setProfileData(res.data.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    getUserInfo();

    return () => {
      isMounted = false;
    };
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
              <button className="btn-gradient px-4 py-2 rounded-xl text-sm">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-card border border-border rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors">
                Share Profile
              </button>
              <button className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
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
            <button className="pb-3 border-b-2 border-primary text-primary font-semibold">
              Posts / Reports
            </button>
            <button className="pb-3 text-muted-foreground hover:text-foreground transition-colors">
              Comments
            </button>
            <button className="pb-3 text-muted-foreground hover:text-foreground transition-colors">
              Saved Issues
            </button>
          </div>

          {/* Recent Reports */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Recent Reports
            </h3>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-lg p-4 flex justify-between items-start hover:shadow-lg transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">
                        Broken Street Light on MG Road
                      </h4>
                      <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-lg">
                        Open
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
                      The street light near the bus stop has been non-functional for
                      over a week, causing safety concerns for pedestrians at night.
                    </p>

                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>⏱ 2 days ago</span>
                      <span>💬 12 comments</span>
                      <span>👍 24 upvotes</span>
                    </div>
                  </div>

                  {/* Decorative Placeholder */}
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
