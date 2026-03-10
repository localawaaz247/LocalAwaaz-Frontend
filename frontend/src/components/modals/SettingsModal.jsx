/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight } from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";

const SettingsModal = ({ isOpen, onClose }) => {
  const user = useSelector((state) => state.auth?.user);
  const globalNotifications = user?.preferences?.globalNotifications;

  const [settings, setSettings] = useState({
    emailNotifications: globalNotifications !== undefined ? globalNotifications : true,
    appNotifications: user?.preferences?.globalOption !== undefined ? user.preferences.globalOption : true,
    anonymousReports: false,
  });

  useEffect(() => {
    if (globalNotifications !== undefined) {
      setSettings(prev => ({
        ...prev,
        emailNotifications: globalNotifications
      }));
    }
  }, [globalNotifications]);

  useEffect(() => {
    if (user?.preferences?.globalOption !== undefined) {
      setSettings(prev => ({
        ...prev,
        appNotifications: user.preferences.globalOption
      }));
    }
  }, [user?.preferences?.globalOption]);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.patch('/me/profile', {
        globalNotifications: settings.emailNotifications,
        isAnonymous: settings.anonymousReports
      });
      
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-muted/50 transition-all duration-200 hover:scale-105"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* General Settings Header */}
          <div className="text-center">
            <Settings className="mx-auto w-14 h-14 text-primary" />
            <h3 className="text-xl font-bold mt-4">General Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage your preferences
            </p>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                settings.emailNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Anonymous Reports */}
          <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Report Issues Anonymously</h4>
                <p className="text-sm text-muted-foreground">Hide identity when reporting</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('anonymousReports')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                settings.anonymousReports ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  settings.anonymousReports ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
          >
            Save Settings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
