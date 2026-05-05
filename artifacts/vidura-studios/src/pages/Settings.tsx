import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Settings() {
  const [theme, setTheme] = useState(false);
  const [emailReports, setEmailReports] = useState(true);
  const [alerts, setAlerts] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="bg-white border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-[#F0F4F4]">
              <AvatarFallback className="bg-[#004D40] text-white text-3xl font-bold">VS</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Dr. Victoria Stone</h2>
              <p className="text-muted-foreground text-lg mb-3">Course Director</p>
              <span className="inline-block px-3 py-1 rounded-md bg-[#CCAC00]/10 text-[#CCAC00] text-sm font-bold border border-[#CCAC00]/20">
                Institutional Tier
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Identity Column */}
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">Identity</h3>
            
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Dr. Victoria Stone"
                  className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-[#F0F4F4]"
                  data-testid="input-settings-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="dr.stone@university.edu"
                  className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] bg-[#F0F4F4]"
                  data-testid="input-settings-email"
                />
              </div>
              
              <div className="pt-2">
                <button type="button" className="text-sm font-bold text-[#004D40] hover:underline" data-testid="btn-update-avatar">
                  Update Avatar Photo
                </button>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors"
                  data-testid="btn-save-settings"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* System Preferences Column */}
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 border-b border-border pb-4">System Preferences</h3>
            
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Interface Theme</h4>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the studio</p>
                </div>
                <button 
                  onClick={() => setTheme(!theme)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${theme ? 'bg-[#004D40]' : 'bg-[#E5E7EB]'}`}
                  data-testid="toggle-theme"
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-sm ${theme ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Email Reports</h4>
                  <p className="text-sm text-muted-foreground">Weekly course generation summaries</p>
                </div>
                <button 
                  onClick={() => setEmailReports(!emailReports)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${emailReports ? 'bg-[#004D40]' : 'bg-[#E5E7EB]'}`}
                  data-testid="toggle-email"
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-sm ${emailReports ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Real-time Alerts</h4>
                  <p className="text-sm text-muted-foreground">Notifications when AI processing finishes</p>
                </div>
                <button 
                  onClick={() => setAlerts(!alerts)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${alerts ? 'bg-[#004D40]' : 'bg-[#E5E7EB]'}`}
                  data-testid="toggle-alerts"
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-sm ${alerts ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold mb-2">Region Server</h4>
                <div className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] bg-[#F0F4F4] text-sm font-medium">
                  North America (US-East)
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <button 
                  className="text-red-600 font-bold hover:text-red-700 hover:underline transition-colors"
                  data-testid="btn-sign-out"
                >
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
