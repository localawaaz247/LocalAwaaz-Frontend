/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { Settings, Bell, Mail, Shield, ArrowRight, Globe } from "lucide-react";
import { useSelector, useDispatch } from "react-redux"; // <-- 1. Added useDispatch
import axiosInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";
import { useTranslation } from "react-i18next";
import { setUser } from "../../reducer/authReducer";

const SettingsModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch(); // <-- 3. Initialize dispatch
  const user = useSelector((state) => state.auth?.user);

  const preferences = user?.preferences || {};

  const [settings, setSettings] = useState({
    emailNotifications: preferences.globalNotifications !== undefined ? preferences.globalNotifications : true,
    anonymousReports: preferences.globalAnonymous !== undefined ? preferences.globalAnonymous : false,
    language: preferences.language || "en",
  });

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

      // 1. Send update to the database
      const response = await axiosInstance.patch('/me/profile', payload);

      // 2. PERMANENT REDUX FIX: 
      // Update Redux immediately with the fresh data from the backend. 
      // (Your backend returns the updated user inside response.data.data)
      dispatch(setUser(response.data.data));

      // 3. Change the language visually on the screen instantly
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card bg-card border border-border/50 rounded-2xl p-6 w-full max-w-xl shadow-2xl animate-fade-in-up">
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

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">{t('language')}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('choose_language')}</p>
              </div>
            </div>

            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              className="bg-background border border-border/50 hover:border-border rounded-xl pl-4 pr-10 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-sm transition-all duration-200 cursor-pointer appearance-none relative"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1em'
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="awa">अवधी (Awadhi)</option>
              <option value="bho">भोजपुरी (Bhojpuri)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="raj">राजस्थानी (Rajasthani)</option>
              <option value="har">हरियाणवी (Haryanvi)</option>
              <option value="gu">ગુજરાती (Gujarati)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="kn">ಕన్నడ (Kannada)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
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
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
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
  );
};

export default SettingsModal;