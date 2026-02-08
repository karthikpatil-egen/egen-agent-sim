import { useState, useEffect } from 'react';
import AgentRoster from './AgentRoster';
import ActivityFeed from './ActivityFeed';
import DeliverablesSidebar from './DeliverablesSidebar';
import PhaseProgress from './PhaseProgress';
import InsightsPanel from './InsightsPanel';
import { DELIVERABLES } from '../../config/agents';

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
  insights,
  insightsLoading,
  insightsError,
  simulatedDate,
  sowStartDate,
  sowEndDate,
}) {
  const [showInsights, setShowInsights] = useState(false);

  // Auto-show insights when they arrive
  useEffect(() => {
    if (insights) {
      setShowInsights(true);
    }
  }, [insights]);

  if (showInsights && insights) {
    return (
      <>
        <InsightsPanel
          insights={insights}
          deliverables={deliverables}
          deliverablesDef={DELIVERABLES}
          onBack={() => setShowInsights(false)}
        />
      </>
    );
  }

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
        <DeliverablesSidebar
          deliverables={deliverables}
          isComplete={isComplete}
          insights={insights}
        />
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
        insightsLoading={insightsLoading}
        onViewInsights={insights ? () => setShowInsights(true) : null}
        simulatedDate={simulatedDate}
      />
    </>
  );
}
