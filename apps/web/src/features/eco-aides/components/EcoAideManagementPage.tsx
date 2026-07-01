import { useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { Button, StatCard } from "@bazoora/ui";
import {
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_ECO_AIDES,
} from "../ecoAides.data";
import type {
  EcoAide,
  EcoAideApprovalRequest,
  EcoAideManagementTab,
  EcoAideStatus,
  EcoAideStatusFilter,
} from "../ecoAides.types";

type ModalMode = "view" | "edit" | "create" | "suspend" | "deactivate" | null;

const statusFilters: EcoAideStatusFilter[] = [
  "All",
  "Active",
  "On Route",
  "Off Duty",
];

const emptyEcoAideForm: Omit<EcoAide, "id" | "addedDate"> = {
  name: "",
  status: "Active",
  contactNumber: "",
  birthdate: "",
  address: "",
  assignedRoute: "",
  assignedTruck: "",
  totalRoutes: 0,
  completionRate: "0%",
  missedAssignment: 0,
  email: "",
};

export function EcoAideManagementPage() {
  const [activeTab, setActiveTab] = useState<EcoAideManagementTab>("all");
  const [ecoAides, setEcoAides] = useState<EcoAide[]>(INITIAL_ECO_AIDES);
  const [approvalRequests, setApprovalRequests] = useState<
    EcoAideApprovalRequest[]
  >(INITIAL_APPROVAL_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<EcoAideStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [selectedEcoAide, setSelectedEcoAide] = useState<EcoAide | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formValue, setFormValue] =
    useState<Omit<EcoAide, "id" | "addedDate">>(emptyEcoAideForm);
  const [reason, setReason] = useState("");

  const filteredEcoAides = useMemo(() => {
    return ecoAides.filter((ecoAide) => {
      const matchesStatus =
        statusFilter === "All" ||
        ecoAide.status === statusFilter ||
        (statusFilter === "Active" && ecoAide.status === "On Duty");

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ecoAide.name.toLowerCase().includes(normalizedSearch) ||
        ecoAide.id.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [ecoAides, searchValue, statusFilter]);

  const filteredApprovalRequests = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return approvalRequests.filter((request) => {
      return (
        normalizedSearch.length === 0 ||
        request.name.toLowerCase().includes(normalizedSearch) ||
        request.date.toLowerCase().includes(normalizedSearch) ||
        request.time.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [approvalRequests, searchValue]);

  const activeCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Active" || ecoAide.status === "On Duty",
  ).length;

  const suspendedCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Suspended",
  ).length;

  const deactivatedCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Deactivated",
  ).length;

  function openViewProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setModalMode("view");
  }

  function openEditProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setFormValue({
      name: ecoAide.name,
      status: ecoAide.status,
      contactNumber: ecoAide.contactNumber,
      birthdate: ecoAide.birthdate,
      address: ecoAide.address,
      assignedRoute: ecoAide.assignedRoute,
      assignedTruck: ecoAide.assignedTruck,
      totalRoutes: ecoAide.totalRoutes,
      completionRate: ecoAide.completionRate,
      missedAssignment: ecoAide.missedAssignment,
      email: ecoAide.email,
    });
    setModalMode("edit");
  }

  function openCreateAccount() {
    setSelectedEcoAide(null);
    setFormValue(emptyEcoAideForm);
    setModalMode("create");
  }

  function openSuspendModal(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setReason("");
    setModalMode("suspend");
  }

  function openDeactivateModal(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setReason("");
    setModalMode("deactivate");
  }

  function closeModal() {
    setSelectedEcoAide(null);
    setModalMode(null);
    setReason("");
  }

  function saveEditedEcoAide() {
    if (!selectedEcoAide) {
      return;
    }

    setEcoAides((currentEcoAides) =>
      currentEcoAides.map((ecoAide) =>
        ecoAide.id === selectedEcoAide.id
          ? {
              ...ecoAide,
              ...formValue,
            }
          : ecoAide,
      ),
    );

    closeModal();
  }

  function createEcoAideAccount() {
    const nextIdNumber = ecoAides.length + 1;
    const nextEcoAide: EcoAide = {
      id: `EA-${String(nextIdNumber).padStart(3, "0")}`,
      addedDate: "26/03/2026",
      ...formValue,
      name: formValue.name.trim() || "New Eco-Aide",
    };

    setEcoAides((currentEcoAides) => [nextEcoAide, ...currentEcoAides]);
    closeModal();
  }

  function confirmStatusChange(status: "Suspended" | "Deactivated") {
    if (!selectedEcoAide) {
      return;
    }

    setEcoAides((currentEcoAides) =>
      currentEcoAides.map((ecoAide) =>
        ecoAide.id === selectedEcoAide.id
          ? {
              ...ecoAide,
              status,
            }
          : ecoAide,
      ),
    );

    closeModal();
  }

  function approveRequest(id: string) {
    setApprovalRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== id),
    );
  }

  function rejectRequest(id: string) {
    setApprovalRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== id),
    );
  }

  return (
    <main style={pageStyle}>
      <section style={topBarStyle}>
        <div style={tabsStyle}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSearchValue("");
            }}
            style={activeTab === "all" ? activeTabStyle : tabStyle}
          >
            All Eco-Aides ({ecoAides.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("approval");
              setSearchValue("");
            }}
            style={activeTab === "approval" ? activeTabStyle : tabStyle}
          >
            Approval queue ({approvalRequests.length})
          </button>
        </div>

        <Button onClick={openCreateAccount}>+ Add Eco-Aide</Button>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="Total Eco-Aides" value={ecoAides.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Suspended" value={suspendedCount} />
        <StatCard label="Deactivated" value={deactivatedCount} />
      </section>

      <section style={filterRowStyle}>
        {activeTab === "all" ? (
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as EcoAideStatusFilter);
            }}
            style={filterButtonStyle}
          >
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "Filter by Status" : status}
              </option>
            ))}
          </select>
        ) : (
          <button type="button" style={filterButtonStyle}>
            Filter by Date
          </button>
        )}

        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
          }}
          placeholder={
            activeTab === "all"
              ? "Search Eco-Aide by name or ID..."
              : "Search approval request by name or date..."
          }
          style={searchInputStyle}
        />
      </section>

      {activeTab === "all" ? (
        <AllEcoAidesTable
          ecoAides={filteredEcoAides}
          onViewProfile={openViewProfile}
          onEdit={openEditProfile}
          onSuspend={openSuspendModal}
          onDeactivate={openDeactivateModal}
        />
      ) : (
        <ApprovalQueueTable
          approvalRequests={filteredApprovalRequests}
          onApprove={approveRequest}
          onReject={rejectRequest}
        />
      )}

      {modalMode === "view" && selectedEcoAide && (
        <ViewProfileModal
          ecoAide={selectedEcoAide}
          onEdit={() => {
            openEditProfile(selectedEcoAide);
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === "edit" && (
        <EditEcoAideModal
          title="Edit Eco-Aide Profile"
          formValue={formValue}
          setFormValue={setFormValue}
          onSave={saveEditedEcoAide}
          onClose={closeModal}
        />
      )}

      {modalMode === "create" && (
        <EditEcoAideModal
          title="Create Eco-Aide Account"
          formValue={formValue}
          setFormValue={setFormValue}
          onSave={createEcoAideAccount}
          onClose={closeModal}
          saveLabel="Create"
        />
      )}

      {modalMode === "suspend" && selectedEcoAide && (
        <ConfirmActionModal
          title="Suspend Eco-Aide"
          warning="This will immediately restrict the Eco-Aide's access to the platform."
          message={`Are you sure you want to suspend ${selectedEcoAide.name}?`}
          reasonLabel="Reason for suspension"
          reason={reason}
          setReason={setReason}
          confirmLabel="Confirm"
          onConfirm={() => {
            confirmStatusChange("Suspended");
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === "deactivate" && selectedEcoAide && (
        <ConfirmActionModal
          title="Deactivate Eco-Aide"
          warning="This will immediately restrict the Eco-Aide's access to the platform."
          message={`Are you sure you want to deactivate ${selectedEcoAide.name}?`}
          reasonLabel="Reason for deactivation"
          reason={reason}
          setReason={setReason}
          confirmLabel="Confirm"
          onConfirm={() => {
            confirmStatusChange("Deactivated");
          }}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

interface AllEcoAidesTableProps {
  ecoAides: EcoAide[];
  onViewProfile: (ecoAide: EcoAide) => void;
  onEdit: (ecoAide: EcoAide) => void;
  onSuspend: (ecoAide: EcoAide) => void;
  onDeactivate: (ecoAide: EcoAide) => void;
}

function AllEcoAidesTable({
  ecoAides,
  onViewProfile,
  onEdit,
  onSuspend,
  onDeactivate,
}: AllEcoAidesTableProps) {
  return (
    <section style={cardStyle}>
      <div style={sectionTitleStyle}>Eco-Aides</div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#145c38" }}>
              {[
                "Eco-Aide ID ↓",
                "Eco-Aide Name",
                "Added",
                "Status",
                "Actions",
              ].map((heading) => (
                <th key={heading} style={tableHeaderStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ecoAides.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCellStyle}>
                  No Eco-Aides found.
                </td>
              </tr>
            ) : (
              ecoAides.map((ecoAide) => (
                <tr key={ecoAide.id} style={tableRowStyle}>
                  <td style={tableCellStyle}>{ecoAide.id}</td>
                  <td style={tableCellStyle}>{ecoAide.name}</td>
                  <td style={tableCellStyle}>{ecoAide.addedDate}</td>
                  <td style={tableCellStyle}>
                    <StatusPill status={ecoAide.status} />
                  </td>
                  <td style={tableCellStyle}>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        style={profileButtonStyle}
                        onClick={() => {
                          onViewProfile(ecoAide);
                        }}
                      >
                        View Profile
                      </button>

                      <ActionMenu
                        ecoAide={ecoAide}
                        onEdit={onEdit}
                        onSuspend={onSuspend}
                        onDeactivate={onDeactivate}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination />
    </section>
  );
}

interface ActionMenuProps {
  ecoAide: EcoAide;
  onEdit: (ecoAide: EcoAide) => void;
  onSuspend: (ecoAide: EcoAide) => void;
  onDeactivate: (ecoAide: EcoAide) => void;
}

function ActionMenu({
  ecoAide,
  onEdit,
  onSuspend,
  onDeactivate,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((currentValue) => !currentValue);
        }}
        style={ellipsisButtonStyle}
      >
        •••
      </button>

      {isOpen && (
        <div style={actionMenuStyle}>
          <button
            type="button"
            style={actionMenuItemStyle}
            onClick={() => {
              setIsOpen(false);
              onEdit(ecoAide);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            style={actionMenuItemStyle}
            onClick={() => {
              setIsOpen(false);
              onSuspend(ecoAide);
            }}
          >
            Suspend
          </button>

          <button
            type="button"
            style={actionMenuItemStyle}
            onClick={() => {
              setIsOpen(false);
              onDeactivate(ecoAide);
            }}
          >
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
}

interface ApprovalQueueTableProps {
  approvalRequests: EcoAideApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function ApprovalQueueTable({
  approvalRequests,
  onApprove,
  onReject,
}: ApprovalQueueTableProps) {
  return (
    <section style={approvalCardStyle}>
      <div style={sectionTitleStyle}>Approval Queue</div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#145c38" }}>
              {["Eco-Aide Name", "Date", "Time", "Actions"].map((heading) => (
                <th key={heading} style={tableHeaderStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {approvalRequests.length === 0 ? (
              <tr>
                <td colSpan={4} style={emptyCellStyle}>
                  No approval requests found.
                </td>
              </tr>
            ) : (
              approvalRequests.map((request) => (
                <tr key={request.id} style={tableRowStyle}>
                  <td style={tableCellStyle}>{request.name}</td>
                  <td style={tableCellStyle}>{request.date}</td>
                  <td style={tableCellStyle}>{request.time}</td>
                  <td style={tableCellStyle}>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() => {
                          onApprove(request.id);
                        }}
                        style={approveButtonStyle}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onReject(request.id);
                        }}
                        style={rejectButtonStyle}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination />
    </section>
  );
}

interface ViewProfileModalProps {
  ecoAide: EcoAide;
  onEdit: () => void;
  onClose: () => void;
}

function ViewProfileModal({ ecoAide, onEdit, onClose }: ViewProfileModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={profileModalCardStyle}>
        <h2 style={modalTitleStyle}>View profile - {ecoAide.name}</h2>

        <div style={profileHeaderStyle}>
          <div style={avatarStyle}>♙</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{ecoAide.name}</div>
            <div style={{ fontSize: 13 }}>{ecoAide.id}</div>
          </div>

          <StatusPill status={ecoAide.status} />
        </div>

        <div style={dividerStyle} />

        <div style={profileGridStyle}>
          <InfoBlock label="Contact number" value={ecoAide.contactNumber} />
          <InfoBlock label="Birthdate" value={ecoAide.birthdate} />
          <InfoBlock label="Assigned Route" value={ecoAide.assignedRoute} />
          <InfoBlock label="Address" value={ecoAide.address} />
          <InfoBlock label="Assigned Truck" value={ecoAide.assignedTruck} />
        </div>

        <div style={{ marginTop: 12, fontWeight: 600 }}>
          Assignment history
        </div>

        <div style={historyGridStyle}>
          <HistoryCard label="Total Routes" value={ecoAide.totalRoutes} />
          <HistoryCard label="Completion Rate" value={ecoAide.completionRate} />
          <HistoryCard label="Missed Assignment" value={ecoAide.missedAssignment} />
        </div>

        <div style={modalActionsStyle}>
          <Button onClick={onEdit}>Edit Profile</Button>
          <Button variant="secondary" onClick={onClose}>
            × Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditEcoAideModalProps {
  title: string;
  formValue: Omit<EcoAide, "id" | "addedDate">;
  setFormValue: Dispatch<SetStateAction<Omit<EcoAide, "id" | "addedDate">>>;
  onSave: () => void;
  onClose: () => void;
  saveLabel?: string;
}

function EditEcoAideModal({
  title,
  formValue,
  setFormValue,
  onSave,
  onClose,
  saveLabel = "Save",
}: EditEcoAideModalProps) {
  function updateField<Key extends keyof typeof formValue>(
    key: Key,
    value: (typeof formValue)[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={editModalCardStyle}>
        <h2 style={modalTitleStyle}>{title}</h2>

        <div style={formGridStyle}>
          <FormField label="Eco-Aide Name">
            <input
              value={formValue.name}
              onChange={(event) => {
                updateField("name", event.target.value);
              }}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Contact Number">
            <input
              value={formValue.contactNumber}
              onChange={(event) => {
                updateField("contactNumber", event.target.value);
              }}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Birthdate">
            <input
              value={formValue.birthdate}
              onChange={(event) => {
                updateField("birthdate", event.target.value);
              }}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Address">
            <input
              value={formValue.address}
              onChange={(event) => {
                updateField("address", event.target.value);
              }}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Truck Assignment">
            <select
              value={formValue.assignedTruck}
              onChange={(event) => {
                updateField("assignedTruck", event.target.value);
              }}
              style={inputStyle}
            >
              <option value="">Select truck</option>
              <option value="FL-001">FL-001</option>
              <option value="FL-002">FL-002</option>
              <option value="FL-003">FL-003</option>
            </select>
          </FormField>

          <FormField label="Route Assignment">
            <select
              value={formValue.assignedRoute}
              onChange={(event) => {
                updateField("assignedRoute", event.target.value);
              }}
              style={inputStyle}
            >
              <option value="">Select route</option>
              <option value="RT-001">RT-001</option>
              <option value="RT-002">RT-002</option>
              <option value="RT-003">RT-003</option>
            </select>
          </FormField>

          <FormField label="Status">
            <select
              value={formValue.status}
              onChange={(event) => {
                updateField("status", event.target.value as EcoAideStatus);
              }}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="On Duty">On Duty</option>
              <option value="On Route">On Route</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </FormField>

          {title.includes("Create") && (
            <FormField label="Email Address">
              <input
                value={formValue.email}
                onChange={(event) => {
                  updateField("email", event.target.value);
                }}
                style={inputStyle}
              />
            </FormField>
          )}
        </div>

        <div style={modalActionsStyle}>
          <Button onClick={onSave}>{saveLabel}</Button>
          <Button variant="secondary" onClick={onClose}>
            × Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmActionModalProps {
  title: string;
  warning: string;
  message: string;
  reasonLabel: string;
  reason: string;
  setReason: (reason: string) => void;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmActionModal({
  title,
  warning,
  message,
  reasonLabel,
  reason,
  setReason,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={confirmModalCardStyle}>
        <h2 style={modalTitleStyle}>{title}</h2>

        <div style={warningStyle}>ⓘ {warning}</div>

        <p style={{ fontSize: 14, marginTop: 18 }}>{message}</p>

        <label style={fieldLabelStyle}>
          {reasonLabel}
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            placeholder="Enter reason..."
            style={textareaStyle}
          />
        </label>

        <div style={modalActionsStyle}>
          <Button onClick={onConfirm}>▣ {confirmLabel}</Button>
          <Button variant="secondary" onClick={onClose}>
            × Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      {children}
    </label>
  );
}

interface InfoBlockProps {
  label: string;
  value: string;
}

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}

interface HistoryCardProps {
  label: string;
  value: string | number;
}

function HistoryCard({ label, value }: HistoryCardProps) {
  return (
    <div style={historyCardStyle}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: EcoAideStatus }) {
  return <span style={{ ...statusPillStyle, ...getStatusStyle(status) }}>{status}</span>;
}

function Pagination() {
  return (
    <div style={paginationStyle}>
      <button type="button" style={paginationArrowStyle}>
        ‹
      </button>
      <button type="button" style={paginationActiveStyle}>
        1
      </button>
      <button type="button" style={paginationArrowStyle}>
        ›
      </button>
    </div>
  );
}

function getStatusStyle(status: EcoAideStatus): CSSProperties {
  if (status === "Active" || status === "On Duty") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (status === "On Route") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (status === "Off Duty") {
    return { background: "#f3f4f6", color: "#4b5563" };
  }

  if (status === "Suspended") {
    return { background: "#fee2e2", color: "#b91c1c" };
  }

  return { background: "#e5e7eb", color: "#374151" };
}

const pageStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const tabsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  borderBottom: "1px solid #d1d5db",
  flexWrap: "wrap",
};

const tabStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "8px 0",
  cursor: "pointer",
  color: "#111827",
  fontSize: 13,
  fontWeight: 500,
};

const activeTabStyle: CSSProperties = {
  ...tabStyle,
  borderBottom: "2px solid #111827",
  fontWeight: 700,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  marginBottom: 0,
  flexWrap: "wrap",
};

const filterButtonStyle: CSSProperties = {
  minWidth: 150,
  border: "none",
  background: "#062f22",
  color: "#ffffff",
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 240,
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0 0 10px 10px",
  overflow: "hidden",
};

const approvalCardStyle: CSSProperties = {
  ...cardStyle,
  minHeight: 395,
};

const sectionTitleStyle: CSSProperties = {
  padding: "18px 14px",
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 720,
  borderCollapse: "collapse",
};

const tableHeaderStyle: CSSProperties = {
  color: "#ffffff",
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
};

const tableCellStyle: CSSProperties = {
  padding: "10px 14px",
  fontSize: 13,
  color: "#111827",
  whiteSpace: "nowrap",
};

const emptyCellStyle: CSSProperties = {
  padding: 28,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 13,
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const profileButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#6b7280",
  color: "#ffffff",
  padding: "3px 10px",
  fontSize: 12,
  cursor: "pointer",
};

const ellipsisButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#111827",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const actionMenuStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  zIndex: 20,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
  minWidth: 100,
  padding: "6px 0",
};

const actionMenuItemStyle: CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "6px 12px",
  textAlign: "left",
  fontSize: 13,
  cursor: "pointer",
};

const approveButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#000000",
  color: "#ffffff",
  padding: "4px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const rejectButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#b91c1c",
  color: "#ffffff",
  padding: "4px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 14,
  padding: "110px 0 18px",
};

const paginationArrowStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6b7280",
  fontSize: 22,
  cursor: "pointer",
};

const paginationActiveStyle: CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#062f22",
  color: "#ffffff",
  width: 34,
  height: 34,
  fontWeight: 700,
  cursor: "pointer",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const profileModalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 570,
  background: "#ffffff",
  borderRadius: 10,
  padding: 28,
};

const editModalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "#ffffff",
  borderRadius: 10,
  padding: 28,
};

const confirmModalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 390,
  background: "#ffffff",
  borderRadius: 10,
  padding: 24,
};

const modalTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: 22,
  fontWeight: 800,
  color: "#111111",
};

const profileHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatarStyle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: "5px solid #000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid #d1d5db",
  margin: "16px 0",
};

const profileGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 16,
};

const historyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 8,
  marginTop: 4,
};

const historyCardStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 12,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 70,
  resize: "vertical",
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 10,
  marginTop: 22,
  flexWrap: "wrap",
};

const warningStyle: CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#dc2626",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 12,
};

const statusPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
};