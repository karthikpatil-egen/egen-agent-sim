import { useState } from 'react';
import { DELIVERABLES, getAgentById } from '../../config/agents';
import DeliverableViewer from './DeliverableViewer';
import { downloadAll } from '../../services/exporters';

const STATUS_ICONS = {
  pending: '\u25FB\uFE0F',
  'in-progress': '\u{1F504}',
  completed: '\u2705',
  error: '\u274C',
};

export default function DeliverablesSidebar({ deliverables, isComplete, insights }) {
  const [viewingId, setViewingId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const viewingDeliverable = viewingId ? DELIVERABLES.find(d => d.id === viewingId) : null;
  const viewingContent = viewingId ? deliverables[viewingId]?.content : '';

  const hasCompletedDeliverables = Object.values(deliverables).some(d => d.status === 'completed' && d.content);

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      await downloadAll(deliverables, DELIVERABLES, insights, 'md');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="deliverables-sidebar">
      <h3>Deliverables</h3>
      {DELIVERABLES.map(d => {
        const state = deliverables[d.id] || { status: 'pending' };
        const agent = getAgentById(d.agentId);
        const canView = state.status === 'completed' && state.content;

        return (
          <div
            key={d.id}
            className={`deliverable-item ${state.status}`}
            onClick={() => canView && setViewingId(d.id)}
            style={{ cursor: canView ? 'pointer' : 'default' }}
          >
            <span className="deliverable-check">{STATUS_ICONS[state.status] || STATUS_ICONS.pending}</span>
            <div className="deliverable-info">
              <div className="deliverable-title">{d.title}</div>
              <div className="deliverable-agent">{agent?.jobFunction || ''}</div>
              {state.completedDate && (
                <div className="deliverable-date">
                  Completed: {state.completedDate}
                  {state.durationDays ? ` (${state.durationDays} days)` : ''}
                </div>
              )}
              {!state.completedDate && state.startDate && state.status === 'in-progress' && (
                <div className="deliverable-date">Started: {state.startDate}</div>
              )}
            </div>
          </div>
        );
      })}

      {isComplete && hasCompletedDeliverables && (
        <button
          className="btn-icon"
          style={{ width: '100%', marginTop: 12 }}
          onClick={handleDownloadAll}
          disabled={downloading}
        >
          {downloading ? 'Preparing...' : 'Download All (.zip)'}
        </button>
      )}

      {viewingDeliverable && viewingContent && (
        <DeliverableViewer
          title={viewingDeliverable.title}
          content={viewingContent}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
