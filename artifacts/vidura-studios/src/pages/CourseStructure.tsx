import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronDown, ChevronRight, Video, BookOpen, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CourseStructure() {
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);

  const toggleModule = (id: number) => {
    if (expandedModules.includes(id)) {
      setExpandedModules(expandedModules.filter(m => m !== id));
    } else {
      setExpandedModules([...expandedModules, id]);
    }
  };

  const courseData = {
    title: "Data Structures & Algorithms",
    stats: {
      modules: 16,
      topics: 64,
      totalLength: "14.5 hours"
    },
    modules: [
      {
        id: 1,
        title: "Module 1: Complexity Analysis",
        topicCount: 4,
        topics: [
          { id: 101, title: "Big O Notation Fundamentals", duration: "12m", type: "Video", icon: Video },
          { id: 102, title: "Time vs Space Complexity", duration: "8m", type: "Reading", icon: BookOpen },
          { id: 103, title: "Analyzing Nested Loops", duration: "15m", type: "Video", icon: Video },
          { id: 104, title: "Common Complexities Cheat Sheet", duration: "5m", type: "Reading", icon: FileText }
        ]
      },
      {
        id: 2,
        title: "Module 2: Arrays & Strings",
        topicCount: 3,
        topics: [
          { id: 201, title: "Memory Allocation of Arrays", duration: "10m", type: "Video", icon: Video },
          { id: 202, title: "Two-Pointer Technique", duration: "18m", type: "Video", icon: Video },
          { id: 203, title: "Sliding Window Patterns", duration: "14m", type: "Reading", icon: BookOpen }
        ]
      },
      {
        id: 3,
        title: "Module 3: Linked Lists",
        topicCount: 4,
        topics: [
          { id: 301, title: "Singly vs Doubly Linked", duration: "11m", type: "Video", icon: Video },
          { id: 302, title: "Reversal Algorithms", duration: "16m", type: "Video", icon: Video },
          { id: 303, title: "Detecting Cycles (Floyd's)", duration: "9m", type: "Video", icon: Video },
          { id: 304, title: "Memory Management", duration: "7m", type: "Reading", icon: BookOpen }
        ]
      },
      {
        id: 4,
        title: "Module 4: Stacks & Queues",
        topicCount: 2,
        topics: [
          { id: 401, title: "LIFO vs FIFO Implementations", duration: "14m", type: "Video", icon: Video },
          { id: 402, title: "Monotonic Stacks", duration: "22m", type: "Video", icon: Video }
        ]
      }
    ]
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        <div>
          <h1 className="text-3xl font-extrabold mb-4">{courseData.title}</h1>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] text-sm font-semibold border border-border">{courseData.stats.modules} Modules</span>
            <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] text-sm font-semibold border border-border">{courseData.stats.topics} Topics</span>
            <span className="px-4 py-1.5 rounded-full bg-[#F0F4F4] text-sm font-semibold border border-border flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {courseData.stats.totalLength}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {courseData.modules.map(module => {
            const isExpanded = expandedModules.includes(module.id);
            return (
              <div key={module.id} className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-[#F0F4F4]/50 transition-colors"
                  data-testid={`btn-toggle-module-${module.id}`}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h2 className="text-lg font-bold">{module.title}</h2>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground bg-[#F0F4F4] px-3 py-1 rounded-md">
                    {module.topicCount} Topics
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border bg-[#fafcfc]">
                    {module.topics.map((topic, idx) => (
                      <div 
                        key={topic.id} 
                        className={cn(
                          "px-8 py-4 flex items-center justify-between hover:bg-black/5 transition-colors",
                          idx !== module.topics.length - 1 ? "border-b border-border/50" : ""
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
                            <topic.icon className="h-4 w-4 text-[#004D40]" />
                          </div>
                          <span className="font-semibold text-foreground">{topic.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-border text-muted-foreground">
                            {topic.duration}
                          </span>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#004D40]/10 text-[#004D40]">
                            {topic.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <button 
            className="w-full py-4 rounded-xl bg-[#CCAC00] text-black font-extrabold text-lg hover:bg-[#b39700] transition-colors shadow-md flex items-center justify-center gap-2"
            data-testid="btn-automate-production"
          >
            <Video className="h-6 w-6" /> Automate Full Course Production
          </button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            This will lock the structure and begin generating scripts for all {courseData.stats.topics} topics.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
