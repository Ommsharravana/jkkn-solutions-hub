// Export all services
// Services handle data fetching and API calls

export * from './users'
export * from './institutions'
export * from './notifications'
export * from './solutions'
export * from './clients'
export * from './intent-integration'
export * from './training-programs'
export * from './training-sessions'
export * from './cohort-members'
export * from './discovery-visits'
export * from './communications'
export * from './publications'
export * from './accreditation'
export * from './departments'
export * from './payments'
export * from './earnings'
export * from './revenue-splits'
export * from './content-orders'
export * from './content-deliverables'
export * from './production-learners'
export * from './phases'
export {
  getBuilders,
  getBuilderById,
  createBuilder,
  updateBuilder,
  deleteBuilder,
  addBuilderSkill,
  updateBuilderSkill,
  removeBuilderSkill,
  requestAssignment,
  approveAssignment,
  startAssignment,
  completeAssignment,
  withdrawAssignment,
  getPendingAssignmentRequests,
  getAssignmentsByStatus,
  getBuilderStats,
  getAvailableBuildersForPhase,
  checkAssignmentApproval,
  type BuilderWithDetails,
  type BuilderAssignmentWithPhase,
  type BuilderFilters,
  type CreateBuilderInput,
  type UpdateBuilderInput,
  type AddSkillInput,
  type CreateAssignmentInput as CreateBuilderAssignmentInput,
  type ApprovalResult,
} from './builders'
