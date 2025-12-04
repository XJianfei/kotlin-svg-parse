import React, { useState } from 'react';
import { TabOption } from './types';
import { ParserPlayground } from './components/ParserPlayground';
import { SolutionViewer } from './components/SolutionViewer';
import { Code, Play, Terminal } from 'lucide-react';

// Default bad example provided by user
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <g id="组_2777" data-name="组 2777" transform="translate(18154.615 -1267.51)">
        <path id="路径_1798" data-name="路径 1798" d="M15,27.692A12.8,12.8,0,0,1,2.308,15,12.805,12.805,0,0,1,15,2.308,12.8,12.8,0,0,1,27.692,15,12.8,12.8,0,0,1,15,27.692M15,0A15,15,0,1,0,30,15,14.97,14.97,0,0,0,15,0m4.154,10.846a1.115,1.115,0,0,0-1.615,0L15,13.385l-2.538-2.538a1.142,1.142,0,0,0-1.615,1.615L13.385,15l-2.538,2.538a1.142,1.142,0,0,0,1.615,1.615L15,16.615l2.538,2.538a1.142,1.142,0,0,0,1.615-1.615L16.615,15l2.538-2.538a1.115,1.115,0,0,0,0-1.615" transform="translate(-18149.721 1272.405)" fill="#333"/>
        <rect id="矩形_1743" data-name="矩形 1743" width="40" height="40" transform="translate(-18154.615 1267.51)" fill="#999" opacity="0"/>
    </g>
</svg>`;

const App: React.FC = () => {
  const [svgInput, setSvgInput] = useState(DEFAULT_SVG);
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.SOLUTION);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Terminal className="text-emerald-400" size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Kotlin SVG Logic Fixer</h1>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Fixing <code>pathData</code> collision in string parsing
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          
          {/* Left Column: Input */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
               <label className="text-sm font-medium text-slate-400">Input SVG Content</label>
               <button 
                onClick={() => setSvgInput(DEFAULT_SVG)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
               >
                 Reset to Example
               </button>
            </div>
            
            <textarea
              value={svgInput}
              onChange={(e) => setSvgInput(e.target.value)}
              className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-lg font-mono text-xs sm:text-sm leading-relaxed text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              placeholder="Paste your SVG here..."
              spellCheck={false}
            />
          </div>

          {/* Right Column: Output / Solution */}
          <div className="flex flex-col h-full gap-4">
             {/* Tabs */}
             <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800 w-fit">
                <button
                  onClick={() => setActiveTab(TabOption.SOLUTION)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === TabOption.SOLUTION 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Code size={16} />
                  Fixed Kotlin Code
                </button>
                <button
                  onClick={() => setActiveTab(TabOption.PLAYGROUND)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === TabOption.PLAYGROUND 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Play size={16} />
                  Live Test
                </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-hidden">
                {activeTab === TabOption.SOLUTION ? (
                  <SolutionViewer />
                ) : (
                  <ParserPlayground inputSvg={svgInput} />
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
