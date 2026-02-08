import { getAgentById } from '../../config/agents';
import { PHASES } from '../../config/agents';

export default function FeedMessage({ message }) {
  const agent = getAgentById(message.agentId);
  if (!agent) return null;

  const phase = PHASES.find(p => p.id === message.phase);

  return (
    <div className="feed-message">
      <div
        className="feed-msg-avatar"
        style={{ background: agent.bgColor, color: agent.color }}
      >
        {agent.emoji}
      </div>
      <div className="feed-msg-content">
        <div className="feed-msg-header">
          <span className="feed-msg-name" style={{ color: agent.color }}>
            {agent.jobFunction}
          </span>
          {phase && (
            <span className="feed-msg-phase">Phase {message.phase}: {phase.name}</span>
          )}
        </div>
        <div className="feed-msg-text">{message.text}</div>
      </div>
    </div>
  );
}
