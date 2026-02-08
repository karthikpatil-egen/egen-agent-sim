import { useState, useCallback, useRef, useMemo } from 'react';
import { createOrchestrator } from '../services/orchestrator';
import { AGENTS, PHASES, DELIVERABLES } from '../config/agents';

export function useSimulation(config) {
  const agents = config?.agents || AGENTS;
  const phases = config?.phases || PHASES;
  const configDeliverables = config?.deliverables || DELIVERABLES;

  const initialAgentStatuses = useMemo(
    () => Object.fromEntries(agents.map(a => [a.id, 'idle'])),
    [agents]
  );

  const initialDeliverableStatuses = useMemo(
    () => Object.fromEntries(configDeliverables.map(d => [d.id, { status: 'pending', content: '' }])),
    [configDeliverables]
  );

  const [currentPhase, setCurrentPhase] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatuses);
  const [agentTasks, setAgentTasks] = useState({});
  const [messages, setMessages] = useState([]);
  const [deliverables, setDeliverables] = useState(initialDeliverableStatuses);
  const [typingAgents, setTypingAgents] = useState(new Set());
  const [streamingText, setStreamingText] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [projectRoles, setProjectRoles] = useState({});

  // Feature 1: Insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  // Feature 5: Timeline state
  const [sowStartDate, setSowStartDate] = useState(null);
  const [sowEndDate, setSowEndDate] = useState(null);
  const [simulatedDate, setSimulatedDate] = useState(null);

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
            startDate: event.startDate || prev[event.deliverableId]?.startDate || null,
            completedDate: event.completedDate || prev[event.deliverableId]?.completedDate || null,
            durationDays: event.durationDays ?? prev[event.deliverableId]?.durationDays ?? null,
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

      // Feature 1: Insights events
      case 'insights-generating':
        setInsightsLoading(true);
        setInsightsError(null);
        break;

      case 'insights-ready':
        setInsightsLoading(false);
        setInsights(event.insights);
        break;

      case 'insights-error':
        setInsightsLoading(false);
        setInsightsError(event.error);
        break;

      // Feature 5: Timeline events
      case 'timeline-update':
        setSimulatedDate(event.simulatedDate);
        break;
    }
  }, []);

  const startSimulation = useCallback(({ apiKey, sowContent, staffingPlan, additionalContext, sowStartDate: startDate, sowEndDate: endDate }) => {
    // Reset state using current config
    const resetAgentStatuses = Object.fromEntries(agents.map(a => [a.id, 'idle']));
    const resetDeliverables = Object.fromEntries(configDeliverables.map(d => [d.id, { status: 'pending', content: '' }]));

    setMessages([]);
    setAgentStatuses(resetAgentStatuses);
    setAgentTasks({});
    setDeliverables(resetDeliverables);
    setTypingAgents(new Set());
    setStreamingText({});
    setCurrentPhase(0);
    setIsComplete(false);
    setError(null);
    setInsights(null);
    setInsightsLoading(false);
    setInsightsError(null);
    setSowStartDate(startDate || null);
    setSowEndDate(endDate || null);
    setSimulatedDate(null);

    const orchestrator = createOrchestrator({
      apiKey,
      sowContent,
      staffingPlan,
      additionalContext,
      onEvent: handleEvent,
      config,
      sowStartDate: startDate,
      sowEndDate: endDate,
    });

    orchestratorRef.current = orchestrator;
    setProjectRoles(orchestrator.getProjectRoles());
    orchestrator.start();
  }, [handleEvent, agents, configDeliverables, config]);

  const stopSimulation = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
    }
    setIsRunning(false);
  }, []);

  const progress = currentPhase > 0
    ? Math.round((Object.values(deliverables).filter(d => d.status === 'completed').length / configDeliverables.length) * 100)
    : 0;

  const currentPhaseName = phases.find(p => p.id === currentPhase)?.name || '';

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
    insights,
    insightsLoading,
    insightsError,
    sowStartDate,
    sowEndDate,
    simulatedDate,
    startSimulation,
    stopSimulation,
  };
}
