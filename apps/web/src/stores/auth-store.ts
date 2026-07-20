import { create } from "zustand";
import { readCookie, writeCookie } from "../lib/cookies";

export type UserRole =
  | "super_admin"
  | "government_agency"
  | "lgu"
  | "hauling_org"
  | "business_org"
  | "business"
  | "resident"
  | "driver"
  | "eco_aide"
  | "citizen";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  phoneNumber?: string | null | undefined;
  contactNo?: string | null | undefined;
  address?:
    | {
        line1: string;
        barangay: string;
        city: string;
        province: string;
      }
    | null
    | undefined;
  notificationPreferences?:
    | {
        emailNotif: boolean;
        pushNotif: boolean;
        collectionReminder: boolean;
        statusUpdates: boolean;
        isDarkMode?: boolean;
      }
    | undefined;
}

interface PersistedAuthState {
  user: AuthUser | null;
  accessToken: string | null;
  rememberMeLoggedIn: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  rememberMeLoggedIn: boolean;
  setSession: (user: AuthUser, accessToken: string, rememberMeLoggedIn?: boolean) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
}

const AUTH_COOKIE_NAME = "bazoora-auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const DEFAULT_MOCK_USER: AuthUser = {
  id: "usr-mock-resident-1",
  email: "resident@bazoora.com",
  firstName: "Jane",
  lastName: "Smith",
  role: "resident",
  organizationId: "org-1",
};

const DEFAULT_MOCK_TOKEN = "mock-token-resident";

function safeParseAuthCookie(): PersistedAuthState | null {
  const raw = readCookie(AUTH_COOKIE_NAME);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAuthState>;
    if (!parsed.user || !parsed.accessToken) {
      return null;
    }

    return {
      user: parsed.user,
      accessToken: parsed.accessToken,
      rememberMeLoggedIn: parsed.rememberMeLoggedIn ?? false,
    };
  } catch {
    return null;
  }
}

function persistAuthCookie(state: PersistedAuthState): void {
  const options = state.rememberMeLoggedIn ? { maxAgeSeconds: AUTH_COOKIE_MAX_AGE_SECONDS } : {};
  writeCookie(AUTH_COOKIE_NAME, JSON.stringify(state), options);
}

const initialState = safeParseAuthCookie();

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: initialState?.user ?? DEFAULT_MOCK_USER,
  accessToken: initialState?.accessToken ?? DEFAULT_MOCK_TOKEN,
  rememberMeLoggedIn: initialState?.rememberMeLoggedIn ?? true,
  setSession: (user, accessToken, rememberMeLoggedIn = true) => {
    const nextState = { user, accessToken, rememberMeLoggedIn };
    set(nextState);
    persistAuthCookie(nextState);
  },
  setAccessToken: (accessToken) => {
    const nextState = { ...get(), accessToken };
    set({ accessToken });
    if (nextState.user && nextState.accessToken) {
      persistAuthCookie({
        user: nextState.user,
        accessToken: nextState.accessToken,
        rememberMeLoggedIn: nextState.rememberMeLoggedIn,
      });
    }
  },
  clear: () => {
    // For the demo simulator, when logging out we just reset to the default resident mock session
    const resetState = {
      user: DEFAULT_MOCK_USER,
      accessToken: DEFAULT_MOCK_TOKEN,
      rememberMeLoggedIn: true,
    };
    set(resetState);
    persistAuthCookie(resetState);
  },
}));
