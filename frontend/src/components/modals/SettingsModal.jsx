import React, { useState } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight } from "lucide-react";

const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    anonymousReports: false,
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = () => {
    console.log("Saving settings:", settings);
    // TODO: Save settings to backend
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

          {/* App Notifications */}
          <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">App Notifications</h4>
                <p className="text-sm text-muted-foreground">In-app alerts and updates</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('appNotifications')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                settings.appNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  settings.appNotifications ? 'translate-x-7' : 'translate-x-1'
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
