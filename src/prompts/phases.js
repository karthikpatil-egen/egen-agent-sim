export const PHASE_INSTRUCTIONS = {
  1: {
    'client-partner': {
      task: 'SOW Review & Discovery',
      instruction: `Analyze the provided Statement of Work (SOW) and any additional context. Produce a comprehensive review that includes:

1. **Project Overview**: Summarize what the client wants in 2-3 sentences
2. **Key Business Objectives**: List the primary business goals
3. **Scope Summary**: What's in scope and what's explicitly out of scope
4. **Success Criteria**: How will success be measured?
5. **Risks & Assumptions**: Identify potential risks and unstated assumptions
6. **Constraints**: Timeline, budget, technology, or regulatory constraints
7. **Initial Recommendations**: Your high-level recommendations for approach

For your chat message, share a brief summary of your findings and any concerns you want the team to be aware of. Be conversational — you're kicking off a team discussion.`,
    },
  },
  2: {
    'solutions-architect': {
      task: 'Technical Architecture Design',
      instruction: `Based on the Client Partner's SOW review and the original SOW, design the technical architecture. Produce:

1. **Architecture Overview**: High-level system design approach
2. **Technology Stack**: Recommended technologies with justification
3. **Architecture Diagram**: Create a Mermaid diagram showing key components and their interactions
4. **Key Design Decisions**: Document important architectural decisions and trade-offs
5. **Integration Points**: External systems, APIs, and data sources
6. **Non-Functional Requirements**: Scalability, performance, security approach
7. **Technical Risks**: Architecture-specific risks and mitigations

For your chat message, explain your architectural approach to the team, highlighting why you chose this direction and any trade-offs. Reference the Client Partner's findings where relevant.

IMPORTANT: Include a Mermaid diagram in your deliverable using \`\`\`mermaid code blocks.`,
    },
    'project-manager': {
      task: 'Project Planning & Backlog',
      instruction: `Based on the Client Partner's SOW review and the original SOW, create the project plan and initial backlog. Produce:

1. **Project Timeline**: Phase breakdown with estimated durations
2. **Epic Breakdown**: 4-8 epics covering the full scope
3. **Product Backlog**: At least 15-20 user stories with priority (Must/Should/Could)
4. **Sprint Plan**: Suggested sprint structure for the first 3-4 sprints
5. **Staffing Recommendations**: Team composition and allocation
6. **Dependencies**: Key dependencies and their impact
7. **Risk Register**: Top 5-8 project risks with mitigation plans

For your chat message, share the high-level timeline and sprint approach with the team. Mention how you're incorporating the Client Partner's findings. Be organized and action-oriented.`,
    },
  },
  3: {
    'data-engineer': {
      task: 'Data Pipeline & Integration Design',
      instruction: `Based on the SOW, Client Partner's review, and Solutions Architect's architecture, design the data strategy. Produce:

1. **Data Architecture**: How data flows through the system
2. **Data Models**: Key entities and their relationships
3. **Pipeline Design**: ETL/ELT pipelines, orchestration approach
4. **Data Sources & Integrations**: External data sources and how to connect
5. **Data Quality Strategy**: Validation, monitoring, and governance
6. **Storage Strategy**: Database selection, data lake/warehouse design
7. **Estimated Data Volumes**: Expected data sizes and growth projections

For your chat message, explain your data approach to the team, reference the architect's design, and flag any data-related concerns or dependencies.`,
    },
    'ai-ml-engineer': {
      task: 'AI/ML Feature Design',
      instruction: `Based on the SOW, Client Partner's review, and Solutions Architect's architecture, design the AI/ML approach. Produce:

1. **AI/ML Use Cases**: Specific ML applications for this project
2. **Model Selection**: Recommended models/algorithms with justification
3. **Training Strategy**: Data requirements, training pipeline, infrastructure
4. **Evaluation Framework**: Metrics, benchmarks, and success criteria
5. **MLOps Plan**: Model versioning, monitoring, retraining strategy
6. **Build vs Buy Analysis**: When to use pre-built APIs vs custom models
7. **Ethical Considerations**: Bias, fairness, and responsible AI practices

For your chat message, share your AI/ML recommendations with the team, reference the architecture, and discuss how AI adds value to this specific project.`,
    },
    'cloud-engineer': {
      task: 'Infrastructure & Deployment Design',
      instruction: `Based on the SOW, Client Partner's review, and Solutions Architect's architecture, design the infrastructure. Produce:

1. **Cloud Architecture**: Cloud provider selection and service mapping
2. **Infrastructure as Code**: Terraform/Pulumi approach
3. **Deployment Strategy**: CI/CD pipeline, environments, rollback plan
4. **Networking & Security**: VPC design, IAM, encryption, compliance
5. **Monitoring & Observability**: Logging, metrics, alerting, dashboards
6. **Cost Estimate**: Monthly/annual cost breakdown by service
7. **Disaster Recovery**: Backup, HA, and DR strategy

For your chat message, present your infrastructure plan to the team, reference the architecture, and share cost estimates. Flag any infrastructure constraints.`,
    },
    'fullstack-developer': {
      task: 'Application Design & MVP Plan',
      instruction: `Based on the SOW, Client Partner's review, and Solutions Architect's architecture, design the application and MVP. Produce:

1. **Application Architecture**: Frontend/backend structure, component design
2. **API Design**: Key endpoints, data contracts, authentication
3. **UI/UX Approach**: Key screens, user flows, design system
4. **MVP Definition**: What's included in the MVP vs future phases
5. **Demo Plan**: What will be shown in the first demo, and when
6. **Frontend Tech Stack**: Framework, state management, styling
7. **Development Workflow**: Branching strategy, PR process, coding standards

For your chat message, share your application approach and MVP plan with the team. Reference the architecture and project plan. Focus on what users will see and interact with first.`,
    },
  },
  4: {
    'qa-engineer': {
      task: 'Test Strategy & Quality Plan',
      instruction: `Based on all previous outputs — SOW review, architecture, project plan, data strategy, AI/ML plan, infrastructure, and application design — create a comprehensive test strategy. Produce:

1. **Test Strategy Overview**: Testing approach and philosophy
2. **Test Pyramid**: Unit, integration, e2e test distribution
3. **Automation Framework**: Tools, frameworks, and infrastructure
4. **Test Scenarios**: Key test scenarios for each component (at least 15-20)
5. **Performance Testing**: Load testing strategy, benchmarks, SLAs
6. **Security Testing**: OWASP top 10, penetration testing approach
7. **Quality Gates**: Release criteria, code coverage targets
8. **Acceptance Criteria**: Key acceptance criteria organized by epic

For your chat message, present your test strategy to the team, referencing specific concerns from other agents' outputs. Call out any gaps or risks you've identified from reviewing their work.`,
    },
  },
  5: {
    'project-manager': {
      task: 'Final Project Report',
      instruction: `Compile a comprehensive final project report synthesizing all agent outputs. This is the master deliverable. Produce:

1. **Executive Summary**: 3-4 paragraph overview of the full project plan
2. **Project Scope & Objectives**: From the Client Partner's review
3. **Technical Approach**: Summary of the architecture and technology decisions
4. **Project Timeline & Milestones**: Refined timeline incorporating all inputs
5. **Team & Staffing**: Final team composition and allocation
6. **Risk Summary**: Consolidated risks from all workstreams
7. **Budget & Cost Summary**: Infrastructure costs + staffing estimates
8. **Next Steps**: Immediate actions for project kickoff
9. **Key Decisions Needed**: Decisions that need client input

For your chat message, present the final report to the team as a wrap-up. Thank each specialist for their contributions and highlight the key takeaways.`,
    },
    'client-partner': {
      task: 'Growth Opportunities & Recommendations',
      instruction: `Based on all the team's work — architecture, data, AI/ML, infrastructure, and quality plans — identify growth opportunities. Produce:

1. **Immediate Opportunities**: Quick wins or scope additions for this engagement
2. **Phase 2 Recommendations**: Natural extensions of the current project
3. **Strategic Initiatives**: Longer-term transformation opportunities
4. **Technology Recommendations**: Additional capabilities that could add value
5. **Industry Insights**: Relevant trends and competitive considerations
6. **Partnership Value**: How Egen can be a long-term strategic partner
7. **Estimated Impact**: Business value estimates for each opportunity

For your chat message, share your growth recommendations with the team. Frame these as opportunities to deliver even more value to the client. End with an encouraging note about the project.`,
    },
  },
};

export function getPhaseInstruction(phaseId, agentId) {
  return PHASE_INSTRUCTIONS[phaseId]?.[agentId] || null;
}
