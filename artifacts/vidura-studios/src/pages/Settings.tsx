import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import UserAvatar from "@/components/UserAvatar";
import { useAuth, getInitials } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Camera } from "lucide-react";
import { uploadAvatar } from "@/lib/database";

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const blockNextProfileSync = useRef(false);

  const [theme, setTheme] = useState(getStoredTheme);
  const [emailReports, setEmailReports] = useState(
    () => localStorage.getItem("vidura_email_reports") !== "false"
  );
  const [alerts, setAlerts] = useState(
    () => localStorage.getItem("vidura_alerts") !== "false"
  );

  useEffect(() => {
    if (!profile) return;
    if (blockNextProfileSync.current) {
      blockNextProfileSync.current = false;
      return;
    }
    setFullName(profile.full_name || "");
    setEmail(profile.email || user?.email || "");
    setAvatarUrl(profile.avatar_url ?? null);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please pick an image under 5 MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      // Show immediately in UI without waiting for full profile re-fetch
      setAvatarUrl(url);
      blockNextProfileSync.current = true;
      const { error } = await updateProfile({ avatar_url: url });
      if (error) throw error;
      toast({ title: "Profile photo updated" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Reset so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    blockNextProfileSync.current = true;

    const { error, saved } = await updateProfile({ full_name: fullName, email });
    setSaving(false);

    if (error) {
      blockNextProfileSync.current = false;
      toast({
        title: "Failed to save changes",
        description: error.message.includes("email")
          ? "Email change requires inbox confirmation — check your email for a verification link."
          : error.message,
        variant: "destructive",
      });
    } else if (saved) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast({ title: "Profile saved", description: `Name updated to "${fullName}"` });
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
            {/* Clickable avatar with camera overlay */}
            <div className="relative group shrink-0">
              <UserAvatar
                avatarUrl={uploadingAvatar ? null : avatarUrl}
                name={fullName || profile?.full_name || "VS"}
                className="h-24 w-24 border-4 border-[#F0F4F4] dark:border-muted"
                fallbackClassName="text-3xl"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-[#004D40] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                aria-label="Change profile photo"
                data-testid="btn-change-avatar"
              >
                <Camera className="h-7 w-7 text-white" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                data-testid="input-avatar-upload"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{fullName || "Your Name"}</h2>
              <p className="text-muted-foreground text-lg mb-1">{role}</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs text-[#004D40] dark:text-[#00BFA5] font-semibold hover:underline mb-3 disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading…" : "Change profile photo"}
              </button>
              <br />
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
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : null}
                  {saving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}
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
