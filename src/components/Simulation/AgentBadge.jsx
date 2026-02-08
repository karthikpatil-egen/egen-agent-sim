import { getAgentById } from '../../config/agents';

const STATUS_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking...',
  active: 'Working',
  done: 'Done',
  error: 'Error',
};

export default function AgentBadge({ agentId, status, task, projectRole }) {
  const agent = getAgentById(agentId);
  if (!agent) return null;

  const displayRole = projectRole || agent.defaultProjectRole;
  const statusClass = status || 'idle';

  return (
    <div className={`agent-badge ${statusClass}`}>
      <div className="agent-badge-header">
        <div
          className="agent-avatar"
          style={{ background: agent.bgColor, color: agent.color }}
        >
          {agent.emoji}
        </div>
        <div className="agent-info">
          <div className="agent-job-function">{agent.jobFunction}</div>
          <div className="agent-project-role">{displayRole}</div>
        </div>
      </div>
      <div className="agent-status">
        <span className={`status-dot ${statusClass}`} />
        <span>{STATUS_LABELS[statusClass] || 'Idle'}</span>
      </div>
      {task && (status === 'active' || status === 'thinking') && (
        <div className="agent-task-label">{task}</div>
      )}
    </div>
  );
}
