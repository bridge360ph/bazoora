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
  /** Display ID such as EA-001. Normalized by the API, never null here. */
  userNumber: string;
  name: string;
}
