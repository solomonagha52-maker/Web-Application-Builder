import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import logoPath from "@assets/logo_1777977950187.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: "Login failed",
        description:
          error.message.includes("Invalid login")
            ? "Incorrect email or password. Please try again."
            : error.message,
        variant: "destructive",
      });
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img src={logoPath} alt="Vidura Studios" className="h-10 object-contain cursor-pointer" />
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-login-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-login-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-[#004D40] text-white font-semibold hover:bg-[#003d33] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="btn-login-submit"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <span className="h-px bg-border flex-1" />
          <span className="px-4 text-xs text-muted-foreground">OR</span>
          <span className="h-px bg-border flex-1" />
        </div>

        <button
          className="mt-4 w-full py-3 rounded-md bg-white border border-[#E5E7EB] font-medium flex items-center justify-center gap-3 hover:bg-black/5 transition-colors text-sm"
          data-testid="btn-login-google"
          onClick={() =>
            toast({ title: "Google sign-in not configured", description: "Connect Google OAuth in your Supabase dashboard." })
          }
        >
          <SiGoogle className="text-lg" />
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#004D40] font-semibold hover:underline" data-testid="link-to-signup">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
