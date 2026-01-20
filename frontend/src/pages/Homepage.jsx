import {
  Home,
  PlusCircle,
  Bell,
  User,
  LayoutDashboard,
  ClipboardList,
  MapPin,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B1220] text-white flex flex-col px-4 py-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center">
            <Home size={20} />
          </div>
          <span className="font-semibold text-lg">LocalAwaz</span>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <SidebarItem icon={Home} label="Home Feed" active />
          <SidebarItem icon={PlusCircle} label="Report Issue" />
          <SidebarItem icon={Bell} label="Notifications" />
          <SidebarItem icon={User} label="My Profile" />

          <div className="mt-6 text-xs text-slate-400">ADMIN</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem icon={ClipboardList} label="Manage Issues" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Indiranagar, Ward 84</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin size={14} /> Bengaluru, Karnataka
              <span className="text-teal-600 cursor-pointer ml-2">
                Change Area
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm">
              12 Active Issues in your area
            </div>
            <button className="px-4 py-2 bg-[#0B1220] text-white rounded-lg">
              + Report Issue
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={CheckCircle}
            label="Resolved This Month"
            value="24"
            color="text-blue-500"
          />
          <StatCard
            icon={Clock}
            label="Pending Verification"
            value="8"
            color="text-orange-500"
          />
          <StatCard
            icon={Users}
            label="Community Impact"
            value="High"
            color="text-emerald-500"
          />
        </div>

        {/* Priority Issues */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Priority Issues</h2>
          <div className="flex gap-2">
            <button className="px-4 py-1 rounded-lg border text-sm">
              Newest
            </button>
            <button className="px-4 py-1 rounded-lg bg-[#0B1220] text-white text-sm">
              Most Impactful
            </button>
          </div>
        </div>

        {/* Issues */}
        <div className="grid grid-cols-2 gap-6">
          <IssueCard
            title="Large Pothole on 12th Main Road"
            description="A severe pothole has developed near the junction, causing traffic slowdowns and posing a risk to two-wheelers."
            status="Open"
            category="Infrastructure"
            confirmed="42"
            impact="89"
            action="Confirm"
          />

          <IssueCard
            title="Garbage Accumulation in Park"
            description="Waste collection has been missed for 3 days straight at the 4th block community park entrance."
            status="Under Review"
            category="Sanitation"
            confirmed="156"
            impact="94"
            action="Authority Reviewing"
            disabled
          />
        </div>
      </main>
    </div>
  );
}

/* ---------- Components ---------- */

function SidebarItem({ icon: Icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
      ${active ? "bg-slate-800" : "hover:bg-slate-800"}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm">
      <div className={`h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function IssueCard({
  title,
  description,
  status,
  category,
  confirmed,
  impact,
  action,
  disabled,
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex gap-2">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs">
          {status}
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
          {category}
        </span>
      </div>

      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-6 text-sm">
          <span>
            <strong>{confirmed}</strong> Confirmed
          </span>
          <span>
            <strong>{impact}</strong> Impact Score
          </span>
        </div>

        <button
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm
            ${
              disabled
                ? "bg-yellow-100 text-yellow-700 cursor-not-allowed"
                : "bg-emerald-500 text-white"
            }`}
        >
          {action}
        </button>
      </div>
    </div>
  );
}
