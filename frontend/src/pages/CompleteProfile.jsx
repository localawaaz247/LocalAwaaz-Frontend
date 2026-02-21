import { useState, useEffect } from "react";
import { UserCircle, MapPin, ArrowRight, User } from "lucide-react";
import { cscApi } from "../utils/cscAPI";
import { BASE_URL } from "../utils/config";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import axiosInstance from "../utils/axios";

export default function CompleteProfile() {
  const [step, setStep] = useState(1);

  const navigate=useNavigate();

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  const [userName, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");



  /* ---------------- API CALLS ---------------- */

  useEffect(() => {
    
    cscApi.get("/countries").then((res) => setCountries(res.data));
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    cscApi.get(`/countries/${countryCode}/states`).then((res) => {
      setStates(res.data);
      setCities([]);
    });
  }, [countryCode]);

  useEffect(() => {
    if (!stateCode) return;
    cscApi
      .get(`/countries/${countryCode}/states/${stateCode}/cities`)
      .then((res) => setCities(res.data));
  }, [stateCode]);



  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    try {
      await axiosInstance.patch(`/users/complete-profile`, {
        userName,
        gender,
        country,
        state,
        city,
        pinCode,
      });
      showToast({ icon: "success", title: "Profile completed!" });
      navigate("/dashboard");
    } catch (error) {
      showToast({
        icon: "error",
        title: error?.response?.data || "Something went wrong",
      });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-texture flex items-center justify-center">
      <div className="w-full max-w-lg glass-card p-8">

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-full mx-1 rounded-full transition-all ${
                step >= s ? "bg-cyan-700" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <UserCircle className="mx-auto w-14 h-14 text-primary" />
              <h2 className="text-2xl font-bold mt-4">Who are you?</h2>
              <p className="text-sm text-muted-foreground">
                Tell us a little about yourself
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  placeholder="Enter your username"
                  value={userName}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Gender
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              disabled={!userName || !gender}
              onClick={() => setStep(2)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <MapPin className="mx-auto w-14 h-14 text-primary" />
              <h2 className="text-2xl font-bold mt-4">Where do you live?</h2>
              <p className="text-sm text-muted-foreground">
                Location helps us personalize better
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Country
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  onChange={(e) => {
                    const c = countries.find((x) => x.iso2 === e.target.value);
                    setCountry(c?.name || "");
                    setCountryCode(c?.iso2 || "");
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                State
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  onChange={(e) => {
                    const s = states.find((x) => x.iso2 === e.target.value);
                    setState(s?.name || "");
                    setStateCode(s?.iso2 || "");
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.iso2} value={s.iso2}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              disabled={!country || !state || !city}
              onClick={() => setStep(3)}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Almost done 🎉</h2>
              <p className="text-sm text-muted-foreground">
                Just one last thing
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Pin Code
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  placeholder="Enter your pin code"
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/50 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <button
              disabled={!pinCode}
              onClick={handleSubmit}
              className="w-full btn-gradient py-3 rounded-xl font-semibold"
            >
              Finish Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
