export const SUPER_ADMINS = ['karthik.patil@egen.ai'];

export function isSuperAdmin(email) {
  return SUPER_ADMINS.includes(email);
}
