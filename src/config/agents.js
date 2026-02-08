export const AGENTS = [
  {
    id: 'client-partner',
    jobFunction: 'Client Partner',
    defaultProjectRole: 'Account Lead',
    emoji: '\u{1F4BC}',
    color: '#4D9BFF',
    bgColor: 'rgba(77, 155, 255, 0.15)',
    description: 'Reviews SOW, extracts objectives, identifies growth opportunities',
  },
  {
    id: 'solutions-architect',
    jobFunction: 'Solutions Architect',
    defaultProjectRole: 'Tech Lead',
    emoji: '\u{1F3D7}\uFE0F',
    color: '#80B8FF',
    bgColor: 'rgba(128, 184, 255, 0.15)',
    description: 'Designs architecture, selects tech stack, creates architecture diagram',
  },
  {
    id: 'project-manager',
    jobFunction: 'Project Manager',
    defaultProjectRole: 'Delivery Manager',
    emoji: '\u{1F4CB}',
    color: '#0DFFAE',
    bgColor: 'rgba(13, 255, 174, 0.15)',
    description: 'Creates project plan, timeline, backlog, staffing recommendations',
  },
  {
    id: 'data-engineer',
    jobFunction: 'Data Engineer',
    defaultProjectRole: 'Data Lead',
    emoji: '\u{1F5C4}\uFE0F',
    color: '#BFD8FF',
    bgColor: 'rgba(191, 216, 255, 0.15)',
    description: 'Data pipeline design, data modeling, integration strategy',
  },
  {
    id: 'ai-ml-engineer',
    jobFunction: 'AI/ML Engineer',
    defaultProjectRole: 'AI Lead',
    emoji: '\u{1F916}',
    color: '#339DFF',
    bgColor: 'rgba(51, 157, 255, 0.15)',
    description: 'ML model selection, AI feature design, evaluation criteria',
  },
  {
    id: 'cloud-engineer',
    jobFunction: 'Cloud Engineer',
    defaultProjectRole: 'Infra Lead',
    emoji: '\u2601\uFE0F',
    color: '#0A7AFF',
    bgColor: 'rgba(10, 122, 255, 0.15)',
    description: 'Infrastructure design, deployment strategy, cost estimates',
  },
  {
    id: 'fullstack-developer',
    jobFunction: 'Full-Stack Developer',
    defaultProjectRole: 'Dev Lead',
    emoji: '\u{1F4BB}',
    color: '#66CCBB',
    bgColor: 'rgba(102, 204, 187, 0.15)',
    description: 'Application design, UI/UX approach, API design, MVP plan',
  },
  {
    id: 'qa-engineer',
    jobFunction: 'QA Engineer',
    defaultProjectRole: 'QA Lead',
    emoji: '\u{1F50D}',
    color: '#00CC8E',
    bgColor: 'rgba(0, 204, 142, 0.15)',
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
