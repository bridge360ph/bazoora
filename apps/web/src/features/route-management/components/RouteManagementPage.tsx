import { useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "../../../components/Button";
import { StatCard } from "../../../components/StatCard";
import {
  COLLECTION_DAYS,
  ECO_AIDE_OPTIONS,
  FLEET_OPTIONS,
  INITIAL_ROUTES,
  WASTE_TYPES,
} from "../route.data";
import type {
  CollectionDay,
  Route,
  RouteFormValue,
  RouteStatus,
  RouteStatusFilter,
  WasteType,
} from "../route.types";

type ModalMode = "create" | "edit" | "assign" | "details" | null;

const statusFilters: RouteStatusFilter[] = [
  "All",
  "In Progress",
  "Not Started",
  "Completed",
];

const emptyRouteForm: RouteFormValue = {
  name: "",
  barangay: "",
  waypoints: "",
  wasteType: "Regular",
  collectionDay: "Sunday",
  startTime: "",
  ecoAide: ECO_AIDE_OPTIONS[0],
  fleetAssignment: FLEET_OPTIONS[0],
  routeType: "Free",
};

export function RouteManagementPage() {
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [routeForm, setRouteForm] = useState<RouteFormValue>(emptyRouteForm);
  const [assignedEcoAide, setAssignedEcoAide] = useState(ECO_AIDE_OPTIONS[0]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesStatus =
        statusFilter === "All" || route.status === statusFilter;

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        route.id.toLowerCase().includes(normalizedSearch) ||
        route.name.toLowerCase().includes(normalizedSearch) ||
        route.ecoAide.toLowerCase().includes(normalizedSearch) ||
        route.barangay.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [routes, searchValue, statusFilter]);

  const completedCount = routes.filter(
    (route) => route.status === "Completed",
  ).length;

  const inProgressCount = routes.filter(
    (route) => route.status === "In Progress",
  ).length;

  const notStartedCount = routes.filter(
    (route) => route.status === "Not Started",
  ).length;

  function openCreateModal() {
    setSelectedRoute(null);
    setRouteForm(emptyRouteForm);
    setModalMode("create");
  }

  function openEditModal(route: Route) {
    setSelectedRoute(route);
    setRouteForm({
      name: route.name,
      barangay: route.barangay,
      waypoints: route.waypoints,
      wasteType: route.wasteType,
      collectionDay: route.collectionDay,
      startTime: route.startTime,
      ecoAide: route.ecoAide,
      fleetAssignment: route.fleetAssignment,
      routeType: route.routeType,
    });
    setModalMode("edit");
  }

  function openAssignModal(route: Route) {
    setSelectedRoute(route);
    setAssignedEcoAide(
      ECO_AIDE_OPTIONS.find((option) => option.startsWith(route.ecoAide)) ??
        ECO_AIDE_OPTIONS[0],
    );
    setModalMode("assign");
  }

  function openDetails(route: Route) {
    setSelectedRoute(route);
    setModalMode("details");
  }

  function closeModal() {
    setSelectedRoute(null);
    setModalMode(null);
  }

  function createRoute() {
    const nextRouteNumber = routes.length + 1;

    const nextRoute: Route = {
      id: `RT-${String(nextRouteNumber).padStart(3, "0")}`,
      routeNumber: nextRouteNumber,
      name: routeForm.name.trim() || "New Route",
      barangay: routeForm.barangay.trim() || "Unassigned Barangay",
      waypoints: routeForm.waypoints.trim() || "TBD",
      wasteType: routeForm.wasteType,
      collectionDay: routeForm.collectionDay,
      startTime: routeForm.startTime.trim() || "TBD",
      ecoAide: normalizeEcoAideName(routeForm.ecoAide),
      fleetAssignment: routeForm.fleetAssignment,
      status: "Not Started",
      stops: getStopCount(routeForm.waypoints),
      routeType: routeForm.routeType,
    };

    setRoutes((currentRoutes) => [nextRoute, ...currentRoutes]);
    closeModal();
  }

  function saveEditedRoute() {
    if (!selectedRoute) {
      return;
    }

    setRoutes((currentRoutes) =>
      currentRoutes.map((route) =>
        route.id === selectedRoute.id
          ? {
              ...route,
              name: routeForm.name.trim() || route.name,
              barangay: routeForm.barangay.trim() || route.barangay,
              waypoints: routeForm.waypoints.trim() || route.waypoints,
              wasteType: routeForm.wasteType,
              collectionDay: routeForm.collectionDay,
              startTime: routeForm.startTime.trim() || route.startTime,
              ecoAide: normalizeEcoAideName(routeForm.ecoAide),
              fleetAssignment: routeForm.fleetAssignment,
              routeType: routeForm.routeType,
              stops: getStopCount(routeForm.waypoints),
            }
          : route,
      ),
    );

    closeModal();
  }

  function saveEcoAideAssignment() {
    if (!selectedRoute) {
      return;
    }

    setRoutes((currentRoutes) =>
      currentRoutes.map((route) =>
        route.id === selectedRoute.id
          ? {
              ...route,
              ecoAide: normalizeEcoAideName(assignedEcoAide),
            }
          : route,
      ),
    );

    closeModal();
  }

  return (
    <main style={pageStyle}>
      <section style={topBarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Route Management</h1>
          <p style={pageSubtitleStyle}>
            Manage hauling routes, assigned Eco-Aides, and fleet assignments.
          </p>
        </div>

        <Button onClick={openCreateModal}>+ Create Route</Button>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Not Started" value={notStartedCount} />
      </section>

      <section style={contentGridStyle}>
        <div>
          <section style={filterRowStyle}>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as RouteStatusFilter);
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
              placeholder="Search route by ID, name, barangay, or Eco-Aide..."
              style={searchInputStyle}
            />
          </section>

          <section>
            {filteredRoutes.length === 0 ? (
              <div style={emptyStateStyle}>No routes match the current filter.</div>
            ) : (
              filteredRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onEdit={() => {
                    openEditModal(route);
                  }}
                  onAssign={() => {
                    openAssignModal(route);
                  }}
                  onView={() => {
                    openDetails(route);
                  }}
                />
              ))
            )}
          </section>

          <Pagination />
        </div>

        <div style={mapPanelStyle}>
          <MapPlaceholder />
        </div>
      </section>

      {modalMode === "create" && (
        <RouteFormModal
          title="Create Route"
          formValue={routeForm}
          setFormValue={setRouteForm}
          saveLabel="Create"
          onSave={createRoute}
          onClose={closeModal}
        />
      )}

      {modalMode === "edit" && selectedRoute && (
        <RouteFormModal
          title={`Edit Route for ${selectedRoute.id}`}
          formValue={routeForm}
          setFormValue={setRouteForm}
          saveLabel="Save"
          onSave={saveEditedRoute}
          onClose={closeModal}
        />
      )}

      {modalMode === "assign" && selectedRoute && (
        <AssignEcoAideModal
          route={selectedRoute}
          assignedEcoAide={assignedEcoAide}
          setAssignedEcoAide={setAssignedEcoAide}
          onSave={saveEcoAideAssignment}
          onClose={closeModal}
        />
      )}

      {modalMode === "details" && selectedRoute && (
        <RouteDetailsModal route={selectedRoute} onClose={closeModal} />
      )}
    </main>
  );
}

