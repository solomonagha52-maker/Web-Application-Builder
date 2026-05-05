import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import logoPath from "@assets/logo_1777977950187.png";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message.includes("already registered")
          ? "This email is already registered. Try logging in."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Check your email to confirm your account, then log in.",
      });
      setLocation("/login");
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm my-8">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img src={logoPath} alt="Vidura Studios" className="h-10 object-contain cursor-pointer" />
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Create Your Account</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Start building your courses today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              required
              autoComplete="name"
              className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="Dr. Victoria Stone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-signup-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-signup-email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-signup-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-shadow text-sm"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-signup-confirm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-md bg-[#004D40] text-white font-semibold hover:bg-[#003d33] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="btn-signup-submit"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <span className="h-px bg-border flex-1" />
          <span className="px-4 text-xs text-muted-foreground">OR</span>
          <span className="h-px bg-border flex-1" />
        </div>

        <button
          className="mt-4 w-full py-3 rounded-md bg-white border border-[#E5E7EB] font-medium flex items-center justify-center gap-3 hover:bg-black/5 transition-colors text-sm"
          data-testid="btn-signup-google"
          onClick={() =>
            toast({ title: "Google sign-up not configured", description: "Connect Google OAuth in your Supabase dashboard." })
          }
        >
          <SiGoogle className="text-lg" />
          Sign up with Google
        </button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[#004D40] font-semibold hover:underline" data-testid="link-to-login">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
