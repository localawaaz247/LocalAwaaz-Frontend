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
  { label: 'Other', value: "OTHER" }, // Added OTHER
];

const roleOptions = [
  { label: 'Govt Official', value: 'official' },
  { label: 'NGO', value: 'ngo' },
  { label: 'Other', value: 'other' } // Added OTHER
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
  const [accountType, setAccountType] = useState('citizen');

  // Form States (Common)
  const [name, setName] = useState("");
  const [userName, setUserName] = useState(""); // Only used for Login now
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  // Form States (Authority Specific)
  const [role, setRole] = useState("official");
  const [otherRole, setOtherRole] = useState(""); // Custom Role
  const [organizationName, setOrganizationName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [otherDepartment, setOtherDepartment] = useState(""); // Custom Department
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

  const [tempUploadToken, setTempUploadToken] = useState("");

  useEffect(() => {
    cscApi.get("/countries/IN/states")
      .then((res) => setStatesList(res.data))
      .catch((err) => console.error("Failed to load states:", err));
  }, []);

  useEffect(() => {
    if (!assignedState) {
      setDistrictsList([]);
      return;
    }
    const selectedStateObj = statesList.find(s => s.name === assignedState);
    if (selectedStateObj) {
      cscApi.get(`/countries/IN/states/${selectedStateObj.iso2}/cities`)
        .then((res) => setDistrictsList(res.data))
        .catch((err) => console.error("Failed to load districts:", err));
    }
  }, [assignedState, statesList]);

  const handleStateChange = (newStateName) => {
    setAssignedState(newStateName);
    setAssignedDistrict("");
  };

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
      if (profileDetail.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, profileDetail, navigate]);

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
      setRole("official");
      setOtherRole("");
      setOrganizationName("");
      setDepartmentName("");
      setOtherDepartment("");
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

    if (emailVerified || showOtpInput) {
      setEmailVerified(false);
      setShowOtpInput(false);
      setEmailVerificationRequested(false);
      setEmailVerificationCode(['', '', '', '', '', '']);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setEmailVerificationRequested(true);
      await axiosInstance.post(`/otp/request`, { email: emailInput }); // No userName needed!
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
        const res = await axiosInstance.post(`/otp/verify`, { email: emailInput, otp }); // No userName needed!
        if (res.data.tempUploadToken) {
          setTempUploadToken(res.data.tempUploadToken);
        }
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);

    try {
      setIsUploadingFile(true);
      const res = await axiosInstance.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${tempUploadToken}`
        }
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

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col items-center justify-center p-3 md:p-6 lg:p-12 relative">
        <div className="w-full max-w-md max-h-[95vh] flex flex-col relative">

          <Link to="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4 group flex-shrink-0">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          <div className="glass-card flex flex-col flex-1 overflow-hidden md:p-8 p-4 rounded-2xl w-full">

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

            <form action={formAction} className="flex flex-col flex-1 min-h-0">
              <input type="hidden" name="mode" value={isLogin ? "login" : (accountType === 'authority' ? 'registerAuthority' : 'register')} />

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 pb-20 pt-2">

                {/* LOGIN SPECIFIC (Shows Username instead of split fields) */}
                {isLogin && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Username / Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input type="text" name="userName" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="username" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:border-primary focus:ring-2 outline-none" />
                    </div>
                  </div>
                )}

                {/* REGISTRATION FIELDS (Common: Name -> Email -> OTP) */}
                {!isLogin && (
                  <>
                    {/* 1. Name */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">{accountType === 'authority' ? "Representative Name" : "Name"}</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" />
                      </div>
                    </div>

                    {/* 2. Email + Verification Button */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">{accountType === 'authority' ? "Official Email" : "Email"}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input
                          type="email"
                          name="email"
                          value={emailInput}
                          onChange={handleEmailChange}
                          readOnly={emailVerified}
                          placeholder="email@domain.com"
                          className="w-full pl-11 pr-24 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none disabled:opacity-60 disabled:bg-muted/50 disabled:cursor-not-allowed"
                        />

                        {/* Universal Verify Button */}
                        {isValidEmail && !emailVerified && !showOtpInput && (
                          <button type="button" onClick={handleVerifyEmail} disabled={emailVerificationRequested} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-teal-800 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors">
                            {emailVerificationRequested ? <MiniLoader className="w-4 h-4" /> : "Verify"}
                          </button>
                        )}
                        {/* Universal Verified Checkmark */}
                        {emailVerified && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" /><span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Universal OTP Input Block */}
                    {showOtpInput && (
                      <div className="space-y-4 p-3 bg-muted/20 rounded-xl border border-border">
                        <div className="flex gap-2 justify-center">
                          {emailVerificationCode.map((digit, index) => (
                            <input key={index} id={`otp-${index}`} type="text" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className="w-10 h-10 md:w-12 md:h-12 text-center text-lg font-semibold rounded-xl border bg-card focus:border-primary focus:ring-2 outline-none shadow-sm" maxLength={1} />
                          ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button type="button" onClick={handleVerifyOtp} disabled={emailVerificationCode.join("").length !== 6 || isOTPVerifying} className="px-6 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 transition-colors">
                            {isOTPVerifying ? <MiniLoader className="size-5" /> : "Confirm OTP"}
                          </button>
                          <button type="button" onClick={() => { handleVerifyEmail(); setTimer(30); setIsTimerRunning(true); }} disabled={isTimerRunning} className="px-6 py-2 border border-border bg-card rounded-lg hover:bg-muted disabled:opacity-50 transition-colors text-foreground text-sm font-medium">
                            {isTimerRunning ? `Resend in ${timer}s` : 'Resend'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* CITIZEN SPECIFIC FIELDS */}
                {!isLogin && accountType === 'citizen' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <input type="hidden" name="gender" value={gender} />
                    <CustomSelect value={gender} onChange={setGender} options={genderOptions} placeholder="Select Gender" />
                  </div>
                )}

                {/* AUTHORITY SPECIFIC FIELDS */}
                {!isLogin && accountType === 'authority' && (
                  <div className="space-y-4 pt-2">

                    {/* 4. Type (Role) */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Type of Authority</label>
                      <input type="hidden" name="role" value={role} />
                      <CustomSelect value={role} onChange={setRole} options={roleOptions} placeholder="Select Type" />
                    </div>

                    {/* Conditional: Organization Name (If NGO) */}
                    {role === 'ngo' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Organization / NGO Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input type="text" name="organizationName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. GreenEarth NGO" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required={role === 'ngo'} />
                        </div>
                      </div>
                    )}

                    {/* Conditional: Other Role (If Other) */}
                    {role === 'other' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Specify Custom Role</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input type="text" name="otherRole" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} placeholder="e.g. Independent Journalist" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required={role === 'other'} />
                        </div>
                      </div>
                    )}

                    {/* 5. Department Focus */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Department Focus</label>
                      <input type="hidden" name="departmentName" value={departmentName} />
                      <CustomSelect value={departmentName} onChange={setDepartmentName} options={categories} placeholder="Select Sector" />
                    </div>

                    {/* Conditional: Other Department */}
                    {departmentName === 'OTHER' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Specify Custom Department</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                          <input type="text" name="otherDepartment" value={otherDepartment} onChange={(e) => setOtherDepartment(e.target.value)} placeholder="e.g. Public Transport" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" required={departmentName === 'OTHER'} />
                        </div>
                      </div>
                    )}

                    {/* 6 & 7. Location Grid */}
                    <div className="grid grid-cols-2 gap-4 relative z-20">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Assigned State</label>
                        <input type="hidden" name="assignedState" value={assignedState} />
                        <CustomSelect value={assignedState} onChange={handleStateChange} options={stateOptions} placeholder="Select State" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Assigned District</label>
                        <input type="hidden" name="assignedDistrict" value={assignedDistrict} />
                        <CustomSelect value={assignedDistrict} onChange={setAssignedDistrict} options={districtOptions} placeholder={assignedState ? "Select District" : "Select State First"} />
                      </div>
                    </div>

                    {/* 8. Expertise Tags */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Expertise Tags (Optional)</label>
                      <input type="text" name="expertiseTags" value={expertiseTags} onChange={(e) => setExpertiseTags(e.target.value)} placeholder="Roads, Sanitation, etc." className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none text-sm" />
                    </div>

                    {/* 9. ID Proof Upload */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">ID Proof / Registration Document</label>
                      <div className="relative">
                        <input type="hidden" name="idProofUrl" value={idProofUrl} />
                        <div className="flex items-center gap-3 w-full px-4 py-2 rounded-xl border border-border bg-card/50">
                          <FileUp className="w-5 h-5 text-primary shrink-0" />
                          <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="w-full text-sm text-foreground/70 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" />
                          {isUploadingFile && <MiniLoader className="w-5 h-5 text-primary shrink-0" />}
                          {idProofUrl && !isUploadingFile && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* COMMON PASSWORD (Used for Login & Citizen Signup) */}
                {/* STRICTLY HIDDEN for Authority Registration */}
                {(isLogin || accountType === 'citizen') && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 outline-none" />
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

              {/* FIXED BOTTOM SECTION */}
              <div className="flex-shrink-0 pt-3 border-t border-border/20 mt-auto bg-background/50 backdrop-blur-sm -mx-4 -mb-4 px-4 pb-4 md:-mx-8 md:-mb-8 md:px-8 md:pb-8">

                {!isLogin && (
                  <p className="text-xs text-foreground/60 text-center pb-3">
                    By proceeding, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </p>
                )}

                {/* Submit button enforces OTP verification for ALL non-login paths */}
                <button type="submit" disabled={isPending || (!isLogin && !emailVerified) || (accountType === 'authority' && !idProofUrl && !isLogin)} className="w-full btn-gradient py-3 rounded-xl font-semibold text-white flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
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