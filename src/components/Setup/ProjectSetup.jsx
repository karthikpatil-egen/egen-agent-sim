import { useState } from 'react';

const FAKE_PROJECT_NAME = 'Acme Intelligent Data Platform';

const FAKE_SOW = `# Statement of Work: Acme Intelligent Data Platform

## 1. Project Overview
Acme Corp, a mid-market B2B SaaS company in the supply-chain logistics space, requires a modern data platform that unifies disparate data sources, enables real-time analytics, and powers AI-driven demand-forecasting features for their 2,400+ enterprise customers.

## 2. Business Objectives
- Consolidate data from 5 operational databases (PostgreSQL, MongoDB, legacy Oracle) into a single analytics-ready warehouse.
- Deliver real-time shipment tracking dashboards with < 5 second refresh.
- Build an ML-based demand-forecasting model to reduce customer inventory overstock by 15%.
- Provide a self-service BI layer for internal product, sales, and ops teams.
- Achieve SOC 2 Type II compliance for the new data infrastructure.

## 3. Scope of Work

### In Scope
- Data ingestion pipelines (batch + streaming) from all 5 source systems.
- Cloud data warehouse design and implementation (GCP BigQuery preferred).
- Real-time event streaming layer (Kafka/Pub-Sub) for shipment events.
- ML demand-forecasting model (train, evaluate, deploy, monitor).
- Executive and operational dashboards (Looker or equivalent).
- API layer exposing forecast results to Acme's existing SaaS product.
- Infrastructure as code, CI/CD, observability stack.
- Security review, penetration testing, and SOC 2 readiness documentation.

### Out of Scope
- Changes to Acme's existing SaaS product UI (beyond API integration).
- Migration of historical data older than 3 years.
- Ongoing model retraining after the 6-month support window.

## 4. Timeline & Milestones
| Milestone | Target Date |
|-----------|------------|
| Discovery & Architecture | Weeks 1-3 |
| Data Pipeline MVP | Weeks 4-8 |
| ML Model v1 | Weeks 6-10 |
| Dashboard Beta | Weeks 8-12 |
| Security & Compliance Review | Weeks 10-14 |
| Production Launch | Week 16 |
| Hypercare & Handoff | Weeks 17-20 |

## 5. Budget
Total engagement budget: $1.2 M (fixed-price with T&M change-order process).

## 6. Success Criteria
- All 5 data sources ingested with < 1 hour batch latency, < 10 second streaming latency.
- Forecast model achieves MAPE < 12% on held-out test set.
- Dashboards load in < 3 seconds for 95th percentile queries.
- Zero critical/high security findings in penetration test.
- SOC 2 Type II audit readiness confirmed by external auditor.

## 7. Assumptions & Constraints
- Acme will provide VPN access to source databases within 5 business days.
- Acme's engineering team will assign a technical liaison available 10 hrs/week.
- All infrastructure will run on Acme's existing GCP organization.
- The engagement must follow Acme's quarterly release cadence (feature freeze every 12 weeks).`;

const FAKE_STAFFING = `Sr. Data Engineer — Pipeline Architect
AI/ML Engineer — Forecasting Model Lead
Cloud Engineer — Infrastructure & DevOps Lead
Solutions Architect — Technical Advisor
Full-Stack Developer — API & Dashboard Developer
QA Engineer — Quality & Compliance Testing
Project Manager — Delivery Lead
Client Partner — Engagement Director`;

const FAKE_CONTEXT = `Acme Corp is publicly traded (NYSE: ACME) and under board pressure to demonstrate AI capabilities by Q3. Their CTO is technically sophisticated and prefers GCP. A competitor recently launched a similar forecasting feature, so speed-to-market is critical. The Acme engineering team uses GitHub, Jira, and Slack. They have an existing dbt project with ~200 models that we can build on.`;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/octet-stream'];

