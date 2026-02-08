import { useEffect, useRef, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { exportAsDocx, exportAsPptx, exportAsXlsx, exportAsPdf, exportAsMarkdown } from '../../services/exporters';

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
          containerRef.current.innerHTML = DOMPurify.sanitize(svg);
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = DOMPurify.sanitize(`<pre style="color: #8b8fa3; font-size: 12px;">${code}</pre>`);
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
        remarkPlugins={[remarkGfm]}
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

const FORMATS = [
  { id: 'md', label: '.md', fn: exportAsMarkdown },
  { id: 'docx', label: '.docx', fn: exportAsDocx },
  { id: 'pptx', label: '.pptx', fn: exportAsPptx },
  { id: 'xlsx', label: '.xlsx', fn: exportAsXlsx },
  { id: 'pdf', label: '.pdf', fn: exportAsPdf },
];

export default function DeliverableViewer({ title, content, onClose }) {
  const [showFormats, setShowFormats] = useState(false);

  const handleDownload = useCallback((format) => {
    const fmt = FORMATS.find(f => f.id === format);
    if (fmt) {
      fmt.fn(title, content);
    }
    setShowFormats(false);
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
            <div className="download-dropdown-wrapper">
              <button className="btn-icon" onClick={() => setShowFormats(!showFormats)}>
                Download as...
              </button>
              {showFormats && (
                <div className="download-dropdown">
                  {FORMATS.map(f => (
                    <button key={f.id} className="download-dropdown-item" onClick={() => handleDownload(f.id)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
