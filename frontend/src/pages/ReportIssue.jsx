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
} from "lucide-react";
import { useState, useEffect } from "react";
import { BASE_URL } from "../utils/config";
import {   saveCurrentLocation } from "../utils/locationUtils";
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
];


export default function ReportIssue() {
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
 
  useEffect(() => {
    // Check if user already has a saved location, but don't auto-populate
    // Only use it if user explicitly clicks "Get Current Location"
    // This gives users full control
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
      return; // No files selected, do nothing
    }
    
    // Check if we're adding to existing files or replacing them
    const currentFileCount = formData.media.length;
    const totalFilesAfterAdd = currentFileCount + files.length;
    
    // Enforce 3-file limit
    if (totalFilesAfterAdd > 3) {
      setErrors(prev => ({ 
        ...prev, 
        media: `Cannot add ${files.length} file(s). You can only have a maximum of 3 files. Currently have ${currentFileCount}/3.`
      }));
      return;
    }
    
    // Only allow image files (PNG, JPEG, JPG)
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    
    // Validate each new file
    const invalidFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) return true;
      return false;
    });
    
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
    
    // Check combined file size limit (30MB)
    const currentTotalSize = formData.media.reduce((total, file) => total + file.size, 0);
    const newFilesSize = files.reduce((total, file) => total + file.size, 0);
    const combinedTotalSize = currentTotalSize + newFilesSize;
    const maxTotalSize = 30 * 1024 * 1024; // 30MB in bytes
    
    if (combinedTotalSize > maxTotalSize) {
      setErrors(prev => ({ 
        ...prev, 
        media: `Combined file size exceeds 30MB limit. Current: ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB, Adding: ${(newFilesSize / (1024 * 1024)).toFixed(2)}MB, Total would be: ${(combinedTotalSize / (1024 * 1024)).toFixed(2)}MB`
      }));
      return;
    }
    
    setErrors(prev => ({ ...prev, media: '' }));
    setUploadError('');
    
    // Combine existing files with new files
    const updatedMedia = [...formData.media, ...files];
    
    // Create preview URLs for new files only
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    const updatedPreviewUrls = [...previewUrls, ...newPreviewUrls];
    
    setPreviewUrls(updatedPreviewUrls);
    setFormData(prev => ({
      ...prev,
      media: updatedMedia,
      mediaUrls: [] // Reset uploaded URLs when new files are added
    }));
    
    // Clear the file input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    // Revoke the preview URL to avoid memory leaks
    if (previewUrls[indexToRemove]) {
      URL.revokeObjectURL(previewUrls[indexToRemove]);
    }
    
    const newMedia = formData.media.filter((_, index) => index !== indexToRemove);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);
    
    setFormData(prev => ({
      ...prev,
      media: newMedia,
      mediaUrls: [] // Reset uploaded URLs when files are removed
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
      formData.media.forEach((file, index) => {
        uploadFormData.append(`issue_media`, file);
      });
      
      const response = await axiosInstance.post('/upload-issues', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success && response.data.media && response.data.media.length > 0) {
        // Use the media URLs from the API response
        const uploadedUrls = response.data.media;
        setFormData(prev => ({
          ...prev,
          mediaUrls: uploadedUrls,
          media: [] // Clear the local files after successful upload
        }));
        
        // Clear preview URLs to free up memory
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
      
      // More strict title validation
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
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return false;
      }
      return true;
    };

    if (!validateForm()) return;

    try {

      // Prepare data for JSON submission
      let dataToSend = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        isAnonymous: formData.isAnonymous
      };

      // Add uploaded media URLs if available
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
        // Clear preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setErrors({});
        // Remove current location from localStorage
        localStorage.removeItem('currentLocation');
      }
    
    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitError(error.response.data.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-texture">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 mx-4 mt-4 rounded-2xl">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 shadow-lg">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">LocalAwaaz</h1>
              <p className="text-xs text-muted-foreground">Community Voice Platform</p>
            </div>
          </div>
          
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-6 mt-8 rounded-3xl glass-card p-8 text-center shadow-xl">
        <div className="animate-fade-in-up">
          <h1 className="mb-4 text-4xl font-bold text-gradient md:text-5xl">
            Report a Local Issue
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Help improve your neighborhood by reporting issues directly to local authorities.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-cyan-950 px-4 py-2 text-sm font-medium text-accent-foreground">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
              Active Community
            </div>
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-accent-foreground bg-cyan-950">
              247 Issues Resolved
            </div>
          </div>
        </div>
      </section>

      {/* Main Card */}
      <div className="mx-auto mt-10 max-w-7xl px-4 pb-16">
        <div className="glass-card p-8 shadow-xl">
          {/* Categories */}
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground">Select Issue Category<span className="text-red-600"> *</span></h2>
            <p className="text-sm text-muted-foreground">Choose the category that best describes your issue</p>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map(({ label, value, icon: Icon }) => (
              <div
                key={value}
                onClick={() => handleInputChange('category', value)}
                className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-sm text-card-foreground transition-all hover:-translate-y-1 hover:border-cyan-600 hover:bg-muted hover:shadow-lg ${
                  formData.category === value ? 'border-cyan-600 bg-muted' : ''
                }`}
              >
                <div className="rounded-lg bg-muted p-3 transition-colors group-hover:bg-cyan-600/10 group-hover:text-cyan-600">
                  <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-cyan-600" />
                </div>
                <span className="text-center font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* Left */}
            <div className="space-y-6 md:col-span-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Issue Title<span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief title of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                <p className="mt-1 text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Detailed Description<span className="text-red-600"> *</span>
                </label>
                <textarea
                  placeholder="Provide more details about the issue..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 resize-none"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Specific Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near SBI Bank, Main Road"
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Assam"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>

                

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Pin Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={formData.location.pinCode}
                    onChange={(e) => handleInputChange('location.pinCode', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
              </div>

              {/* GPS Location Status */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">GPS Location<span className="text-red-600"> *</span></span>
                    {formData.location.geoData.coordinates ? (
                      <>
                        <div className="h-4 w-4 rounded-full bg-green-600"></div>
                        <span className="text-sm text-green-600">GPS location captured</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full bg-yellow-600"></div>
                        <span className="text-sm text-yellow-600">GPS location not captured</span>
                      </>
                    )}
                  </div>
                  {!formData.location.geoData.coordinates && (
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      Get Current Location
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Click "Get Current Location" to capture your GPS coordinates. Manual location fields are for additional context.
                </p>
                {errors.geoData && (
                  <p className="mt-2 text-xs text-red-600">{errors.geoData}</p>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Add Photos
                  <span className="font-normal text-red-600"> *</span>
                </label>
                <div className="group relative">
                  <div className="h-44 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-cyan-600 hover:bg-muted">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      accept="image/png, image/jpg, image/jpeg"
                      multiple
                      onChange={handleFileChange}
                      disabled={formData.mediaUrls.length > 0} // Disable input after successful upload
                    />
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      {formData.media.length > 0 ? (
                        <>
                          <Camera className="h-8 w-8 text-green-600" />
                          <span className="text-sm font-medium text-foreground">
                            {formData.media.length} file(s) selected
                          </span>
                          <div className="text-xs text-muted-foreground max-w-xs">
                            {formData.media.map((file, index) => (
                              <div key={index} className="truncate">
                                {file.name.length > 25 
                                  ? `${file.name.substring(0, 25)}...` 
                                  : file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-cyan-600 font-medium">
                              Click again to add more files
                            </span>
                            <span className="text-xs text-muted-foreground">
                              (Max 3 files total)
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                          <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            Upload Photos
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PNG, JPG, JPEG images only (max 3 files, 30MB total)
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
                      className="w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-teal-600"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                    
                    {uploadError && (
                      <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs text-red-600">{uploadError}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Success Message - Show when files are uploaded successfully */}
                {formData.mediaUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="w-full rounded-xl py-6 px-4  text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-600 text-sm font-semibold">
                          Images uploaded successfully
                        </span>
                        <span className="text-green-500 text-xs">
                          {formData.mediaUrls.length} image(s) ready to submit
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Preview Section - Hide when files are uploaded successfully */}
              {formData.media.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Selected Files ({formData.media.length}/3)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border transition-all hover:border-cyan-600">
                          <img
                            src={previewUrls[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* File type indicator */}
                        <div className="absolute top-2 left-2">
                          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                            </svg>
                            Image
                          </div>
                        </div>
                        
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {/* File name tooltip */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate">
                            {file.name.length > 15 
                              ? `${file.name.substring(0, 15)}...` 
                              : file.name}
                          </p>
                          <p className="text-white/70 text-xs">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-cyan-600 focus:ring-2 focus:ring-cyan-600/20 focus:outline-none"
                  />
                  Post Anonymously
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Your personal details won't be shown
                </p>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-gradient w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </button>
              
              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-600">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-green-600 font-medium">Issue submitted successfully!</p>
                  </div>
                  <p className="text-xs text-green-500 mt-1">Your report has been received and will be reviewed shortly.</p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Your report will be reviewed and forwarded to the appropriate department.
                </p>
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
