import { Link } from "wouter";
import { motion } from "framer-motion";
import logoPath from "@assets/logo_1777977950187.png";
import { UploadCloud, Zap, ListTree, FileVideo } from "lucide-react";

export default function Landing() {
  const features = [
    {
      title: "PDF Upload",
      description: "Instantly upload and parse your curriculum documents.",
      icon: UploadCloud
    },
    {
      title: "AI Compression",
      description: "Distill complex academic materials into clear summaries.",
      icon: Zap
    },
    {
      title: "Course Structuring",
      description: "Automatically generate logical modules and topics.",
      icon: ListTree
    },
    {
      title: "Script Generation",
      description: "Produce ready-to-record video scripts with visual cues.",
      icon: FileVideo
    }
  ];

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-border">
        <Link href="/">
          <img src={logoPath} alt="Vidura Studios Logo" className="h-8 object-contain cursor-pointer" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="px-5 py-2 rounded-md text-[#004D40] border border-[#004D40] font-medium hover:bg-black/5 transition-colors" data-testid="btn-login-nav">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-5 py-2 rounded-md bg-[#004D40] text-white font-medium hover:bg-[#003d33] transition-colors" data-testid="btn-get-started-nav">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            The Production Studio for <span className="text-[#004D40]">Academic Content</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
            Upload PDFs, structure courses with AI, and generate professional video scripts in minutes. Built for educators who take their curriculum seriously.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <button className="w-full sm:w-auto px-8 py-4 rounded-md bg-[#004D40] text-white font-semibold text-lg hover:bg-[#003d33] transition-colors" data-testid="btn-hero-start">
                Start Creating Free
              </button>
            </Link>
            <Link href="/login">
              <button className="w-full sm:w-auto px-8 py-4 rounded-md text-[#004D40] border border-[#004D40] font-semibold text-lg hover:bg-black/5 transition-colors" data-testid="btn-hero-demo">
                View Demo
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, idx) => (
            <div key={idx} className="bg-[#F0F4F4] p-8 rounded-xl border border-border/50 hover:shadow-md transition-shadow">
              <feature.icon className="h-10 w-10 text-[#004D40] mb-6" />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="h-24 flex items-center justify-center border-t border-border mt-auto">
        <div className="flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
