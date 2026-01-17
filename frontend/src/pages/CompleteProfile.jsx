import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import { cscApi } from '../utils/cscAPI';
import axios from 'axios';
import { BASE_URL } from '../utils/config';
import { useSearchParams } from 'react-router-dom';
import { showToast } from '../utils/toast';

export default function CompleteProfile() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [userName, setUsername] = useState("");
  const [gender, setGender] = useState("");

 const [searchparams]=useSearchParams();
 const token=searchparams.get("params");


  useEffect(() => {
    cscApi.get("/countries")
      .then((res) => {
        setCountries(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

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
      setCities(res.data);
    })
    .catch((err) => console.log(err));
  }, [stateCode]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    // Handle form submission here
     try {
        const res= await axios.post(`${BASE_URL}/users/complete-profile`,{userName,gender,country,state,city,pinCode});
       console.log(res.data);
       showToast({
        icon:"success",
        title:"Profile completed!"
       })
       localStorage.setItem("access_token",token);
     } catch (error) {
        showToast({
            icon:"error",
            title:error?.response.data
        })
        
        console.log(error?.response.data);
     }
  };



  return (
    <div className="h-screen   bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
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

      {/* Card */}
      <div className=" h-[97%] max-w-xl glass-card p-8 rounded-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
            <div className="w-full h-full rounded-full bg-card/50 backdrop-blur flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mt-4">
            Complete your profile
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            Just a few more details to get started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Username
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  const selected = countries.find(
                    (c) => c.iso2 === e.target.value
                  );
                  setCountry(selected?.name || "");
                  setCountryCode(selected?.iso2 || "");
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              >
                <option value="">Select Country</option>
                {countries && countries.map((country) => {
                  return <option key={country.iso2} value={country?.iso2}>
                    {country.name}
                  </option>
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                State
              </label>
              <select
                value={stateCode}
                onChange={(e) => {
                  const selected = states.find(
                    (s) => s.iso2 === e.target.value
                  );
                  setState(selected?.name || "");
                  setStateCode(selected?.iso2 || "");
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              >
                <option value="">Select State</option>
                {states && states.map((s) => 
                  <option key={s.iso2} value={s.iso2}>{s.name}</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              >
                <option value="">Select City</option>
                {cities && cities.map((city) => {
                  return <option key={city.id} value={city.name}>{city.name}</option>
                })}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Pin Code
            </label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setPinCode(value);
              }}
              placeholder="Enter your pin code"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full btn-gradient py-3 rounded-xl font-semibold text-white mt-6"
          >
            Continue
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-foreground/60 mt-6">
            You can update these details later from settings
          </p>
        </form>
      </div>
    </div>
  );
}
