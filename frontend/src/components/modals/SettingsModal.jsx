/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight, Globe } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";
import { useTranslation } from "react-i18next";
import { setUser } from "../../reducer/authReducer";

// 1. IMPORT YOUR NEW COMPONENT (Adjust path if your folders are structured differently)
import CustomSelect from "../CustomSelect";

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

  // 2. DEFINE THE LANGUAGE OPTIONS ARRAY
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

  useEffect(() => {
    if (user?.preferences) {
      setSettings({
        emailNotifications: user.preferences.globalNotifications !== undefined ? user.preferences.globalNotifications : true,
        anonymousReports: user.preferences.globalAnonymous !== undefined ? user.preferences.globalAnonymous : false,
        language: user.preferences.language || "en",
      });
    }
  }, [user]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in">
      <div className="glass-card bg-card border border-border/50 rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] overflow-hidden">

        <div className="p-5 sm:p-6 overflow-y-auto thin-scrollbar w-full">

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

          <div className="space-y-6">
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

              {/* 3. REPLACED NATIVE SELECT WITH CUSTOM SELECT */}
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
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;