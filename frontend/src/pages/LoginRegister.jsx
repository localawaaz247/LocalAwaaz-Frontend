/* eslint-disable no-unused-vars */
import {  useEffect, useState,useFormState, useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, ArrowLeft, UserCircle, Check, Megaphone, Users, MessageCircle, Shield, ArrowRight } from 'lucide-react';
import google from "/google.png";
import logo from "/logo.png"
import { cscApi } from '../util/cscAPI';
import authAction from '../actions/authAction';
import {useDispatch} from "react-redux"
import Loader from '../components/Loader';


const LoginRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [countries, setCountries] = useState([]);
   const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  
  const dispatch=useDispatch();
  const navigate=useNavigate();
  const [country,setCountry]=useState("");
  const [state,setState]=useState("");
  const [city,setCity]=useState("");
  const [pincode,setPinCode]=useState("");
  
  // const [verifyEmail, setVerifyEmail] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  
    const [result, formAction, isPending]=useActionState((prev,formData)=>authAction(prev,formData,dispatch,navigate), null);


  const handleFormAction = async (formData) => {
  const res = await formAction(formData);

  // ✅ clear local states AFTER submit
  setCountry("");
  setCountryCode("");
  setState("");
  setStateCode("");
  setCity("");
  setPinCode("");

  return res;
};

   
  

  useEffect(()=>{
      cscApi.get("/countries")
    .then((res)=>{
      setCountries(res.data)})
    .catch((err)=>{
      console.log(err);
    })
   
  },[])
 useEffect(() => {
    if (!countryCode) return;
    cscApi.get(`/countries/${countryCode}/states`)
      .then(res => {
        setStates(res.data);
        setCities([]);
      });
  }, [countryCode]);

  useEffect(() => {
    if (!stateCode) return;

    cscApi.get(
      `/countries/${countryCode}/states/${stateCode}/cities`
    ).then((res) => {
      setCities(res.data)})
    .catch((err)=>console.log(err));
  }, [stateCode]);
  


 

 
 
  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
  };

  const features = [
    { icon: Megaphone, text: 'Amplify your local voice' },
    { icon: Users, text: 'Connect with your community' },
    { icon: MessageCircle, text: 'Share stories that matter' },
    { icon: Shield, text: 'Safe & trusted platform' },
  ];


  if(isPending){
    return <Loader/>
  }
  

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-texture">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{ 
            backgroundImage: 'linear-gradient(hsla(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(var(--primary) / 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl  flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-3xl font-bold text-white">
                <img src={logo} alt='/'/>
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

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground/80 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

         
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto flex items-start justify-center p-6 lg:p-12 relative">

        {/* Background decoration for mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10 py-4">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Signup Card */}
          <div className="glass-card p-8 rounded-2xl h-full mb-8">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              <div className="w-12 h-12 rounded-xl  flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  <img src={logo} alt='/'/>
                </span>
              </div>
              <span className="text-2xl font-bold font-display text-gradient">
                LocalAwaaz
              </span>
            </div>

            <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-4">
              {isLogin ?<div className='flex gap-2 items-center
              '> Sign In <ArrowRight/> </div> :"Create Account"}
            </h1>
            {!isLogin && <p className="text-foreground/60 text-center lg:text-left mb-3">
              Join the community and make your voice heard
            </p>}

            {/* Google Signup */}
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-200 mb-6"
            > <img src={google} alt="/" className='w-5 h-5'/>
              <span className="font-medium text-foreground">
                Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-foreground/50 text-sm">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Signup/SignIn Form */}
            <form  action={handleFormAction} className="space-y-2">
              {/* Name Row */}

              <input
              type="hidden"
              name="mode"
              value={isLogin ? "login" : "register"}
                    />
                <input type="hidden" name="country" value={country} />
                <input type="hidden" name="state" value={state} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="pincode" value={pincode} />

             { !isLogin && <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="text"
                      name="name"
                      placeholder="John"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                
              </div>}

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {isLogin? "Username/Email":"Username"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    name="userName"
                    placeholder="username"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

             {!isLogin &&  <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
                {/* {canVerifyEmail && (
                  <div className="mt-3 space-y-2">
                    {!emailVerificationRequested ? (
                      <button
                        type="button"
                        onClick={() => setEmailVerificationRequested(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-card transition-all duration-200"
                      >
                        <span className="font-medium text-foreground text-sm">Verify email</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-foreground/60 text-center">
                          Enter the verification code sent to your email
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailVerificationCode}
                            onChange={(e) => setEmailVerificationCode(e.target.value)}
                            placeholder="Verification code"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                          <button
                            type="button"
                            disabled={!emailVerificationCode.trim()}
                            onClick={() => setEmailVerified(true)}
                            className="px-4 py-2.5 rounded-xl btn-gradient font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {emailVerified && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-primary" />
                    Email verified
                  </div>
                )} */}
              </div>}

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder=" password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

                    

               {!isLogin && <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Gender
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    required
                  >
                    <option value="" className='rounded-lg' >Select Gender</option>
                    <option value={"male"} className='rounded-lg'>Male</option>
                    <option value={"female"}>Female</option>
                    <option value="other">Other</option>
                  </select>
                 
                </div>
              </div>}

              {!isLogin && <div className='w-full grid grid-cols-2 gap-4 '>
                 
                 <div className='mt-2 '>
                  <label className='text-sm font-medium text-foreground mb-2'>Country</label>
                  <div className="relative">
                    <select
                     name='countryCode'
                     value={countryCode}
                     onChange={(e) => {
                      const selected = countries.find(
                          (c) => c.iso2 === e.target.value
                         );
                       setCountry(selected.name)
                      setCountryCode(selected.iso2)}}
                     className='w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    > 
                     <option value="">Select Country</option>
                      {countries && countries.map((country)=>{
                        return <option name={country.name} key={country.iso2} value={country?.iso2}>
                          {country.name} (+{country.phonecode})
                         </option>
                      })}
                    </select>
                    <input type="hidden" name="country" value={country} />
                  </div>
                 </div>

                 <div className='mt-2'>
                  <label className='text-sm font-medium text-foreground'>State</label>
                  <div className='relative'>
                    <select
                     name='stateCode'
                     value={stateCode}
                     onChange={(e) => {
                       const selected = states.find(
                          (s) => s.iso2 === e.target.value
                         );
                       setState(selected.name)
                      setStateCode(selected.iso2)}}
                     className='w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    >
                      <option value=""> Select State</option>
                        {states && states.map((s)=> 
                        <option  key={s.iso2} value={s.iso2}>{s.name}</option>
                      ) }
                    </select>
                    <input type="hidden" name="state" value={state} />
                  </div>
                 </div>

                  <div className='mt-2'>
                  <label className='text-sm font-medium text-foreground'>City</label>
                  <div className='relative'>
                    <select
                     name='city'
                     value={city}
                     onChange={(e)=>setCity(e.target.value)}
                     className='w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    >
                      <option value=""> Select City</option>

                       {cities && cities.map((city)=>{
                        return <option  key={city.id} value={city.name}>{city.name}</option>
                       })}

                      
                    </select>
                  </div>
                 </div>

                 <div className='mt-2'>
                  <label className='text-foreground text-sm font-medium'>
                    Pin Code
                  </label>
                  <div>
                    <input
                     type='text'
                     name='pinCode'
                     placeholder='pincode'
                     value={pincode}
                     onChange={(e) => {
                       const value = e.target.value.replace(/[^0-9]/g, '');
                        setPinCode(value);
                     }}
                     className='w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    >
                    </input>
                  </div>
                 </div>

              </div>}

       
              
             <div className='py-1'> {/* Terms */}
              <p className="text-xs text-foreground/60 text-center  ">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
              </div>

              <button
                type="submit"
                className="w-full btn-gradient py-3 rounded-xl font-semibold text-white"
              >
               { isPending ? "Loading..." : isLogin ? "Sign In " : "Create Account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center mt-3 text-foreground/70">
              Already have an account?{' '}
              <button
                onClick={()=>setIsLogin(!isLogin)}
                disabled={isPending}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
              {isPending ? "Loading...": isLogin ?  "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
