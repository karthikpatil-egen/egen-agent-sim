import { useEffect, useRef } from 'react';
import { getAgentById, PHASES } from '../../config/agents';
import FeedMessage from './FeedMessage';

export default function ActivityFeed({ messages, typingAgents, currentPhase }) {
  const feedRef = useRef(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    if (feedRef.current && messages.length > prevMessageCount.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Also scroll when typing agents change
  useEffect(() => {
    if (feedRef.current && typingAgents.size > 0) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [typingAgents.size]);

  // Group messages by phase for phase transition indicators
  let lastPhase = 0;
  const elements = [];

  for (const msg of messages) {
    if (msg.phase !== lastPhase) {
      const phase = PHASES.find(p => p.id === msg.phase);
      if (phase) {
        elements.push(
          <div key={`phase-${msg.phase}`} className="phase-transition">
            <span className="phase-transition-line" />
            <span>Phase {msg.phase}: {phase.name}</span>
            <span className="phase-transition-line" />
          </div>
        );
      }
      lastPhase = msg.phase;
    }
    elements.push(<FeedMessage key={msg.id} message={msg} />);
  }

  const typingAgentArray = [...typingAgents];

  return (
    <div className="activity-feed">
      <div className="feed-header">Activity Feed</div>
      <div className="feed-messages" ref={feedRef}>
        {elements.length === 0 && typingAgentArray.length === 0 && (
          <div className="feed-empty">
            <div className="feed-empty-icon">&#x1F4AC;</div>
            <div>Agent activity will appear here</div>
          </div>
        )}
        {elements}
        {typingAgentArray.map(agentId => {
          const agent = getAgentById(agentId);
          if (!agent) return null;
          return (
            <div key={`typing-${agentId}`} className="typing-indicator">
              <div
                className="feed-msg-avatar"
                style={{ background: agent.bgColor, color: agent.color }}
              >
                {agent.emoji}
              </div>
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="typing-label">{agent.jobFunction} is working...</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
