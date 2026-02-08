import { AGENTS } from '../../config/agents';
import AgentBadge from './AgentBadge';

export default function AgentRoster({ agentStatuses, agentTasks, projectRoles }) {
  return (
    <div className="agent-roster">
      <h3>Agents</h3>
      {AGENTS.map(agent => (
        <AgentBadge
          key={agent.id}
          agentId={agent.id}
          status={agentStatuses[agent.id]}
          task={agentTasks[agent.id]}
          projectRole={projectRoles[agent.id]}
        />
      ))}
    </div>
  );
}
