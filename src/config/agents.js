export const AGENTS = [
  {
    id: 'client-partner',
    jobFunction: 'Client Partner',
    defaultProjectRole: 'Account Lead',
    emoji: '\u{1F4BC}',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    description: 'Reviews SOW, extracts objectives, identifies growth opportunities',
  },
  {
    id: 'solutions-architect',
    jobFunction: 'Solutions Architect',
    defaultProjectRole: 'Tech Lead',
    emoji: '\u{1F3D7}\uFE0F',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    description: 'Designs architecture, selects tech stack, creates architecture diagram',
  },
  {
    id: 'project-manager',
    jobFunction: 'Project Manager',
    defaultProjectRole: 'Delivery Manager',
    emoji: '\u{1F4CB}',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    description: 'Creates project plan, timeline, backlog, staffing recommendations',
  },
  {
    id: 'data-engineer',
    jobFunction: 'Data Engineer',
    defaultProjectRole: 'Data Lead',
    emoji: '\u{1F5C4}\uFE0F',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    description: 'Data pipeline design, data modeling, integration strategy',
  },
  {
    id: 'ai-ml-engineer',
    jobFunction: 'AI/ML Engineer',
    defaultProjectRole: 'AI Lead',
    emoji: '\u{1F916}',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    description: 'ML model selection, AI feature design, evaluation criteria',
  },
  {
    id: 'cloud-engineer',
    jobFunction: 'Cloud Engineer',
    defaultProjectRole: 'Infra Lead',
    emoji: '\u2601\uFE0F',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    description: 'Infrastructure design, deployment strategy, cost estimates',
  },
  {
    id: 'fullstack-developer',
    jobFunction: 'Full-Stack Developer',
    defaultProjectRole: 'Dev Lead',
    emoji: '\u{1F4BB}',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    description: 'Application design, UI/UX approach, API design, MVP plan',
  },
  {
    id: 'qa-engineer',
    jobFunction: 'QA Engineer',
    defaultProjectRole: 'QA Lead',
    emoji: '\u{1F50D}',
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    description: 'Test strategy, acceptance criteria, quality gates',
  },
];

export const DELIVERABLES = [
  { id: 'sow-review', title: 'SOW Review & Objectives', agentId: 'client-partner', phase: 1 },
  { id: 'tech-architecture', title: 'Technical Architecture', agentId: 'solutions-architect', phase: 2 },
  { id: 'project-backlog', title: 'Product Backlog', agentId: 'project-manager', phase: 2 },
  { id: 'data-strategy', title: 'Data & Integration Strategy', agentId: 'data-engineer', phase: 3 },
  { id: 'ai-strategy', title: 'AI/ML Strategy', agentId: 'ai-ml-engineer', phase: 3 },
  { id: 'infra-plan', title: 'Infrastructure & Cost Estimate', agentId: 'cloud-engineer', phase: 3 },
  { id: 'mvp-plan', title: 'MVP Scope & Demo Plan', agentId: 'fullstack-developer', phase: 3 },
  { id: 'test-strategy', title: 'Test Strategy', agentId: 'qa-engineer', phase: 4 },
  { id: 'project-report', title: 'Final Project Report', agentId: 'project-manager', phase: 5 },
  { id: 'growth-opportunities', title: 'Growth Opportunities', agentId: 'client-partner', phase: 5 },
];

export const PHASES = [
  { id: 1, name: 'Discovery', agents: ['client-partner'] },
  { id: 2, name: 'Architecture & Planning', agents: ['solutions-architect', 'project-manager'] },
  { id: 3, name: 'Engineering Breakdown', agents: ['data-engineer', 'ai-ml-engineer', 'cloud-engineer', 'fullstack-developer'] },
  { id: 4, name: 'Quality & Review', agents: ['qa-engineer'] },
  { id: 5, name: 'Deliverables & Wrap-up', agents: ['project-manager', 'client-partner'] },
];

export function getAgentById(id) {
  return AGENTS.find(a => a.id === id);
}
