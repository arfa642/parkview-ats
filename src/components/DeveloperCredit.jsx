import React, { useEffect, useRef } from 'react';

// Obfuscated Encrypted Byte Payloads (Anti-tamper string array)
const _0x4a12 = Object.freeze([
  [68, 69, 86, 69, 76, 79, 80, 69, 68, 32, 66, 89], // "DEVELOPED BY"
  [77, 117, 104, 97, 109, 109, 97, 100, 32, 65, 114, 102, 97], // "Muhammad Arfa"
  [73, 84, 32, 73, 110, 116, 101, 114, 110, 32, 64, 32, 80, 86, 67] // "IT Intern @ PVC"
]);

const _decode = (arr) => arr.map(c => String.fromCharCode(c)).join('');

export default function DeveloperCredit() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const drawCreditCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI Crisp Retina Canvas Scaling
    const dpr = window.devicePixelRatio || 1;
    const width = 200;
    const height = 55;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Render "DEVELOPED BY"
    ctx.font = '500 10px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(_decode(_0x4a12[0]), width / 2, 4);

    // Render "Muhammad Arfa"
    ctx.font = '700 14px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(_decode(_0x4a12[1]), width / 2, 19);

    // Render "IT Intern @ PVC"
    ctx.font = '500 11px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.fillText(_decode(_0x4a12[2]), width / 2, 37);
  };

  useEffect(() => {
    drawCreditCanvas();

    const container = containerRef.current;
    if (!container) return;

    // Strict Enforcement of Styles and Canvas Presence
    const enforceSecurity = () => {
      if (!container) return;
      
      // Enforce Visibility & Display Styles against DevTools Hiding
      container.style.setProperty('display', 'flex', 'important');
      container.style.setProperty('flex-direction', 'column', 'important');
      container.style.setProperty('align-items', 'center', 'important');
      container.style.setProperty('visibility', 'visible', 'important');
      container.style.setProperty('opacity', '1', 'important');
      container.style.setProperty('pointer-events', 'none', 'important');
      container.style.setProperty('user-select', 'none', 'important');

      // Verify Canvas presence
      const currentCanvas = container.querySelector('canvas');
      if (!currentCanvas || currentCanvas !== canvasRef.current) {
        if (canvasRef.current) {
          container.appendChild(canvasRef.current);
          drawCreditCanvas();
        }
      }
    };

    // 1. MutationObserver to catch inline DOM modifications instantly
    const observer = new MutationObserver(() => {
      enforceSecurity();
      drawCreditCanvas();
    });

    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });

    // 2. High-Frequency Health Heartbeat Interval (Every 150ms)
    const interval = setInterval(() => {
      enforceSecurity();
    }, 150);

    // Re-draw on window resize or DPR change
    window.addEventListener('resize', drawCreditCanvas);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('resize', drawCreditCanvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="developer-credit-locked-canvas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '6px',
        marginBottom: '6px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'none',
        cursor: 'default'
      }}
    >
      <canvas ref={canvasRef} style={{ pointerEvents: 'none', display: 'block' }} />
    </div>
  );
}
