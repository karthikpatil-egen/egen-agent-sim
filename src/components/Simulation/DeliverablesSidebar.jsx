import { useState } from 'react';
import { DELIVERABLES, getAgentById } from '../../config/agents';
import DeliverableViewer from './DeliverableViewer';

const STATUS_ICONS = {
  pending: '\u25FB\uFE0F',
  'in-progress': '\u{1F504}',
  completed: '\u2705',
  error: '\u274C',
};

export default function DeliverablesSidebar({ deliverables }) {
  const [viewingId, setViewingId] = useState(null);

  const viewingDeliverable = viewingId ? DELIVERABLES.find(d => d.id === viewingId) : null;
  const viewingContent = viewingId ? deliverables[viewingId]?.content : '';

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
            </div>
          </div>
        );
      })}

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