function getFakeDates() {
  const today = new Date();
  const start = today.toISOString().split('T')[0];
  const end = new Date(today.getTime() + 20 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { start, end };
}

export default function ProjectSetup({ onStart, onBack }) {
  const [projectName, setProjectName] = useState('');
  const [sowText, setSowText] = useState('');
  const [sowFile, setSowFile] = useState(null);
  const [staffingFile, setStaffingFile] = useState(null);
  const [staffingText, setStaffingText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [sowStartDate, setSowStartDate] = useState('');
  const [sowEndDate, setSowEndDate] = useState('');
  const [fileError, setFileError] = useState('');

  function validateFile(file) {
    if (!file) return true;
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File "${file.name}" exceeds the 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return false;
    }
    // Check MIME type - allow common text types
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(txt|md|csv)$/i)) {
      setFileError(`File "${file.name}" has an unsupported type. Please upload .txt, .md, or .csv files.`);
      return false;
    }
    setFileError('');
    return true;
  }

  function handleSowFileChange(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setSowFile(file);
    } else {
      e.target.value = '';
      setSowFile(null);
    }
  }

  function handleStaffingFileChange(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setStaffingFile(file);
    } else {
      e.target.value = '';
      setStaffingFile(null);
    }
  }

  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let sowContent = sowText;
      if (sowFile) {
        sowContent = await readFileAsText(sowFile);
      }

      let staffingPlan = staffingText;
      if (staffingFile) {
        staffingPlan = await readFileAsText(staffingFile);
      }

      if (!sowContent.trim()) {
        setLoading(false);
        return;
      }

      // Validate dates
      if (sowStartDate && sowEndDate && new Date(sowEndDate) <= new Date(sowStartDate)) {
        setFileError('End date must be after start date.');
        setLoading(false);
        return;
      }

      onStart({
        projectName: projectName.trim() || 'Untitled Project',
        sowContent,
        staffingPlan: staffingPlan || null,
        additionalContext: additionalContext || null,
        sowStartDate: sowStartDate || null,
        sowEndDate: sowEndDate || null,
      });
    } catch {
      setLoading(false);
    }
  }

  function fillFakeData() {
    const dates = getFakeDates();
    setProjectName(FAKE_PROJECT_NAME);
    setSowText(FAKE_SOW);
    setSowFile(null);
    setStaffingText(FAKE_STAFFING);
    setStaffingFile(null);
    setAdditionalContext(FAKE_CONTEXT);
    setSowStartDate(dates.start);
    setSowEndDate(dates.end);
    setFileError('');
  }

  const hasSow = sowText.trim() || sowFile;

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-step">Step 2 of 2</div>
        <div className="setup-title-row">
          <div>
            <h2>Project Setup</h2>
            <p>Upload your SOW and any context to kick off the agent simulation.</p>
          </div>
          <button type="button" className="btn-fake-data" onClick={fillFakeData}>
            Fill Demo Data
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Acme Data Platform"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="date-input-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>SOW Start Date <span className="optional">(optional)</span></label>
              <input
                type="date"
                className="form-input"
                value={sowStartDate}
                onChange={(e) => setSowStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>SOW End Date <span className="optional">(optional)</span></label>
              <input
                type="date"
                className="form-input"
                value={sowEndDate}
                onChange={(e) => setSowEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Statement of Work <span className="optional">(paste or upload)</span>
            </label>
            <textarea
              className="form-input"
              placeholder="Paste your SOW content here..."
              value={sowText}
              onChange={(e) => setSowText(e.target.value)}
              rows={6}
            />
            <div className="file-upload" style={{ marginTop: 8 }}>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleSowFileChange}
              />
              <p className="file-upload-label">
                or <strong>click to upload</strong> a file (.txt, .md — max 5MB)
              </p>
              {sowFile && <p className="file-upload-name">{sowFile.name}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>
              Staffing Plan <span className="optional">(optional — assigns project roles to agents)</span>
            </label>
            <div className="file-upload">
              <input
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleStaffingFileChange}
              />
              <p className="file-upload-label">
                <strong>Click to upload</strong> staffing plan (max 5MB)
              </p>
              {staffingFile && <p className="file-upload-name">{staffingFile.name}</p>}
            </div>
            {!staffingFile && (
              <textarea
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="Or paste staffing info, e.g.:&#10;Sr. Data Engineer — Pipeline Architect&#10;ML Engineer — AI Lead"
                value={staffingText}
                onChange={(e) => setStaffingText(e.target.value)}
                rows={3}
              />
            )}
          </div>

          <div className="form-group">
            <label>
              Additional Context <span className="optional">(optional)</span>
            </label>
            <textarea
              className="form-input"
              placeholder="Any additional context about the project, client, industry, tech constraints..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
            />
          </div>

          {fileError && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              {fileError}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={!hasSow || loading}>
            {loading ? 'Starting simulation...' : 'Start Simulation'}
          </button>
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        </form>
      </div>
    </div>
  );
}
