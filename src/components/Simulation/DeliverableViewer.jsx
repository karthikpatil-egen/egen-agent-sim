import { useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#1a1d27',
    primaryColor: '#6366f1',
    primaryTextColor: '#e4e6f0',
    primaryBorderColor: '#2e3144',
    lineColor: '#8b8fa3',
    secondaryColor: '#242736',
    tertiaryColor: '#0f1117',
  },
});

function MermaidDiagram({ code }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!containerRef.current || !code) return;
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre style="color: #8b8fa3; font-size: 12px;">${code}</pre>`;
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  return <div className="mermaid-container" ref={containerRef} />;
}

function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match?.[1];
            const codeString = String(children).replace(/\n$/, '');

            if (lang === 'mermaid') {
              return <MermaidDiagram code={codeString} />;
            }

            if (lang) {
              return (
                <pre>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function DeliverableViewer({ title, content, onClose }) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, title]);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="deliverable-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="deliverable-modal">
        <div className="deliverable-modal-header">
          <h3>{title}</h3>
          <div className="deliverable-modal-actions">
            <button className="btn-icon" onClick={handleDownload}>
              Download .md
            </button>
            <button className="btn-icon" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="deliverable-modal-body">
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
}
