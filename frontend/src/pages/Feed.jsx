


import {
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getChosenLocation, formatLocationDisplay } from "../utils/locationUtils";
import LocationModal from "../components/LocationModal";

const Feed = () => {
  const [chosenLocation, setChosenLocation] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    const savedLocation = getChosenLocation()
    setChosenLocation(savedLocation)
  }, [])

  const displayLocation = chosenLocation ? formatLocationDisplay(chosenLocation) : "Lucknow"

  const handleLocationUpdate = () => {
    const updatedLocation = getChosenLocation()
    setChosenLocation(updatedLocation)
  }

  return (
    <div className="bg-texture min-h-screen ">
      {/* HEADER (same as previous – NOT navbar) */}
      <div className="px-6 py-4 sticky top-2 glass-card z-50 rounded-lg border-0 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">{displayLocation}</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} />
              {chosenLocation?.country || "Uttar Pradesh, India"}
              <button 
                className="ml-2 text-accent font-medium transition-colors hover:text-accent/80"
                onClick={() => setShowLocationModal(true)}
              >
                Change Area
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm bg-accent text-accent-foreground px-3 py-1 rounded-full border border-accent/30">
              ● 12 Active Issues in your area
            </span>
            <button className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-xl">
              <Plus size={16} />
              New Issue
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="mt-6 mx-6 rounded-2xl glass-card p-8 text-card-foreground">
        <div className="w-full flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-gradient">
              Community-Verified Local Issues
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
              Track, report, and resolve civic issues in your neighborhood
              with the power of community verification.
            </p>

            <div className="flex gap-4">
              <HeroBadge label="24 Resolved This Month" />
              <HeroBadge label="1,247 Active Citizens" />
            </div>
          </div>

          <div className="hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29tcHV0ZXJ8ZW58MHx8MHx8fDA%3D"
              alt="hero"
              className="rounded-xl shadow-lg h-56"
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="-mt-6 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<CheckCircle2 className="text-secondary" />}
            label="Resolved This Month"
            value="24"
          />
          <StatCard
            icon={<Clock className="text-secondary" />}
            label="Pending Verification"
            value="8"
          />
          <StatCard
            icon={<Users className="text-accent" />}
            label="Community Impact"
            value="High"
          />
        </div>
      </div>

      {/* PRIORITY ISSUES */}
      <div className="px-6 mt-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">
            Priority Issues in Your Area
          </h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-border bg-card text-card-foreground text-sm hover:bg-muted transition-colors">
              Newest
            </button>
            <button className="btn-gradient px-4 py-2 rounded-xl text-sm">
              Most Impactful
            </button>
          </div>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                    {/* Card 1 */}
        <IssueCard
          status="Open"
          category="Infrastructure"
          title="Large Pothole on 12th Main Road"
          description="A severe pothole has developed near the junction, causing traffic slowdowns and posing a risk to two-wheelers."
          location="Near Sony Signal"
          confirmed="42"
          impact="89"
          action="Confirm"
          actionType="primary"
          image="https://images.unsplash.com/photo-1560782202-154b39d57ef2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />

        {/* Card 2 */}
        <IssueCard
          status="Under Review"
          category="Sanitation"
          title="Garbage Accumulation in Park"
          description="Waste collection has been missed for 3 days straight at the 4th block community park entrance."
          location="Community Park, 4th Block"
          confirmed="156"
          impact="94"
          action="Authority Reviewing"
          actionType="warning"
          image="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
          verified
        /> 
        <IssueCard
          status="Under Review"
          category="Sanitation"
          title="Garbage Accumulation in Park"
          description="Waste collection has been missed for 3 days straight at the 4th block community park entrance."
          location="Community Park, 4th Block"
          confirmed="156"
          impact="94"
          action="Authority Reviewing"
          actionType="warning"
          image="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
          verified
        />
        <IssueCard
          status="Open"
          category="Infrastructure"
          title="Large Pothole on 12th Main Road"
          description="A severe pothole has developed near the junction, causing traffic slowdowns and posing a risk to two-wheelers."
          location="Near Sony Signal"
          confirmed="42"
          impact="89"
          action="Confirm"
          actionType="primary"
          image="https://images.unsplash.com/photo-1560782202-154b39d57ef2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />

      </div>
      </div>
      
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          handleLocationUpdate()
        }}
      />
    </div>
  );
};

export default Feed;

/* ---------------- COMPONENTS ---------------- */

const HeroBadge = ({ label }) => (
  <div className="glass-card px-4 py-2 rounded-full text-sm text-foreground/80 backdrop-blur">
    {label}
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="glass-card p-5 rounded-xl flex gap-4 items-center hover:shadow-lg transition-all">
    <div className="p-3 bg-muted rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const IssueCard = ({
  status,
  color,
  category,
  title,
  description,
  image,
  location,
  confirmed,
  impact,
  action,
  primary,
  verified,
}) => {
  const colors = {
    red: "bg-destructive/10 text-destructive border border-destructive/20",
    yellow: "bg-secondary/20 text-secondary border border-secondary/30",
    green: "bg-accent/20 text-accent border border-accent/30",
  };

  return (
    <div className="glass-card p-5 rounded-xl hover:shadow-lg transition-all">
      <div className="flex justify-between mb-3">
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${colors[color]}`}>
            {status}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {category}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">2 hrs ago</span>
      </div>

      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{description}</p>

      <img
        src={image}
        alt="issue"
        className="h-40 w-full rounded-lg object-cover mb-3"
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MapPin size={14} />
        {location}
        {verified && (
          <span className="flex items-center gap-1 text-accent ml-2">
            <ShieldCheck size={14} />
            Verified User
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-6 text-sm">
          <span className="text-foreground">
            <strong>{confirmed}</strong> Confirmed
          </span>
          <span className="text-foreground">
            <strong>{impact}</strong> Impact
          </span>
        </div>

        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            primary
              ? "btn-gradient"
              : "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"
          }`}
        >
          {action}
        </button>
      </div>
    </div>
  );
};