interface RouteCardProps {
  route: Route;
  onEdit: () => void;
  onAssign: () => void;
  onView: () => void;
}

function RouteCard({ route, onEdit, onAssign, onView }: RouteCardProps) {
  return (
    <article style={routeCardStyle}>
      <div style={routeCardHeaderStyle}>
        <div>
          <h2 style={routeCardTitleStyle}>{route.name}</h2>
          <p style={routeCardSubtitleStyle}>
            Route {route.routeNumber} ({route.id}) · Eco-Aide: {route.ecoAide}
          </p>
        </div>

        <RouteStatusPill status={route.status} />
      </div>

      <div style={tagRowStyle}>
        <span style={routeTagStyle}>{route.collectionDay}</span>
        <span style={routeTagStyle}>{route.startTime}</span>
        <span style={routeTagStyle}>{route.wasteType}</span>
        <span style={routeTagStyle}>{route.stops} Stops</span>
      </div>

      <div style={actionRowStyle}>
        <button type="button" onClick={onEdit} style={secondaryActionButtonStyle}>
          Edit Route
        </button>

        <button type="button" onClick={onAssign} style={secondaryActionButtonStyle}>
          Assign Eco-Aide
        </button>

        <button type="button" onClick={onView} style={primaryActionButtonStyle}>
          View Details
        </button>
      </div>
    </article>
  );
}

