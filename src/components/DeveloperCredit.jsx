import React, { useEffect, useRef } from 'react';

// Hardcoded, frozen immutable developer identity
const DEVELOPER_INFO = Object.freeze({
  title: String.fromCharCode(68, 69, 86, 69, 76, 79, 80, 69, 68, 32, 66, 89), // DEVELOPED BY
  name: String.fromCharCode(77, 117, 104, 97, 109, 109, 97, 100, 32, 65, 114, 102, 97), // Muhammad Arfa
  role: String.fromCharCode(73, 84, 32, 73, 110, 116, 101, 114, 110, 32, 64, 32, 80, 86, 67) // IT Intern @ PVC
});

export default function DeveloperCredit() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Self-healing function that enforces immutable content
    const enforceCredit = () => {
      const titleEl = el.querySelector('.dev-title');
      const nameEl = el.querySelector('.dev-name');
      const roleEl = el.querySelector('.dev-role');

      if (!titleEl || titleEl.textContent !== DEVELOPER_INFO.title) {
        if (titleEl) titleEl.textContent = DEVELOPER_INFO.title;
      }
      if (!nameEl || nameEl.textContent !== DEVELOPER_INFO.name) {
        if (nameEl) nameEl.textContent = DEVELOPER_INFO.name;
      }
      if (!roleEl || roleEl.textContent !== DEVELOPER_INFO.role) {
        if (roleEl) roleEl.textContent = DEVELOPER_INFO.role;
      }
    };

    // MutationObserver monitors DOM tampering (e.g. Inspect Element edits) and instantly reverts them
    const observer = new MutationObserver(() => {
      enforceCredit();
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="developer-credit-locked"
      style={{
        textAlign: 'center',
        marginTop: '6px',
        marginBottom: '6px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'none',
        cursor: 'default'
      }}
    >
      <p className="dev-title" style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>
        {DEVELOPER_INFO.title}
      </p>
      <p className="dev-name" style={{ margin: '2px 0', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.2px' }}>
        {DEVELOPER_INFO.name}
      </p>
      <p className="dev-role" style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
        {DEVELOPER_INFO.role}
      </p>
    </div>
  );
}
