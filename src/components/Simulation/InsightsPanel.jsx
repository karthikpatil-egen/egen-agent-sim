import { useState } from 'react';
import { downloadAll } from '../../services/exporters';

const SEVERITY_COLORS = {
  high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  low: { bg: 'rgba(13, 255, 174, 0.15)', color: '#0DFFAE', border: 'rgba(13, 255, 174, 0.3)' },
};

const PRIORITY_COLORS = {
  immediate: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  'short-term': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  'long-term': { bg: 'rgba(77, 155, 255, 0.15)', color: '#4D9BFF' },
};

const VERDICT_COLORS = {
  realistic: { bg: 'rgba(13, 255, 174, 0.15)', color: '#0DFFAE' },
  tight: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  aggressive: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  unrealistic: { bg: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' },
};

export default function InsightsPanel({ insights, deliverables, deliverablesDef, onBack }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      await downloadAll(deliverables, deliverablesDef, insights, 'md');
    } finally {
      setDownloading(false);
    }
  }

  if (!insights) return null;

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div>
          <h2>Project Insights</h2>
          <p>AI-generated analysis of all simulation deliverables</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={handleDownloadAll} disabled={downloading}>
            {downloading ? 'Preparing...' : 'Download All (.zip)'}
          </button>
          <button className="btn-icon" onClick={onBack}>
            Back to Simulation
          </button>
        </div>
      </div>

      <div className="insights-body">
        {/* Executive Summary */}
        <div className="insights-summary">
          <h3>Executive Summary</h3>
          <div className="insights-summary-text">
            {insights.executiveSummary?.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* Grid of insight cards */}
        <div className="insights-grid">
          {/* Project Risks */}
          <div className="insights-card">
            <h4>Project Risks</h4>
            {(insights.projectRisks || []).map((r, i) => (
              <div key={i} className="insights-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="severity-badge" style={{
                    background: SEVERITY_COLORS[r.severity]?.bg,
                    color: SEVERITY_COLORS[r.severity]?.color,
                    borderColor: SEVERITY_COLORS[r.severity]?.border,
                  }}>
                    {r.severity}
                  </span>
                  <strong>{r.risk}</strong>
                </div>
                <div className="insights-detail">Source: {r.source}</div>
                <div className="insights-detail">Mitigation: {r.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <div className="insights-card">
            <h4>Strengths</h4>
            {(insights.strengths || []).map((s, i) => (
              <div key={i} className="insights-list-item strength-item">
                {s}
              </div>
            ))}
          </div>

          {/* Watchpoints */}
          <div className="insights-card">
            <h4>Watchpoints</h4>
            {(insights.watchpoints || []).map((w, i) => (
              <div key={i} className="insights-list-item watchpoint-item">
                <strong>{w.item}</strong>
                <div className="insights-detail">{w.reason}</div>
              </div>
            ))}
          </div>

          {/* Staffing Gaps */}
          <div className="insights-card">
            <h4>Staffing Gaps</h4>
            {(insights.staffingGaps || []).map((g, i) => (
              <div key={i} className="insights-list-item">
                <strong>{g.gap}</strong>
                <div className="insights-detail">Current: {g.currentCoverage}</div>
                <div className="insights-detail">Impact: {g.impact}</div>
                <div className="insights-detail">Recommendation: {g.recommendation}</div>
              </div>
            ))}
          </div>

          {/* Scope Assessment */}
          <div className="insights-card">
            <h4>Scope Assessment</h4>
            {insights.scopeAssessment && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <span className="verdict-badge" style={{
                    background: VERDICT_COLORS[insights.scopeAssessment.verdict]?.bg,
                    color: VERDICT_COLORS[insights.scopeAssessment.verdict]?.color,
                  }}>
                    {insights.scopeAssessment.verdict}
                  </span>
                </div>
                <p style={{ marginBottom: 8, lineHeight: 1.6 }}>{insights.scopeAssessment.analysis}</p>
                <div className="insights-detail">Recommendations: {insights.scopeAssessment.recommendations}</div>
              </>
            )}
          </div>

          {/* Client Dependencies */}
          <div className="insights-card">
            <h4>Client Dependencies</h4>
            {(insights.clientDependencies || []).map((d, i) => (
              <div key={i} className="insights-list-item">
                <strong>{d.dependency}</strong>
                <div className="insights-detail">Assumption: {d.assumption}</div>
                <div className="insights-detail">Impact if not met: {d.impact}</div>
                <div className="insights-detail">Recommendation: {d.recommendation}</div>
              </div>
            ))}
          </div>

          {/* Key Recommendations */}
          <div className="insights-card" style={{ gridColumn: '1 / -1' }}>
            <h4>Key Recommendations</h4>
            <div className="insights-grid" style={{ gap: 12 }}>
              {(insights.keyRecommendations || []).map((r, i) => (
                <div key={i} className="insights-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="priority-badge" style={{
                      background: PRIORITY_COLORS[r.priority]?.bg,
                      color: PRIORITY_COLORS[r.priority]?.color,
                    }}>
                      {r.priority}
                    </span>
                    <strong>{r.recommendation}</strong>
                  </div>
                  <div className="insights-detail">{r.rationale}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
