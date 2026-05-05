import { Link, useLocation } from "wouter";
import { useState } from "react";
import logoPath from "@assets/logo_1777977950187.png";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#F0F4F4] p-8 shadow-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img src={logoPath} alt="Vidura Studios Logo" className="h-10 object-contain cursor-pointer" />
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow"
              placeholder="dr.stone@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              data-testid="input-login-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              data-testid="input-login-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 rounded-md bg-[#004D40] text-white font-semibold hover:bg-[#003d33] transition-colors"
            data-testid="btn-login-submit"
          >
            Login
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <span className="h-px bg-border flex-1"></span>
          <span className="px-4 text-sm text-muted-foreground">OR</span>
          <span className="h-px bg-border flex-1"></span>
        </div>

        <button 
          className="mt-6 w-full py-3 rounded-md bg-white border border-[#E5E7EB] font-medium flex items-center justify-center gap-3 hover:bg-black/5 transition-colors"
          data-testid="btn-login-google"
          onClick={() => setLocation("/dashboard")}
        >
          <SiGoogle className="text-xl" />
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#004D40] font-semibold hover:underline" data-testid="link-to-signup">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
