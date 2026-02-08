import AgentRoster from './AgentRoster';
import ActivityFeed from './ActivityFeed';
import DeliverablesSidebar from './DeliverablesSidebar';
import PhaseProgress from './PhaseProgress';

export default function SimulationView({
  agentStatuses,
  agentTasks,
  messages,
  deliverables,
  typingAgents,
  currentPhase,
  progress,
  isComplete,
  isRunning,
  error,
  projectRoles,
}) {
  return (
    <>
      <div className="simulation-layout">
        <AgentRoster
          agentStatuses={agentStatuses}
          agentTasks={agentTasks}
          projectRoles={projectRoles}
        />
        <ActivityFeed
          messages={messages}
          typingAgents={typingAgents}
          currentPhase={currentPhase}
        />
        <DeliverablesSidebar deliverables={deliverables} />
      </div>
      {error && (
        <div style={{ padding: '0 24px' }}>
          <div className="error-banner">
            Error: {error}
          </div>
        </div>
      )}
      <PhaseProgress
        currentPhase={currentPhase}
        progress={progress}
        isComplete={isComplete}
      />
    </>
  );
}
