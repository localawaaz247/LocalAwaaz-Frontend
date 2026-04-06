import { Megaphone, Construction, Droplet, Zap, Trash2, Waves, Lightbulb, TrafficCone, AlertTriangle, Camera, HeartPulse, GraduationCap, ShieldAlert, Sparkles, UploadCloud, CheckCircle2, X, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { saveCurrentLocation } from "../utils/locationUtils";
import CurrentLocationModal from "../components/CurrentLocationModal";
import axiosInstance from "../utils/axios";
import { showToast } from "../utils/toast";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';

// --- ZERO-COST HD THUMBNAIL GENERATOR FOR VIDEOS ---
const generateHDThumbnail = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration || 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.7));
      video.src = "";
      video.load();
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      video.src = "";
      video.load();
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
};

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
      geoData: { type: 'Point', coordinates: null }
    },
    media: [],
    mediaUrls: [],
    isAnonymous: false
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [previewUrls, setPreviewUrls] = useState([]);
  const [primaryVideoUrl, setPrimaryVideoUrl] = useState(null);
  const uppyRef = useRef(null);

  const [isAILoading, setIsAILoading] = useState(false);
  const [totalResolved, setTotalResolved] = useState(0);

  useEffect(() => {
    if (user) {
      const isAnon = Boolean(user.preferences?.globalAnonymous);
      setFormData(prev => ({ ...prev, isAnonymous: isAnon }));
    }
  }, [user]);

  useEffect(() => {
    const fetchGlobalResolvedCount = async () => {
      try {
        const res = await axiosInstance.get('/issue/global/resolved-count');
        const count = res.data?.resolvedCount || res.data?.count || res.data?.totalResolved;
        if (count !== undefined) setTotalResolved(count);
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
        category: prefilledData.category ? prefilledData.category.toUpperCase() : prev.category,
        description: prefilledData.description || prev.description,
        isAnonymous: prefilledData.isAnonymous !== undefined ? prefilledData.isAnonymous : prev.isAnonymous,
        location: {
          ...prev.location,
          address: prefilledData.location?.address || prev.location.address,
          city: prefilledData.location?.city || prev.location.city,
          state: prefilledData.location?.state || prev.location.state,
          pinCode: prefilledData.location?.pinCode || prev.location.pinCode,
          geoData: {
            type: 'Point',
            coordinates: prefilledData.location?.coordinates || prev.location.geoData.coordinates
          }
        },
        media: prefilledData.originalFiles ? prefilledData.originalFiles : prev.media
      }));

      if (prefilledData.originalFiles && prefilledData.originalFiles.length > 0) {
        try {
          if (prefilledData.originalFiles[0] instanceof Blob) {
            const urls = prefilledData.originalFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
          }
        } catch (error) {
          console.error("Error creating preview URL:", error);
        }
      }
    }
  }, [prefilledData]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      if (uppyRef.current) uppyRef.current.destroy();
    };
  }, [previewUrls]);

  useEffect(() => {
    if (formData.media.length > 0 && formData.media[0].type.startsWith('video/')) {
      const url = URL.createObjectURL(formData.media[0]);
      setPrimaryVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPrimaryVideoUrl(null);
    }
  }, [formData.media]);

  const handleFillWithAI = async () => {
    // 🚀 NEW: Check if any of the selected media is a video
    const hasVideo = formData.media.some(file => file.type.startsWith('video/'));

    if (hasVideo) {
      setUploadError(t('ai_only_images', 'Only images can be analyzed!'));
      showToast({ icon: "warning", title: t('ai_only_images', 'Only images can be analyzed!') });
      return;
    }

    const imageFiles = formData.media.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setUploadError(t('ai_req_image', 'Please upload at least one image for the AI to analyze.'));
      showToast({ icon: "warning", title: t('select_image_first', 'Please upload an image to proceed.') });
      return;
    }

    setIsAILoading(true);
    setUploadError('');
    setErrors({});

    try {
      const aiFormData = new FormData();
      imageFiles.forEach(file => aiFormData.append('images', file));
      aiFormData.append('city', formData.location.city || user?.contact?.city || '');

      if (formData.location.geoData?.coordinates) {
        aiFormData.append('lng', formData.location.geoData.coordinates[0]);
        aiFormData.append('lat', formData.location.geoData.coordinates[1]);
      }

      aiFormData.append('userHint', formData.description || '');

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
          category: aiResult.category ? aiResult.category.toUpperCase() : prev.category,
          description: aiResult.description || prev.description
        }));
        showToast({ icon: "success", title: t('ai_draft_success', 'Auto-filled successfully!') });
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
        geoData: { type: 'Point', coordinates: [locationData.longitude, locationData.latitude] }
      }
    }));
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [locationField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const totalFilesAfterAdd = formData.media.length + files.length;
    if (totalFilesAfterAdd > 3) {
      setErrors(prev => ({ ...prev, media: `${t('cannot_add')} ${files.length} files. Max is 3.` }));
      return;
    }

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/webm', 'video/quicktime'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, media: t('invalid_media_type', 'Only JPG, PNG, and Videos are allowed.') }));
      return;
    }

    const currentTotalSize = formData.media.reduce((total, file) => total + file.size, 0);
    const newFilesSize = files.reduce((total, file) => total + file.size, 0);
    if (currentTotalSize + newFilesSize > 300 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, media: t('size_limit_exceeded', 'Total size exceeds 300MB limit.') }));
      return;
    }

    setErrors(prev => ({ ...prev, media: '' }));
    setUploadError('');

    const toastId = toast.loading(t('processing_media', 'Processing media...'));
    const newPreviewUrls = [];

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const thumbBase64 = await generateHDThumbnail(file);
        newPreviewUrls.push(thumbBase64 || 'https://via.placeholder.com/640x360?text=Video+Preview');
      } else {
        newPreviewUrls.push(URL.createObjectURL(file));
      }
    }
    toast.dismiss(toastId);

    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...files],
      mediaUrls: [] // Clear Cloudflare URLs because files changed
    }));

    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    if (previewUrls[indexToRemove] && previewUrls[indexToRemove].startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[indexToRemove]);
    }

    const newMedia = formData.media.filter((_, index) => index !== indexToRemove);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);

    setFormData(prev => ({ ...prev, media: newMedia, mediaUrls: [] }));
    setPreviewUrls(newPreviewUrls);
    setUploadError('');
  };

  const handleCancelUpload = () => {
    if (uppyRef.current) {
      uppyRef.current.cancelAll();
      uppyRef.current.destroy();
      uppyRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(t('upload_cancelled', 'Upload was cancelled.'));
  };

  // --- LOCAL UPPY UPLOAD LOGIC ---
  const handleUploadMedia = () => {
    if (formData.media.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    const uppy = new Uppy({
      autoProceed: true,
      allowMultipleUploadBatches: false,
      retryDelays: [1000, 3000, 5000, 10000, 15000]
    });

    uppy.use(AwsS3, {
      limit: 2,
      getChunkSize: (file) => {
        return 10 * 1024 * 1024; // 10 MB
      },
      timeout: 60 * 1000,
      shouldUseMultipart: true,
      createMultipartUpload: async (file) => {
        const rawName = user?.name || user?.firstName || 'Anonymous';
        const cleanUserName = rawName.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanTitle = (formData.title || 'Issue').replace(/[^a-zA-Z0-9]/g, '_');

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        const customFileName = `${cleanUserName}_${cleanTitle}_${uniqueId}_${dateStr}${extension}`;

        const res = await axiosInstance.post('/multipart/create', {
          filename: customFileName,
          type: file.type,
          metadata: { category: formData.category || 'Issue', location: formData.location }
        });
        return { uploadId: res.data.uploadId, key: res.data.key };
      },
      signPart: async (file, partData) => {
        const res = await axiosInstance.post('/multipart/sign', {
          uploadId: partData.uploadId,
          key: partData.key,
          partNumber: partData.partNumber
        });
        return { url: res.data.url };
      },
      completeMultipartUpload: async (file, uploadData) => {
        const res = await axiosInstance.post('/multipart/complete', {
          uploadId: uploadData.uploadId,
          key: uploadData.key,
          parts: uploadData.parts
        });
        return { location: res.data.location };
      },
      abortMultipartUpload: async (file, uploadData) => {
        await axiosInstance.post('/multipart/abort', {
          uploadId: uploadData.uploadId,
          key: uploadData.key
        });
      }
    });

    let successUrls = [];

    uppy.on('progress', (progress) => {
      setUploadProgress(progress);
    });

    uppy.on('upload-success', (file, response) => {
      successUrls.push(response.body?.location || response.uploadURL);
    });

    uppy.on('complete', (result) => {
      if (result.failed.length > 0) {
        setUploadError(t('upload_fail_retry', 'Upload failed. Please check your connection and try again.'));
        setIsUploading(false);
        uppy.destroy();
        uppyRef.current = null;
      } else {
        setUploadProgress(100);

        setTimeout(() => {
          setFormData(prev => ({ ...prev, mediaUrls: successUrls }));
          setIsUploading(false);
          toast.success(t('img_up_success', 'Media uploaded to cloud successfully!'));
          uppy.destroy();
          uppyRef.current = null;
        }, 1500);
      }
    });

    formData.media.forEach(file => {
      uppy.addFile({ name: file.name, type: file.type, data: file });
    });

    uppyRef.current = uppy;
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

      if (!formData.location.state || !formData.location.city || !formData.location.pinCode) {
        setSubmitError(t('req_state_city_pin', 'Please enter state, city, and pincode'));
        setIsSubmitting(false);
        return false;
      }

      if (!formData.location.geoData.coordinates) newErrors.geoData = t('gps_req');

      if (formData.media.length > 0 && formData.mediaUrls.length === 0) {
        setUploadError(t('click_upload_before_submit', 'Please click Upload to save your media before submitting.'));
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
      const base64Thumbnails = previewUrls.map(url => url && url.startsWith('data:image') ? url : "");

      let dataToSend = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        media: formData.mediaUrls,
        isAnonymous: formData.isAnonymous,
        thumbnails: base64Thumbnails
      };

      if (formData.mediaUrls.length > 0) {
        dataToSend.mediaUrls = formData.mediaUrls;
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

        previewUrls.forEach(url => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
        setPreviewUrls([]);
        setErrors({});
        setUploadProgress(0);
        localStorage.removeItem('currentLocation');

        setTotalResolved(prev => prev + 1);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(t('something_went_wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const ghostFilterStyle = isUploading ? {
    filter: `blur(${Math.max(0, 8 - (uploadProgress * 0.08))}px) grayscale(${Math.max(0, 100 - uploadProgress)}%) brightness(${0.5 + (uploadProgress * 0.005)})`
  } : {};

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
                {errors.geoData && <p className="mt-2 text-xs text-red-600 font-medium">{errors.geoData}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  {t('add_media', 'Add Photos / Videos')}<span className="font-normal text-red-600"> *</span>
                </label>

                {/* Removed dashed borders when files exist for a cleaner look */}
                <div className={`relative group w-full h-48 md:h-64 rounded-xl overflow-hidden flex items-center justify-center transition-all ${formData.media.length === 0 ? 'border-2 border-dashed border-border bg-black hover:border-cyan-600' : 'bg-black'}`}>

                  {formData.media.length === 0 ? (
                    <div className="flex w-full h-full bg-muted/50">
                      <label className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-2 cursor-pointer hover:bg-muted/80 transition-colors z-10">
                        <Camera className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground group-hover:text-cyan-600 transition-colors" />
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">{t('camera', 'Camera')}</span>
                        <input
                          type="file"
                          accept="image/*" 
                          capture="environment"
                          className="hidden"
                          onChange={handleFileChange}
                        /> </label>
                      <div className="w-px bg-border my-6"></div>
                      <label className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-2 cursor-pointer hover:bg-muted/80 transition-colors z-10">
                        <UploadCloud className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground group-hover:text-cyan-600 transition-colors" />
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">{t('browse', 'Browse Files')}</span>
                        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                      </label>
                      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                        <span className="text-[10px] md:text-xs text-muted-foreground px-2">Max 3 files, 300MB total</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative group cursor-pointer overflow-hidden rounded-xl">

                      {formData.media[0].type.startsWith('video/') ? (
                        <video
                          src={primaryVideoUrl} // 🚀 NEW: Uses the cached URL so it doesn't reset!
                          poster={previewUrls[0]}
                          className="w-full h-full object-cover transition-all duration-300"
                          style={{ ...ghostFilterStyle, backgroundColor: 'black' }}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={previewUrls[0]}
                          alt="Primary Preview"
                          className="w-full h-full object-cover transition-all duration-300"
                          style={ghostFilterStyle}
                        />
                      )}

                      {isUploading && (
                        <>
                          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/50 z-20">
                            <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-20 gap-3">
                            <span className="text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tighter">{uploadProgress}%</span>

                            {/* Stop Upload Button */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCancelUpload(); }}
                              className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer z-30"
                            >
                              <X className="w-4 h-4" /> Stop Upload
                            </button>
                          </div>
                        </>
                      )}

                      {!isUploading && formData.mediaUrls.length === 0 && formData.media[0].type.startsWith('video/') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      )}

                      {!isUploading && formData.mediaUrls.length > 0 && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                          <CheckCircle2 className="w-12 h-12 text-green-500 drop-shadow-md mb-2" />
                          <span className="text-white font-bold drop-shadow-md text-sm">Upload Complete</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.media && <p className="mt-2 text-xs text-red-600">{errors.media}</p>}
              </div>

              {formData.media.length > 0 && (
                <div className="flex flex-col gap-3">

                  {/* Primary Upload Button */}
                  {!isUploading && formData.mediaUrls.length === 0 && (
                    <button
                      type="button"
                      onClick={handleUploadMedia}
                      className="w-full btn-gradient py-3 rounded-xl text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                      <UploadCloud className="w-5 h-5" />
                      Upload {formData.media.length} File{formData.media.length > 1 ? 's' : ''} to Cloud
                    </button>
                  )}

                  {uploadError && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                      <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                    </div>
                  )}

                  {/* Grid of Thumbnails including "Add More" option */}
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-black transition-all">
                        <img
                          src={previewUrls[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        {/* Always visible Trash Icon on all devices */}
                        {!isUploading && formData.mediaUrls.length === 0 && (
                          <button
                            type="button" onClick={() => handleRemoveFile(index)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-100 transition-opacity hover:bg-red-700 shadow-lg z-20 m-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {file.type.startsWith('video/') && (
                          <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1">
                            <span className="text-[8px] font-bold text-white tracking-widest">VIDEO</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Integrated Browse/Add More Option */}
                    {!isUploading && formData.mediaUrls.length === 0 && formData.media.length > 0 && formData.media.length < 3 && (
                      <label className="relative flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted hover:border-cyan-600 transition-all">
                        <Plus className="w-5 h-5 text-muted-foreground mb-0.5" />
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">{t('add_more', 'Add')}</span>
                        <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-muted/30 p-4 rounded-xl border border-border mt-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-cyan-600 focus:ring-2 focus:ring-cyan-600/20 focus:outline-none"
                  />
                  {t('post_anonymously')}
                </label>
              </div>

              <div className="pt-4 border-t border-border/50">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || formData.media.length === 0 || formData.mediaUrls.length === 0 || isUploading}
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
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
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