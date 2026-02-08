import { AGENTS, PHASES, DELIVERABLES, getAgentById } from '../config/agents';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/system';
import { PHASE_INSTRUCTIONS, getPhaseInstruction } from '../prompts/phases';
import { callGeminiStreaming, callGeminiWithSchema } from './gemini';
import { INSIGHTS_SYSTEM_PROMPT, INSIGHTS_RESPONSE_SCHEMA, buildInsightsUserPrompt } from '../prompts/insights';

export function createOrchestrator({ apiKey, sowContent, staffingPlan, additionalContext, onEvent, config, sowStartDate, sowEndDate }) {
  // Use config values if provided, otherwise fall back to static imports
  const agents = config?.agents || AGENTS;
  const phases = config?.phases || PHASES;
  const deliverablesDef = config?.deliverables || DELIVERABLES;
  const systemPrompts = config?.systemPrompts || AGENT_SYSTEM_PROMPTS;
  const phaseInstructions = config?.phaseInstructions || PHASE_INSTRUCTIONS;

  // Timeline computation
  const timeline = computeTimeline(sowStartDate, sowEndDate, phases);

  function findAgent(id) {
    return agents.find(a => a.id === id) || getAgentById(id);
  }

  function findPhaseInstruction(phaseId, agentId) {
    return phaseInstructions[phaseId]?.[agentId] || getPhaseInstruction(phaseId, agentId);
  }

  const state = {
    currentPhase: 0,
    agentStatuses: {},
    agentOutputs: {},
    deliverables: {},
    messages: [],
    isRunning: false,
    error: null,
    projectRoles: {},
    simulatedDate: null,
  };

  // Initialize agent statuses
  agents.forEach(agent => {
    state.agentStatuses[agent.id] = 'idle';
  });

  // Initialize deliverables
  deliverablesDef.forEach(d => {
    state.deliverables[d.id] = { status: 'pending', content: '' };
  });

  // Parse staffing plan to extract project roles
  if (staffingPlan) {
    parseStaffingPlan(staffingPlan, state.projectRoles);
  }

  function emit(type, payload) {
    onEvent({ type, ...payload, timestamp: Date.now() });
  }

  function parseStaffingPlan(text, roles) {
    const lines = text.split('\n');
    const rolePatterns = [
      { pattern: /data\s*engineer/i, agentId: 'data-engineer' },
      { pattern: /ai|ml|machine\s*learning/i, agentId: 'ai-ml-engineer' },
      { pattern: /cloud|infra|devops|sre/i, agentId: 'cloud-engineer' },
      { pattern: /full.?stack|front.?end|back.?end|developer|software\s*eng/i, agentId: 'fullstack-developer' },
      { pattern: /qa|quality|test/i, agentId: 'qa-engineer' },
      { pattern: /architect|solution/i, agentId: 'solutions-architect' },
      { pattern: /project\s*manag|scrum|delivery/i, agentId: 'project-manager' },
      { pattern: /client|account|partner|engagement/i, agentId: 'client-partner' },
    ];

    for (const line of lines) {
      const dashMatch = line.match(/(.+?)[\u2014\u2013\-\|:]+(.+)/);
      if (dashMatch) {
        const leftPart = dashMatch[1].trim();
        const rightPart = dashMatch[2].trim();
        for (const { pattern, agentId } of rolePatterns) {
          if (pattern.test(leftPart) && rightPart.length > 2 && rightPart.length < 50) {
            roles[agentId] = rightPart;
            break;
          }
        }
      }
    }
  }

  function buildUserPrompt(agentId, phaseId) {
    const instruction = findPhaseInstruction(phaseId, agentId);
    if (!instruction) return '';

    // Security: truncate inputs to prevent prompt injection via very long content
    const safeSowContent = (sowContent || '').slice(0, 50000);
    const safeAdditionalContext = (additionalContext || '').slice(0, 10000);

    let prompt = `## Task: ${instruction.task}\n\n`;
    prompt += `## Instructions\n${instruction.instruction}\n\n`;

    // Formatting directives (Feature 3)
    prompt += `## Formatting Requirements
Structure your deliverable with clear markdown headings (## for sections, ### for subsections).
Use markdown tables with proper | column | headers | for any tabular data.
Use bullet lists (- item) for enumerated points, not plain text paragraphs.
Separate sections with blank lines for readability.

`;

    // Template instructions (Feature 4)
    if (config?.templates?.enabled) {
      const tmpl = config.templates;
      if (tmpl.branding) {
        prompt += `## Branding & Tone
Company: ${tmpl.branding.companyName || 'Egen'}
Tone: ${tmpl.branding.toneOfVoice || 'Professional and consultative'}
${tmpl.branding.headerText ? `Header: ${tmpl.branding.headerText}` : ''}
${tmpl.branding.footerText ? `Footer: ${tmpl.branding.footerText}` : ''}

`;
      }

      // Find deliverable for this agent in this phase
      const deliverable = deliverablesDef.find(d => d.agentId === agentId && d.phase === phaseId);
      if (deliverable && tmpl.deliverableTemplates?.[deliverable.id]) {
        const dt = tmpl.deliverableTemplates[deliverable.id];
        if (dt.sections?.length > 0) {
          prompt += `## Required Section Structure
Your deliverable MUST follow this exact section order:
${dt.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

`;
        }
        if (dt.instructions) {
          prompt += `## Additional Formatting Instructions
${dt.instructions}

`;
        }
      }
    }

    // Timeline context (Feature 5)
    if (timeline && state.simulatedDate) {
      const phaseTimeline = timeline.phases[phaseId];
      if (phaseTimeline) {
        prompt += `## Timeline Context
The current simulated project date is ${formatDate(state.simulatedDate)}. You are in ${phases.find(p => p.id === phaseId)?.name || 'Phase ' + phaseId} (${formatDate(phaseTimeline.startDate)} - ${formatDate(phaseTimeline.endDate)}).

`;
      }
    }

    prompt += `## Statement of Work\n${safeSowContent}\n\n`;

    if (safeAdditionalContext) {
      prompt += `## Additional Context\n${safeAdditionalContext}\n\n`;
    }

    // Include previous agent outputs as context
    const previousOutputs = Object.entries(state.agentOutputs)
      .filter(([, output]) => output)
      .map(([id, output]) => {
        const agent = findAgent(id);
        return `### ${agent?.jobFunction || id}'s Output\n${output.chatMessage}\n\n**Deliverable Summary:**\n${output.deliverableContent?.slice(0, 1500) || 'N/A'}`;
      })
      .join('\n\n---\n\n');

    if (previousOutputs) {
      prompt += `## Team Members' Previous Work\n${previousOutputs}\n\n`;
    }

    prompt += `## Response Format
Respond with a JSON object containing:
- "chatMessage": A conversational 2-4 sentence message for the team chat, addressing colleagues by their roles. Be natural and collaborative.
- "deliverableContent": The full deliverable content in well-formatted markdown. Use ## headings for major sections, ### for subsections, tables with | pipes |, and - bullet lists. Never output plain unstructured text.`;

    return prompt;
  }

  async function runAgent(agentId, phaseId) {
    const agent = findAgent(agentId);
    const instruction = findPhaseInstruction(phaseId, agentId);
    if (!agent || !instruction) return;

    const deliverable = deliverablesDef.find(d => d.agentId === agentId && d.phase === phaseId);

    state.agentStatuses[agentId] = 'thinking';
    emit('agent-status', { agentId, status: 'thinking', task: instruction.task });

    if (deliverable) {
      state.deliverables[deliverable.id] = { status: 'in-progress', content: '' };
      emit('deliverable-update', {
        deliverableId: deliverable.id,
        status: 'in-progress',
        startDate: state.simulatedDate ? formatDate(state.simulatedDate) : null,
      });
    }

    await delay(800);

    state.agentStatuses[agentId] = 'active';
    emit('agent-status', { agentId, status: 'active', task: instruction.task });
    emit('typing-start', { agentId });

    const systemPrompt = systemPrompts[agentId];
    const userPrompt = buildUserPrompt(agentId, phaseId);

    try {
      let streamedText = '';
      const result = await callGeminiStreaming({
        apiKey,
        systemPrompt,
        userPrompt,
        onChunk: (chunk, fullText) => {
          streamedText = fullText;
          emit('streaming-chunk', { agentId, chunk, fullText });
        },
      });

      emit('typing-stop', { agentId });

      state.agentOutputs[agentId] = result;

      const message = {
        id: `${agentId}-phase${phaseId}-${Date.now()}`,
        agentId,
        text: result.chatMessage,
        phase: phaseId,
        timestamp: Date.now(),
      };
      state.messages.push(message);
      emit('message', { message });

      if (deliverable) {
        // Compute simulated duration for deliverable
        let completedDate = null;
        let durationDays = null;
        if (timeline) {
          const phaseTimeline = timeline.phases[phaseId];
          if (phaseTimeline) {
            const agentCount = phases.find(p => p.id === phaseId)?.agents.length || 1;
            durationDays = Math.max(1, Math.round(phaseTimeline.businessDays / agentCount));
            completedDate = state.simulatedDate ? formatDate(state.simulatedDate) : null;
          }
        }

        state.deliverables[deliverable.id] = { status: 'completed', content: result.deliverableContent };
        emit('deliverable-update', {
          deliverableId: deliverable.id,
          status: 'completed',
          content: result.deliverableContent,
          completedDate,
          durationDays,
        });
      }

      state.agentStatuses[agentId] = 'done';
      emit('agent-status', { agentId, status: 'done', task: instruction.task });

    } catch (error) {
      emit('typing-stop', { agentId });
      state.agentStatuses[agentId] = 'error';
      emit('agent-status', { agentId, status: 'error', task: instruction.task });
      emit('error', { agentId, error: error.message });
      state.error = error.message;

      if (deliverable) {
        state.deliverables[deliverable.id] = { status: 'error', content: '' };
        emit('deliverable-update', { deliverableId: deliverable.id, status: 'error' });
      }

      throw error;
    }
  }

  async function runPhase(phaseId) {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    state.currentPhase = phaseId;

    // Advance simulated date to phase start
    if (timeline?.phases[phaseId]) {
      state.simulatedDate = new Date(timeline.phases[phaseId].startDate);
      emit('timeline-update', { simulatedDate: formatDate(state.simulatedDate) });
    }

    emit('phase-start', { phaseId, phaseName: phase.name });

    if (phase.agents.length === 1) {
      await runAgent(phase.agents[0], phaseId);
      // Advance date after agent completes
      if (timeline?.phases[phaseId]) {
        state.simulatedDate = new Date(timeline.phases[phaseId].endDate);
        emit('timeline-update', { simulatedDate: formatDate(state.simulatedDate) });
      }
    } else {
      const results = await Promise.allSettled(
        phase.agents.map(async (agentId, idx) => {
          // Advance date incrementally between agents within phase
          if (timeline?.phases[phaseId]) {
            const phaseT = timeline.phases[phaseId];
            const fraction = idx / phase.agents.length;
            const dayOffset = Math.round(phaseT.businessDays * fraction);
            state.simulatedDate = addBusinessDays(new Date(phaseT.startDate), dayOffset);
            emit('timeline-update', { simulatedDate: formatDate(state.simulatedDate) });
          }
          return runAgent(agentId, phaseId);
        })
      );

      // Advance to phase end
      if (timeline?.phases[phaseId]) {
        state.simulatedDate = new Date(timeline.phases[phaseId].endDate);
        emit('timeline-update', { simulatedDate: formatDate(state.simulatedDate) });
      }

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0 && failures.length === results.length) {
        throw new Error(`All agents failed in Phase ${phaseId}: ${failures[0].reason.message}`);
      }
    }

    emit('phase-complete', { phaseId, phaseName: phase.name });
  }

  async function generateInsights() {
    emit('insights-generating', {});

    try {
      const userPrompt = buildInsightsUserPrompt(
        (sowContent || '').slice(0, 50000),
        (additionalContext || '').slice(0, 10000),
        staffingPlan,
        state.agentOutputs,
        deliverablesDef,
        agents,
      );

      const result = await callGeminiWithSchema({
        apiKey,
        systemPrompt: INSIGHTS_SYSTEM_PROMPT,
        userPrompt,
        responseSchema: INSIGHTS_RESPONSE_SCHEMA,
        maxTokens: 8192,
      });

      emit('insights-ready', { insights: result });
      return result;
    } catch (error) {
      emit('insights-error', { error: error.message });
      return null;
    }
  }

  async function start() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.error = null;
    emit('simulation-start', {});

    try {
      for (const phase of phases) {
        if (!state.isRunning) break;
        await runPhase(phase.id);
        if (phase.id < phases.length) {
          await delay(1000);
        }
      }

      // Generate insights after all phases complete
      await generateInsights();

      emit('simulation-complete', {});
    } catch (error) {
      emit('simulation-error', { error: error.message });
    } finally {
      state.isRunning = false;
    }
  }

  function stop() {
    state.isRunning = false;
  }

  function getState() {
    return { ...state };
  }

  function getProjectRoles() {
    return { ...state.projectRoles };
  }

  return { start, stop, getState, getProjectRoles };
}

// --- Timeline Helpers ---

function computeTimeline(startDateStr, endDateStr, phases) {
  if (!startDateStr || !endDateStr) return null;

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) return null;

  const totalBusinessDays = countBusinessDays(startDate, endDate);
  if (totalBusinessDays <= 0) return null;

  // Distribute business days across phases proportionally by agent count
  const totalAgents = phases.reduce((sum, p) => sum + p.agents.length, 0);
  const phaseTimeline = {};
  let currentDate = new Date(startDate);

  for (const phase of phases) {
    const weight = phase.agents.length / totalAgents;
    const phaseDays = Math.max(1, Math.round(totalBusinessDays * weight));
    const phaseStart = new Date(currentDate);
    const phaseEnd = addBusinessDays(phaseStart, phaseDays);

    phaseTimeline[phase.id] = {
      startDate: new Date(phaseStart),
      endDate: phaseEnd,
      businessDays: phaseDays,
    };

    currentDate = addBusinessDays(phaseEnd, 1);
  }

  return { startDate, endDate, totalBusinessDays, phases: phaseTimeline };
}

function countBusinessDays(start, end) {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function addBusinessDays(startDate, days) {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
