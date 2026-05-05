import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, getInitials } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function getStoredTheme(): boolean {
  return localStorage.getItem("vidura_theme") === "dark";
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("vidura_theme", dark ? "dark" : "light");
}

export default function Settings() {
  const { profile, user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [theme, setTheme] = useState(getStoredTheme);
  const [emailReports, setEmailReports] = useState(
    () => localStorage.getItem("vidura_email_reports") !== "false"
  );
  const [alerts, setAlerts] = useState(
    () => localStorage.getItem("vidura_alerts") !== "false"
  );

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || user?.email || "");
    }
  }, [profile, user]);

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const handleThemeToggle = (dark: boolean) => {
    setTheme(dark);
    applyTheme(dark);
  };

  const handleEmailReports = (v: boolean) => {
    setEmailReports(v);
    localStorage.setItem("vidura_email_reports", String(v));
  };

  const handleAlerts = (v: boolean) => {
    setAlerts(v);
    localStorage.setItem("vidura_alerts", String(v));
  };

  const initials = getInitials(fullName || profile?.full_name || "VS");
  const role = profile?.role || "Course Director";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName, email });
    setSaving(false);
    if (error) {
      toast({
        title: "Failed to save changes",
        description: error.message.includes("email")
          ? "Email change requires confirmation — check your inbox for a verification link."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile updated successfully" });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    applyTheme(false);
    await signOut();
    setLocation("/");
  };

  const Toggle = ({
    value,
    onChange,
    testId,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
    testId: string;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004D40] ${
        value ? "bg-[#004D40]" : "bg-[#E5E7EB] dark:bg-muted"
      }`}
      data-testid={testId}
      aria-checked={value}
      role="switch"
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-sm ${
          value ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile card */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-[#F0F4F4] dark:border-muted">
              <AvatarFallback className="bg-[#004D40] text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{fullName || "Your Name"}</h2>
              <p className="text-muted-foreground text-lg mb-3">{role}</p>
              <span className="inline-block px-3 py-1 rounded-md bg-[#CCAC00]/10 text-[#CCAC00] text-sm font-bold border border-[#CCAC00]/30">
                Institutional Tier
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity */}
          <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 pb-4 border-b border-border">Identity</h3>
            <form className="space-y-5" onSubmit={handleSave}>
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] dark:border-border focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-[#F0F4F4] dark:bg-muted text-foreground text-sm"
                  data-testid="input-settings-name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] dark:border-border focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-[#F0F4F4] dark:bg-muted text-foreground text-sm"
                  data-testid="input-settings-email"
                />
                <p className="text-xs text-muted-foreground mt-1">Email changes require inbox confirmation.</p>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors disabled:opacity-60 flex items-center gap-2"
                  data-testid="btn-save-settings"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* System Preferences */}
          <div className="bg-white dark:bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 pb-4 border-b border-border">System Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Interface Theme</h4>
                  <p className="text-sm text-muted-foreground">
                    {theme ? "Dark mode enabled" : "Light mode enabled"}
                  </p>
                </div>
                <Toggle value={theme} onChange={handleThemeToggle} testId="toggle-theme" />
              </div>

              <div className="pt-2 border-t border-border">
                <h4 className="font-semibold mb-4">Communication</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Email Reports</p>
                      <p className="text-xs text-muted-foreground">Weekly course generation summaries</p>
                    </div>
                    <Toggle value={emailReports} onChange={handleEmailReports} testId="toggle-email" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Real-time Alerts</p>
                      <p className="text-xs text-muted-foreground">Notify when AI processing finishes</p>
                    </div>
                    <Toggle value={alerts} onChange={handleAlerts} testId="toggle-alerts" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <h4 className="font-semibold mb-2 text-sm">Region Server</h4>
                <div className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] dark:border-border bg-[#F0F4F4] dark:bg-muted text-sm font-medium">
                  North America (US-East)
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <button
                  className="text-red-600 font-bold hover:text-red-700 hover:underline transition-colors flex items-center gap-2 text-sm"
                  data-testid="btn-sign-out"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sign Out from Academic Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
