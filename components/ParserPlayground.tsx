import React, { useState, useEffect, useRef } from 'react';
import { parseSvgContentFixed, parseSvgContentBuggy } from '../utils/parserLogic';
import { SvgAttributes } from '../types';
import { AlertCircle, CheckCircle, Eye, Bug, AlertTriangle } from 'lucide-react';

interface Props {
  inputSvg: string;
}

export const ParserPlayground: React.FC<Props> = ({ inputSvg }) => {
  const [result, setResult] = useState<SvgAttributes | null>(null);
  const [useFixedLogic, setUseFixedLogic] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsing Effect
  useEffect(() => {
    try {
      // Choose parser based on state
      const parser = useFixedLogic ? parseSvgContentFixed : parseSvgContentBuggy;
      const data = parser(inputSvg);
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult(null);
    }
  }, [inputSvg, useFixedLogic]);

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !result) return;

    const renderCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      // Set canvas dimensions for High DPI
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale context to match coordinate system
      ctx.scale(dpr, dpr);
      
      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. Determine ViewBox
      let vbX = 0, vbY = 0, vbW = 100, vbH = 100;
      if (result.viewBox) {
        const parts = result.viewBox.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
        if (parts.length === 4) {
          [vbX, vbY, vbW, vbH] = parts;
        }
      } else if (result.width && result.height) {
        vbW = parseFloat(result.width) || 100;
        vbH = parseFloat(result.height) || 100;
      }

      // 2. Calculate Scale (Contain Mode)
      // Add padding to container
      const padding = 24; 
      const availW = rect.width - padding * 2;
      const availH = rect.height - padding * 2;
      
      // Prevent division by zero
      if (vbW <= 0) vbW = 100;
      if (vbH <= 0) vbH = 100;

      const scaleX = availW / vbW;
      const scaleY = availH / vbH;
      const scale = Math.min(scaleX, scaleY);

      // Dimensions of the drawn SVG
      const drawW = vbW * scale;
      const drawH = vbH * scale;

      // Centering offset
      const offsetX = (rect.width - drawW) / 2;
      const offsetY = (rect.height - drawH) / 2;

      ctx.save();
      
      // Move to center
      ctx.translate(offsetX, offsetY);
      // Scale
      ctx.scale(scale, scale);
      // Adjust for viewBox origin
      ctx.translate(-vbX, -vbY);

      // 3. Draw Paths
      if (result.paths.length > 0) {
        result.paths.forEach((d) => {
          try {
            // Attempt to create Path2D. This will fail silently or throw for invalid data.
            const p = new Path2D(d);
            
            // Fill
            ctx.fillStyle = useFixedLogic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'; 
            ctx.fill(p);
            
            // Stroke
            ctx.strokeStyle = useFixedLogic ? '#10b981' : '#ef4444'; 
            ctx.lineWidth = 1.5 / scale;
            ctx.stroke(p);
          } catch (err) {
            // Invalid path data (expected behavior for buggy logic)
          }
        });
      }

      ctx.restore();
    };

    renderCanvas();

    const resizeObserver = new ResizeObserver(() => {
      renderCanvas();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [result, useFixedLogic]);

  // Check if we suspect bad data extraction (e.g. ID leakage)
  const isLikelyBuggy = result && result.paths.some(p => !/^[Mm]/.test(p.trim()) && p.length < 100 && !/[0-9]/.test(p));

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Control / Explanation Card */}
      <div className={`p-4 rounded-lg border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${useFixedLogic ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'}`}>
        <div>
          <h4 className={`font-semibold flex items-center gap-2 ${useFixedLogic ? 'text-emerald-400' : 'text-rose-400'}`}>
            {useFixedLogic ? <CheckCircle size={18} /> : <Bug size={18} />}
            {useFixedLogic ? 'Fixed Logic' : 'Original (Buggy) Logic'}
          </h4>
          <p className="text-slate-400 text-xs mt-1">
            {useFixedLogic 
              ? 'Correctly identifies whole-word attributes.' 
              : 'Naively finds the first substring match (e.g. finds "d=" inside "id=").'}
          </p>
        </div>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
           <button 
             onClick={() => setUseFixedLogic(false)}
             className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${!useFixedLogic ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
           >
             Original
           </button>
           <button 
             onClick={() => setUseFixedLogic(true)}
             className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${useFixedLogic ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
           >
             Fixed
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Visual Preview */}
        <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye size={14} />
                    Canvas Visualization
                </span>
            </div>
            <div ref={containerRef} className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                 <canvas 
                    ref={canvasRef} 
                    className="block"
                    style={{ width: '100%', height: '100%' }}
                 />
                 {(!result || result.paths.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-700 text-sm">
                        No paths found
                    </div>
                 )}
                 {result && result.paths.length > 0 && isLikelyBuggy && !useFixedLogic && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-rose-500/80 bg-slate-950/80 p-4 text-center">
                        <AlertTriangle size={32} className="mb-2" />
                        <p className="font-semibold">Render Failed</p>
                        <p className="text-xs max-w-[200px] mt-1">
                          The extracted data "{result.paths[0].substring(0, 15)}..." is not a valid SVG path command.
                        </p>
                    </div>
                 )}
            </div>
        </div>

        {/* Data Inspector */}
        <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Extracted Data
            </div>
            <div className="flex-1 p-4 overflow-auto">
            {result ? (
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-xs text-slate-500 mb-1">ViewBox</span>
                    <span className="font-mono text-emerald-300 text-xs break-all">{result.viewBox || 'null'}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="block text-xs text-slate-500 mb-1">Dimensions</span>
                    <span className="font-mono text-blue-300 text-xs">
                        {result.width || '?'} x {result.height || '?'}
                    </span>
                    </div>
                </div>

                <div>
                    <span className="block text-xs text-slate-500 mb-2">Extracted Paths ({result.paths.length})</span>
                    {result.paths.length === 0 ? (
                    <div className="text-slate-500 text-sm italic">No paths found</div>
                    ) : (
                    <ul className="space-y-2">
                        {result.paths.map((p, i) => {
                            const isSuspicious = !/^[Mm]/.test(p.trim()) && p.length < 50;
                            return (
                                <li key={i} className={`p-3 rounded border text-xs font-mono break-all cursor-default transition-colors ${
                                    isSuspicious && !useFixedLogic 
                                      ? 'bg-rose-950/30 border-rose-900 text-rose-300' 
                                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                                }`}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-slate-500 shrink-0 mt-[1px]">[{i}]</span>
                                        <span>{p.substring(0, 150)}{p.length > 150 ? '...' : ''}</span>
                                    </div>
                                    {isSuspicious && !useFixedLogic && (
                                        <div className="mt-2 text-[10px] text-rose-400 font-sans flex items-center gap-1">
                                            <AlertTriangle size={10} />
                                            Suspected ID leak (Invalid path data)
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    )}
                </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                <AlertCircle className="mr-2" size={16} />
                Unable to parse content
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};
