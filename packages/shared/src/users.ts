/**
 * Lightweight user information intended for dropdowns,
 * assignment lists and selectors.
 *
 * Never expose sensitive fields such as:
 *
 *  password
 *  email
 *  auth provider
 *  timestamps
 *
 * This represents the public API contract only.
 */

export interface UserSummary {
  id: string;
  name: string;
}