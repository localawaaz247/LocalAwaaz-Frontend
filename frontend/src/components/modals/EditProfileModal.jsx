import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../reducer/profileReducer";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, FileText, Lock, ArrowLeft, AtSign, ChevronRight,
  CheckCircle2, XCircle, Loader2, Camera
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);

  // View State
  const [activeField, setActiveField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldValue, setFieldValue] = useState("");

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveField(null);
      setFieldValue("");
      setIsUsernameAvailable(null);
    }
  }, [isOpen]);

  // Real-time Username Uniqueness Checker (Debounced)
  useEffect(() => {
    if (activeField !== 'userName') return;

    if (fieldValue === profileData?.userName) {
      setIsUsernameAvailable(true);
      setIsCheckingUsername(false);
      return;
    }

    if (fieldValue.length < 3) {
      setIsUsernameAvailable(false);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setIsUsernameAvailable(null);

    const timeoutId = setTimeout(async () => {
      try {
        const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:1111';
        const res = await fetch(`${backendUrl}/check-username?q=${fieldValue}`);
        const data = await res.json();
        setIsUsernameAvailable(data.available);
      } catch (error) {
        console.error("Failed to check username:", error);
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fieldValue, activeField, profileData]);

  // Image Upload Logic
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(t('image_upload_failed'));

      const data = await response.json();
      const newImageUrl = data.publicUrl || data.url || data.profilePic;

      // Instantly dispatch the profile update for the new image
      await dispatch(updateProfile({ profilePic: newImageUrl })).unwrap();
      toast.success(t('image_uploaded_success', 'Profile picture updated!'));

    } catch (error) {
      toast.error(error.message || t('image_upload_failed'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenField = (field, currentValue) => {
    setActiveField(field);
    setFieldValue(currentValue || "");
    if (field === 'userName') setIsUsernameAvailable(true);
  };

  const handleBack = () => {
    setActiveField(null);
    setFieldValue("");
  };

  const handleSave = async () => {
    if (!fieldValue && activeField !== 'password') return;

    setIsLoading(true);
    try {
      const payload = { [activeField]: fieldValue };
      const result = await dispatch(updateProfile(payload)).unwrap();
      toast.success(result?.message || t('profile_updated_success'));
      setActiveField(null);
    } catch (error) {
      toast.error(error?.message || t('profile_update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Render the Main List
  const renderMainList = () => (
    <motion.div
      key="main-list"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="text-center mb-6 flex flex-col items-center">
        {/* Clickable Profile Picture */}
        <div className="relative mb-4 group">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-lg overflow-hidden relative cursor-pointer flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
          >
            {isUploadingImage ? (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            ) : null}

            {profileData?.profilePic ? (
              <img
                src={profileData.profilePic}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Camera className="text-white w-6 h-6 drop-shadow-md" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-foreground">{t('edit_profile')}</h3>
        <p className="text-sm text-muted-foreground font-medium mt-1">{t('select_field_to_edit', 'Select a field to edit')}</p>
      </div>

      <div className="space-y-3">
        <ListOption
          icon={User}
          title={t('name')}
          value={profileData?.name || t('not_set')}
          onClick={() => handleOpenField('name', profileData?.name)}
        />
        <ListOption
          icon={AtSign}
          title={t('username')}
          value={`@${profileData?.userName || 'username'}`}
          onClick={() => handleOpenField('userName', profileData?.userName)}
        />
        <ListOption
          icon={FileText}
          title={t('bio')}
          value={profileData?.bio ? `${profileData.bio.substring(0, 30)}...` : t('add_bio', 'Add a bio')}
          onClick={() => handleOpenField('bio', profileData?.bio)}
        />
        <ListOption
          icon={Lock}
          title={t('password')}
          value="••••••••"
          onClick={() => handleOpenField('password', "")}
        />
      </div>
    </motion.div>
  );

  // Render the Specific Field Editor
  const renderFieldEditor = () => {
    let title = "";
    let inputElement = null;
    let isSaveDisabled = isLoading || !fieldValue.trim();

    switch (activeField) {
      case 'name':
        title = t('edit_name');
        isSaveDisabled = isLoading || fieldValue.length < 3;
        inputElement = (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl text-[15px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
            placeholder={t('enter_name')}
            autoFocus
          />
        );
        break;

      case 'userName':
        title = t('edit_username');
        isSaveDisabled = isLoading || !isUsernameAvailable || fieldValue.length < 3;
        inputElement = (
          <div className="space-y-2">
            <div className="relative flex items-center">
              <AtSign className="absolute left-4 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className={`w-full pl-11 pr-12 py-4 bg-muted/30 border rounded-2xl text-[15px] focus:outline-none focus:ring-4 transition-all shadow-inner ${fieldValue.length > 0
                    ? isCheckingUsername
                      ? 'border-blue-500/50 focus:ring-blue-500/10'
                      : isUsernameAvailable
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-border/50 focus:border-primary focus:ring-primary/10'
                  }`}
                placeholder={t('enter_username')}
                autoFocus
              />
              <div className="absolute right-4 flex items-center justify-center">
                {isCheckingUsername ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : fieldValue.length >= 3 && fieldValue !== profileData?.userName ? (
                  isUsernameAvailable ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}><CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-sm" /></motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}><XCircle className="w-5 h-5 text-red-500 drop-shadow-sm" /></motion.div>
                  )
                ) : null}
              </div>
            </div>
            <AnimatePresence>
              {!isCheckingUsername && fieldValue.length >= 3 && !isUsernameAvailable && fieldValue !== profileData?.userName && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="text-xs text-red-500 ml-2 font-medium">
                  {t('username_taken', 'This username is not available.')}
                </motion.p>
              )}
              {!isCheckingUsername && isUsernameAvailable && fieldValue !== profileData?.userName && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="text-xs text-green-500 ml-2 font-medium">
                  {t('username_available', 'Username is available!')}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        );
        break;

      case 'bio':
        title = t('edit_bio');
        inputElement = (
          <div className="relative">
            <textarea
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              rows={5}
              maxLength={150}
              className="w-full p-5 bg-muted/30 border border-border/50 rounded-2xl text-[15px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
              placeholder={t('bio_placeholder')}
              autoFocus
            />
            <span className={`absolute bottom-4 right-4 text-xs font-medium ${fieldValue.length >= 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {fieldValue.length}/150
            </span>
          </div>
        );
        break;

      case 'password':
        title = t('change_password');
        isSaveDisabled = isLoading || fieldValue.length < 8;
        inputElement = (
          <div className="space-y-3">
            <input
              type="password"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl text-[15px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
              placeholder={t('new_password_placeholder')}
              autoFocus
            />
            <p className="text-xs text-muted-foreground ml-2 leading-relaxed">
              {t('password_hint', 'Minimum 8 characters, including uppercase, lowercase, number, and symbol.')}
            </p>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <motion.div
        key="field-editor"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        </div>

        <div>
          {inputElement}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full btn-gradient py-4 rounded-2xl text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-[15px]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {isLoading ? t('saving') : t('save_changes')}
        </button>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-card bg-card border border-border/60 rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[480px]"
          >
            {/* Close Button (Only show on main list) */}
            <AnimatePresence>
              {!activeField && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  onClick={onClose}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-muted/50 text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-150 z-10"
                >
                  <X size={20} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Content Container with AnimatePresence for smooth swapping */}
            <div className="relative w-full">
              <AnimatePresence mode="wait">
                {activeField === null ? renderMainList() : renderFieldEditor()}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Sub-component for main list options
const ListOption = ({ icon: Icon, title, value, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border/80 transition-all duration-200 group shadow-sm hover:shadow-md"
  >
    <div className="flex items-center gap-4 overflow-hidden">
      <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center shadow-sm text-foreground group-hover:scale-105 transition-transform duration-200 shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="text-left flex flex-col min-w-0">
        <span className="font-bold text-[15px] text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-[250px] font-medium">{value}</span>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
  </button>
);

const X = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

export default EditProfileModal;