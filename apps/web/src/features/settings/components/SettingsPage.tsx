import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  MonitorCog,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@bazoora/ui";

type Tab = "Account" | "Notifications" | "System";

interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  postalCode?: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const NAME_PATTERN = /^[\p{L}\p{M} .'-]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_PATTERN = /^09\d{9}$/;
const POSTAL_CODE_PATTERN = /^\d{4}$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

function validateName(value: string, fieldName: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return `${fieldName} is required.`;
  }

  if (normalizedValue.length < 2) {
    return `${fieldName} must contain at least 2 characters.`;
  }

  if (normalizedValue.length > 100) {
    return `${fieldName} must not exceed 100 characters.`;
  }

  if (!NAME_PATTERN.test(normalizedValue)) {
    return `${fieldName} may only contain letters, spaces, periods, hyphens, and apostrophes.`;
  }

  return undefined;
}

function validateRequiredAddress(
  value: string,
  fieldName: string,
  minimumLength = 2,
) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return `${fieldName} is required.`;
  }

  if (normalizedValue.length < minimumLength) {
    return `${fieldName} must contain at least ${minimumLength} characters.`;
  }

  if (normalizedValue.length > 120) {
    return `${fieldName} must not exceed 120 characters.`;
  }

  return undefined;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clear);

  const [tab, setTab] = useState<Tab>("Account");

  const [firstName, setFirstName] = useState(authUser?.firstName ?? "");
  const [lastName, setLastName] = useState(authUser?.lastName ?? "");
  const [email, setEmail] = useState(authUser?.email ?? "");
  const [phone, setPhone] = useState(authUser?.phoneNumber ?? authUser?.contactNo ?? "");
  const [streetAddress, setStreetAddress] = useState(authUser?.address?.line1 ?? "");
  const [barangay, setBarangay] = useState(authUser?.address?.barangay ?? "");
  const [cityMunicipality, setCityMunicipality] = useState(authUser?.address?.city ?? "");
  const [province, setProvince] = useState(authUser?.address?.province ?? "");
  const [postalCode, setPostalCode] = useState("");
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  const [emailNotifications, setEmailNotifications] = useState(authUser?.notificationPreferences?.emailNotif ?? true);
  const [pushNotifications, setPushNotifications] = useState(authUser?.notificationPreferences?.pushNotif ?? true);
  const [dailySummary, setDailySummary] = useState(authUser?.notificationPreferences?.collectionReminder ?? false);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem("bazoora-admin-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [autoAssignRoutes, setAutoAssignRoutes] = useState(true);
  const [realTimeTracking, setRealTimeTracking] = useState(true);
  const [automaticReports, setAutomaticReports] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  function showToast(message: string) {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    window.localStorage.setItem(
      "bazoora-admin-theme",
      darkMode ? "dark" : "light",
    );
  }, [darkMode]);

  function validateProfileField(field: keyof ProfileErrors) {
    let error: string | undefined;

    switch (field) {
      case "firstName":
        error = validateName(firstName, "First name");
        break;
      case "lastName":
        error = validateName(lastName, "Last name");
        break;
      case "email":
        if (!email.trim()) {
          error = "Email is required.";
        } else if (!EMAIL_PATTERN.test(email.trim())) {
          error = "Enter a valid email address.";
        }
        break;
      case "phone":
        if (!phone) {
          error = "Phone number is required.";
        } else if (!PH_MOBILE_PATTERN.test(phone)) {
          error = "Use an 11-digit Philippine mobile number beginning with 09.";
        }
        break;
      case "streetAddress":
        error = validateRequiredAddress(
          streetAddress,
          "House/unit number and street",
          5,
        );
        break;
      case "barangay":
        error = validateRequiredAddress(barangay, "Barangay");
        break;
      case "cityMunicipality":
        error = validateRequiredAddress(
          cityMunicipality,
          "City or municipality",
        );
        break;
      case "province":
        error = validateRequiredAddress(province, "Province");
        break;
      case "postalCode":
        if (!postalCode) {
          error = "ZIP/postal code is required.";
        } else if (!POSTAL_CODE_PATTERN.test(postalCode)) {
          error = "Enter a valid 4-digit Philippine ZIP/postal code.";
        }
        break;
    }

    setProfileErrors((currentErrors) => ({
      ...currentErrors,
      [field]: error,
    }));

    return error;
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: ProfileErrors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      email: !email.trim()
        ? "Email is required."
        : EMAIL_PATTERN.test(email.trim())
          ? undefined
          : "Enter a valid email address.",
      phone: !phone
        ? "Phone number is required."
        : PH_MOBILE_PATTERN.test(phone)
          ? undefined
          : "Use an 11-digit Philippine mobile number beginning with 09.",
      streetAddress: validateRequiredAddress(
        streetAddress,
        "House/unit number and street",
        5,
      ),
      barangay: validateRequiredAddress(barangay, "Barangay"),
      cityMunicipality: validateRequiredAddress(
        cityMunicipality,
        "City or municipality",
      ),
      province: validateRequiredAddress(province, "Province"),
      postalCode: !postalCode
        ? "ZIP/postal code is required."
        : POSTAL_CODE_PATTERN.test(postalCode)
          ? undefined
          : "Enter a valid 4-digit Philippine ZIP/postal code.",
    };

    setProfileErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      showToast("Please correct the highlighted profile fields.");
      return;
    }

    setFirstName(firstName.trim().replace(/\s+/g, " "));
    setLastName(lastName.trim().replace(/\s+/g, " "));
    setEmail(email.trim().toLowerCase());
    setStreetAddress(streetAddress.trim().replace(/\s+/g, " "));
    setBarangay(barangay.trim().replace(/\s+/g, " "));
    setCityMunicipality(cityMunicipality.trim().replace(/\s+/g, " "));
    setProvince(province.trim().replace(/\s+/g, " "));

    showToast("Profile information saved.");
  }

  function validatePasswordField(field: keyof PasswordErrors) {
    let error: string | undefined;

    switch (field) {
      case "currentPassword":
        if (!currentPassword) {
          error = "Current password is required.";
        }
        break;
      case "newPassword":
        if (!newPassword) {
          error = "New password is required.";
        } else if (!PASSWORD_PATTERN.test(newPassword)) {
          error =
            "Use 8–128 characters with uppercase, lowercase, number, and special character.";
        } else if (newPassword === currentPassword) {
          error = "New password must be different from the current password.";
        }
        break;
      case "confirmPassword":
        if (!confirmPassword) {
          error = "Please confirm your new password.";
        } else if (confirmPassword !== newPassword) {
          error = "New passwords do not match.";
        }
        break;
    }

    setPasswordErrors((currentErrors) => ({
      ...currentErrors,
      [field]: error,
    }));

    return error;
  }

  function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: PasswordErrors = {
      currentPassword: !currentPassword
        ? "Current password is required."
        : undefined,
      newPassword: !newPassword
        ? "New password is required."
        : !PASSWORD_PATTERN.test(newPassword)
          ? "Use 8–128 characters with uppercase, lowercase, number, and special character."
          : newPassword === currentPassword
            ? "New password must be different from the current password."
            : undefined,
      confirmPassword: !confirmPassword
        ? "Please confirm your new password."
        : confirmPassword !== newPassword
          ? "New passwords do not match."
          : undefined,
    };

    setPasswordErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      showToast("Please correct the highlighted password fields.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    showToast("Password updated successfully.");
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-gray-900 dark:text-white">
            Settings and System Configuration
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500 dark:text-gray-400">
            Manage account details, notification preferences, and system
            behavior.
          </p>
        </div>
      </section>

      <div
        className="mb-6 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Settings sections"
      >
        <TabButton
          active={tab === "Account"}
          onClick={() => {
            setTab("Account");
          }}
        >
          Account
        </TabButton>
        <TabButton
          active={tab === "Notifications"}
          onClick={() => {
            setTab("Notifications");
          }}
        >
          Notifications
        </TabButton>
        <TabButton
          active={tab === "System"}
          onClick={() => {
            setTab("System");
          }}
        >
          System
        </TabButton>
      </div>

      <div className="mx-auto max-w-[760px]">
        {tab === "Account" && (
          <>
            <SectionCard
              icon={<UserRound size={24} strokeWidth={1.8} />}
              title="Profile Information"
              subtitle="Update your account details"
            >
              <form onSubmit={handleProfileSubmit} noValidate>
                <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field
                    label="First Name"
                    value={firstName}
                    onChange={(value) => {
                      setFirstName(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        firstName: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("firstName");
                    }}
                    error={profileErrors.firstName}
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    placeholder="Juan"
                  />
                  <Field
                    label="Last Name"
                    value={lastName}
                    onChange={(value) => {
                      setLastName(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        lastName: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("lastName");
                    }}
                    error={profileErrors.lastName}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    placeholder="Dela Cruz"
                  />
                </div>

                <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field
                    label="Email"
                    value={email}
                    onChange={(value) => {
                      setEmail(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        email: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("email");
                    }}
                    error={profileErrors.email}
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="juan.delacruz@example.com"
                  />
                  <Field
                    label="Phone Number"
                    value={phone}
                    onChange={(value) => {
                      setPhone(value.replace(/\D/g, "").slice(0, 11));
                      setProfileErrors((errors) => ({
                        ...errors,
                        phone: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("phone");
                    }}
                    error={profileErrors.phone}
                    required
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="09123456789"
                  />
                </div>

                <div className="mb-3.5">
                  <Field
                    label="House/Unit Number and Street"
                    value={streetAddress}
                    onChange={(value) => {
                      setStreetAddress(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        streetAddress: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("streetAddress");
                    }}
                    error={profileErrors.streetAddress}
                    required
                    maxLength={120}
                    autoComplete="address-line1"
                    placeholder="123 Rizal Street"
                  />
                </div>

                <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field
                    label="Barangay"
                    value={barangay}
                    onChange={(value) => {
                      setBarangay(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        barangay: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("barangay");
                    }}
                    error={profileErrors.barangay}
                    required
                    maxLength={120}
                    placeholder="Barangay San Antonio"
                  />
                  <Field
                    label="City/Municipality"
                    value={cityMunicipality}
                    onChange={(value) => {
                      setCityMunicipality(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        cityMunicipality: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("cityMunicipality");
                    }}
                    error={profileErrors.cityMunicipality}
                    required
                    maxLength={120}
                    autoComplete="address-level2"
                    placeholder="Quezon City"
                  />
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field
                    label="Province"
                    value={province}
                    onChange={(value) => {
                      setProvince(value);
                      setProfileErrors((errors) => ({
                        ...errors,
                        province: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("province");
                    }}
                    error={profileErrors.province}
                    required
                    maxLength={120}
                    autoComplete="address-level1"
                    placeholder="Metro Manila"
                  />
                  <Field
                    label="ZIP/Postal Code"
                    value={postalCode}
                    onChange={(value) => {
                      setPostalCode(value.replace(/\D/g, "").slice(0, 4));
                      setProfileErrors((errors) => ({
                        ...errors,
                        postalCode: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validateProfileField("postalCode");
                    }}
                    error={profileErrors.postalCode}
                    required
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="1100"
                  />
                </div>

                <Button type="submit">Save Changes</Button>
              </form>
            </SectionCard>

            <SectionCard
              icon={<ShieldCheck size={24} strokeWidth={1.8} />}
              title="Security"
              subtitle="Manage your password and security settings"
            >
              <form onSubmit={handlePasswordUpdate} noValidate>
                <div className="mb-5 flex flex-col gap-3.5">
                  <PasswordField
                    label="Current Password"
                    value={currentPassword}
                    onChange={(value) => {
                      setCurrentPassword(value);
                      setPasswordErrors((errors) => ({
                        ...errors,
                        currentPassword: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validatePasswordField("currentPassword");
                    }}
                    error={passwordErrors.currentPassword}
                    visible={showCurrentPassword}
                    onToggleVisibility={() => {
                      setShowCurrentPassword((visible) => !visible);
                    }}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={(value) => {
                      setNewPassword(value);
                      setPasswordErrors((errors) => ({
                        ...errors,
                        newPassword: undefined,
                        confirmPassword:
                          confirmPassword && confirmPassword !== value
                            ? "New passwords do not match."
                            : undefined,
                      }));
                    }}
                    onBlur={() => {
                      validatePasswordField("newPassword");
                    }}
                    error={passwordErrors.newPassword}
                    visible={showNewPassword}
                    onToggleVisibility={() => {
                      setShowNewPassword((visible) => !visible);
                    }}
                    autoComplete="new-password"
                    helpText="Use 8–128 characters with uppercase, lowercase, number, and special character."
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(value) => {
                      setConfirmPassword(value);
                      setPasswordErrors((errors) => ({
                        ...errors,
                        confirmPassword: undefined,
                      }));
                    }}
                    onBlur={() => {
                      validatePasswordField("confirmPassword");
                    }}
                    error={passwordErrors.confirmPassword}
                    visible={showConfirmPassword}
                    onToggleVisibility={() => {
                      setShowConfirmPassword((visible) => !visible);
                    }}
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit">Update Password</Button>
              </form>
            </SectionCard>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  document.documentElement.classList.remove("dark");
                  void navigate("/login");
                }}
                className="w-full rounded-[10px] border-2 border-brand bg-white px-4 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Log Out
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                }}
                className="w-full rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                Delete Account
              </button>
            </div>
          </>
        )}

        {tab === "Notifications" && (
          <SectionCard
            icon={<Bell size={24} strokeWidth={1.8} />}
            title="Notification Preferences"
            subtitle="Choose how you want to be notified"
          >
            <ToggleRow
              label="Email Notifications"
              description="Receive email updates about reports and issues"
              value={emailNotifications}
              onChange={setEmailNotifications}
            />
            <ToggleRow
              label="Push Notifications"
              description="Receive push notifications for urgent alerts"
              value={pushNotifications}
              onChange={setPushNotifications}
            />
            <ToggleRow
              label="Daily Summary"
              description="Receive a daily summary of activities"
              value={dailySummary}
              onChange={setDailySummary}
            />

            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => {
                  showToast("Notification preferences saved.");
                }}
              >
                Save Preference
              </Button>
            </div>
          </SectionCard>
        )}

        {tab === "System" && (
          <>
            <SectionCard
              icon={<Palette size={24} strokeWidth={1.8} />}
              title="Appearance"
              subtitle="Customize the look and feel"
            >
              <ToggleRow
                label="Dark Mode"
                description="Use dark theme for the admin panel"
                value={darkMode}
                onChange={setDarkMode}
              />
            </SectionCard>

            <SectionCard
              icon={<MonitorCog size={24} strokeWidth={1.8} />}
              title="System Configuration"
              subtitle="Configure system behavior"
            >
              <ToggleRow
                label="Auto-assign Routes"
                description="Automatically assign trucks to optimal routes"
                value={autoAssignRoutes}
                onChange={setAutoAssignRoutes}
              />
              <ToggleRow
                label="Real-time Tracking"
                description="Enable GPS tracking for all trucks"
                value={realTimeTracking}
                onChange={setRealTimeTracking}
              />
              <ToggleRow
                label="Automatic Reports"
                description="Generate weekly reports automatically"
                value={automaticReports}
                onChange={setAutomaticReports}
              />

              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  onClick={() => {
                    showToast("System preferences saved.");
                  }}
                >
                  Save Preference
                </Button>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={() => {
            setShowDeleteModal(false);
            showToast("Account deleted.");
          }}
          onClose={() => {
            setShowDeleteModal(false);
          }}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-brand px-[22px] py-3 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          role="status"
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}
    </main>
  );
}

interface TabButtonProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-5 py-2 text-[13.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 ${
        active
          ? "border-brand bg-brand font-semibold text-white"
          : "border-gray-200 bg-white font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function SectionCard({ icon, title, subtitle, children }: SectionCardProps) {
  return (
    <section className="mb-[18px] rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:px-7">
      <div className="mb-[22px] flex items-center gap-3.5">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-brand text-2xl text-brand"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h2 className="m-0 text-lg font-extrabold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "email" | "tel";
  autoComplete?: string;
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  error,
  required = false,
  maxLength,
  inputMode,
  autoComplete,
}: FieldProps) {
  const errorId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-error`;

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
            : "border-gray-300 focus:border-brand focus:ring-brand/15"
        }`}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1.5 block text-xs font-normal text-red-600"
        >
          {error}
        </span>
      )}
    </label>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
  helpText?: string;
}

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  visible,
  onToggleVisibility,
  autoComplete,
  helpText,
}: PasswordFieldProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy = [error ? errorId : "", helpText ? helpId : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-gray-700 dark:text-gray-200">
        {label}
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      </span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onBlur={onBlur}
          maxLength={128}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 pr-11 text-[13.5px] text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-gray-100 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
              : "border-gray-300 focus:border-brand focus:ring-brand/15"
          }`}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
        >
          <EyeIcon hidden={!visible} />
        </button>
      </span>
      {helpText && !error && (
        <span
          id={helpId}
          className="mt-1.5 block text-xs font-normal text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </span>
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1.5 block text-xs font-normal text-red-600"
        >
          {error}
        </span>
      )}
    </label>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9 8 9 8a17.2 17.2 0 01-2.3 3.4" />
        <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 004.1-.9" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12s3.5-8 9-8 9 8 9 8-3.5 8-9 8-9-8-9-8z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0 dark:border-gray-800">
      <div>
        <div className="mb-0.5 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </div>
        <div className="text-[12.5px] text-gray-500 dark:text-gray-400">{description}</div>
      </div>

      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onChange(!value);
      }}
      aria-pressed={value}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 ${
        value ? "bg-brand" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-[3px] top-[3px] block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{value ? "Disable" : "Enable"}</span>
    </button>
  );
}

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirmModal({ onConfirm, onClose }: DeleteConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const canDelete = confirmationText === "DELETE";
  const hasInvalidConfirmation =
    confirmationText.length > 0 && !canDelete;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canDelete) {
      return;
    }

    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <h3
          id="delete-account-title"
          className="mb-2.5 text-lg font-bold text-red-600"
        >
          Delete Account
        </h3>

        <p
          id="delete-account-description"
          className="mb-5 text-[13.5px] leading-relaxed text-gray-600 dark:text-gray-300"
        >
          This action is permanent and cannot be undone. Type{" "}
          <strong className="font-bold text-gray-900 dark:text-white">DELETE</strong> in all
          capital letters to confirm.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="mb-6 block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-gray-700 dark:text-gray-200">
              Confirmation
              <span className="ml-1 text-red-600" aria-hidden="true">
                *
              </span>
            </span>

            <input
              type="text"
              value={confirmationText}
              onChange={(event) => {
                setConfirmationText(event.target.value);
              }}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={hasInvalidConfirmation}
              aria-describedby={
                hasInvalidConfirmation
                  ? "delete-confirmation-error"
                  : "delete-confirmation-help"
              }
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                hasInvalidConfirmation
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                  : "border-gray-300 focus:border-brand focus:ring-brand/15"
              }`}
            />

            {hasInvalidConfirmation ? (
              <span
                id="delete-confirmation-error"
                role="alert"
                className="mt-1.5 block text-xs text-red-600"
              >
                Enter DELETE exactly as shown.
              </span>
            ) : (
              <span
                id="delete-confirmation-help"
                className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400"
              >
                The Delete Account button will activate after you enter DELETE.
              </span>
            )}
          </label>

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-[18px] py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/30"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canDelete}
              className="rounded-lg bg-red-600 px-[18px] py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:bg-red-300 disabled:hover:bg-red-300"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
