import { useState, useEffect } from "react";
import { UserCircle, MapPin, ArrowRight, ArrowLeft, User, Camera, Loader2 } from "lucide-react";
import { cscApi } from "../utils/cscAPI";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import axiosInstance from "../utils/axios";
import { setUser } from "../reducer/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function CompleteProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user);

  const [step, setStep] = useState(1);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  const [userName, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [previewImage, setPreviewImage] = useState(user?.profilePic || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    cscApi.get("/countries").then((res) => setCountries(res.data));
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    cscApi.get(`/countries/${countryCode}/states`).then((res) => {
      setStates(res.data);
      setCities([]);
    });
  }, [countryCode]);

  useEffect(() => {
    if (!stateCode) return;
    cscApi
      .get(`/countries/${countryCode}/states/${stateCode}/cities`)
      .then((res) => setCities(res.data));
  }, [stateCode]);

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

      setProfilePic(data.publicUrl);
      showToast({ icon: "success", title: t('image_uploaded_success') });

    } catch (error) {
      console.error("Image upload failed:", error);
      setPreviewImage(profilePic);
      showToast({ icon: "error", title: error.message || t('image_upload_failed') });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axiosInstance.patch(`/me/profile-complete`, {
        userName,
        gender,
        country,
        state,
        city,
        pinCode,
        profilePic
      });
      showToast({ icon: "success", title: t('profile_completed') });
      dispatch(setUser(res.data?.user));
      navigate("/dashboard");
    } catch (error) {
      showToast({
        icon: "error",
        title: error?.response?.data?.message || t('something_went_wrong'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-texture flex items-center justify-center py-10">
      <div className="w-full max-w-lg glass-card p-8 shadow-2xl rounded-2xl relative overflow-hidden">

        <div className="flex items-center justify-between mb-8 relative z-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-full mx-1 rounded-full transition-all duration-300 ${step >= s ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted"
                }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mt-4">{t('who_are_you')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('tell_about_yourself')}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center relative">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
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
                {isUploading ? t('uploading') : t('click_set_avatar')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  placeholder={t('enter_username')}
                  value={userName}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('gender')}
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">{t('select_gender')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>

            <button
              disabled={!userName || !gender || isUploading}
              onClick={() => setStep(2)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('continue')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <MapPin className="mx-auto w-14 h-14 text-primary" />
              <h2 className="text-2xl font-bold mt-4">{t('where_do_you_live')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('location_helps_personalize')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('country')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  onChange={(e) => {
                    const c = countries.find((x) => x.iso2 === e.target.value);
                    setCountry(c?.name || "");
                    setCountryCode(c?.iso2 || "");
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">{t('select_country')}</option>
                  {countries.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('state')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  onChange={(e) => {
                    const s = states.find((x) => x.iso2 === e.target.value);
                    setState(s?.name || "");
                    setStateCode(s?.iso2 || "");
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">{t('select_state')}</option>
                  {states.map((s) => (
                    <option key={s.iso2} value={s.iso2}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('city')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">{t('select_city')}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-card/50 hover:bg-card transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {t('previous')}
              </button>
              <button
                disabled={!country || !state || !city}
                onClick={() => setStep(3)}
                className="flex-1 btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {t('continue')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{t('almost_done')} 🎉</h2>
              <p className="text-sm text-muted-foreground">
                {t('just_one_last_thing')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('pin_code')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  placeholder={t('enter_pin_code')}
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-border bg-card/50 hover:bg-card transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {t('previous')}
              </button>
              <button
                disabled={!pinCode}
                onClick={handleSubmit}
                className="flex-1 btn-gradient py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {t('finish_profile')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}