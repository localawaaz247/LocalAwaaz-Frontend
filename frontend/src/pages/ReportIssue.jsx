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
import axios from "axios";
import { BASE_URL } from "../utils/config";
import {   saveCurrentLocation } from "../utils/locationUtils";
import CurrentLocationModal from "../components/CurrentLocationModal";

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
    isAnonymous: false
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
 
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
    const file = e.target.files[0];
    if (!file) {
      setFormData(prev => ({
        ...prev,
        media: []
      }));
      setErrors(prev => ({ ...prev, media: '' }));
      return;
    }
    
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    
    if (file.size > maxSize) {
      setErrors(prev => ({ 
        ...prev, 
        media: `File ${file.name} exceeds 20MB limit and will not be uploaded.`
      }));
      setFormData(prev => ({
        ...prev,
        media: []
      }));
      return;
    }
    
    setErrors(prev => ({ ...prev, media: '' }));
    setFormData(prev => ({
      ...prev,
      media: [file]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    const token=localStorage.getItem('access_token');
    
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
      // Debug: Log form data before sending
      console.log('Form data being sent:', {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        isAnonymous: formData.isAnonymous
      });

      // Prepare data for JSON submission
      let dataToSend = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        isAnonymous: formData.isAnonymous
      };

      // Handle file upload by converting to base64
      if (formData.media.length > 0) {
        const file = formData.media[0];
        const reader = new FileReader();
        
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64String = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64File = await base64Promise;
        
        dataToSend.media = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64File
        };
      }

      const response = await axios.post(`${BASE_URL}/issue`, dataToSend, {
        headers: {
          'Authorization':`Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        console.log('Issue submitted successfully:', response.data);
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
          isAnonymous: false
        });
        setErrors({});
      }
    
    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitError('An error occurred. Please try again.');
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
            <h2 className="mb-2 text-2xl font-bold text-foreground">Select Issue Category</h2>
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
                  Issue Title
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
                  Detailed Description
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
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai"
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
                    placeholder="e.g., 400001"
                    value={formData.location.pinCode}
                    onChange={(e) => handleInputChange('location.pinCode', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Maharashtra"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  />
                </div>
              </div>

              {/* GPS Location Status */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  <span className="font-normal text-muted-foreground"> (Optional)</span>
                </label>
                <div className="group relative">
                  <div className="h-44 cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-cyan-600 hover:bg-muted">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      accept="image/png, image/jpg, image/jpeg, video/mp4"
                      onChange={handleFileChange}
                    />
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      {formData.media.length > 0 ? (
                        <>
                          <Camera className="h-8 w-8 text-green-600" />
                          <span className="text-sm font-medium text-foreground">
                            {formData.media[0].name.length > 20 
                              ? `${formData.media[0].name.substring(0, 20)}...` 
                              : formData.media[0].name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(formData.media[0].size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-cyan-600 font-medium">
                            Click to change file
                          </span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                          <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            Upload Photo/Video
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PNG, JPG, JPEG, MP4 up to 20MB (single file)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.media && (
                    <p className="mt-2 text-xs text-red-600">{errors.media}</p>
                  )}
                  {formData.media.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, media: [] }));
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

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
