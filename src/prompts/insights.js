export const INSIGHTS_SYSTEM_PROMPT = `You are a senior engagement analyst at Egen, a technology consulting firm. You have 15+ years of experience reviewing project plans, identifying risks, and providing strategic recommendations for technology engagements.

You are reviewing the complete output of a simulated project kickoff — all deliverables produced by the team of 8 AI agents across 5 phases. Your job is to synthesize everything into actionable project intelligence.

You are precise, direct, and pragmatic. You focus on what matters most for project success. You call out risks honestly and provide specific, actionable recommendations. You reference specific deliverables and agent outputs when making points.`;

export const INSIGHTS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: {
      type: 'string',
      description: 'A 3-5 paragraph executive summary of the overall project plan quality, key strengths, and areas of concern',
    },
    projectRisks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          risk: { type: 'string', description: 'Description of the risk' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Risk severity level' },
          source: { type: 'string', description: 'Which deliverable or agent output surfaced this risk' },
          mitigation: { type: 'string', description: 'Recommended mitigation strategy' },
        },
        required: ['risk', 'severity', 'source', 'mitigation'],
      },
      description: 'Identified project risks with severity and mitigation strategies',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'What went well in the project planning — strong areas of the deliverables',
    },
    watchpoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'The watchpoint item' },
          reason: { type: 'string', description: 'Why this needs monitoring' },
        },
        required: ['item', 'reason'],
      },
      description: 'Things to monitor when the project becomes real',
    },
    staffingGaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          gap: { type: 'string', description: 'The staffing gap identified' },
          currentCoverage: { type: 'string', description: 'What role or person currently covers this, if any' },
          impact: { type: 'string', description: 'Impact if this gap is not addressed' },
          recommendation: { type: 'string', description: 'How to address the gap' },
        },
        required: ['gap', 'currentCoverage', 'impact', 'recommendation'],
      },
      description: 'Gaps in staffing based on the provided team roles vs the SOW scope',
    },
    scopeAssessment: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['realistic', 'tight', 'aggressive', 'unrealistic'], description: 'Overall scope feasibility verdict' },
        analysis: { type: 'string', description: 'Detailed analysis of scope vs timeline vs resources' },
        recommendations: { type: 'string', description: 'Recommendations for scope adjustments' },
      },
      required: ['verdict', 'analysis', 'recommendations'],
      description: 'Assessment of whether the scope is achievable given timeline and resources',
    },
    keyRecommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          recommendation: { type: 'string', description: 'The recommendation' },
          priority: { type: 'string', enum: ['immediate', 'short-term', 'long-term'], description: 'Priority timeframe' },
          rationale: { type: 'string', description: 'Why this recommendation matters' },
        },
        required: ['recommendation', 'priority', 'rationale'],
      },
      description: 'Key recommendations prioritized by timeframe',
    },
    clientDependencies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dependency: { type: 'string', description: 'What the client must provide, decide, or unblock' },
          assumption: { type: 'string', description: 'What was assumed by the agents about this dependency' },
          impact: { type: 'string', description: 'Impact if this dependency is not met' },
          recommendation: { type: 'string', description: 'How the real team should prepare for this' },
        },
        required: ['dependency', 'assumption', 'impact', 'recommendation'],
      },
      description: 'Client dependencies and assumptions that need validation',
    },
  },
  required: ['executiveSummary', 'projectRisks', 'strengths', 'watchpoints', 'staffingGaps', 'scopeAssessment', 'keyRecommendations', 'clientDependencies'],
};

export function buildInsightsUserPrompt(sowContent, additionalContext, staffingPlan, agentOutputs, deliverablesDef, agents) {
  let prompt = `## Your Task
Review ALL of the following project deliverables produced by the simulation team and provide comprehensive project insights.

## Original Statement of Work
${sowContent}

`;

  if (staffingPlan) {
    prompt += `## Staffing Plan (Provided Team Roles)
${staffingPlan}

`;
  }

  if (additionalContext) {
    prompt += `## Additional Project Context
${additionalContext}

`;
  }

  prompt += `## Agent Deliverables (Full Content)\n\n`;

  for (const deliverable of deliverablesDef) {
    const output = agentOutputs[deliverable.agentId];
    if (!output) continue;
    const agent = agents.find(a => a.id === deliverable.agentId);
    const agentName = agent?.jobFunction || deliverable.agentId;

    prompt += `### ${deliverable.title} (by ${agentName})
${output.deliverableContent || 'No content produced.'}

---

`;
  }

  prompt += `## Analysis Instructions

Based on ALL the deliverables above, provide:

1. **Executive Summary** — Synthesize the overall project plan quality
2. **Project Risks** — Identify risks across all deliverables with severity ratings
3. **Strengths** — What the team did well
4. **Watchpoints** — Things to monitor when the project becomes real
5. **Staffing Gaps** — Compare the provided staffing plan/team roles against the SOW scope. Identify where coverage is thin, skills are missing, or roles are overloaded. Reference specific team roles from the staffing plan.
6. **Scope Assessment** — Is the scope realistic given the timeline and resources? Provide a verdict.
7. **Key Recommendations** — Prioritized recommendations for project success
8. **Client Dependencies** — Find assumptions agents made about client-provided resources, decisions, access, or data. Call these out so the real-life team can prepare.

Be specific. Reference actual deliverable content. Do not be generic.`;

  return prompt;
}
