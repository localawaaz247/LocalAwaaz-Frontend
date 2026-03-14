import { Megaphone, Construction, Droplet, Zap, Trash2, Waves, Lightbulb, TrafficCone, AlertTriangle, Camera, HeartPulse, GraduationCap, ShieldAlert, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { saveCurrentLocation } from "../utils/locationUtils";
import CurrentLocationModal from "../components/CurrentLocationModal";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import { useTranslation } from "react-i18next";

export default function ReportIssue() {
  const { t } = useTranslation();
  const routerLocation = useLocation();
  const prefilledData = routerLocation.state?.prefilledData;

  const categories = [
    { label: t('road_&_potholes'), value: "ROAD_&_POTHOLES", icon: Construction },
    { label: t('water_supply'), value: "WATER_SUPPLY", icon: Droplet },
    { label: t('electricity'), value: "ELECTRICITY", icon: Zap },
    { label: t('sanitation'), value: "SANITATION", icon: Trash2 },
    { label: t('garbage'), value: "GARBAGE", icon: Trash2 },
    { label: t('drainage'), value: "DRAINAGE", icon: Waves },
    { label: t('street_lights'), value: "STREET_LIGHTS", icon: Lightbulb },
    { label: t('traffic'), value: "TRAFFIC", icon: TrafficCone },
    { label: t('encroachment'), value: "ENCROACHMENT", icon: AlertTriangle },
    { label: t('health'), value: "HEALTH", icon: HeartPulse },
    { label: t('education'), value: "EDUCATION", icon: GraduationCap },
    { label: t('corruption'), value: "CORRUPTION", icon: ShieldAlert },
  ];

  const user = useSelector((state) => state.auth?.user);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: {
      address: '',
      city: '',
      pinCode: '',
      state: '',
      geoData: {
        type: 'Point',
        coordinates: null
      }
    },
    media: [],
    mediaUrls: [],
    isAnonymous: false
  });

  useEffect(() => {
    if (user) {
      const isAnon = Boolean(user.preferences?.globalAnonymous);
      setFormData(prev => ({ ...prev, isAnonymous: isAnon }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrls, setPreviewUrls] = useState([]);

  const [isAILoading, setIsAILoading] = useState(false);
  const [totalResolved, setTotalResolved] = useState(0);

  useEffect(() => {
    const fetchGlobalResolvedCount = async () => {
      try {
        const res = await axiosInstance.get('/issue/global/resolved-count');
        const count = res.data?.resolvedCount || res.data?.count || res.data?.totalResolved;
        if (count !== undefined) {
          setTotalResolved(count);
        }
      } catch (error) {
        console.warn("Could not fetch global resolved count.", error.message);
      }
    };
    fetchGlobalResolvedCount();
  }, []);

  useEffect(() => {
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        title: prefilledData.title || prev.title,
        category: prefilledData.category || prev.category,
        description: prefilledData.description || prev.description,
        location: {
          ...prev.location,
          address: prefilledData.location?.address || prev.location.address,
          city: prefilledData.location?.city || prev.location.city,
          state: prefilledData.location?.state || prev.location.state,
          geoData: {
            type: 'Point',
            coordinates: prefilledData.location?.coordinates || prev.location.geoData.coordinates
          }
        },
        media: prefilledData.originalFile ? [prefilledData.originalFile] : prev.media
      }));

      if (prefilledData.originalFile) {
        try {
          const url = URL.createObjectURL(prefilledData.originalFile);
          setPreviewUrls([url]);
        } catch (error) {
          console.error("Error creating preview URL:", error);
        }
      }
    }
  }, [prefilledData]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFillWithAI = async () => {
    if (formData.media.length === 0) {
      setUploadError(t('ai_req_image'));
      showToast({ icon: "warning", title: t('select_image_first') });
      return;
    }

    const hasTextLocation = formData.location.city && formData.location.state && formData.location.pinCode;
    const hasGPS = formData.location.geoData.coordinates !== null;

    if (!hasTextLocation && !hasGPS) {
      setErrors(prev => ({ ...prev, location: t('ai_req_location') }));
      showToast({ icon: "warning", title: t('location_details_req') });
      return;
    }

    setIsAILoading(true);
    setUploadError('');
    setErrors({});

    try {
      const aiFormData = new FormData();
      aiFormData.append('images', formData.media[0]);

      aiFormData.append('city', formData.location.city || user?.contact?.city || '');
      if (hasGPS) {
        aiFormData.append('lng', formData.location.geoData.coordinates[0]);
        aiFormData.append('lat', formData.location.geoData.coordinates[1]);
      }
      aiFormData.append('userHint', '');

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/ai/analyze-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: aiFormData
      });

      const data = await response.json();

      if (data?.success && data?.analysis) {
        const aiResult = data.analysis;

        setFormData(prev => ({
          ...prev,
          title: aiResult.title || prev.title,
          category: aiResult.category || prev.category,
          description: aiResult.description || prev.description
        }));

        showToast({ icon: "success", title: t('ai_draft_success') });
      } else {
        throw new Error(data?.message || t('ai_analysis_fail'));
      }
    } catch (error) {
      console.error("AI Fill Error:", error);
      showToast({ icon: "error", title: t('ai_fill_fail') });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleLocationCaptured = (locationData) => {
    saveCurrentLocation(locationData);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        geoData: {
          type: 'Point',
          coordinates: [locationData.longitude, locationData.latitude]
        }
      }
    }));
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const currentFileCount = formData.media.length;
    const totalFilesAfterAdd = currentFileCount + files.length;

    if (totalFilesAfterAdd > 3) {
      setErrors(prev => ({
        ...prev,
        media: `${t('cannot_add')} ${files.length} ${t('files_max_3')}`
      }));
      return;
    }

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, media: t('invalid_img_type') }));
      return;
    }

    const currentTotalSize = formData.media.reduce((total, file) => total + file.size, 0);
    const newFilesSize = files.reduce((total, file) => total + file.size, 0);
    if (currentTotalSize + newFilesSize > 30 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, media: t('size_limit_exceeded') }));
      return;
    }

    setErrors(prev => ({ ...prev, media: '' }));
    setUploadError('');

    const updatedMedia = [...formData.media, ...files];
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setFormData(prev => ({
      ...prev,
      media: updatedMedia,
      mediaUrls: []
    }));

    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    if (previewUrls[indexToRemove]) URL.revokeObjectURL(previewUrls[indexToRemove]);

    const newMedia = formData.media.filter((_, index) => index !== indexToRemove);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);

    setFormData(prev => ({ ...prev, media: newMedia, mediaUrls: [] }));
    setPreviewUrls(newPreviewUrls);
    setUploadError('');
  };

  const handleUploadMedia = async () => {
    if (formData.media.length === 0) {
      setUploadError(t('select_files_first'));
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const uploadFormData = new FormData();
      formData.media.forEach((file) => {
        uploadFormData.append(`issue_media`, file);
      });

      const response = await axiosInstance.post('/upload-issues', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success && response.data.media && response.data.media.length > 0) {
        setFormData(prev => ({
          ...prev,
          mediaUrls: response.data.media
        }));
      } else {
        setUploadError(t('upload_fail_retry'));
      }
    } catch (error) {
      setUploadError(t('upload_fail_retry'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    const validateForm = () => {
      const newErrors = {};

      if (!formData.title || !formData.title.trim()) newErrors.title = t('title_req');
      else if (formData.title.trim().length < 3) newErrors.title = t('title_length');

      if (!formData.category) newErrors.category = t('category_req');

      if (!formData.description || !formData.description.trim()) newErrors.description = t('desc_req');
      else if (formData.description.trim().length < 10) newErrors.description = t('desc_length');

      if (!formData.location.address.trim()) newErrors.location = t('location_req');
      if (!formData.location.geoData.coordinates) newErrors.geoData = t('gps_req');

      if (formData.media.length > 0 && formData.mediaUrls.length === 0) {
        setUploadError(t('click_upload_before_submit'));
        setIsSubmitting(false);
        return false;
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return false;
      }
      return true;
    };

    if (!validateForm()) return;

    try {
      let dataToSend = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        isAnonymous: formData.isAnonymous
      };

      if (formData.mediaUrls.length > 0) {
        dataToSend.media = formData.mediaUrls;
      }

      const response = await axiosInstance.post(`/issue`, dataToSend);

      if (response.data) {
        setSubmitSuccess(true);
        setFormData({
          title: '', category: '', description: '',
          location: { address: '', city: '', pinCode: '', state: '', geoData: { type: 'Point', coordinates: null } },
          media: [], mediaUrls: [],
          isAnonymous: Boolean(user?.preferences?.globalAnonymous)
        });
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setErrors({});
        localStorage.removeItem('currentLocation');

        setTotalResolved(prev => prev + 1);
      }

    } catch (error) {
      setSubmitError(error.response?.data?.message || t('something_went_wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-texture pb-20 md:pb-8">
      <header className="glass-card sticky top-2 md:top-4 z-40 mx-2 md:mx-4 rounded-xl md:rounded-2xl shadow-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 shadow-lg">
              <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gradient leading-tight">LocalAwaaz</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">{t('community_voice')}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative mx-2 md:mx-6 mt-4 md:mt-8 rounded-2xl md:rounded-3xl glass-card p-6 md:p-8 text-center shadow-xl">
        <div className="animate-fade-in-up">
          <h1 className="mb-2 md:mb-4 text-2xl md:text-4xl lg:text-5xl font-bold text-gradient">
            {t('report_local_issue')}
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-lg text-muted-foreground">
            {t('report_desc')}
          </p>
          <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-cyan-950 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-accent-foreground border border-cyan-800">
              <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-white animate-pulse"></div>
              {t('active_community')}
            </div>
            {totalResolved > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-cyan-950 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-accent-foreground border border-cyan-800">
                {totalResolved.toLocaleString()} {t('total_issues_resolved')}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-6 md:mt-10 max-w-7xl px-2 md:px-4">
        <div className="glass-card p-4 md:p-8 shadow-xl rounded-2xl md:rounded-3xl relative">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 gap-4 border-b border-border/50 pb-4">
            <div>
              <h2 className="mb-1 md:mb-2 text-xl md:text-2xl font-bold text-foreground">{t('select_category_header')}<span className="text-red-600"> *</span></h2>
              <p className="text-xs md:text-sm text-muted-foreground">{t('select_category_desc')}</p>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>

            <button
              onClick={handleFillWithAI}
              disabled={isAILoading}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${isAILoading
                ? 'bg-muted text-muted-foreground cursor-wait'
                : 'btn-gradient text-white hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isAILoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{t('analyzing')}</>
              ) : (
                <><Sparkles className="w-4 h-4" />{t('auto_fill_ai')}</>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map(({ label, value, icon: Icon }) => (
              <div
                key={value}
                onClick={() => handleInputChange('category', value)}
                className={`group flex cursor-pointer flex-col items-center gap-2 md:gap-3 rounded-xl border-2 border-border bg-card p-3 md:p-4 text-xs md:text-sm text-card-foreground transition-all hover:-translate-y-1 hover:border-cyan-600 hover:bg-muted hover:shadow-lg ${formData.category === value ? 'border-cyan-600 bg-muted' : ''}`}
              >
                <div className="rounded-lg bg-muted p-2 md:p-3 transition-colors group-hover:bg-cyan-600/10 group-hover:text-cyan-600">
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground transition-colors group-hover:text-cyan-600" />
                </div>
                <span className="text-center font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 md:mt-10 grid gap-6 md:gap-8 lg:grid-cols-3">
            <div className="space-y-4 md:space-y-6 lg:col-span-2">
              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('issue_title')}<span className="text-red-600"> *</span></label>
                <input
                  type="text"
                  placeholder={t('brief_title')}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{formData.title.length}/100 {t('characters')}</p>
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('detailed_desc')}<span className="text-red-600"> *</span></label>
                <textarea
                  placeholder={t('issue_desc_placeholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 resize-none"
                  rows={4}
                />
                <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{formData.description.length}/500 {t('characters')}</p>
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('specific_location')}</label>
                <input
                  type="text"
                  placeholder={t('location_placeholder')}
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('state')}</label>
                  <input
                    type="text" placeholder={t('state_placeholder')} value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('city')}</label>
                  <input
                    type="text" placeholder={t('city_placeholder')} value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">{t('pin_code')}</label>
                  <input
                    type="text" placeholder={t('pincode_placeholder')} value={formData.location.pinCode}
                    onChange={(e) => handleInputChange('location.pinCode', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
              </div>

              <div className="mt-2 md:mt-4 p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{t('gps_location')}<span className="text-red-600"> *</span></span>
                    {formData.location.geoData.coordinates ? (
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                        <span className="text-xs font-medium text-green-600">{t('captured')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-full">
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
                        <span className="text-xs font-medium text-yellow-600">{t('not_captured')}</span>
                      </div>
                    )}
                  </div>
                  {!formData.location.geoData.coordinates && (
                    <button
                      type="button" onClick={() => setShowLocationModal(true)}
                      className="text-xs md:text-sm bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors font-medium self-start sm:self-auto"
                    >
                      {t('get_current_location')}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] md:text-xs text-muted-foreground leading-relaxed">
                  {t('gps_desc')}
                </p>
                {errors.geoData && <p className="mt-2 text-xs text-red-600 font-medium">{errors.geoData}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  {t('add_photos')}<span className="font-normal text-red-600"> *</span>
                </label>
                <div className="group relative">
                  <div className="h-36 md:h-44 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-cyan-600 hover:bg-muted">
                    <input
                      type="file" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                      accept="image/png, image/jpg, image/jpeg" multiple
                      onChange={handleFileChange} disabled={formData.mediaUrls.length > 0}
                    />
                    <div className="flex h-full flex-col items-center justify-center gap-1 md:gap-2 text-center p-4">
                      {formData.media.length > 0 ? (
                        <>
                          <Camera className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                          <span className="text-xs md:text-sm font-medium text-foreground">{formData.media.length} {t('files_selected')}</span>
                          <div className="text-[10px] md:text-xs text-muted-foreground max-w-[200px] md:max-w-xs">
                            {formData.media.map((file, index) => (
                              <div key={index} className="truncate">
                                {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                          {!formData.mediaUrls.length && (
                            <div className="flex flex-col mt-1">
                              <span className="text-[10px] md:text-xs text-cyan-600 font-medium">{t('click_add_more')}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                          <span className="text-xs md:text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">{t('upload_photos')}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground mt-1 px-2">{t('img_formats_limit')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.media && <p className="mt-2 text-xs text-red-600">{errors.media}</p>}
                </div>

                {formData.media.length > 0 && formData.mediaUrls.length === 0 && (
                  <div className="mt-4">
                    <button
                      type="button" onClick={handleUploadMedia} disabled={isUploading}
                      className="w-full rounded-xl py-2.5 md:py-3 text-sm md:text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-teal-600"
                    >
                      {isUploading ? t('uploading') : t('upload_files_btn')}
                    </button>
                    {uploadError && (
                      <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                      </div>
                    )}
                  </div>
                )}

                {formData.mediaUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="w-full rounded-xl py-4 md:py-6 px-4 bg-green-500/10 border border-green-500/20 text-center">
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-600 text-xs md:text-sm font-semibold">{t('img_up_success')}</span>
                        <span className="text-green-600/80 text-[10px] md:text-xs">{formData.mediaUrls.length} {t('img_ready')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {formData.media.length > 0 && formData.mediaUrls.length === 0 && (
                <div className="mt-4 md:mt-6">
                  <h3 className="mb-2 md:mb-3 text-xs md:text-sm font-semibold text-foreground">{t('selected_files')} ({formData.media.length}/3)</h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border transition-all hover:border-cyan-600">
                          <img src={previewUrls[index]} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button" onClick={() => handleRemoveFile(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md z-20"
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <label className="flex items-center gap-3 text-sm font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-cyan-600 focus:ring-2 focus:ring-cyan-600/20 focus:outline-none"
                  />
                  {t('post_anonymously')}
                </label>
                <p className="text-[11px] md:text-xs text-muted-foreground ml-7 mt-1">
                  {t('anon_desc')}
                </p>
              </div>

              <div className="pt-2 md:pt-4 border-t border-border/50">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-gradient w-full rounded-xl py-3 text-sm md:text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('submitting') : t('submit_issue')}
                </button>

                {submitError && (
                  <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-xs text-red-500 font-medium">{submitError}</p>
                  </div>
                )}

                {submitSuccess && (
                  <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-green-500 font-semibold">{t('issue_submit_success')}</p>
                    </div>
                    <p className="text-xs text-green-600/80 mt-1.5 ml-7">{t('issue_review_shortly')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CurrentLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationCaptured={handleLocationCaptured}
      />
    </div>
  );
}