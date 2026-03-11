/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight } from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";

const SettingsModal = ({ isOpen, onClose }) => {
  const user = useSelector((state) => state.auth?.user);
  
  const preferences = user?.preferences || {};

  const [settings, setSettings] = useState({
    emailNotifications: preferences.globalNotifications !== undefined ? preferences.globalNotifications : true,
    anonymousReports: preferences.globalAnonymous !== undefined ? preferences.globalAnonymous : false,
  });

  useEffect(() => {
    if (user?.preferences) {
      setSettings({
        emailNotifications: user.preferences.globalNotifications !== undefined ? user.preferences.globalNotifications : true,
        anonymousReports: user.preferences.globalAnonymous !== undefined ? user.preferences.globalAnonymous : false,
      });
    }
  }, [user]);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        globalNotification: settings.emailNotifications, 
        isAnonymous: settings.anonymousReports
      };

      const response = await axiosInstance.patch('/me/profile', payload);
      
      console.log("Settings saved:", response.data);
      showToast({ 
        icon: 'success', 
        title: 'Settings saved successfully!',
        subtitle: 'Your preferences have been updated'
      });
      onClose();
      
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast({ 
        icon: 'error', 
        title: 'Failed to save settings',
        subtitle: error.response?.data?.message || 'Please try again'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card bg-card border border-border/50 rounded-2xl p-6 w-full max-w-xl shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-muted transition-all duration-200 hover:scale-105 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <Settings className="mx-auto w-14 h-14 text-primary" />
            <h3 className="text-xl font-bold mt-4 text-foreground">General Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage your global app preferences
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">Email Notifications</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive important updates via email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                settings.emailNotifications ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">Global Anonymous Mode</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Hide identity by default on all reports</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('anonymousReports')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                settings.anonymousReports ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                  settings.anonymousReports ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-border/50">
            <button
              onClick={handleSubmit}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Save Settings <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;