import { useState } from 'react';

const TABS = ['Roles', 'System Prompts', 'Phase Instructions', 'Phases & Deliverables', 'Templates'];

export default function AdminPanel({ config, onSave, onBack }) {
  const [activeTab, setActiveTab] = useState(0);
  const [agents, setAgents] = useState(() => structuredClone(config.agents));
  const [systemPrompts, setSystemPrompts] = useState(() => ({ ...config.systemPrompts }));
  const [phaseInstructions, setPhaseInstructions] = useState(() => structuredClone(config.phaseInstructions));
  const [phases, setPhases] = useState(() => structuredClone(config.phases));
  const [deliverables, setDeliverables] = useState(() => structuredClone(config.deliverables));
  const [templates, setTemplates] = useState(() => structuredClone(config.templates || {
    enabled: false,
    branding: { companyName: '', primaryColor: '#4D9BFF', secondaryColor: '#0DFFAE', headerText: '', footerText: '', toneOfVoice: '' },
    deliverableTemplates: {},
  }));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  async function handleSave(section, data) {
    setSaving(true);
    setSaveMsg('');
    try {
      await onSave(section, data);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="btn-secondary admin-back-btn" onClick={onBack}>
          Back
        </button>
        <h2>Admin Settings</h2>
        <div className="admin-save-status">{saveMsg}</div>
      </div>

      <div className="admin-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {activeTab === 0 && (
          <RolesTab
            agents={agents}
            setAgents={setAgents}
            saving={saving}
            onSave={() => handleSave('agents', agents)}
          />
        )}
        {activeTab === 1 && (
          <SystemPromptsTab
            agents={agents}
            systemPrompts={systemPrompts}
            setSystemPrompts={setSystemPrompts}
            saving={saving}
            onSave={() => handleSave('systemPrompts', systemPrompts)}
          />
        )}
        {activeTab === 2 && (
          <PhaseInstructionsTab
            agents={agents}
            phases={phases}
            phaseInstructions={phaseInstructions}
            setPhaseInstructions={setPhaseInstructions}
            saving={saving}
            onSave={() => handleSave('phaseInstructions', phaseInstructions)}
          />
        )}
        {activeTab === 3 && (
          <PhasesDeliverablesTab
            agents={agents}
            phases={phases}
            setPhases={setPhases}
            deliverables={deliverables}
            setDeliverables={setDeliverables}
            saving={saving}
            onSave={async () => {
              await handleSave('phases', phases);
              await handleSave('deliverables', deliverables);
            }}
          />
        )}
        {activeTab === 4 && (
          <TemplatesTab
            templates={templates}
            setTemplates={setTemplates}
            deliverables={deliverables}
            saving={saving}
            onSave={() => handleSave('templates', templates)}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Roles Tab ---------- */
function RolesTab({ agents, setAgents, saving, onSave }) {
  function updateAgent(index, field, value) {
    setAgents(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addAgent() {
    const id = `agent-${Date.now()}`;
    setAgents(prev => [...prev, {
      id,
      jobFunction: 'New Agent',
      defaultProjectRole: 'Role',
      emoji: '\u{1F9D1}',
      color: '#4D9BFF',
      bgColor: 'rgba(77, 155, 255, 0.15)',
      description: '',
    }]);
  }

  function removeAgent(index) {
    setAgents(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>Agent Roles</h3>
        <button className="btn-primary admin-add-btn" onClick={addAgent}>+ Add Agent</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Emoji</th>
              <th>Job Function</th>
              <th>Default Project Role</th>
              <th>Color</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <tr key={agent.id}>
                <td>
                  <input
                    className="form-input admin-input-sm"
                    value={agent.emoji}
                    onChange={e => updateAgent(i, 'emoji', e.target.value)}
                    style={{ width: 50, textAlign: 'center' }}
                  />
                </td>
                <td>
                  <input
                    className="form-input admin-input-sm"
                    value={agent.jobFunction}
                    onChange={e => updateAgent(i, 'jobFunction', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="form-input admin-input-sm"
                    value={agent.defaultProjectRole}
                    onChange={e => updateAgent(i, 'defaultProjectRole', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="color"
                    value={agent.color}
                    onChange={e => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      updateAgent(i, 'color', hex);
                      updateAgent(i, 'bgColor', `rgba(${r}, ${g}, ${b}, 0.15)`);
                    }}
                    className="admin-color-input"
                  />
                </td>
                <td>
                  <input
                    className="form-input admin-input-sm"
                    value={agent.description}
                    onChange={e => updateAgent(i, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <button className="admin-remove-btn" onClick={() => removeAgent(i)} title="Remove agent">
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary admin-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Roles'}
      </button>
    </div>
  );
}

/* ---------- System Prompts Tab ---------- */
function SystemPromptsTab({ agents, systemPrompts, setSystemPrompts, saving, onSave }) {
  return (
    <div className="admin-section">
      <h3>System Prompts</h3>
      {agents.map(agent => (
        <div key={agent.id} className="admin-prompt-group">
          <label>{agent.emoji} {agent.jobFunction}</label>
          <textarea
            className="form-input admin-textarea"
            value={systemPrompts[agent.id] || ''}
            onChange={e => setSystemPrompts(prev => ({ ...prev, [agent.id]: e.target.value }))}
            rows={6}
          />
        </div>
      ))}
      <button className="btn-primary admin-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save System Prompts'}
      </button>
    </div>
  );
}

/* ---------- Phase Instructions Tab ---------- */
function PhaseInstructionsTab({ agents, phases, phaseInstructions, setPhaseInstructions, saving, onSave }) {
  function updateInstruction(phaseId, agentId, field, value) {
    setPhaseInstructions(prev => {
      const next = structuredClone(prev);
      if (!next[phaseId]) next[phaseId] = {};
      if (!next[phaseId][agentId]) next[phaseId][agentId] = { task: '', instruction: '' };
      next[phaseId][agentId][field] = value;
      return next;
    });
  }

  return (
    <div className="admin-section">
      <h3>Phase Instructions</h3>
      {phases.map(phase => (
        <div key={phase.id} className="admin-phase-group">
          <h4>Phase {phase.id}: {phase.name}</h4>
          {phase.agents.map(agentId => {
            const agent = agents.find(a => a.id === agentId);
            const instr = phaseInstructions[phase.id]?.[agentId] || { task: '', instruction: '' };
            return (
              <div key={agentId} className="admin-instruction-block">
                <label>{agent?.emoji || ''} {agent?.jobFunction || agentId}</label>
                <div className="form-group">
                  <label className="admin-field-label">Task Name</label>
                  <input
                    className="form-input admin-input-sm"
                    value={instr.task}
                    onChange={e => updateInstruction(phase.id, agentId, 'task', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="admin-field-label">Instruction</label>
                  <textarea
                    className="form-input admin-textarea"
                    value={instr.instruction}
                    onChange={e => updateInstruction(phase.id, agentId, 'instruction', e.target.value)}
                    rows={8}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <button className="btn-primary admin-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Phase Instructions'}
      </button>
    </div>
  );
}

/* ---------- Phases & Deliverables Tab ---------- */
function PhasesDeliverablesTab({ agents, phases, setPhases, deliverables, setDeliverables, saving, onSave }) {
  function updatePhase(index, field, value) {
    setPhases(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function togglePhaseAgent(phaseIndex, agentId) {
    setPhases(prev => {
      const next = [...prev];
      const phase = { ...next[phaseIndex] };
      const agentList = [...phase.agents];
      const idx = agentList.indexOf(agentId);
      if (idx >= 0) {
        agentList.splice(idx, 1);
      } else {
        agentList.push(agentId);
      }
      phase.agents = agentList;
      next[phaseIndex] = phase;
      return next;
    });
  }

  function updateDeliverable(index, field, value) {
    setDeliverables(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addDeliverable() {
    setDeliverables(prev => [...prev, {
      id: `deliverable-${Date.now()}`,
      title: 'New Deliverable',
      agentId: agents[0]?.id || '',
      phase: 1,
    }]);
  }

  function removeDeliverable(index) {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-section">
      <h3>Phases</h3>
      {phases.map((phase, pi) => (
        <div key={phase.id} className="admin-phase-config">
          <div className="admin-phase-row">
            <label>Phase {phase.id}:</label>
            <input
              className="form-input admin-input-sm"
              value={phase.name}
              onChange={e => updatePhase(pi, 'name', e.target.value)}
            />
          </div>
          <div className="admin-agent-checkboxes">
            {agents.map(agent => (
              <label key={agent.id} className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={phase.agents.includes(agent.id)}
                  onChange={() => togglePhaseAgent(pi, agent.id)}
                />
                {agent.emoji} {agent.jobFunction}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="admin-section-header" style={{ marginTop: 32 }}>
        <h3>Deliverables</h3>
        <button className="btn-primary admin-add-btn" onClick={addDeliverable}>+ Add Deliverable</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Agent</th>
              <th>Phase</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map((d, i) => (
              <tr key={d.id}>
                <td>
                  <input
                    className="form-input admin-input-sm"
                    value={d.title}
                    onChange={e => updateDeliverable(i, 'title', e.target.value)}
                  />
                </td>
                <td>
                  <select
                    className="form-input admin-input-sm"
                    value={d.agentId}
                    onChange={e => updateDeliverable(i, 'agentId', e.target.value)}
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.emoji} {a.jobFunction}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="form-input admin-input-sm"
                    value={d.phase}
                    onChange={e => updateDeliverable(i, 'phase', Number(e.target.value))}
                  >
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>Phase {p.id}: {p.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="admin-remove-btn" onClick={() => removeDeliverable(i)} title="Remove deliverable">
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary admin-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Phases & Deliverables'}
      </button>
    </div>
  );
}

/* ---------- Templates Tab ---------- */
function TemplatesTab({ templates, setTemplates, deliverables, saving, onSave }) {
  function updateBranding(field, value) {
    setTemplates(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: value },
    }));
  }

  function updateDeliverableTemplate(deliverableId, field, value) {
    setTemplates(prev => ({
      ...prev,
      deliverableTemplates: {
        ...prev.deliverableTemplates,
        [deliverableId]: {
          ...prev.deliverableTemplates?.[deliverableId],
          [field]: value,
        },
      },
    }));
  }

  function updateSectionName(deliverableId, index, value) {
    setTemplates(prev => {
      const dt = { ...prev.deliverableTemplates };
      const existing = dt[deliverableId] || { sections: [], instructions: '' };
      const sections = [...(existing.sections || [])];
      sections[index] = value;
      dt[deliverableId] = { ...existing, sections };
      return { ...prev, deliverableTemplates: dt };
    });
  }

  function addSection(deliverableId) {
    setTemplates(prev => {
      const dt = { ...prev.deliverableTemplates };
      const existing = dt[deliverableId] || { sections: [], instructions: '' };
      dt[deliverableId] = { ...existing, sections: [...(existing.sections || []), 'New Section'] };
      return { ...prev, deliverableTemplates: dt };
    });
  }

  function removeSection(deliverableId, index) {
    setTemplates(prev => {
      const dt = { ...prev.deliverableTemplates };
      const existing = dt[deliverableId] || { sections: [], instructions: '' };
      const sections = [...(existing.sections || [])];
      sections.splice(index, 1);
      dt[deliverableId] = { ...existing, sections };
      return { ...prev, deliverableTemplates: dt };
    });
  }

  function moveSectionUp(deliverableId, index) {
    if (index === 0) return;
    setTemplates(prev => {
      const dt = { ...prev.deliverableTemplates };
      const existing = dt[deliverableId] || { sections: [], instructions: '' };
      const sections = [...(existing.sections || [])];
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
      dt[deliverableId] = { ...existing, sections };
      return { ...prev, deliverableTemplates: dt };
    });
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>Template Configuration</h3>
        <label className="admin-checkbox-label" style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={templates.enabled || false}
            onChange={e => setTemplates(prev => ({ ...prev, enabled: e.target.checked }))}
          />
          Enable Templates
        </label>
      </div>

      {templates.enabled && (
        <>
          <div className="admin-phase-group">
            <h4>Branding</h4>
            <div className="form-group">
              <label className="admin-field-label">Company Name</label>
              <input
                className="form-input admin-input-sm"
                value={templates.branding?.companyName || ''}
                onChange={e => updateBranding('companyName', e.target.value)}
                placeholder="Egen"
              />
            </div>
            <div className="date-input-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="admin-field-label">Primary Color</label>
                <input
                  type="color"
                  value={templates.branding?.primaryColor || '#4D9BFF'}
                  onChange={e => updateBranding('primaryColor', e.target.value)}
                  className="admin-color-input"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="admin-field-label">Secondary Color</label>
                <input
                  type="color"
                  value={templates.branding?.secondaryColor || '#0DFFAE'}
                  onChange={e => updateBranding('secondaryColor', e.target.value)}
                  className="admin-color-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="admin-field-label">Header Text</label>
              <input
                className="form-input admin-input-sm"
                value={templates.branding?.headerText || ''}
                onChange={e => updateBranding('headerText', e.target.value)}
                placeholder="e.g., Confidential — Egen Consulting"
              />
            </div>
            <div className="form-group">
              <label className="admin-field-label">Footer Text</label>
              <input
                className="form-input admin-input-sm"
                value={templates.branding?.footerText || ''}
                onChange={e => updateBranding('footerText', e.target.value)}
                placeholder="e.g., Prepared by Egen AI Practice"
              />
            </div>
            <div className="form-group">
              <label className="admin-field-label">Tone of Voice</label>
              <input
                className="form-input admin-input-sm"
                value={templates.branding?.toneOfVoice || ''}
                onChange={e => updateBranding('toneOfVoice', e.target.value)}
                placeholder="e.g., Professional and consultative"
              />
            </div>
          </div>

          <h4 style={{ marginTop: 24, marginBottom: 16, color: 'var(--color-primary)' }}>Deliverable Structure</h4>
          {deliverables.map(d => {
            const dt = templates.deliverableTemplates?.[d.id] || { sections: [], instructions: '' };
            return (
              <div key={d.id} className="admin-phase-config" style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, marginBottom: 12 }}>{d.title}</h4>
                <div className="form-group">
                  <label className="admin-field-label">Required Sections (ordered)</label>
                  {(dt.sections || []).map((section, si) => (
                    <div key={si} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', minWidth: 20 }}>{si + 1}.</span>
                      <input
                        className="form-input admin-input-sm"
                        value={section}
                        onChange={e => updateSectionName(d.id, si, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button className="admin-remove-btn" style={{ fontSize: 14 }} onClick={() => moveSectionUp(d.id, si)} title="Move up">&uarr;</button>
                      <button className="admin-remove-btn" onClick={() => removeSection(d.id, si)} title="Remove">&times;</button>
                    </div>
                  ))}
                  <button
                    className="btn-icon"
                    style={{ marginTop: 4, fontSize: 12 }}
                    onClick={() => addSection(d.id)}
                  >
                    + Add Section
                  </button>
                </div>
                <div className="form-group">
                  <label className="admin-field-label">Additional Formatting Instructions</label>
                  <textarea
                    className="form-input admin-textarea"
                    value={dt.instructions || ''}
                    onChange={e => updateDeliverableTemplate(d.id, 'instructions', e.target.value)}
                    rows={3}
                    placeholder="e.g., Include a risk matrix table. Use executive-friendly language."
                  />
                </div>
              </div>
            );
          })}
        </>
      )}

      <button className="btn-primary admin-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Templates'}
      </button>
    </div>
  );
}
