/* eslint-disable no-unused-vars */
import {
  Megaphone,
  Construction,
  Droplet,
  Zap,
  Trash2,
  Waves,
  Lightbulb,
  TrafficCone,
  AlertTriangle,
  Camera,
  HeartPulse,    // Added for Health
  GraduationCap, // Added for Education
  ShieldAlert    // Added for Corruption
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // IMPORT REQUIRED FOR ROUTER STATE
import { BASE_URL } from "../utils/config";
import { saveCurrentLocation } from "../utils/locationUtils";
import CurrentLocationModal from "../components/CurrentLocationModal";
import axiosInstance from "../utils/axios";

const categories = [
  { label: "Roads & Potholes", value: "ROAD_&_POTHOLES", icon: Construction },
  { label: "Water Supply", value: "WATER_SUPPLY", icon: Droplet },
  { label: "Electricity", value: "ELECTRICITY", icon: Zap },
  { label: "Sanitation", value: "SANITATION", icon: Trash2 },
  { label: "Garbage Collection", value: "GARBAGE", icon: Trash2 },
  { label: "Drainage", value: "DRAINAGE", icon: Waves },
  { label: "Street Lights", value: "STREET_LIGHTS", icon: Lightbulb },
  { label: "Traffic", value: "TRAFFIC", icon: TrafficCone },
  { label: "Encroachment", value: "ENCROACHMENT", icon: AlertTriangle },
  // New Categories Added Below
  { label: "Health & Medical", value: "HEALTH", icon: HeartPulse },
  { label: "Education", value: "EDUCATION", icon: GraduationCap },
  { label: "Corruption", value: "CORRUPTION", icon: ShieldAlert },
];


export default function ReportIssue() {
  const routerLocation = useLocation();
  const prefilledData = routerLocation.state?.prefilledData;

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

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrls, setPreviewUrls] = useState([]);

  // --- AUTOMATICALLY PREFILL DATA FROM ASSISTANT ---
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
            // AI returns coordinates in an array [lng, lat]
            coordinates: prefilledData.location?.coordinates || prev.location.geoData.coordinates
          }
        },
        media: prefilledData.originalFile ? [prefilledData.originalFile] : prev.media
      }));

      // Generate preview for the prefilled image
      if (prefilledData.originalFile) {
        try {
          const url = URL.createObjectURL(prefilledData.originalFile);
          setPreviewUrls([url]);
        } catch (error) {
          console.error("Error creating preview URL for prefilled file:", error);
        }
      }
    }
  }, [prefilledData]);

  useEffect(() => {
    // Cleanup preview URLs to avoid memory leaks
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (!files || files.length === 0) {
      return;
    }

    const currentFileCount = formData.media.length;
    const totalFilesAfterAdd = currentFileCount + files.length;

    if (totalFilesAfterAdd > 3) {
      setErrors(prev => ({
        ...prev,
        media: `Cannot add ${files.length} file(s). You can only have a maximum of 3 files. Currently have ${currentFileCount}/3.`
      }));
      return;
    }

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];

    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(file => {
        return `${file.name} is not a supported format. Only PNG, JPG, JPEG images are allowed.`;
      });

      setErrors(prev => ({
        ...prev,
        media: errorMessages.join(', ')
      }));
      return;
    }

    const currentTotalSize = formData.media.reduce((total, file) => total + file.size, 0);
    const newFilesSize = files.reduce((total, file) => total + file.size, 0);
    const combinedTotalSize = currentTotalSize + newFilesSize;
    const maxTotalSize = 30 * 1024 * 1024; // 30MB

    if (combinedTotalSize > maxTotalSize) {
      setErrors(prev => ({
        ...prev,
        media: `Combined file size exceeds 30MB limit. Current: ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB, Adding: ${(newFilesSize / (1024 * 1024)).toFixed(2)}MB, Total would be: ${(combinedTotalSize / (1024 * 1024)).toFixed(2)}MB`
      }));
      return;
    }

    setErrors(prev => ({ ...prev, media: '' }));
    setUploadError('');

    const updatedMedia = [...formData.media, ...files];
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    const updatedPreviewUrls = [...previewUrls, ...newPreviewUrls];

    setPreviewUrls(updatedPreviewUrls);
    setFormData(prev => ({
      ...prev,
      media: updatedMedia,
      mediaUrls: []
    }));

    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    if (previewUrls[indexToRemove]) {
      URL.revokeObjectURL(previewUrls[indexToRemove]);
    }

    const newMedia = formData.media.filter((_, index) => index !== indexToRemove);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);

    setFormData(prev => ({
      ...prev,
      media: newMedia,
      mediaUrls: []
    }));
    setPreviewUrls(newPreviewUrls);
    setUploadError('');
  };

  const handleUploadMedia = async () => {
    if (formData.media.length === 0) {
      setUploadError('Please select files to upload first');
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success && response.data.media && response.data.media.length > 0) {
        const uploadedUrls = response.data.media;
        setFormData(prev => ({
          ...prev,
          mediaUrls: uploadedUrls,
          media: []
        }));

        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
      } else {
        setUploadError('Failed to upload files. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
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

      if (!formData.title || !formData.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (formData.title.trim().length < 3) {
        newErrors.title = 'Title must be at least 3 characters long';
      }

      if (!formData.category) newErrors.category = 'Please select a category';

      if (!formData.description || !formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters long';
      }

      if (!formData.location.address.trim()) newErrors.location = 'Location is required';
      if (!formData.location.geoData.coordinates) {
        newErrors.geoData = 'GPS coordinates are required. Please click "Get Current Location".';
      }

      // Force user to upload images first if they have selected them locally
      if (formData.media.length > 0 && formData.mediaUrls.length === 0) {
        setUploadError("Please click 'Upload Files' before submitting your issue.");
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
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setErrors({});
        localStorage.removeItem('currentLocation');
      }

    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitError(error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-texture pb-20 md:pb-8">
      {/* Header */}
      <header className="glass-card sticky top-2 md:top-4 z-40 mx-2 md:mx-4 rounded-xl md:rounded-2xl shadow-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 shadow-lg">
              <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gradient leading-tight">LocalAwaaz</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">Community Voice Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-2 md:mx-6 mt-4 md:mt-8 rounded-2xl md:rounded-3xl glass-card p-6 md:p-8 text-center shadow-xl">
        <div className="animate-fade-in-up">
          <h1 className="mb-2 md:mb-4 text-2xl md:text-4xl lg:text-5xl font-bold text-gradient">
            Report a Local Issue
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-lg text-muted-foreground">
            Help improve your neighborhood by reporting issues directly to local authorities.
          </p>
          <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-cyan-950 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-accent-foreground border border-cyan-800">
              <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-white animate-pulse"></div>
              Active Community
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-cyan-950 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-accent-foreground border border-cyan-800">
              247 Issues Resolved
            </div>
          </div>
        </div>
      </section>

      {/* Main Card */}
      <div className="mx-auto mt-6 md:mt-10 max-w-7xl px-2 md:px-4">
        <div className="glass-card p-4 md:p-8 shadow-xl rounded-2xl md:rounded-3xl">

          {/* Categories */}
          <div className="mb-6 md:mb-8">
            <h2 className="mb-1 md:mb-2 text-xl md:text-2xl font-bold text-foreground">Select Issue Category<span className="text-red-600"> *</span></h2>
            <p className="text-xs md:text-sm text-muted-foreground">Choose the category that best describes your issue</p>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map(({ label, value, icon: Icon }) => (
              <div
                key={value}
                onClick={() => handleInputChange('category', value)}
                className={`group flex cursor-pointer flex-col items-center gap-2 md:gap-3 rounded-xl border-2 border-border bg-card p-3 md:p-4 text-xs md:text-sm text-card-foreground transition-all hover:-translate-y-1 hover:border-cyan-600 hover:bg-muted hover:shadow-lg ${formData.category === value ? 'border-cyan-600 bg-muted' : ''
                  }`}
              >
                <div className="rounded-lg bg-muted p-2 md:p-3 transition-colors group-hover:bg-cyan-600/10 group-hover:text-cyan-600">
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground transition-colors group-hover:text-cyan-600" />
                </div>
                <span className="text-center font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="mt-8 md:mt-10 grid gap-6 md:gap-8 lg:grid-cols-3">

            {/* Left Column (Inputs) */}
            <div className="space-y-4 md:space-y-6 lg:col-span-2">
              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  Issue Title<span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief title of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  Detailed Description<span className="text-red-600"> *</span>
                </label>
                <textarea
                  placeholder="Provide more details about the issue..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 resize-none"
                  rows={4}
                />
                <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  Specific Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near SBI Bank, Main Road"
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Assam"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                    Pin Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={formData.location.pinCode}
                    onChange={(e) => handleInputChange('location.pinCode', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
              </div>

              {/* GPS Location Status */}
              <div className="mt-2 md:mt-4 p-3 md:p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">GPS Location<span className="text-red-600"> *</span></span>
                    {formData.location.geoData.coordinates ? (
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                        <span className="text-xs font-medium text-green-600">Captured</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-full">
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
                        <span className="text-xs font-medium text-yellow-600">Not captured</span>
                      </div>
                    )}
                  </div>
                  {!formData.location.geoData.coordinates && (
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="text-xs md:text-sm bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors font-medium self-start sm:self-auto"
                    >
                      Get Current Location
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] md:text-xs text-muted-foreground leading-relaxed">
                  Click "Get Current Location" to capture your GPS coordinates. Manual location fields are for additional context.
                </p>
                {errors.geoData && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{errors.geoData}</p>
                )}
              </div>
            </div>

            {/* Right Column (Upload & Submit) */}
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 md:mb-2 block text-sm font-semibold text-foreground">
                  Add Photos
                  <span className="font-normal text-red-600"> *</span>
                </label>
                <div className="group relative">
                  <div className="h-36 md:h-44 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-cyan-600 hover:bg-muted">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                      accept="image/png, image/jpg, image/jpeg"
                      multiple
                      onChange={handleFileChange}
                      disabled={formData.mediaUrls.length > 0} // Disable input after successful upload
                    />
                    <div className="flex h-full flex-col items-center justify-center gap-1 md:gap-2 text-center p-4">
                      {formData.media.length > 0 ? (
                        <>
                          <Camera className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                          <span className="text-xs md:text-sm font-medium text-foreground">
                            {formData.media.length} file(s) selected
                          </span>
                          <div className="text-[10px] md:text-xs text-muted-foreground max-w-[200px] md:max-w-xs">
                            {formData.media.map((file, index) => (
                              <div key={index} className="truncate">
                                {file.name.length > 20
                                  ? `${file.name.substring(0, 20)}...`
                                  : file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col mt-1">
                            <span className="text-[10px] md:text-xs text-cyan-600 font-medium">
                              Click to add more
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                          <span className="text-xs md:text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            Upload Photos
                          </span>
                          <span className="text-[10px] md:text-xs text-muted-foreground mt-1 px-2">
                            PNG, JPG, JPEG only<br />(max 3 files, 30MB total)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.media && (
                    <p className="mt-2 text-xs text-red-600">{errors.media}</p>
                  )}
                </div>

                {/* Upload Button or Success Message */}
                {formData.media.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleUploadMedia}
                      disabled={isUploading}
                      className="w-full rounded-xl py-2.5 md:py-3 text-sm md:text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-teal-600"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                    </button>

                    {uploadError && (
                      <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Success Message - Show when files are uploaded successfully */}
                {formData.mediaUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="w-full rounded-xl py-4 md:py-6 px-4 bg-green-500/10 border border-green-500/20 text-center">
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-600 text-xs md:text-sm font-semibold">
                          Images uploaded successfully
                        </span>
                        <span className="text-green-600/80 text-[10px] md:text-xs">
                          {formData.mediaUrls.length} image(s) ready to submit
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Preview Section - Hide when files are uploaded successfully */}
              {formData.media.length > 0 && (
                <div className="mt-4 md:mt-6">
                  <h3 className="mb-2 md:mb-3 text-xs md:text-sm font-semibold text-foreground">
                    Selected Files ({formData.media.length}/3)
                  </h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border transition-all hover:border-cyan-600">
                          <img
                            src={previewUrls[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md z-20"
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* File name tooltip - Hidden on mobile to avoid overlap */}
                        <div className="hidden md:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <p className="text-white text-[10px] truncate">
                            {file.name.length > 12 ? `${file.name.substring(0, 12)}...` : file.name}
                          </p>
                        </div>
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
                  Post Anonymously
                </label>
                <p className="text-[11px] md:text-xs text-muted-foreground ml-7 mt-1">
                  Your personal details won't be shown to the public
                </p>
              </div>

              <div className="pt-2 md:pt-4 border-t border-border/50">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-gradient w-full rounded-xl py-3 text-sm md:text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
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
                      <p className="text-sm text-green-500 font-semibold">Issue submitted successfully!</p>
                    </div>
                    <p className="text-xs text-green-600/80 mt-1.5 ml-7">Your report has been received and will be reviewed shortly.</p>
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-muted/50 p-3 md:p-4 text-center">
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Your report will be reviewed and forwarded to the appropriate department.
                  </p>
                </div>
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