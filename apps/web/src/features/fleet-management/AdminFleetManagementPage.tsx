import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Button, PaginationControls, StatCard } from "@bazoora/ui";
import {
  ECO_AIDE_OPTIONS,
  INITIAL_TRUCKS,
  ROUTE_OPTIONS,
} from "./fleet.mockData";
import type { Truck, TruckFormValue, TruckStatusFilter } from "./fleet.types";
import { TruckStatusPill } from "./components/TruckStatusPill";
import { TruckFormModal } from "./components/TruckFormModal";
import { AssignTruckModal } from "./components/AssignTruckModal";

type ModalMode = "register" | "edit" | "assign" | null;

const TRUCKS_PAGE_SIZE = 5;

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

export function AdminFleetManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>(INITIAL_TRUCKS);
  const [statusFilter, setStatusFilter] = useState<TruckStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrucks.length / TRUCKS_PAGE_SIZE),
  );

  const paginatedTrucks = filteredTrucks.slice(
    (page - 1) * TRUCKS_PAGE_SIZE,
    page * TRUCKS_PAGE_SIZE,
  );

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
    <div style={pageStyle}>
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
              setPage(1);
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
            setPage(1);
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
              {paginatedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={emptyCellStyle}>
                    No trucks match the current filter.
                  </td>
                </tr>
              ) : (
                paginatedTrucks.map((truck) => (
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

        <div style={paginationWrapperStyle}>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          />
        </div>
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
          routeOptions={ROUTE_OPTIONS}
          ecoAideOptions={ECO_AIDE_OPTIONS}
          onSave={saveTruckAssignment}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

const pageStyle: CSSProperties = {
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

const paginationWrapperStyle: CSSProperties = {
  padding: "10px 0 18px",
};