interface RouteFormModalProps {
  title: string;
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

function RouteFormModal({
  title,
  formValue,
  setFormValue,
  saveLabel,
  onSave,
  onClose,
}: RouteFormModalProps) {
  function updateField<Key extends keyof RouteFormValue>(
    key: Key,
    value: RouteFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <div style={formStackStyle}>
        <FormField label="Route Name">
          <input
            value={formValue.name}
            onChange={(event) => {
              updateField("name", event.target.value);
            }}
            placeholder="e.g. Brgy. Poblacion Loop"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Barangay Coverage">
          <input
            value={formValue.barangay}
            onChange={(event) => {
              updateField("barangay", event.target.value);
            }}
            placeholder="e.g. Brgy. Poblacion"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Waypoints / Collection Points">
          <input
            value={formValue.waypoints}
            onChange={(event) => {
              updateField("waypoints", event.target.value);
            }}
            placeholder="e.g. Stop A, Stop B, Stop C"
            style={inputStyle}
          />
        </FormField>

        <div style={twoColumnFormStyle}>
          <FormField label="Waste Type">
            <select
              value={formValue.wasteType}
              onChange={(event) => {
                updateField("wasteType", event.target.value as WasteType);
              }}
              style={inputStyle}
            >
              {WASTE_TYPES.map((wasteType) => (
                <option key={wasteType} value={wasteType}>
                  {wasteType}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Collection Day">
            <select
              value={formValue.collectionDay}
              onChange={(event) => {
                updateField("collectionDay", event.target.value as CollectionDay);
              }}
              style={inputStyle}
            >
              {COLLECTION_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={twoColumnFormStyle}>
          <FormField label="Start Time">
            <input
              value={formValue.startTime}
              onChange={(event) => {
                updateField("startTime", event.target.value);
              }}
              placeholder="e.g. 10:00 AM"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Route Type">
            <select
              value={formValue.routeType}
              onChange={(event) => {
                updateField("routeType", event.target.value);
              }}
              style={inputStyle}
            >
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
          </FormField>
        </div>

        <FormField label="Eco-Aide">
          <select
            value={formValue.ecoAide}
            onChange={(event) => {
              updateField("ecoAide", event.target.value);
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

        <FormField label="Fleet Assignment">
          <select
            value={formValue.fleetAssignment}
            onChange={(event) => {
              updateField("fleetAssignment", event.target.value);
            }}
            style={inputStyle}
          >
            {FLEET_OPTIONS.map((fleet) => (
              <option key={fleet} value={fleet}>
                {fleet}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <ModalFooter saveLabel={saveLabel} onSave={onSave} onClose={onClose} />
    </ModalShell>
  );
}

interface AssignEcoAideModalProps {
  route: Route;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function AssignEcoAideModal({
  route,
  assignedEcoAide,
  setAssignedEcoAide,
  onSave,
  onClose,
}: AssignEcoAideModalProps) {
  return (
    <ModalShell title={`Assign Eco-Aide to R${route.routeNumber}`} onClose={onClose}>
      <FormField label="Route">
        <input value={route.name} disabled style={disabledInputStyle} />
      </FormField>

      <FormField label="Select Eco-Aide">
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

      <ModalFooter saveLabel="Save" onSave={onSave} onClose={onClose} />
    </ModalShell>
  );
}

interface RouteDetailsModalProps {
  route: Route;
  onClose: () => void;
}

function RouteDetailsModal({ route, onClose }: RouteDetailsModalProps) {
  return (
    <ModalShell title="Route Details" onClose={onClose} width={820}>
      <div style={detailsGridStyle}>
        <div style={detailsListStyle}>
          <DetailItem label="Route ID" value={route.id} />
          <DetailItem label="Route Name" value={route.name} />
          <DetailItem label="Barangay Coverage" value={route.barangay} />
          <DetailItem label="Waypoint / Collection Points" value={route.waypoints} />
          <DetailItem label="Waste Type" value={route.wasteType} />
          <DetailItem label="Route Type" value={route.routeType} />
          <DetailItem
            label="Start Time"
            value={`3/26/2026 ${route.startTime} (${route.collectionDay})`}
          />
          <DetailItem label="Assigned Eco-Aide" value={route.ecoAide} />
          <DetailItem
            label="Fleet Assignment"
            value={`${route.fleetAssignment} Isuzu`}
          />
        </div>

        <div style={detailsMapStyle}>
          <MapPlaceholder />
        </div>
      </div>

      <ModalFooter saveLabel="Back" onSave={onClose} onClose={onClose} />
    </ModalShell>
  );
}

interface ModalShellProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
}

function ModalShell({ title, children, onClose, width = 560 }: ModalShellProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalCardStyle, maxWidth: width }}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{title}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

interface ModalFooterProps {
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

function ModalFooter({ saveLabel, onSave, onClose }: ModalFooterProps) {
  return (
    <div style={modalFooterStyle}>
      <Button onClick={onSave}>{saveLabel}</Button>
      <Button variant="secondary" onClick={onClose}>
        × Close
      </Button>
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

interface DetailItemProps {
  label: string;
  value: string | number;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <p style={detailItemStyle}>
      <strong>{label}:</strong> {value}
    </p>
  );
}

function RouteStatusPill({ status }: { status: RouteStatus }) {
  return (
    <span style={{ ...statusPillStyle, ...getRouteStatusStyle(status) }}>
      {status}
    </span>
  );
}

function getRouteStatusStyle(status: RouteStatus): CSSProperties {
  if (status === "In Progress") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fbbf24",
    };
  }

  if (status === "Completed") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #4ade80",
    };
  }

  return {
    background: "#fee2e2",
    color: "#9a3412",
    border: "1px solid #f87171",
  };
}

function MapPlaceholder() {
  return (
    <div style={mapPlaceholderStyle}>
      <div style={mapShapeStyle}>◇</div>
      <p style={mapTextStyle}>Map preview placeholder</p>
    </div>
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

function normalizeEcoAideName(value: string) {
  return value.split(" (")[0];
}

function getStopCount(waypoints: string) {
  return (
    waypoints
      .split(",")
      .map((waypoint) => waypoint.trim())
      .filter(Boolean).length || 1
  );
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
  marginBottom: 18,
};

const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 300px)",
  gap: 16,
  alignItems: "stretch",
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 12,
  alignItems: "stretch",
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
  borderRadius: 8,
};

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 240,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};

const routeCardStyle: CSSProperties = {
  background: "#1a3a2e",
  borderRadius: 10,
  padding: "14px 16px",
  marginBottom: 10,
};

const routeCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 8,
};

const routeCardTitleStyle: CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
};

const routeCardSubtitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: 12,
  margin: "2px 0 0",
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginBottom: 10,
};

const routeTagStyle: CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  color: "#ffffff",
  padding: "3px 10px",
  borderRadius: 12,
  fontSize: 11.5,
  fontWeight: 500,
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const secondaryActionButtonStyle: CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  color: "#ffffff",
  border: "none",
  padding: "5px 13px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
};

const primaryActionButtonStyle: CSSProperties = {
  background: "#4ade80",
  color: "#1a3a2e",
  border: "none",
  padding: "5px 13px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};

const mapPanelStyle: CSSProperties = {
  borderRadius: 10,
  overflow: "hidden",
  background: "#e8ece8",
  minHeight: 420,
};

const emptyStateStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#9ca3af",
  fontSize: 13,
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  marginTop: 14,
};

const paginationArrowStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontSize: 22,
  cursor: "pointer",
  borderRadius: 7,
  padding: "3px 10px",
};

const paginationActiveStyle: CSSProperties = {
  border: "none",
  borderRadius: 7,
  background: "#1a3a2e",
  color: "#ffffff",
  width: 32,
  height: 32,
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
  background: "#ffffff",
  borderRadius: 14,
  padding: 24,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 22,
  cursor: "pointer",
  color: "#6b7280",
};

const formStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const twoColumnFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
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

const modalFooterStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "center",
  marginTop: 20,
  flexWrap: "wrap",
};

const detailsGridStyle: CSSProperties = {
  background: "#1a3a2e",
  borderRadius: 12,
  padding: "28px 32px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 320px)",
  gap: "18px 40px",
};

const detailsListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const detailItemStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.9)",
  fontSize: 14,
};

const detailsMapStyle: CSSProperties = {
  borderRadius: 10,
  overflow: "hidden",
  minHeight: 240,
};

const statusPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "3px 12px",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const mapPlaceholderStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 240,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#e8ece8",
  color: "#1f2937",
};

const mapShapeStyle: CSSProperties = {
  fontSize: 56,
  opacity: 0.5,
};

const mapTextStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: 13,
  color: "#6b7280",
};