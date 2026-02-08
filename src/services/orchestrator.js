import { AGENTS, PHASES, DELIVERABLES, getAgentById } from '../config/agents';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/system';
import { getPhaseInstruction } from '../prompts/phases';
import { callGeminiStreaming } from './gemini';

export function createOrchestrator({ apiKey, sowContent, staffingPlan, additionalContext, onEvent }) {
  const state = {
    currentPhase: 0,
    agentStatuses: {},
    agentOutputs: {},
    deliverables: {},
    messages: [],
    isRunning: false,
    error: null,
    projectRoles: {},
  };

  // Initialize agent statuses
  AGENTS.forEach(agent => {
    state.agentStatuses[agent.id] = 'idle';
  });

  // Initialize deliverables
  DELIVERABLES.forEach(d => {
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
      // Look for patterns like "Role — Project Role" or "Role - Project Role"
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
    const instruction = getPhaseInstruction(phaseId, agentId);
    if (!instruction) return '';

    let prompt = `## Task: ${instruction.task}\n\n`;
    prompt += `## Instructions\n${instruction.instruction}\n\n`;
    prompt += `## Statement of Work\n${sowContent}\n\n`;

    if (additionalContext) {
      prompt += `## Additional Context\n${additionalContext}\n\n`;
    }

    // Include previous agent outputs as context
    const previousOutputs = Object.entries(state.agentOutputs)
      .filter(([, output]) => output)
      .map(([id, output]) => {
        const agent = getAgentById(id);
        return `### ${agent?.jobFunction || id}'s Output\n${output.chatMessage}\n\n**Deliverable Summary:**\n${output.deliverableContent?.slice(0, 1500) || 'N/A'}`;
      })
      .join('\n\n---\n\n');

    if (previousOutputs) {
      prompt += `## Team Members' Previous Work\n${previousOutputs}\n\n`;
    }

    prompt += `## Response Format
Respond with a JSON object containing:
- "chatMessage": A conversational 2-4 sentence message for the team chat, addressing colleagues by their roles. Be natural and collaborative.
- "deliverableContent": Your full deliverable in well-structured markdown format.`;

    return prompt;
  }

  async function runAgent(agentId, phaseId) {
    const agent = getAgentById(agentId);
    const instruction = getPhaseInstruction(phaseId, agentId);
    if (!agent || !instruction) return;

    // Find the deliverable(s) this agent produces in this phase
    const deliverable = DELIVERABLES.find(d => d.agentId === agentId && d.phase === phaseId);

    state.agentStatuses[agentId] = 'thinking';
    emit('agent-status', { agentId, status: 'thinking', task: instruction.task });

    if (deliverable) {
      state.deliverables[deliverable.id] = { status: 'in-progress', content: '' };
      emit('deliverable-update', { deliverableId: deliverable.id, status: 'in-progress' });
    }

    // Brief pause for visual effect
    await delay(800);

    state.agentStatuses[agentId] = 'active';
    emit('agent-status', { agentId, status: 'active', task: instruction.task });
    emit('typing-start', { agentId });

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId];
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

      // Add message to feed
      const message = {
        id: `${agentId}-phase${phaseId}-${Date.now()}`,
        agentId,
        text: result.chatMessage,
        phase: phaseId,
        timestamp: Date.now(),
      };
      state.messages.push(message);
      emit('message', { message });

      // Update deliverable
      if (deliverable) {
        state.deliverables[deliverable.id] = { status: 'completed', content: result.deliverableContent };
        emit('deliverable-update', { deliverableId: deliverable.id, status: 'completed', content: result.deliverableContent });
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
    const phase = PHASES.find(p => p.id === phaseId);
    if (!phase) return;

    state.currentPhase = phaseId;
    emit('phase-start', { phaseId, phaseName: phase.name });

    // Run agents in this phase — parallel if multiple
    if (phase.agents.length === 1) {
      await runAgent(phase.agents[0], phaseId);
    } else {
      // Run in parallel
      const results = await Promise.allSettled(
        phase.agents.map(agentId => runAgent(agentId, phaseId))
      );

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0 && failures.length === results.length) {
        throw new Error(`All agents failed in Phase ${phaseId}: ${failures[0].reason.message}`);
      }
    }

    emit('phase-complete', { phaseId, phaseName: phase.name });
  }

  async function start() {
    if (state.isRunning) return;
    state.isRunning = true;
    state.error = null;
    emit('simulation-start', {});

    try {
      for (const phase of PHASES) {
        if (!state.isRunning) break;
        await runPhase(phase.id);
        // Brief pause between phases
        if (phase.id < PHASES.length) {
          await delay(1000);
        }
      }
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
