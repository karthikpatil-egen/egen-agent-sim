import { useState, useCallback, useRef } from 'react';
import { createOrchestrator } from '../services/orchestrator';
import { AGENTS, PHASES, DELIVERABLES } from '../config/agents';

const initialAgentStatuses = Object.fromEntries(AGENTS.map(a => [a.id, 'idle']));
const initialDeliverables = Object.fromEntries(
  DELIVERABLES.map(d => [d.id, { status: 'pending', content: '' }])
);

export function useSimulation() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatuses);
  const [agentTasks, setAgentTasks] = useState({});
  const [messages, setMessages] = useState([]);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [typingAgents, setTypingAgents] = useState(new Set());
  const [streamingText, setStreamingText] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [projectRoles, setProjectRoles] = useState({});

  const orchestratorRef = useRef(null);

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'simulation-start':
        setIsRunning(true);
        setIsComplete(false);
        setError(null);
        break;

      case 'phase-start':
        setCurrentPhase(event.phaseId);
        break;

      case 'agent-status':
        setAgentStatuses(prev => ({ ...prev, [event.agentId]: event.status }));
        setAgentTasks(prev => ({ ...prev, [event.agentId]: event.task }));
        break;

      case 'typing-start':
        setTypingAgents(prev => new Set([...prev, event.agentId]));
        setStreamingText(prev => ({ ...prev, [event.agentId]: '' }));
        break;

      case 'typing-stop':
        setTypingAgents(prev => {
          const next = new Set(prev);
          next.delete(event.agentId);
          return next;
        });
        setStreamingText(prev => {
          const next = { ...prev };
          delete next[event.agentId];
          return next;
        });
        break;

      case 'streaming-chunk':
        setStreamingText(prev => ({ ...prev, [event.agentId]: event.fullText }));
        break;

      case 'message':
        setMessages(prev => [...prev, event.message]);
        break;

      case 'deliverable-update':
        setDeliverables(prev => ({
          ...prev,
          [event.deliverableId]: {
            status: event.status,
            content: event.content || prev[event.deliverableId]?.content || '',
          },
        }));
        break;

      case 'simulation-complete':
        setIsRunning(false);
        setIsComplete(true);
        break;

      case 'simulation-error':
        setIsRunning(false);
        setError(event.error);
        break;

      case 'error':
        setError(event.error);
        break;
    }
  }, []);

  const startSimulation = useCallback(({ apiKey, sowContent, staffingPlan, additionalContext }) => {
    // Reset state
    setMessages([]);
    setAgentStatuses(initialAgentStatuses);
    setAgentTasks({});
    setDeliverables(initialDeliverables);
    setTypingAgents(new Set());
    setStreamingText({});
    setCurrentPhase(0);
    setIsComplete(false);
    setError(null);

    const orchestrator = createOrchestrator({
      apiKey,
      sowContent,
      staffingPlan,
      additionalContext,
      onEvent: handleEvent,
    });

    orchestratorRef.current = orchestrator;
    setProjectRoles(orchestrator.getProjectRoles());
    orchestrator.start();
  }, [handleEvent]);

  const stopSimulation = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
    }
    setIsRunning(false);
  }, []);

  const progress = currentPhase > 0
    ? Math.round((Object.values(deliverables).filter(d => d.status === 'completed').length / DELIVERABLES.length) * 100)
    : 0;

  const currentPhaseName = PHASES.find(p => p.id === currentPhase)?.name || '';

  return {
    currentPhase,
    currentPhaseName,
    agentStatuses,
    agentTasks,
    messages,
    deliverables,
    typingAgents,
    streamingText,
    isRunning,
    isComplete,
    error,
    progress,
    projectRoles,
    startSimulation,
    stopSimulation,
  };
}
