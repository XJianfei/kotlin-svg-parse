import React, { useState, useEffect, useRef } from 'react';
import { parseSvgContentFixed } from '../utils/parserLogic';
import { SvgAttributes } from '../types';
import { AlertCircle, CheckCircle, Eye } from 'lucide-react';

interface Props {
  inputSvg: string;
}

export const ParserPlayground: React.FC<Props> = ({ inputSvg }) => {
  const [result, setResult] = useState<SvgAttributes | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsing Effect
  useEffect(() => {
    try {
      const data = parseSvgContentFixed(inputSvg);
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult(null);
    }
  }, [inputSvg]);

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

      // Optional: Draw bounding box
      // ctx.strokeStyle = '#334155';
      // ctx.lineWidth = 1 / scale;
      // ctx.strokeRect(vbX, vbY, vbW, vbH);

      // 3. Draw Paths
      if (result.paths.length > 0) {
        result.paths.forEach((d) => {
          try {
            const p = new Path2D(d);
            
            // Fill
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Emerald 500, 20% opacity
            ctx.fill(p);
            
            // Stroke
            ctx.strokeStyle = '#10b981'; // Emerald 500
            ctx.lineWidth = 1.5 / scale; // Consistent hairline width
            ctx.stroke(p);
          } catch (err) {
            // Ignore invalid paths
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
  }, [result]);

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Explanation Card */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex-shrink-0">
        <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
          <CheckCircle size={18} />
          Logic Fixed
        </h4>
        <p className="text-slate-300 text-sm mb-1">
          The extraction logic correctly identifies <code>d="..."</code> attributes while ignoring partial matches like <code>id="..."</code>.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        
        {/* Visual Preview */}
        <div className="flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye size={14} />
                    Canvas Visualization
                </span>
                <span className="text-[10px] text-slate-500">
                    *Transforms ignored
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
                        No paths to render
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
                        {result.paths.map((p, i) => (
                        <li key={i} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono text-slate-300 break-all hover:bg-slate-900 transition-colors cursor-default group">
                            <span className="text-orange-400 mr-2 select-none group-hover:text-orange-300">[{i}]</span>
                            {p.substring(0, 100)}{p.length > 100 ? '...' : ''}
                        </li>
                        ))}
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
