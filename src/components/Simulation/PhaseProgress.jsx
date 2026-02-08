import { PHASES } from '../../config/agents';

export default function PhaseProgress({ currentPhase, progress, isComplete, insightsLoading, onViewInsights, simulatedDate }) {
  const phase = PHASES.find(p => p.id === currentPhase);

  let label;
  if (insightsLoading) {
    label = 'Generating Insights...';
  } else if (isComplete) {
    label = 'Simulation Complete';
  } else if (currentPhase > 0) {
    let dateStr = '';
    if (simulatedDate) {
      dateStr = ` \u2014 ${simulatedDate}`;
    }
    label = `Phase ${currentPhase} of ${PHASES.length}: ${phase?.name || ''}${dateStr}`;
  } else {
    label = 'Ready to start';
  }

  return (
    <div className="phase-progress">
      <span className="phase-label">
        {insightsLoading && <span className="spinner" style={{ width: 14, height: 14, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />}
        {label}
      </span>
      <div className="phase-bar-container">
        <div className="phase-bar" style={{ width: `${progress}%` }} />
      </div>
      <span className="phase-percent">{progress}%</span>
      {isComplete && onViewInsights && (
        <button className="btn-icon" onClick={onViewInsights} style={{ marginLeft: 8 }}>
          View Insights
        </button>
      )}
    </div>
  );
}
