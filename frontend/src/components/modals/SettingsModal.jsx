/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight, Globe, Info } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";
import { useTranslation } from "react-i18next";
import { setUser } from "../../reducer/authReducer";
import CustomSelect from "../CustomSelect";

// 🟢 IMPORT OTA PLUGINS & GLOBAL TOAST
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { toast } from "react-hot-toast";

const SettingsModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  const preferences = user?.preferences || {};

  const [settings, setSettings] = useState({
    emailNotifications: preferences.globalNotifications !== undefined ? preferences.globalNotifications : true,
    anonymousReports: preferences.globalAnonymous !== undefined ? preferences.globalAnonymous : false,
    language: preferences.language || "en",
  });

  // 🟢 OTA Version States (Now storing the full update object to get the URL)
  const [updateData, setUpdateData] = useState(null);
  const localVersion = localStorage.getItem('OTA_APP_VERSION') || "1.0.0";

  const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी (Hindi)' },
    { value: 'awa', label: 'अवधी (Awadhi)' },
    { value: 'bho', label: 'भोजपुरी (Bhojpuri)' },
    { value: 'mr', label: 'मराठी (Marathi)' },
    { value: 'raj', label: 'राजस्थानी (Rajasthani)' },
    { value: 'har', label: 'हरियाणवी (Haryanvi)' },
    { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { value: 'te', label: 'తెలుగు (Telugu)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'bn', label: 'বাংলা (Bengali)' }
  ];

  // Fetch Settings Data
  useEffect(() => {
    if (user?.preferences) {
      setSettings({
        emailNotifications: user.preferences.globalNotifications !== undefined ? user.preferences.globalNotifications : true,
        anonymousReports: user.preferences.globalAnonymous !== undefined ? user.preferences.globalAnonymous : false,
        language: user.preferences.language || "en",
      });
    }
  }, [user]);

  // Fetch Full OTA Update Data when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchOtaVersion = async () => {
        try {
          const response = await axiosInstance.get('/check-update');
          if (response.data && response.data.available) {
            setUpdateData(response.data); // Save the whole object so we have the URL
          }
        } catch (error) {
          console.error("Failed to fetch OTA version from DB:", error);
        }
      };
      fetchOtaVersion();
    }
  }, [isOpen]);

  const handleToggle = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        globalNotification: settings.emailNotifications,
        isAnonymous: settings.anonymousReports,
        language: settings.language
      };

      const response = await axiosInstance.patch('/me/profile', payload);

      dispatch(setUser(response.data.data));
      i18n.changeLanguage(settings.language);

      showToast({
        icon: 'success',
        title: t('settings_saved'),
        subtitle: t('preferences_updated')
      });

      onClose();

    } catch (error) {
      console.error("Error saving settings:", error);
      showToast({
        icon: 'error',
        title: t('failed_save'),
        subtitle: error.response?.data?.message || t('please_try_again')
      });
    }
  };

  // 🟢 NEW: Manual Trigger Execution
  const handleManualUpdate = async () => {
    if (!updateData || !updateData.url) return;

    if (!Capacitor.isNativePlatform()) {
      toast.error("Updates are only available on the mobile app.");
      return;
    }

    const toastId = toast.loading("Downloading update...");
    try {
      const downloadedUpdate = await CapacitorUpdater.download({
        version: updateData.version,
        url: updateData.url
      });

      // Update local storage so we don't redownload
      localStorage.setItem('OTA_APP_VERSION', updateData.version);

      toast.success("Restarting the app...", { id: toastId });

      // Reload native webview
      setTimeout(async () => {
        await CapacitorUpdater.set(downloadedUpdate);
      }, 1500);

    } catch (error) {
      toast.error("Update failed. Please retry later.", { id: toastId });
      console.error("Manual OTA update failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in">
      <div className="glass-card bg-card border border-border/50 rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] overflow-hidden">

        <div className="p-5 sm:p-6 overflow-y-auto thin-scrollbar w-full flex flex-col h-full">

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('settings')}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-muted transition-all duration-200 hover:scale-105 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            <div className="text-center">
              <Settings className="mx-auto w-14 h-14 text-primary" />
              <h3 className="text-xl font-bold mt-4 text-foreground">{t('general_settings')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('manage_preferences')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors gap-4 sm:gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{t('language')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('choose_language')}</p>
                </div>
              </div>
              <CustomSelect
                options={LANGUAGE_OPTIONS}
                value={settings.language}
                onChange={(newValue) => setSettings(prev => ({ ...prev, language: newValue }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{t('email_notifications')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('receive_updates')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${settings.emailNotifications ? 'bg-primary' : 'bg-muted border border-border'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{t('global_anonymous')}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('hide_identity')}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('anonymousReports')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${settings.anonymousReports ? 'bg-primary' : 'bg-muted border border-border'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${settings.anonymousReports ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-border/50">
              <button
                onClick={handleSubmit}
                className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('save_settings')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 🟢 BEAUTIFUL OTA VERSION FOOTER */}
          <div className="mt-8 pt-4 flex flex-col items-center justify-center space-y-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-medium tracking-wide">
              <Info className="w-3.5 h-3.5" />
              LocalAwaaz Build Architecture
            </div>

            <div className="flex items-center gap-3 text-xs">
              {/* Local Version Tag */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/50 text-slate-300 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400/80"></span>
                v{localVersion}
              </div>

              {/* Server Database Tag logic - Now conditionally renders a clickable button */}
              {updateData && (
                <>
                  <span className="text-border">→</span>

                  {updateData.version === localVersion ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-sm border bg-teal-500/10 border-teal-500/20 text-teal-400">
                      Up to Date
                    </div>
                  ) : (
                    <button
                      onClick={handleManualUpdate}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md shadow-lg border bg-primary/20 border-primary/40 text-primary font-semibold hover:bg-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 animate-pulse cursor-pointer"
                      title="Click to install latest update"
                    >
                      Update to v{updateData.version}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;