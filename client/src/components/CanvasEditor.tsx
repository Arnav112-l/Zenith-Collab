"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Pen, Square, Circle, Eraser, Undo, Redo, 
  Trash2, Download, Upload, Save, Type, ArrowRight,
  MousePointer2, Triangle, Hexagon, Star, Pentagon,
  Minus, Sparkles, Image, Brush, Droplet, Search,
  ZoomIn, ZoomOut, Hand, Move
} from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";

type Tool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'select' | 'triangle' | 'hexagon' | 'star' | 'pentagon' | 'ellipse';

interface Point {
  x: number;
  y: number;
}

interface DrawElement {
  id: string;
  type: Tool;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
}

interface CanvasEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function CanvasEditor({ content, onChange, readOnly }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [history, setHistory] = useState<DrawElement[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Load initial data
  useEffect(() => {
    try {
      if (content && content.trim()) {
        const data = JSON.parse(content);
        if (data.elements) {
          setElements(data.elements);
          setHistory([data.elements]);
          setHistoryStep(0);
        }
      }
    } catch (error) {
      console.error('Failed to parse canvas content:', error);
    }
  }, []);

  // Redraw canvas when elements change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });

    // Draw current element being created
    if (currentElement) {
      drawElement(ctx, currentElement);
    }
  }, [elements, currentElement]);

  // Auto-save
  useEffect(() => {
    if (readOnly) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const data = JSON.stringify({ elements });
        onChange(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save canvas:', error);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, onChange, readOnly]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Redraw after resize
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        elements.forEach(element => drawElement(ctx, element));
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [elements]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'pen':
        if (element.points && element.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
        }
        break;

      case 'eraser':
        if (element.points && element.points.length > 0) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        break;

      case 'line':
      case 'arrow':
        if (element.startPoint && element.endPoint) {
          ctx.beginPath();
          ctx.moveTo(element.startPoint.x, element.startPoint.y);
          ctx.lineTo(element.endPoint.x, element.endPoint.y);
          ctx.stroke();

          if (element.type === 'arrow') {
            // Draw arrowhead
            const angle = Math.atan2(
              element.endPoint.y - element.startPoint.y,
              element.endPoint.x - element.startPoint.x
            );
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(element.endPoint.x, element.endPoint.y);
            ctx.lineTo(
              element.endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
              element.endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(element.endPoint.x, element.endPoint.y);
            ctx.lineTo(
              element.endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
              element.endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
        break;

      case 'rectangle':
        if (element.startPoint && element.width && element.height) {
          ctx.strokeRect(element.startPoint.x, element.startPoint.y, element.width, element.height);
        }
        break;

      case 'circle':
        if (element.startPoint && element.width && element.height) {
          const radius = Math.sqrt(Math.pow(element.width, 2) + Math.pow(element.height, 2)) / 2;
          const centerX = element.startPoint.x + element.width / 2;
          const centerY = element.startPoint.y + element.height / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'ellipse':
        if (element.startPoint && element.width && element.height) {
          const radiusX = Math.abs(element.width) / 2;
          const radiusY = Math.abs(element.height) / 2;
          const centerX = element.startPoint.x + element.width / 2;
          const centerY = element.startPoint.y + element.height / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'triangle':
        if (element.startPoint && element.width && element.height) {
          ctx.beginPath();
          ctx.moveTo(element.startPoint.x + element.width / 2, element.startPoint.y);
          ctx.lineTo(element.startPoint.x + element.width, element.startPoint.y + element.height);
          ctx.lineTo(element.startPoint.x, element.startPoint.y + element.height);
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'star':
        if (element.startPoint && element.width && element.height) {
          const cx = element.startPoint.x + element.width / 2;
          const cy = element.startPoint.y + element.height / 2;
          const outerRadius = Math.abs(element.width) / 2;
          const innerRadius = outerRadius * 0.4;
          const points = 5;
          
          ctx.beginPath();
          for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / points - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'hexagon':
        if (element.startPoint && element.width && element.height) {
          const cx = element.startPoint.x + element.width / 2;
          const cy = element.startPoint.y + element.height / 2;
          const radius = Math.abs(element.width) / 2;
          const sides = 6;
          
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'pentagon':
        if (element.startPoint && element.width && element.height) {
          const cx = element.startPoint.x + element.width / 2;
          const cy = element.startPoint.y + element.height / 2;
          const radius = Math.abs(element.width) / 2;
          const sides = 5;
          
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && element.startPoint) {
          ctx.fillStyle = element.color;
          ctx.font = `${element.fontSize || 20}px Arial`;
          ctx.fillText(element.text, element.startPoint.x, element.startPoint.y);
        }
        break;
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    setIsDrawing(true);
    const point = getMousePos(e);

    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newElement: DrawElement = {
          id: Date.now().toString(),
          type: 'text',
          startPoint: point,
          color,
          strokeWidth,
          text,
          fontSize: 20,
        };
        addElement(newElement);
      }
      return;
    }

    const newElement: DrawElement = {
      id: Date.now().toString(),
      type: tool,
      points: tool === 'pen' || tool === 'eraser' ? [point] : undefined,
      startPoint: tool !== 'pen' && tool !== 'eraser' ? point : undefined,
      endPoint: undefined,
      color,
      strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
    };

    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement || readOnly) return;

    const point = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), point],
      });
    } else if (tool === 'line' || tool === 'arrow') {
      setCurrentElement({
        ...currentElement,
        endPoint: point,
      });
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'ellipse' || tool === 'triangle' || tool === 'star' || tool === 'hexagon' || tool === 'pentagon') {
      const width = point.x - (currentElement.startPoint?.x || 0);
      const height = point.y - (currentElement.startPoint?.y || 0);
      setCurrentElement({
        ...currentElement,
        width,
        height,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;
    
    setIsDrawing(false);
    addElement(currentElement);
    setCurrentElement(null);
  };

  const addElement = (element: DrawElement) => {
    const newElements = [...elements, element];
    setElements(newElements);
    
    // Update history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setElements(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setElements(history[historyStep + 1]);
    }
  };

  const handleClear = () => {
    setConfirmation({
      isOpen: true,
      title: "Clear Canvas?",
      message: "This will clear all drawings from the canvas. This action cannot be undone.",
      confirmText: "Clear Canvas",
      isDangerous: true,
      onConfirm: () => {
        setElements([]);
        setHistory([[]]);
        setHistoryStep(0);
      }
    });
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `canvas-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.elements) {
            setElements(data.elements);
            setHistory([data.elements]);
            setHistoryStep(0);
          }
        } catch (error) {
          console.error('Import failed:', error);
          alert('Failed to import canvas data');
        }
      }
    };
    input.click();
  };

  const colors = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f472b6', '#fb7185', '#9ca3af', '#6b7280', '#374151', '#1f2937'
  ];
  const strokeWidths = [1, 2, 3, 4, 6, 8, 12, 16];

  return (
    <div className="h-full w-full bg-[#1a1a1a] relative overflow-hidden flex flex-col">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1F2E] border-b border-[#27272a]">
          {/* Image Section */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={handleUndo}
                disabled={historyStep <= 0}
                className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">Image</span>
          </div>

          <div className="h-12 w-px bg-[#27272a]"></div>

          {/* Tools Section */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded transition-all ${tool === 'pen' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Pen"
              >
                <Pen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded transition-all ${tool === 'eraser' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('text')}
                className={`p-2 rounded transition-all ${tool === 'text' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Text"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all"
                title="Zoom"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">Tools</span>
          </div>

          <div className="h-12 w-px bg-[#27272a]"></div>

          {/* Brushes Section */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <button
                className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all"
                title="Brush"
              >
                <Brush className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('select')}
                className={`p-2 rounded transition-all ${tool === 'select' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Select"
              >
                <MousePointer2 className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">Brushes</span>
          </div>

          <div className="h-12 w-px bg-[#27272a]"></div>

          {/* Shapes Section */}
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-6 gap-1 mb-1">
              <button
                onClick={() => setTool('line')}
                className={`p-1.5 rounded transition-all ${tool === 'line' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Line"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded transition-all ${tool === 'pen' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Freehand"
              >
                <Pen className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('circle')}
                className={`p-1.5 rounded transition-all ${tool === 'circle' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Circle"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`p-1.5 rounded transition-all ${tool === 'rectangle' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Rectangle"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`p-1.5 rounded transition-all text-gray-400 hover:bg-[#27272a] hover:text-white`}
                title="Rounded Rectangle"
              >
                <Square className="w-3.5 h-3.5 rounded" />
              </button>
              <button
                onClick={() => setTool('triangle')}
                className={`p-1.5 rounded transition-all ${tool === 'triangle' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Triangle"
              >
                <Triangle className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setTool('arrow')}
                className={`p-1.5 rounded transition-all ${tool === 'arrow' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Left Arrow"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                onClick={() => setTool('arrow')}
                className={`p-1.5 rounded transition-all ${tool === 'arrow' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Up Arrow"
              >
                <ArrowRight className="w-3.5 h-3.5 -rotate-90" />
              </button>
              <button
                onClick={() => setTool('arrow')}
                className={`p-1.5 rounded transition-all ${tool === 'arrow' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Down Arrow"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button
                onClick={() => setTool('star')}
                className={`p-1.5 rounded transition-all ${tool === 'star' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Star"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('pentagon')}
                className={`p-1.5 rounded transition-all ${tool === 'pentagon' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Pentagon"
              >
                <Pentagon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('hexagon')}
                className={`p-1.5 rounded transition-all ${tool === 'hexagon' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Hexagon"
              >
                <Hexagon className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setTool('arrow')}
                className={`p-1.5 rounded transition-all ${tool === 'arrow' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Right Arrow"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTool('ellipse')}
                className={`p-1.5 rounded transition-all ${tool === 'ellipse' ? 'bg-[#f472b6] text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                title="Ellipse"
              >
                <Circle className="w-3.5 h-3.5 scale-x-150" />
              </button>
              <button className="p-1.5 rounded transition-all text-gray-400 hover:bg-[#27272a] hover:text-white" title="More">
                <span className="text-xs">...</span>
              </button>
            </div>
            <span className="text-xs text-gray-500">Shapes</span>
          </div>

          <div className="h-12 w-px bg-[#27272a]"></div>

          {/* Colours Section */}
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-12 gap-0.5 mb-1">
              {colors.map((c, idx) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-sm border transition-all hover:scale-110 ${color === c ? 'border-2 border-[#f472b6] ring-2 ring-[#f472b6]/30' : 'border-[#27272a]'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Colours</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:bg-red-500 hover:text-white rounded transition-all"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all"
              title="Import"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-400 hover:bg-[#27272a] hover:text-white rounded transition-all"
              title="Export PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Save Indicator */}
      {lastSaved && !readOnly && (
        <div className="absolute bottom-4 right-4 z-[100] px-4 py-2 bg-[#1A1F2E] border border-[#27272a] rounded-lg text-sm text-gray-400 flex items-center gap-2 shadow-lg">
          <Save className="w-4 h-4 text-green-400" />
          Saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Read-only Banner */}
      {readOnly && (
        <div className="absolute top-4 left-4 z-[100] px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm text-yellow-400 shadow-lg">
          View Only Mode - Drawing Disabled
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        isDangerous={confirmation.isDangerous}
      />
    </div>
  );
}
