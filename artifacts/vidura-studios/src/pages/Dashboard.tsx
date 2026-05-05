import { UploadCloud } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "wouter";

export default function Dashboard() {
  const projects = [
    { id: 1, title: "Introduction to Organic Chemistry", subject: "Chemistry", progress: 80, modules: 12, lastUpdated: "2 hours ago" },
    { id: 2, title: "Modern European History 101", subject: "History", progress: 45, modules: 8, lastUpdated: "1 day ago" },
    { id: 3, title: "Data Structures & Algorithms", subject: "Computer Science", progress: 15, modules: 16, lastUpdated: "3 days ago" },
    { id: 4, title: "Macroeconomics Principles", subject: "Economics", progress: 100, modules: 10, lastUpdated: "1 week ago" }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Dr. Stone</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your courses today.</p>
        </div>

        <div 
          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl bg-white p-12 flex flex-col items-center justify-center text-center hover:bg-black/5 hover:border-[#004D40] transition-colors cursor-pointer"
          data-testid="pdf-drop-zone"
        >
          <div className="h-16 w-16 bg-[#F0F4F4] rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="h-8 w-8 text-[#004D40]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Curriculum PDF</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Drag and drop your syllabus, textbook chapters, or lecture notes here. We'll automatically structure it into a course.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white border border-border rounded-xl p-6 flex flex-col hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#F0F4F4] text-xs font-medium text-foreground mb-3">
                      {project.subject}
                    </span>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{project.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{project.lastUpdated}</span>
                </div>
                
                <div className="mt-auto pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{project.modules} Modules</span>
                      <span className="font-semibold text-foreground">{project.progress}% Complete</span>
                    </div>
                    <div className="h-2 w-full bg-[#F0F4F4] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#004D40] rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link href="/course-structure">
                    <button 
                      className="w-full py-2.5 rounded-md bg-[#004D40] text-white font-medium hover:bg-[#003d33] transition-colors"
                      data-testid={`btn-continue-project-${project.id}`}
                    >
                      Continue
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
