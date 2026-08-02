/**
 * Shared user-related types
 * Never expose sensitive fields such as:
 *
 *  password
 *  email
 *  auth provider
 *  timestamps
 *
 * This represents the public API contract only.
 */


// Lightweight user information intended for dropdowns, assignment lists, and selectors.
export interface UserSummary {
  id: string;
  userNumber: string;
  name: string;
}
