import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@bazoora/ui";

type Tab = "Account" | "Notifications" | "System";

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Account");

  const [firstName, setFirstName] = useState("Luz Anthony");
  const [lastName, setLastName] = useState("Miranda");
  const [email, setEmail] = useState("luimiranda@ecohaulers.com");
  const [phone, setPhone] = useState("+63 9xx-xxx-xxx");
  const [address, setAddress] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
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

  function handlePasswordUpdate() {
    if (!currentPassword.trim()) {
      showToast("Please enter your current password.");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast("Please complete the new password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated successfully.");
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-gray-900">
            Settings and System Configuration
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
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

      <div className="mx-auto max-w-[640px]">
        {tab === "Account" && (
          <>
            <SectionCard
              icon="👤"
              title="Profile Information"
              subtitle="Update your account details"
            >
              <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                />
                <Field
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>

              <div className="mb-5 flex flex-col gap-3.5">
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
                <Field
                  label="Phone Number"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+63 9xx-xxx-xxx"
                />
                <Field
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Address Line, Barangay, City/Municipality, and Province"
                />
              </div>

              <Button
                type="button"
                onClick={() => {
                  showToast("Profile information saved.");
                }}
              >
                Save Changes
              </Button>
            </SectionCard>

            <SectionCard
              icon="🛡"
              title="Security"
              subtitle="Manage your password and security settings"
            >
              <div className="mb-5 flex flex-col gap-3.5">
                <Field
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  type="password"
                />
                <Field
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                />
                <Field
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                />
              </div>

              <Button type="button" onClick={handlePasswordUpdate}>
                Update Password
              </Button>
            </SectionCard>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3"
                onClick={() => {
                  showToast("Logged out.");
                }}
              >
                Log Out
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                }}
                className="w-full rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              >
                Delete Account
              </button>
            </div>
          </>
        )}

        {tab === "Notifications" && (
          <SectionCard
            icon="🔔"
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
              icon="⚙"
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
              icon="🖥"
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
          className="fixed bottom-6 left-1/2 z-[2000] -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-brand px-[22px] py-3 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          role="status"
        >
          ✓ {toast}
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
          : "border-gray-200 bg-white font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
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
    <section className="mb-[18px] rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm sm:px-7">
      <div className="mb-[22px] flex items-center gap-3.5">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-brand text-2xl text-brand"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h2 className="m-0 text-lg font-extrabold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>
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
  type?: string;
  placeholder?: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-gray-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
    </label>
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
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0">
      <div>
        <div className="mb-0.5 text-[15px] font-semibold text-gray-900">
          {label}
        </div>
        <div className="text-[12.5px] text-gray-500">{description}</div>
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
        className="w-full max-w-[380px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <h3
          id="delete-account-title"
          className="mb-2.5 text-base font-bold text-red-600"
        >
          Delete Account
        </h3>
        <p className="mb-6 text-[13.5px] leading-relaxed text-gray-600">
          Are you sure you want to delete your account? This action is permanent
          and cannot be undone.
        </p>

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-[18px] py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
