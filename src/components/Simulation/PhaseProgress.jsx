import { PHASES } from '../../config/agents';

export default function PhaseProgress({ currentPhase, progress, isComplete }) {
  const phase = PHASES.find(p => p.id === currentPhase);
  const label = isComplete
    ? 'Simulation Complete'
    : currentPhase > 0
      ? `Phase ${currentPhase} of ${PHASES.length}: ${phase?.name || ''}`
      : 'Ready to start';

  return (
    <div className="phase-progress">
      <span className="phase-label">{label}</span>
      <div className="phase-bar-container">
        <div className="phase-bar" style={{ width: `${progress}%` }} />
      </div>
      <span className="phase-percent">{progress}%</span>
    </div>
  );
}
