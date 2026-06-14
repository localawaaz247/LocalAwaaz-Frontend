/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useActionState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, ArrowLeft, UserCircle, Megaphone, Users, MessageCircle, Shield, ArrowRight, CheckCircle, Building2, Briefcase, FileUp } from 'lucide-react';
import google from "/google.png";
import logo from "/logo.png";
import authAction from '../actions/authAction';
import { useDispatch, useSelector } from "react-redux";
import { showToast } from '../utils/toast';
import { BASE_URL } from '../utils/config';
import MiniLoader from '../components/MiniLoader';
import axiosInstance from '../utils/axios';
import SEO from '../components/SEO';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { cscApi } from '../utils/cscAPI';
// Import your CustomSelect
import CustomSelect from '../components/CustomSelect';

const categories = [
  { label: 'Roads & Potholes', value: "ROAD_&_POTHOLES" },
  { label: 'Water Supply', value: "WATER_SUPPLY" },
  { label: 'Electricity', value: "ELECTRICITY" },
  { label: 'Sanitation', value: "SANITATION" },
  { label: 'Garbage', value: "GARBAGE" },
  { label: 'Drainage', value: "DRAINAGE" },
  { label: 'Street Lights', value: "STREET_LIGHTS" },
  { label: 'Traffic', value: "TRAFFIC" },
  { label: 'Encroachment', value: "ENCROACHMENT" },
  { label: 'Health', value: "HEALTH" },
  { label: 'Education', value: "EDUCATION" },
  { label: 'Corruption', value: "CORRUPTION" },
];

