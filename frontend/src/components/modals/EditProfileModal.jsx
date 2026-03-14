import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../reducer/profileReducer";
import { User, FileText, Lock, ArrowRight, ArrowLeft, MapPin, Globe, Hash, Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    profilePic: "",
    gender: "",
    bio: "",
    address: {
      city: "",
      state: "",
      country: "",
      pinCode: ""
    },
    password: "",
  });

  useEffect(() => {
    if (profileData && isOpen) {
      setFormData({
        name: profileData.name || "",
        profilePic: profileData.profilePic || "",
        gender: profileData.gender || "",
        bio: profileData.bio || "",
        address: {
          city: profileData.contact?.city || "",
          state: profileData.contact?.state || "",
          country: profileData.contact?.country || "",
          pinCode: profileData.contact?.pinCode || ""
        },
        password: "",
      });
      setPreviewImage(profileData.profilePic || null);
      setStep(1);
    }
  }, [profileData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewImage(localPreviewUrl);
    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:1111';
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${backendUrl}/upload-avatar`, {
        method: 'POST',
        body: uploadData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('image_upload_failed'));
      }

      const data = await response.json();

      setFormData((prev) => ({ ...prev, profilePic: data.publicUrl }));
      toast.success(data.message || t('image_uploaded_success'));

    } catch (error) {
      console.error("Image upload failed:", error);
      setPreviewImage(formData.profilePic);
      toast.error(error.message || t('image_upload_failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === "") {
        delete payload.password;
      }

      const result = await dispatch(updateProfile(payload)).unwrap();

      toast.success(result?.message || t('profile_updated_success'));
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error?.message || t('profile_update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card bg-card border border-border/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground">
            {t('edit_profile')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-8 relative z-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-full mx-1 rounded-full transition-all duration-300 ${step >= s ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">{t('basic_info')}</h3>
              <p className="text-xs text-muted-foreground">{t('update_identity')}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center relative">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isUploading ? t('uploading') : t('click_camera')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">{t('name')} <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder={t('enter_name')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">{t('gender')} <span className="text-destructive">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">{t('select_gender')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>

            <button
              disabled={!formData.name || formData.name.length < 3 || !formData.gender || isUploading}
              onClick={() => setStep(2)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('continue')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3 border border-secondary/20">
                <MapPin className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-bold">{t('about_location')}</h3>
              <p className="text-xs text-muted-foreground">{t('where_impact')}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">{t('bio')}</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    maxLength={150}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder={t('bio_placeholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">{t('city')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder={t('city')}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">{t('state')}</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                    placeholder={t('state')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">{t('country')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="country"
                      value={formData.address.country}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder={t('country')}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">{t('pin_code')}</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.address.pinCode}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder={t('zip_pin')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-muted hover:bg-border transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {t('back')}
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02] text-sm"
              >
                {t('next')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold">{t('security')}</h3>
              <p className="text-xs text-muted-foreground">{t('finalize_account')}</p>
            </div>

            <div className="space-y-5 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">{t('change_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder={t('new_password_placeholder')}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">
                  {t('password_hint')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-muted hover:bg-border transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {t('back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 btn-gradient px-4 py-3 rounded-xl text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] disabled:hover:scale-100 text-sm"
              >
                {isLoading ? t('saving') : t('save_profile')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const X = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

export default EditProfileModal;