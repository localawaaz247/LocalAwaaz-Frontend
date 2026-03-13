/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, EyeOff, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import logo from "/logo.png";
import MiniLoader from '../components/MiniLoader';
import { showToast } from '../utils/toast';
import axiosInstance from '../utils/axios';
import SEO from '../components/SEO'; // <-- Added SEO Import

const ForgotPassword = () => {
    const navigate = useNavigate();

    // Flow State
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetToken, setResetToken] = useState("");

    // Timer State for OTP
    const [timer, setTimer] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const handleRequestOtp = async (e) => {
        e?.preventDefault();
        if (!identifier) {
            return showToast({ icon: "warning", title: "Please enter your email or username" });
        }
        try {
            setIsLoading(true);
            const { data } = await axiosInstance.post(`${import.meta.env.VITE_BASE_URL}/reset-password/verify-user`, { identifier });
            showToast({ icon: "success", title: data.message });
            setStep(2);
            setTimer(60);
            setIsTimerRunning(true);
        } catch (error) {
            showToast({
                icon: "error",
                title: error.response?.data?.message || "Failed to send OTP"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            return showToast({ icon: "warning", title: "Please enter a 6-digit OTP" });
        }
        try {
            setIsLoading(true);
            const { data } = await axiosInstance.post(`${import.meta.env.VITE_BASE_URL}/reset-password/verify-otp`, {
                identifier,
                otp: otpString
            });
            showToast({ icon: "success", title: "OTP Verified!" });
            setResetToken(data.resetToken);
            setStep(3);
        } catch (error) {
            showToast({
                icon: "error",
                title: error.response?.data?.message || "Invalid OTP"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e?.preventDefault();
        if (password !== confirmPassword) {
            return showToast({ icon: "warning", title: "Passwords do not match" });
        }
        try {
            setIsLoading(true);
            const { data } = await axiosInstance.patch(`${import.meta.env.VITE_BASE_URL}/reset-password/update?resetToken=${resetToken}`, {
                identifier,
                password
            });
            showToast({ icon: "success", title: data.message });
            navigate('/login');
        } catch (error) {
            showToast({
                icon: "error",
                title: error.response?.data?.message || "Failed to reset password"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length <= 1 && /^[0-9]*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    return (
        <div className="h-screen bg-background flex relative overflow-hidden">
            {/* 🟢 SEO Metadata */}
            <SEO
                title="Reset Password"
                description="Recover your LocalAwaaz account. Follow the secure steps to verify your identity and reset your password."
                url="/forgot-password"
            />

            {/* Left Design Section */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-texture">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-32 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                        Secure Your <br />
                        <span className="text-gradient">Account</span>
                    </h2>
                    <p className="text-lg text-foreground/70 mb-12 max-w-md">
                        Don't worry, it happens to the best of us. Let's get you back into your account securely and quickly.
                    </p>
                </div>
            </div>

            {/* 🟢 Right Form Section: Adjusted for Perfect Vertical Centering */}
            <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-4 md:p-8 relative">
                <div className="w-full max-w-md relative z-10 flex flex-col">

                    <Link to="/login" className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4 group w-max">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>

                    <div className="glass-card md:p-8 p-6 rounded-2xl shadow-2xl">
                        <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2">
                            Reset Password
                        </h1>
                        <p className="text-foreground/60 text-center lg:text-left mb-8 text-sm">
                            {step === 1 && "Enter your email or username to receive a verification code."}
                            {step === 2 && "Enter the 6-digit code sent to your email."}
                            {step === 3 && "Create a new strong password for your account."}
                        </p>

                        {/* STEP 1: REQUEST OTP */}
                        {step === 1 && (
                            <form onSubmit={handleRequestOtp} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-foreground">Username / Email</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-gradient py-3 mt-4 rounded-xl font-semibold text-white flex justify-center items-center"
                                >
                                    {isLoading ? <MiniLoader className='size-5' /> : "Send Reset Link"}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: VERIFY OTP */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="flex gap-2 justify-center">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-semibold rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            maxLength={1}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={otp.join("").length !== 6 || isLoading}
                                        className="w-full btn-gradient py-3 rounded-xl font-semibold text-white flex justify-center items-center disabled:opacity-50"
                                    >
                                        {isLoading ? <MiniLoader className='size-5' /> : "Verify Code"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRequestOtp()}
                                        disabled={isTimerRunning || isLoading}
                                        className="w-full py-3 border border-border rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground text-sm"
                                    >
                                        {isTimerRunning ? `Resend Code in ${timer}s` : 'Resend Code'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 3: NEW PASSWORD */}
                        {step === 3 && (
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-foreground">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
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
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-gradient py-3 mt-2 rounded-xl font-semibold text-white flex justify-center items-center"
                                >
                                    {isLoading ? <MiniLoader className='size-5' /> : "Update Password"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;