const roleOptions = [
  { label: 'NGO', value: 'ngo' },
  { label: 'Govt Official', value: 'official' }
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

const LoginRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggles & Modes
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState('citizen'); // 'citizen' | 'authority'

  // Form States (Common)
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  // Form States (Authority Specific)
  const [role, setRole] = useState("ngo");
  const [organizationName, setOrganizationName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [assignedState, setAssignedState] = useState("");
  const [assignedDistrict, setAssignedDistrict] = useState("");
  const [expertiseTags, setExpertiseTags] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Email/OTP States
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isOTPVerifying, setIsOTPVerifying] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailInput, setEmailInput] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { profileDetail } = useSelector((state) => state.profile);

  const [result, formAction, isPending] = useActionState((prev, formData) => authAction(prev, formData, dispatch, navigate), null);
  // --- LOCATION API STATES ---
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  // 1. Fetch Indian States on Mount
  useEffect(() => {
    // "IN" is the standard ISO2 code for India
    cscApi.get("/countries/IN/states")
      .then((res) => setStatesList(res.data))
      .catch((err) => console.error("Failed to load states:", err));
  }, []);

  // 2. Fetch Districts when the Assigned State changes
  useEffect(() => {
    if (!assignedState) {
      setDistrictsList([]);
      return;
    }

    // Find the ISO2 code for the selected state (required by cscApi)
    const selectedStateObj = statesList.find(s => s.name === assignedState);

    if (selectedStateObj) {
      cscApi.get(`/countries/IN/states/${selectedStateObj.iso2}/cities`)
        .then((res) => setDistrictsList(res.data))
        .catch((err) => console.error("Failed to load districts:", err));
    }
  }, [assignedState, statesList]);

  // --- HANDLERS & OPTIONS ---
  const handleStateChange = (newStateName) => {
    setAssignedState(newStateName);
    setAssignedDistrict(""); // Reset district when state changes
  };

  // Format options for the CustomSelect component
  const stateOptions = statesList.map(s => ({ value: s.name, label: s.name }));
  const districtOptions = districtsList.map(d => ({ value: d.name, label: d.name }));

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && profileDetail) {
      if (profileDetail.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, profileDetail, navigate]);

  // Reset form on successful registration
  useEffect(() => {
    if (result && result.success && !isLogin) {
      setEmailInput("");
      setIsValidEmail(false);
      setEmailVerified(false);
      setShowOtpInput(false);
      setEmailVerificationCode(['', '', '', '', '', '']);
      setShowVerifiedMessage(false);
      setTimer(30);
      setIsTimerRunning(false);
      setName("");
      setUserName("");
      setPassword("");
      setGender("");
      setOrganizationName("");
      setDepartmentName("");
      setAssignedDistrict("");
      setAssignedState("");
      setExpertiseTags("");
      setIdProofUrl("");
      setIsLogin(true);
      setAccountType('citizen');
    }
  }, [result, isLogin]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    if (errorParam && errorParam.includes("account_")) {
      const statusText = errorParam.split('_')[1];
      showToast({
        icon: "error",
        title: `Account ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}. Contact Administrator.`
      });
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const handleGoogleSignup = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        const response = await axiosInstance.post('/auth/google/native', { idToken });
        if (response.data.success) {
          const { accessToken, user, isProfileComplete } = response.data;
          navigate(`/google/callback?token=${accessToken}&isProfileComplete=${isProfileComplete}&role=${user.role}`);
        }
      } else {
        window.location.href = `${BASE_URL}/auth/google`;
      }
    } catch (error) {
      showToast({ icon: "error", title: "Google authentication failed." });
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setEmailInput(email);
    setIsValidEmail(validateEmail(email));
  };

  const handleVerifyEmail = async () => {
    try {
      setEmailVerificationRequested(true);
      await axiosInstance.post(`/otp/request`, { email: emailInput, userName });
      setShowOtpInput(true);
      setEmailVerificationRequested(false);
      setTimer(30);
      setIsTimerRunning(true);
    } catch (error) {
      setEmailVerificationRequested(false);
      showToast({ icon: "error", title: error.response?.data?.message || "Failed to send OTP" });
    }
  };

  const handleVerifyOtp = async () => {
    const otp = emailVerificationCode.join('');
    try {
      if (otp.length === 6) {
        setIsOTPVerifying(true);
        await axiosInstance.post(`/otp/verify`, { email: emailInput, otp, userName });
        setEmailVerified(true);
        setShowOtpInput(false);
        setShowVerifiedMessage(true);
        setIsOTPVerifying(false);
        setTimeout(() => setShowVerifiedMessage(false), 5000);
      } else {
        showToast({ icon: "warning", title: "OTP should be exactly 6 digits" });
      }
    } catch (error) {
      setIsOTPVerifying(false);
      showToast({ icon: "error", title: "Failed to verify OTP" });
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...emailVerificationCode];
      newOtp[index] = value;
      setEmailVerificationCode(newOtp);
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailVerificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Cloudflare R2 Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      setIsUploadingFile(true);
      const res = await axiosInstance.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data.urls ? res.data.urls[0] : res.data.url;
      setIdProofUrl(uploadedUrl);
      showToast({ icon: 'success', title: 'Document uploaded successfully' });
    } catch (err) {
      console.error(err);
      showToast({ icon: 'error', title: 'Failed to upload document' });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const features = [
    { icon: Megaphone, text: 'Amplify your local voice' },
    { icon: Users, text: 'Connect with your community' },
    { icon: MessageCircle, text: 'Share stories that matter' },
    { icon: Shield, text: 'Safe & trusted platform' },
  ];

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      <SEO title={isLogin ? "Sign In" : "Create Account"} url={isLogin ? "/login" : "/register"} />

      {/* Left Design Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-texture">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center md:px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-white"><img src={logo} alt='Logo' /></span>
            </div>
            <span className="text-3xl font-bold font-display text-gradient">LocalAwaaz</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
            Join the Movement,<br /><span className="text-gradient">Make an Impact</span>
          </h2>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground/80 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Section - FIXED LAYOUT */}
      {/* 
        Changes Made: 
        1. Outer container is flex-col, items-center to center the modal horizontally and vertically.
        2. Removed overflow-y-auto from the outer container.
      */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col items-center justify-center p-3 md:p-6 lg:p-12 relative">

        {/* 
          1. The modal wrapper enforces a max height (95vh). 
          2. flex-col allows internal elements to size properly.
        */}
        <div className="w-full max-w-md max-h-[95vh] flex flex-col relative">

          {/* Header Link - Fixed at top */}
          <Link to="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4 group flex-shrink-0">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          {/* 
            The Glass Card itself is now flex-col, flex-1, overflow-hidden.
            This ensures the card boundaries NEVER break out of the screen.
          */}
          <div className="glass-card flex flex-col flex-1 overflow-hidden md:p-8 p-4 rounded-2xl w-full">

            {/* FIXED TOP SECTION (Title, Toggles, Google Login) */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-4">
                {isLogin ? <div className="flex gap-2 items-center justify-center lg:justify-start">Sign In <ArrowRight className="w-5 h-5" /></div> : "Create Account"}
              </h1>

              {!isLogin && (
                <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setAccountType('citizen')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${accountType === 'citizen' ? 'bg-background shadow text-primary' : 'text-foreground/60 hover:text-foreground'}`}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('authority')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${accountType === 'authority' ? 'bg-background shadow text-primary' : 'text-foreground/60 hover:text-foreground'}`}
                  >
                    Official / NGO
                  </button>
                </div>
              )}

              {isLogin && (
                <>
                  <button type="button" onClick={handleGoogleSignup} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-200 mb-6">
                    <img src={google} alt="Google" className='w-5 h-5' />
                    <span className="font-medium text-foreground">Continue with Google</span>
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-border" /><span className="text-foreground/50 text-sm">or</span><div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}
            </div>

            {/* FORM WRAPPER - This handles the scrolling of inputs ONLY */}
            <form action={formAction} className="flex flex-col flex-1 min-h-0">
              <input type="hidden" name="mode" value={isLogin ? "login" : (accountType === 'authority' ? 'registerAuthority' : 'register')} />

              {/* SCROLLABLE INNER SECTION - Added pb-20 so dropdowns don't get hidden under the scroll frame */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 pb-20 pt-2">

                {/* COMMON FIELDS: Name & Email */}
                {!isLogin && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">{accountType === 'authority' ? "Representative Name" : "Name"}</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required />
                      </div>
                    </div>

                    {accountType === 'authority' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Organization / NGO Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input type="text" name="organizationName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. GreenEarth NGO" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">{accountType === 'authority' ? "Official Email" : "Email"}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input type="email" name="email" value={emailInput} onChange={handleEmailChange} placeholder="email@domain.com" className="w-full pl-11 pr-24 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required />

                        {accountType === 'citizen' && isValidEmail && !emailVerified && !showOtpInput && (
                          <button type="button" onClick={handleVerifyEmail} disabled={emailVerificationRequested} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-teal-800 text-white text-sm rounded-lg hover:bg-teal-700">
                            {emailVerificationRequested ? <MiniLoader className="w-4 h-4" /> : "Verify"}
                          </button>
                        )}
                        {accountType === 'citizen' && emailVerified && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" /><span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {accountType === 'citizen' && showOtpInput && (
                      <div className="space-y-4">
                        <div className="flex gap-2 justify-center">
                          {emailVerificationCode.map((digit, index) => (
                            <input key={index} id={`otp-${index}`} type="text" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className="w-10 h-10 md:w-12 md:h-12 text-center text-lg font-semibold rounded-xl border bg-card/50 focus:border-primary focus:ring-2 outline-none" maxLength={1} />
                          ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button type="button" onClick={handleVerifyOtp} disabled={emailVerificationCode.join("").length !== 6 || isOTPVerifying} className="px-6 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50">
                            {isOTPVerifying ? <MiniLoader className="size-5" /> : "Verify"}
                          </button>
                          <button type="button" onClick={() => { handleVerifyEmail(); setTimer(30); setIsTimerRunning(true); }} disabled={isTimerRunning} className="px-6 py-2 border rounded-lg hover:bg-muted disabled:opacity-50">
                            {isTimerRunning ? `Resend (${timer}s)` : 'Resend'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* USERNAME (Only for Login & Citizen) */}
                {(isLogin || accountType === 'citizen') && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">{isLogin ? "Username / Email" : "Username"}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input type="text" name="userName" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="username" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:border-primary focus:ring-2 outline-none" required={isLogin || accountType === 'citizen'} />
                    </div>
                  </div>
                )}

                {/* AUTHORITY SPECIFIC DROPDOWNS & UPLOAD */}
                {!isLogin && accountType === 'authority' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4 relative z-30">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Type</label>
                        <input type="hidden" name="role" value={role} required />
                        <CustomSelect value={role} onChange={setRole} options={roleOptions} placeholder="Select Type" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Department Focus</label>
                        <input type="hidden" name="departmentName" value={departmentName} required />
                        <CustomSelect value={departmentName} onChange={setDepartmentName} options={categories} placeholder="Select Sector" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-20">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Assigned State</label>
                        <input type="hidden" name="assignedState" value={assignedState} required />
                        <CustomSelect
                          value={assignedState}
                          onChange={handleStateChange}
                          options={stateOptions}
                          placeholder="Select State"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Assigned District</label>
                        <input type="hidden" name="assignedDistrict" value={assignedDistrict} required />
                        <CustomSelect
                          value={assignedDistrict}
                          onChange={setAssignedDistrict}
                          options={districtOptions}
                          placeholder={assignedState ? "Select District" : "Select State First"}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Expertise Tags (Optional)</label>
                      <input type="text" name="expertiseTags" value={expertiseTags} onChange={(e) => setExpertiseTags(e.target.value)} placeholder="Roads, Sanitation, etc." className="w-full px-4 py-2.5 rounded-xl border bg-card/50 focus:border-primary outline-none text-sm" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">ID Proof / Registration Document</label>
                      <div className="relative">
                        <input type="hidden" name="idProofUrl" value={idProofUrl} required />

                        <div className="flex items-center gap-3 w-full px-4 py-2 rounded-xl border border-border bg-card/50">
                          <FileUp className="w-5 h-5 text-primary shrink-0" />
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            className="w-full text-sm text-foreground/70 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                          />
                          {isUploadingFile && <MiniLoader className="w-5 h-5 text-primary shrink-0" />}
                          {idProofUrl && !isUploadingFile && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CITIZEN GENDER */}
                {!isLogin && accountType === 'citizen' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <input type="hidden" name="gender" value={gender} required />
                    <CustomSelect value={gender} onChange={setGender} options={genderOptions} placeholder="Select Gender" />
                  </div>
                )}

                {/* PASSWORD (STRICTLY HIDDEN FOR AUTHORITY) */}
                {(isLogin || accountType === 'citizen') && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:border-primary outline-none" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {isLogin && (
                      <div className="flex justify-end mt-1">
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot Password?</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FIXED BOTTOM SECTION (Submit Button & Footer Links) */}
              {/* flex-shrink-0 keeps it permanently pinned to the bottom of the card */}
              <div className="flex-shrink-0 pt-3 border-t border-border/20 mt-auto bg-background/50 backdrop-blur-sm -mx-4 -mb-4 px-4 pb-4 md:-mx-8 md:-mb-8 md:px-8 md:pb-8">

                {!isLogin && (
                  <p className="text-xs text-foreground/60 text-center pb-3">
                    By proceeding, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </p>
                )}

                <button type="submit" disabled={isPending || (!isLogin && accountType === 'citizen' && !emailVerified) || (accountType === 'authority' && !idProofUrl && !isLogin)} className="w-full btn-gradient py-3 rounded-xl font-semibold text-white flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {isPending ? <MiniLoader className='size-5' /> : (isLogin ? "Sign In" : (accountType === 'authority' ? "Submit Application" : "Create Account"))}
                </button>

                <p className="text-center mt-4 text-foreground/70 text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={isPending} className="text-primary hover:text-primary/80 font-semibold ml-1">
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;