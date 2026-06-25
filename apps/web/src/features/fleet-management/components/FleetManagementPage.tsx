import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../../components/Button";
import { StatCard } from "../../../components/StatCard";
import {
  ECO_AIDE_OPTIONS,
  INITIAL_TRUCKS,
  ROUTE_OPTIONS,
} from "../fleet.data";
import type { Truck, TruckFormValue, TruckStatus, TruckStatusFilter } from "../fleet.types";

type ModalMode = "register" | "edit" | "assign" | null;

const statusFilters: TruckStatusFilter[] = [
  "All",
  "Active",
  "Idle",
  "Under Maintenance",
];

const emptyTruckForm: TruckFormValue = {
  plateNumber: "",
  model: "",
  capacity: "",
  status: "Active",
  assignedDriver: "",
};

export function FleetManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>(INITIAL_TRUCKS);
  const [statusFilter, setStatusFilter] = useState<TruckStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [truckForm, setTruckForm] = useState<TruckFormValue>(emptyTruckForm);
  const [assignedRoute, setAssignedRoute] = useState(ROUTE_OPTIONS[0]);
  const [assignedEcoAide, setAssignedEcoAide] = useState(ECO_AIDE_OPTIONS[0]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      const matchesStatus =
        statusFilter === "All" || truck.status === statusFilter;

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        truck.id.toLowerCase().includes(normalizedSearch) ||
        truck.plateNumber.toLowerCase().includes(normalizedSearch) ||
        truck.model.toLowerCase().includes(normalizedSearch) ||
        truck.assignedDriver.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [searchValue, statusFilter, trucks]);

  const activeCount = trucks.filter((truck) => truck.status === "Active").length;
  const idleCount = trucks.filter((truck) => truck.status === "Idle").length;
  const maintenanceCount = trucks.filter(
    (truck) => truck.status === "Under Maintenance",
  ).length;

  function openRegisterModal() {
    setTruckForm(emptyTruckForm);
    setSelectedTruck(null);
    setModalMode("register");
  }

  function openEditModal(truck: Truck) {
    setSelectedTruck(truck);
    setTruckForm({
      plateNumber: truck.plateNumber,
      model: truck.model,
      capacity: truck.capacity.replace(" kg", ""),
      status: truck.status,
      assignedDriver: truck.assignedDriver,
    });
    setModalMode("edit");
  }

  function openAssignModal(truck: Truck) {
    setSelectedTruck(truck);
    setAssignedRoute(truck.assignedRoute ?? ROUTE_OPTIONS[0]);
    setAssignedEcoAide(truck.assignedEcoAide ?? ECO_AIDE_OPTIONS[0]);
    setModalMode("assign");
  }

  function closeModal() {
    setSelectedTruck(null);
    setModalMode(null);
  }

  function registerTruck() {
    const nextTruckNumber = trucks.length + 1;

    const nextTruck: Truck = {
      id: `FL-${String(nextTruckNumber).padStart(3, "0")}`,
      plateNumber: truckForm.plateNumber.trim() || "NEW-0000",
      model: truckForm.model.trim() || "Unspecified Model",
      capacity: `${truckForm.capacity.trim() || "0"} kg`,
      status: truckForm.status,
      assignedDriver: truckForm.assignedDriver.trim() || "Unassigned",
      registeredDate: "26/03/2026",
    };

    setTrucks((currentTrucks) => [nextTruck, ...currentTrucks]);
    closeModal();
  }

  function saveEditedTruck() {
    if (!selectedTruck) {
      return;
    }

    setTrucks((currentTrucks) =>
      currentTrucks.map((truck) =>
        truck.id === selectedTruck.id
          ? {
              ...truck,
              plateNumber: truckForm.plateNumber.trim() || truck.plateNumber,
              model: truckForm.model.trim() || truck.model,
              capacity: `${truckForm.capacity.trim() || "0"} kg`,
              status: truckForm.status,
              assignedDriver:
                truckForm.assignedDriver.trim() || truck.assignedDriver,
            }
          : truck,
      ),
    );

    closeModal();
  }

  function saveTruckAssignment() {
    if (!selectedTruck) {
      return;
    }

    setTrucks((currentTrucks) =>
      currentTrucks.map((truck) =>
        truck.id === selectedTruck.id
          ? {
              ...truck,
              assignedRoute,
              assignedEcoAide,
            }
          : truck,
      ),
    );

    closeModal();
  }

  return (
    <main style={pageStyle}>
      <section style={topBarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Fleet Management</h1>
          <p style={pageSubtitleStyle}>
            Manage garbage trucks, truck status, and truck assignments.
          </p>
        </div>

        <Button onClick={openRegisterModal}>+ Register Truck</Button>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Idle" value={idleCount} />
        <StatCard label="Under Maintenance" value={maintenanceCount} />
      </section>

      <section style={filterRowStyle}>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as TruckStatusFilter);
          }}
          style={filterButtonStyle}
        >
          {statusFilters.map((status) => (
            <option key={status} value={status}>
              {status === "All" ? "Filter by Status" : status}
            </option>
          ))}
        </select>

        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
          }}
          placeholder="Search truck by ID, plate no., model, or driver..."
          style={searchInputStyle}
        />
      </section>

      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Fleet List</div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#145c38" }}>
                {[
                  "Truck ID",
                  "Plate No.",
                  "Model",
                  "Capacity",
                  "Truck Status",
                  "Assigned Driver",
                  "Registered",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} style={tableHeaderStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyCellStyle}>
                    No trucks match the current filter.
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck) => (
                  <tr key={truck.id} style={tableRowStyle}>
                    <td style={tableCellStyle}>{truck.id}</td>
                    <td style={tableCellStyle}>{truck.plateNumber}</td>
                    <td style={tableCellStyle}>{truck.model}</td>
                    <td style={tableCellStyle}>{truck.capacity}</td>
                    <td style={tableCellStyle}>
                      <TruckStatusPill status={truck.status} />
                    </td>
                    <td style={tableCellStyle}>{truck.assignedDriver}</td>
                    <td style={tableCellStyle}>{truck.registeredDate}</td>
                    <td style={tableCellStyle}>
                      <div style={actionRowStyle}>
                        <Button
                          size="sm"
                          onClick={() => {
                            openEditModal(truck);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            openAssignModal(truck);
                          }}
                        >
                          Assign
                        </Button>
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

      {modalMode === "register" && (
        <TruckFormModal
          title="Register Garbage Truck"
          formValue={truckForm}
          setFormValue={setTruckForm}
          saveLabel="Register"
          onSave={registerTruck}
          onClose={closeModal}
        />
      )}

      {modalMode === "edit" && selectedTruck && (
        <TruckFormModal
          title="Edit Garbage Truck"
          formValue={truckForm}
          setFormValue={setTruckForm}
          saveLabel="Save"
          onSave={saveEditedTruck}
          onClose={closeModal}
        />
      )}

      {modalMode === "assign" && selectedTruck && (
        <AssignTruckModal
          truck={selectedTruck}
          assignedRoute={assignedRoute}
          setAssignedRoute={setAssignedRoute}
          assignedEcoAide={assignedEcoAide}
          setAssignedEcoAide={setAssignedEcoAide}
          onSave={saveTruckAssignment}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

interface TruckFormModalProps {
  title: string;
  formValue: TruckFormValue;
  setFormValue: React.Dispatch<React.SetStateAction<TruckFormValue>>;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

function TruckFormModal({
  title,
  formValue,
  setFormValue,
  saveLabel,
  onSave,
  onClose,
}: TruckFormModalProps) {
  function updateField<Key extends keyof TruckFormValue>(
    key: Key,
    value: TruckFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <h2 style={modalTitleStyle}>{title}</h2>

        <div style={formGridStyle}>
          <FormField label="Assigned Driver">
            <input
              value={formValue.assignedDriver}
              onChange={(event) => {
                updateField("assignedDriver", event.target.value);
              }}
              placeholder="e.g. Henry Correa"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Plate Number">
            <input
              value={formValue.plateNumber}
              onChange={(event) => {
                updateField("plateNumber", event.target.value);
              }}
              placeholder="e.g. GTM-5895"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Truck Model">
            <input
              value={formValue.model}
              onChange={(event) => {
                updateField("model", event.target.value);
              }}
              placeholder="e.g. Isuzu Elf"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Capacity (kg)">
            <input
              value={formValue.capacity}
              onChange={(event) => {
                updateField("capacity", event.target.value);
              }}
              placeholder="e.g. 7000"
              style={inputStyle}
              type="number"
            />
          </FormField>

          <FormField label="Status">
            <select
              value={formValue.status}
              onChange={(event) => {
                updateField("status", event.target.value as TruckStatus);
              }}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Idle">Idle</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </FormField>
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

interface AssignTruckModalProps {
  truck: Truck;
  assignedRoute: string;
  setAssignedRoute: (route: string) => void;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function AssignTruckModal({
  truck,
  assignedRoute,
  setAssignedRoute,
  assignedEcoAide,
  setAssignedEcoAide,
  onSave,
  onClose,
}: AssignTruckModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={assignModalCardStyle}>
        <h2 style={modalTitleStyle}>Assign Truck</h2>

        <FormField label="Truck ID">
          <div style={inlineFieldRowStyle}>
            <input value={truck.id} disabled style={disabledInputStyle} />
            <input value={truck.model} disabled style={disabledInputStyle} />
          </div>
        </FormField>

        <FormField label="Assigned Route ID">
          <select
            value={assignedRoute}
            onChange={(event) => {
              setAssignedRoute(event.target.value);
            }}
            style={inputStyle}
          >
            {ROUTE_OPTIONS.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Assigned Eco-Aide ID">
          <select
            value={assignedEcoAide}
            onChange={(event) => {
              setAssignedEcoAide(event.target.value);
            }}
            style={inputStyle}
          >
            {ECO_AIDE_OPTIONS.map((ecoAide) => (
              <option key={ecoAide} value={ecoAide}>
                {ecoAide}
              </option>
            ))}
          </select>
        </FormField>

        <div style={modalActionsStyle}>
          <Button onClick={onSave}>Save</Button>
          <Button variant="secondary" onClick={onClose}>
            × Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      {children}
    </label>
  );
}

function TruckStatusPill({ status }: { status: TruckStatus }) {
  return (
    <span style={{ ...statusPillStyle, ...getTruckStatusStyle(status) }}>
      {status}
    </span>
  );
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

function getTruckStatusStyle(status: TruckStatus): CSSProperties {
  if (status === "Active") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (status === "Idle") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#fee2e2", color: "#b91c1c" };
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

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  minWidth: 170,
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

const sectionTitleStyle: CSSProperties = {
  padding: "18px 14px",
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 880,
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

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 14,
  padding: "24px 0 18px",
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

const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "#ffffff",
  borderRadius: 14,
  padding: 26,
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
};

const assignModalCardStyle: CSSProperties = {
  ...modalCardStyle,
  maxWidth: 430,
};

const modalTitleStyle: CSSProperties = {
  margin: "0 0 20px",
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 14,
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  padding: "8px 10px",
  fontSize: 13,
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#111827",
};

const disabledInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#f9fafb",
  color: "#6b7280",
};

const inlineFieldRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 10,
  marginTop: 22,
  flexWrap: "wrap",
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