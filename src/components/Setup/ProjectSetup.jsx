import { useState } from 'react';

export default function ProjectSetup({ onStart, onBack }) {
  const [projectName, setProjectName] = useState('');
  const [sowText, setSowText] = useState('');
  const [sowFile, setSowFile] = useState(null);
  const [staffingFile, setStaffingFile] = useState(null);
  const [staffingText, setStaffingText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);

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

      onStart({
        projectName: projectName.trim() || 'Untitled Project',
        sowContent,
        staffingPlan: staffingPlan || null,
        additionalContext: additionalContext || null,
      });
    } catch {
      setLoading(false);
    }
  }

  const hasSow = sowText.trim() || sowFile;

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-step">Step 2 of 2</div>
        <h2>Project Setup</h2>
        <p>Upload your SOW and any context to kick off the agent simulation.</p>
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
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={(e) => setSowFile(e.target.files[0])}
              />
              <p className="file-upload-label">
                or <strong>click to upload</strong> a file (.txt, .md)
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
                onChange={(e) => setStaffingFile(e.target.files[0])}
              />
              <p className="file-upload-label">
                <strong>Click to upload</strong> staffing plan
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
