/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useActionState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, ArrowLeft, UserCircle, Megaphone, Users, MessageCircle, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import google from "/google.png";
import logo from "/logo.png"
import authAction from '../actions/authAction';
import { useDispatch, useSelector } from "react-redux"
import { showToast } from '../utils/toast';
import { BASE_URL } from '../utils/config';
import MiniLoader from '../components/MiniLoader';
import axiosInstance from '../utils/axios';
import SEO from '../components/SEO'; // <-- Added SEO Import

const LoginRegister = () => {
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Form States
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");

  // Toggles & Verification States
  const [isLogin, setIsLogin] = useState(true);
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

  // Redux States
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { profileDetail } = useSelector((state) => state.profile);

  const [result, formAction, isPending] = useActionState((prev, formData) => authAction(prev, formData, dispatch, navigate), null);

  // Auto-Redirect if already logged in
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
      setIsLogin(true); // Switch to login view after successful signup
    }
  }, [result, isLogin]);

  // Timer Logic for OTP
  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");

    // Check if the URL contains ?error=account_suspended or ?error=account_banned
    if (errorParam && errorParam.includes("account_")) {
      const statusText = errorParam.split('_')[1]; // Extracts "suspended" or "banned"

      showToast({
        icon: "error",
        title: `Account ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}. Contact Administrator.`
      });

      // Clean up the URL so the toast doesn't fire again on a manual refresh
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);
  const handleGoogleSignup = () => {
    try {
      window.location.href = `${BASE_URL}/auth/google`;
    } catch (error) {
      console.log(error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setEmailInput(email);
    setIsValidEmail(validateEmail(email));
  };

  const handleVerifyEmail = async () => {
    try {
      const email = emailInput;
      setEmailVerificationRequested(true);
      await axiosInstance.post(`/otp/request`, { email, userName });
      setShowOtpInput(true);
      setEmailVerificationRequested(false);
      setTimer(30);
      setIsTimerRunning(true);
    } catch (error) {
      console.log(error);
      setEmailVerificationRequested(false);
      showToast({ icon: "error", title: error.response?.data?.message || "Failed to send OTP" });
    }
  };

  const handleVerifyOtp = async () => {
    const otp = emailVerificationCode.join('');
    const email = emailInput;

    try {
      if (otp.length === 6) {
        setIsOTPVerifying(true);
        await axiosInstance.post(`/otp/verify`, { email, otp, userName });
        setEmailVerified(true);
        setShowOtpInput(false);
        setShowVerifiedMessage(true);
        setIsOTPVerifying(false);
        setTimeout(() => {
          setShowVerifiedMessage(false);
        }, 5000);
      } else {
        showToast({ icon: "warning", title: "OTP should be exactly 6 digits" });
      }
    } catch (error) {
      console.log(error);
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

  const handleResendOtp = () => {
    handleVerifyEmail(); // Reuse the API call logic
    setTimer(30);
    setIsTimerRunning(true);
  };

  const features = [
    { icon: Megaphone, text: 'Amplify your local voice' },
    { icon: Users, text: 'Connect with your community' },
    { icon: MessageCircle, text: 'Share stories that matter' },
    { icon: Shield, text: 'Safe & trusted platform' },
  ];

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      {/* 🟢 SEO Metadata for Auth Page */}
      <SEO
        title={isLogin ? "Sign In" : "Create Your Account"}
        description={isLogin ? "Sign in to your LocalAwaaz account to report issues and track resolutions." : "Join LocalAwaaz today to make your voice heard and contribute to a better community."}
        url={isLogin ? "/login" : "/register"}
      />

      {/* Left Design Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-texture">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(hsla(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(var(--primary) / 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center md:px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-white">
                <img src={logo} alt='LocalAwaaz Logo' />
              </span>
            </div>
            <span className="text-3xl font-bold font-display text-gradient">
              LocalAwaaz
            </span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
            Join the Movement,<br />
            <span className="text-gradient">Make an Impact</span>
          </h2>

          <p className="text-lg text-foreground/70 mb-12 max-w-md">
            Be part of a growing community that believes in the power of local voices to create meaningful change.
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground/80 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className={`w-full lg:w-1/2 h-screen overflow-y-auto flex items-start justify-center p-3 md:p-6 lg:p-12 relative`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className={`h-full no-scrollbar ${isLogin ? "overflow-hidden" : "py-4 overflow-y-auto"}`}>
          <div className="w-full max-w-md relative z-10">

            <Link to="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            <div className="glass-card md:p-8 p-4 rounded-2xl h-full mb-8">
              <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    <img src={logo} alt='LocalAwaaz Logo' />
                  </span>
                </div>
                <span className="text-2xl font-bold font-display text-gradient">
                  LocalAwaaz
                </span>
              </div>

              <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-4">
                {isLogin ? (
                  <div className="flex gap-2 items-center justify-center lg:justify-start">
                    Sign In <ArrowRight className="w-5 h-5" />
                  </div>
                ) : (
                  "Create Account"
                )}
              </h1>

              {!isLogin && (
                <p className="text-foreground/60 text-center lg:text-left mb-3">
                  Join the community and make your voice heard
                </p>
              )}

              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-200 mb-6"
              >
                <img src={google} alt="Google" className='w-5 h-5' />
                <span className="font-medium text-foreground">Continue with Google</span>
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-foreground/50 text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form action={formAction} className="space-y-3">
                <input type="hidden" name="mode" value={isLogin ? "login" : "register"} />

                {!isLogin && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Name</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input
                          type="text"
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    {isLogin ? "Username / Email" : "Username"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="text"
                      name="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="username"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    {!showOtpInput && (
                      <label className="text-sm font-medium text-foreground">Email</label>
                    )}

                    {!showOtpInput ? (
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input
                          type="email"
                          name="email"
                          value={emailInput}
                          onChange={handleEmailChange}
                          placeholder="john@example.com"
                          className="w-full pl-11 pr-24 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          required
                        />
                        {isValidEmail && !emailVerified && (
                          <button
                            type="button"
                            onClick={handleVerifyEmail}
                            disabled={emailVerificationRequested}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-teal-800 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            <span className="relative inline-flex items-center justify-center">
                              <span className={emailVerificationRequested ? "opacity-0" : "opacity-100"}>
                                Verify
                              </span>
                              {emailVerificationRequested && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <MiniLoader className="w-4 h-4 text-white" />
                                </span>
                              )}
                            </span>
                          </button>
                        )}
                        {emailVerified && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-primary/10 p-3 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" /> Email verification link sent
                        </div>
                        <div className="flex gap-2 justify-center">
                          {emailVerificationCode.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              maxLength={1}
                            />
                          ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={emailVerificationCode.join("").length !== 6 || isOTPVerifying}
                            className="relative px-6 py-2.5 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 transition-colors"
                          >
                            <span className={isOTPVerifying ? "opacity-0" : "opacity-100"}>Verify</span>
                            {isOTPVerifying && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <MiniLoader className="size-5 text-white" />
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isTimerRunning}
                            className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isTimerRunning ? `Resend (${timer}s)` : 'Resend'}
                          </button>
                        </div>
                      </div>
                    )}

                    {showVerifiedMessage && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Email verification successful!
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="flex justify-end mt-1">
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                        Forgot Password?
                      </Link>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                        required
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className='py-2'>
                  <p className="text-xs text-foreground/60 text-center">
                    By proceeding, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full btn-gradient py-3 rounded-xl font-semibold text-white flex justify-center items-center"
                >
                  {isPending ? <MiniLoader className='size-5' /> : (isLogin ? "Sign In" : "Create Account")}
                </button>
              </form>

              <p className="text-center mt-5 text-foreground/70 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={isPending}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors ml-1"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;