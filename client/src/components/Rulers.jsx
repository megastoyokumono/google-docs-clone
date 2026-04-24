import { useEffect, useId, useRef, useState } from "react";

export function HorizontalRuler({ leftMargin, rightMargin, onChange, pageWidth = 816 }) {
  const rulerRef = useRef(null);
  const patternId = useId();
  const [dragging, setDragging] = useState(null); // 'left' or 'right'

  useEffect(() => {
    if (!dragging) return;

    function handleMouseMove(e) {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(pageWidth, e.clientX - rect.left));

      if (dragging === "left") {
        const newLeft = Math.min(x, pageWidth - rightMargin - 36); // Ensure left doesn't cross right
        onChange({ left: Math.round(newLeft), right: rightMargin });
      } else if (dragging === "right") {
        const newRight = Math.min(pageWidth - x, pageWidth - leftMargin - 36);
        onChange({ left: leftMargin, right: Math.round(newRight) });
      }
    }

    function handleMouseUp() {
      setDragging(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, leftMargin, onChange, pageWidth, rightMargin]);

  const leftPos = leftMargin;
  const rightPos = pageWidth - rightMargin;
  const printableWidth = rightPos - leftPos;
  const markerCount = Math.max(1, Math.floor(pageWidth / 72));

  return (
    <div
      ref={rulerRef}
      className="relative flex h-[16px] overflow-hidden border border-[#dadce0] bg-white font-mono text-[9px] text-[#5f6368] shadow-sm select-none"
      style={{ width: `${pageWidth}px` }}
    >
      <svg width={pageWidth} height="16" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width="72" height="16" patternUnits="userSpaceOnUse">
            <line x1="9" y1="10" x2="9" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="18" y1="10" x2="18" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="27" y1="10" x2="27" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="36" y1="6" x2="36" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="45" y1="10" x2="45" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="54" y1="10" x2="54" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="63" y1="10" x2="63" y2="16" stroke="#dadce0" strokeWidth="1" />
            <line x1="72" y1="0" x2="72" y2="16" stroke="#dadce0" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Gray background for non-printable areas (margins) */}
        <rect x="0" y="0" width={pageWidth} height="16" fill="#f1f3f4" />
        
        {/* White background for printable area */}
        <rect x={leftPos} y="0" width={printableWidth} height="16" fill="white" />

        {/* Static Ruler ticks covering everything */}
        <rect x="0" y="0" width={pageWidth} height="16" fill={`url(#${patternId})`} />

        {/* Margin dividers */}
        <line x1={leftPos} y1="0" x2={leftPos} y2="16" stroke="#dadce0" strokeWidth="1" />
        <line x1={rightPos} y1="0" x2={rightPos} y2="16" stroke="#dadce0" strokeWidth="1" />

        {/* Numbers */}
        {[...Array(markerCount)].map((_, i) => (
          <text key={i} x={(i + 1) * 72 - 3} y="11" fill="#5f6368">{i + 1}</text>
        ))}
      </svg>
      
      {/* Margin Indicators */}
      <div
        className="absolute top-0 bottom-0 w-[8px] bg-[#1a73e8] rounded-sm cursor-col-resize hover:bg-[#1765cc] opacity-80"
        style={{ left: (leftPos - 4) + "px" }}
        onMouseDown={(e) => { e.preventDefault(); setDragging("left"); }}
      />
      <div
        className="absolute top-0 bottom-0 w-[8px] bg-[#1a73e8] rounded-sm cursor-col-resize hover:bg-[#1765cc] opacity-80"
        style={{ left: (rightPos - 4) + "px" }}
        onMouseDown={(e) => { e.preventDefault(); setDragging("right"); }}
      />
    </div>
  );
}

export function VerticalRuler({ topMargin, bottomMargin, onChange, pageHeight = 1056 }) {
  const rulerRef = useRef(null);
  const patternId = useId();
  const [dragging, setDragging] = useState(null); // 'top' or 'bottom'

  useEffect(() => {
    if (!dragging) return;

    function handleMouseMove(e) {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(pageHeight, e.clientY - rect.top));

      if (dragging === "top") {
        const newTop = Math.min(y, pageHeight - bottomMargin - 36);
        onChange({ top: Math.round(newTop), bottom: bottomMargin });
      } else if (dragging === "bottom") {
        const newBottom = Math.min(pageHeight - y, pageHeight - topMargin - 36);
        onChange({ top: topMargin, bottom: Math.round(newBottom) });
      }
    }

    function handleMouseUp() {
      setDragging(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [bottomMargin, dragging, onChange, pageHeight, topMargin]);

  const topPos = topMargin;
  const bottomPos = pageHeight - bottomMargin;
  const printableHeight = bottomPos - topPos;
  const markerCount = Math.max(1, Math.floor(pageHeight / 72));

  return (
    <div
      ref={rulerRef}
      className="w-[16px] bg-white border border-[#dadce0] relative overflow-hidden text-[#5f6368] font-mono text-[9px] flex-shrink-0 shadow-sm select-none"
      style={{ minHeight: `${pageHeight}px` }}
    >
      <svg width="16" height={pageHeight} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} x="0" y="0" width="16" height="72" patternUnits="userSpaceOnUse">
            <line x1="10" y1="9" x2="16" y2="9" stroke="#dadce0" strokeWidth="1" />
            <line x1="10" y1="18" x2="16" y2="18" stroke="#dadce0" strokeWidth="1" />
            <line x1="10" y1="27" x2="16" y2="27" stroke="#dadce0" strokeWidth="1" />
            <line x1="6" y1="36" x2="16" y2="36" stroke="#dadce0" strokeWidth="1" />
            <line x1="10" y1="45" x2="16" y2="45" stroke="#dadce0" strokeWidth="1" />
            <line x1="10" y1="54" x2="16" y2="54" stroke="#dadce0" strokeWidth="1" />
            <line x1="10" y1="63" x2="16" y2="63" stroke="#dadce0" strokeWidth="1" />
            <line x1="0" y1="72" x2="16" y2="72" stroke="#dadce0" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Gray background for non-printable areas */}
        <rect x="0" y="0" width="16" height={pageHeight} fill="#f1f3f4" />
        
        {/* White background for printable area */}
        <rect x="0" y={topPos} width="16" height={printableHeight} fill="white" />

        {/* Static Ruler ticks covering everything */}
        <rect x="0" y="0" width="16" height={pageHeight} fill={`url(#${patternId})`} />

        {/* Margin dividers */}
        <line x1="0" y1={topPos} x2="16" y2={topPos} stroke="#dadce0" strokeWidth="1" />
        <line x1="0" y1={bottomPos} x2="16" y2={bottomPos} stroke="#dadce0" strokeWidth="1" />

        {/* Numbers */}
        {[...Array(markerCount)].map((_, i) => (
          <text key={i} x="5" y={(i + 1) * 72 + 3} fill="#5f6368">{i + 1}</text>
        ))}
      </svg>
      
      {/* Visual indicators for margins */}
      <div
        className="absolute left-0 right-0 h-[8px] bg-[#1a73e8] rounded-sm cursor-row-resize hover:bg-[#1765cc] opacity-80"
        style={{ top: (topPos - 4) + "px" }}
        onMouseDown={(e) => { e.preventDefault(); setDragging("top"); }}
      />
      <div
        className="absolute left-0 right-0 h-[8px] bg-[#1a73e8] rounded-sm cursor-row-resize hover:bg-[#1765cc] opacity-80"
        style={{ top: (bottomPos - 4) + "px" }}
        onMouseDown={(e) => { e.preventDefault(); setDragging("bottom"); }}
      />
    </div>
  );
}
