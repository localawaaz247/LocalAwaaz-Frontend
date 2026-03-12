import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../reducer/profileReducer";
import {
  User, FileText, Lock, ArrowRight, ArrowLeft,
  MapPin, Globe, Hash, Camera, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Image upload state
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

  // Populate form when modal opens or profile data changes
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

    // Show local preview immediately for better UX
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewImage(localPreviewUrl);
    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:1111';

      // 🟢 CRITICAL FIX: Grab the exact token key from your localStorage
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${backendUrl}/upload-avatar`, {
        method: 'POST',
        body: uploadData,
        credentials: 'include',
        headers: {
          // 🟢 CRITICAL FIX: Pass the token to satisfy your userAuth middleware
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();

      // Update form data with the new public URL from Cloudflare R2
      setFormData((prev) => ({ ...prev, profilePic: data.publicUrl }));
      toast.success(data.message || "Image uploaded successfully!");

    } catch (error) {
      console.error("Image upload failed:", error);
      // Revert the preview if upload fails
      setPreviewImage(formData.profilePic);
      toast.error(error.message || "Failed to upload image. Please try again.");
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

      toast.success(result?.message || "Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card bg-card border border-border/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-full mx-1 rounded-full transition-all duration-300 ${step >= s ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted"
                }`}
            />
          ))}
        </div>

        {/* ================= STEP 1: BASIC INFO ================= */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">Basic Information</h3>
              <p className="text-xs text-muted-foreground">Update your identity details</p>
            </div>

            {/* Profile Picture Upload Section */}
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
                {isUploading ? "Uploading..." : "Click the camera icon to upload"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Name <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Gender <span className="text-destructive">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              disabled={!formData.name || formData.name.length < 3 || !formData.gender || isUploading}
              onClick={() => setStep(2)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: BIO & LOCATION ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3 border border-secondary/20">
                <MapPin className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-bold">About & Location</h3>
              <p className="text-xs text-muted-foreground">Where are you making an impact?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    maxLength={150}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about yourself (max 150 chars)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="country"
                      value={formData.address.country}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Pin Code</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.address.pinCode}
                      onChange={handleAddressChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary"
                      placeholder="Zip/Pin Code"
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
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02] text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SECURITY ================= */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold">Security</h3>
              <p className="text-xs text-muted-foreground">Finalize your account details</p>
            </div>

            <div className="space-y-5 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Change Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter new password (optional)"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">
                  Must be 8+ chars with uppercase, lowercase, number, & symbol. Leave blank to keep current.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-muted hover:bg-border transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 btn-gradient px-4 py-3 rounded-xl text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] disabled:hover:scale-100 text-sm"
              >
                {isLoading ? "Saving..." : "Save Profile"}
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