import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlayCircle, Download, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScriptGenerator() {
  const [activeModule, setActiveModule] = useState(1);

  const modules = [
    { id: 1, title: "1. Foundations of Algorithms" },
    { id: 2, title: "2. Data Structures Primer" },
    { id: 3, title: "3. Sorting & Searching" },
    { id: 4, title: "4. Dynamic Programming" }
  ];

  const scenes = [
    {
      id: 1,
      title: "Scene 1: Introduction",
      visualCue: "Display an animated sorting algorithm working on a bar chart array.",
      script: "Welcome to module 3. Today we're diving into one of the most fundamental concepts in computer science: sorting. Imagine you have a massive library of unsorted books—finding what you need is impossible. Sorting algorithms give us the power to organize chaos efficiently."
    },
    {
      id: 2,
      title: "Scene 2: The Naive Approach",
      visualCue: "Show a person manually comparing two books at a time, looking frustrated.",
      script: "The most intuitive way to sort is often the slowest. Bubble sort, for instance, compares adjacent elements and swaps them if they're in the wrong order. It gets the job done, but as your dataset grows, the time it takes grows exponentially."
    },
    {
      id: 3,
      title: "Scene 3: Divide and Conquer",
      visualCue: "Visual split of the bar chart array into smaller halves, merging back together sorted.",
      script: "But what if we split the problem in half? And then in half again? Merge sort uses a 'divide and conquer' strategy. By breaking the list down into single elements and merging them back in order, we dramatically reduce the total comparisons needed."
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-hidden border-t border-border">
        
        {/* Left Panel */}
        <div className="w-64 bg-[#F0F4F4] border-r border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border sticky top-0 bg-[#F0F4F4]">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#004D40]" />
              Course Modules
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {modules.map(mod => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  activeModule === mod.id 
                    ? "bg-white border-l-4 border-[#004D40] shadow-sm text-[#004D40]" 
                    : "hover:bg-black/5 text-foreground"
                )}
                data-testid={`btn-select-module-${mod.id}`}
              >
                {mod.title}
              </button>
            ))}
          </div>
        </div>

        {/* Center Panel */}
        <div className="flex-1 bg-white flex flex-col overflow-y-auto">
          <div className="p-8 max-w-3xl mx-auto w-full space-y-8 pb-32">
            {scenes.map((scene) => (
              <div key={scene.id} className="group relative bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm hover:border-[#004D40]/30 transition-colors">
                <h3 className="font-bold text-lg mb-4">{scene.title}</h3>
                
                <div className="bg-[#F0F4F4] p-4 rounded-md mb-4 border border-border/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Visual Cue</span>
                  <p className="text-sm italic text-foreground/80">{scene.visualCue}</p>
                </div>
                
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#004D40] mb-2 block">Voiceover Script</span>
                  <p className="text-base leading-relaxed text-foreground" contentEditable suppressContentEditableWarning>
                    {scene.script}
                  </p>
                </div>
              </div>
            ))}

            <button 
              className="w-full py-4 border-2 border-dashed border-[#004D40] text-[#004D40] rounded-xl font-semibold hover:bg-[#004D40]/5 transition-colors"
              data-testid="btn-add-scene"
            >
              + Add Scene to Module
            </button>
          </div>

          <div className="p-4 bg-white border-t border-border mt-auto sticky bottom-0">
            <div className="max-w-3xl mx-auto">
              <button 
                className="w-full py-3 rounded-md bg-[#004D40] text-white font-bold hover:bg-[#003d33] transition-colors"
                data-testid="btn-finalize-module"
              >
                Finalize and Lock Module
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 bg-[#F0F4F4] border-l border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg mb-6">Audio Preview</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
              <button 
                className="h-16 w-16 bg-[#CCAC00] rounded-full flex items-center justify-center hover:bg-[#b39700] transition-colors shadow-md mb-4"
                data-testid="btn-play-audio"
              >
                <PlayCircle className="h-8 w-8 text-white fill-current" />
              </button>
              
              <span className="text-sm font-semibold bg-black/5 px-3 py-1 rounded-full mb-4">Neural Voice Pro</span>
              
              <div className="w-full space-y-2 mb-6">
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-[#004D40] w-1/3 rounded-full"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>0:45</span>
                  <span>2:15</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2">
                <button 
                  className="py-2 text-xs font-semibold rounded-md border border-[#004D40] text-[#004D40] hover:bg-black/5 transition-colors flex items-center justify-center gap-1"
                  data-testid="btn-resync"
                >
                  <RefreshCw className="h-3 w-3" /> Resync
                </button>
                <button 
                  className="py-2 text-xs font-semibold rounded-md bg-[#CCAC00] text-black hover:bg-[#b39700] transition-colors flex items-center justify-center gap-1 shadow-sm"
                  data-testid="btn-export-audio"
                >
                  <Download className="h-3 w-3" /> Export
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-bold text-lg mb-4">Visual Storyboard</h2>
            <div className="space-y-4">
              {[1, 2, 3].map(frame => (
                <div key={frame} className="bg-border/30 rounded-lg aspect-video flex items-center justify-center border border-border">
                  <span className="text-muted-foreground text-sm font-medium">Frame {frame} placeholder</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
