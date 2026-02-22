import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../reducer/profileReducer";
import { User, FileText, Lock, ArrowRight, ArrowLeft } from "lucide-react";

const EditProfileModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.profile.profileDetail);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: profileData?.name || "",
    gender: profileData?.gender || "",
    bio: profileData?.bio || "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      await dispatch(updateProfile(formData)).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-muted/50 transition-all duration-200 hover:scale-105"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-full mx-1 rounded-full transition-all ${
                step >= s ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* STEP 1 - Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <User className="mx-auto w-14 h-14 text-primary" />
              <h3 className="text-xl font-bold mt-4">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your personal details
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Gender <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="" className="bg-card text-foreground">Select gender</option>
                    <option value="male" className="bg-card text-foreground">Male</option>
                    <option value="female" className="bg-card text-foreground">Female</option>
                    <option value="other" className="bg-card text-foreground">Other</option>
                    <option value="prefer-not-to-say" className="bg-card text-foreground">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              disabled={!formData.name}
              onClick={() => setStep(2)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 - Bio & Address */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <FileText className="mx-auto w-14 h-14 text-primary" />
              <h3 className="text-xl font-bold mt-4">About You</h3>
              <p className="text-sm text-muted-foreground">
                Tell us more about yourself
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-card/50 hover:bg-card transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - Password */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <Lock className="mx-auto w-14 h-14 text-primary" />
              <h3 className="text-xl font-bold mt-4">Security</h3>
              <p className="text-sm text-muted-foreground">
                Update your password if needed
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                    placeholder="Enter new password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current password
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-card/50 hover:bg-card transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 btn-gradient px-6 py-3 rounded-xl text-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
