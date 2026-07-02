import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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
    <main style={pageStyle}>
      <section style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Settings and System Configuration</h1>
          <p style={pageSubtitleStyle}>
            Manage account details, notification preferences, and system
            behavior.
          </p>
        </div>
      </section>

      <div style={tabBarStyle}>
        <TabButton active={tab === "Account"} onClick={() => setTab("Account")}>
          Account
        </TabButton>
        <TabButton
          active={tab === "Notifications"}
          onClick={() => setTab("Notifications")}
        >
          Notifications
        </TabButton>
        <TabButton active={tab === "System"} onClick={() => setTab("System")}>
          System
        </TabButton>
      </div>

      <div style={contentWrapperStyle}>
        {tab === "Account" && (
          <>
            <SectionCard
              icon="👤"
              title="Profile Information"
              subtitle="Update your account details"
            >
              <div style={twoColumnGridStyle}>
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

              <div style={fieldStackStyle}>
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
                onClick={() => showToast("Profile information saved.")}
              >
                Save Changes
              </Button>
            </SectionCard>

            <SectionCard
              icon="🛡"
              title="Security"
              subtitle="Manage your password and security settings"
            >
              <div style={fieldStackStyle}>
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

            <div style={dangerActionsGridStyle}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => showToast("Logged out.")}
                style={{
                  width: "100%",
                  padding: "12px",
                }}
              >
                Log Out
              </Button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={deleteAccountButtonStyle}
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

            <div style={centerActionStyle}>
              <Button
                type="button"
                onClick={() => showToast("Notification preferences saved.")}
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

              <div style={centerActionStyle}>
                <Button
                  type="button"
                  onClick={() => showToast("System preferences saved.")}
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
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {toast && <div style={toastStyle}>✓ {toast}</div>}
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
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        background: active ? "#1a3a2e" : "#ffffff",
        color: active ? "#ffffff" : "#374151",
        fontWeight: active ? 600 : 500,
      }}
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
    <section style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div style={sectionIconStyle}>{icon}</div>
        <div>
          <h2 style={sectionTitleStyle}>{title}</h2>
          <p style={sectionSubtitleStyle}>{subtitle}</p>
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
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        style={inputStyle}
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
    <div style={toggleRowStyle}>
      <div>
        <div style={toggleLabelStyle}>{label}</div>
        <div style={toggleDescriptionStyle}>{description}</div>
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
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        ...toggleStyle,
        background: value ? "#1a3a2e" : "#d1d5db",
      }}
    >
      <span
        style={{
          ...toggleKnobStyle,
          left: value ? 23 : 3,
        }}
      />
    </button>
  );
}

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirmModal({ onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <h3 style={modalTitleStyle}>Delete Account</h3>
        <p style={modalTextStyle}>
          Are you sure you want to delete your account? This action is permanent
          and cannot be undone.
        </p>

        <div style={modalActionsStyle}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <button type="button" onClick={onConfirm} style={modalDeleteButton}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const pageSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 26,
  justifyContent: "center",
  flexWrap: "wrap",
};

const tabButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 20px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13.5,
};

const contentWrapperStyle: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
};

const sectionCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "24px 28px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  marginBottom: 18,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 22,
};

const sectionIconStyle: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  border: "2px solid #1a3a2e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#1a3a2e",
  fontSize: 24,
  flexShrink: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 18,
  color: "#111827",
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "2px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const fieldStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginBottom: 20,
};

const fieldStyle: CSSProperties = {
  display: "block",
};

const labelStyle: CSSProperties = {
  fontSize: 12.5,
  color: "#374151",
  fontWeight: 500,
  display: "block",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13.5,
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  color: "#111827",
};

const dangerActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const deleteAccountButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid #fecaca",
  borderRadius: 10,
  background: "#fff5f5",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  color: "#dc2626",
};

const centerActionStyle: CSSProperties = {
  marginTop: 24,
  display: "flex",
  justifyContent: "center",
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 0",
  borderBottom: "1px solid #f3f4f6",
};

const toggleLabelStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 3,
};

const toggleDescriptionStyle: CSSProperties = {
  fontSize: 12.5,
  color: "#6b7280",
};

const toggleStyle: CSSProperties = {
  width: 46,
  height: 26,
  borderRadius: 13,
  border: "none",
  cursor: "pointer",
  position: "relative",
  flexShrink: 0,
  transition: "background 0.2s",
  padding: 0,
};

const toggleKnobStyle: CSSProperties = {
  position: "absolute",
  top: 3,
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  transition: "left 0.2s",
  display: "block",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const modalCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  padding: 28,
  width: 380,
  maxWidth: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const modalTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 16,
  fontWeight: 700,
  color: "#dc2626",
};

const modalTextStyle: CSSProperties = {
  margin: "0 0 24px",
  fontSize: 13.5,
  color: "#4b5563",
  lineHeight: 1.6,
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
};

const modalDeleteButton: CSSProperties = {
  padding: "8px 18px",
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const toastStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1a3a2e",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 500,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  zIndex: 2000,
  whiteSpace: "nowrap",
};