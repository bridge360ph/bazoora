import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button, StatCard } from "@bazoora/ui";
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
    <main className="flex-1 overflow-y-auto p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-gray-900">Route Management</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Manage hauling routes, assigned Eco-Aides, and fleet assignments.
          </p>
        </div>

        <Button onClick={openCreateModal}>+ Create Route</Button>
      </section>

      <section className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Not Started" value={notStartedCount} />
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <div>
          <section className="mb-3 flex flex-wrap items-stretch gap-2.5">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as RouteStatusFilter);
              }}
              className="min-w-[170px] cursor-pointer rounded-lg border-0 bg-brand px-3 py-2.5 text-[13px] text-white"
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
              className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-[13px] outline-none"
            />
          </section>

          <section>
            {filteredRoutes.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-gray-400">No routes match the current filter.</div>
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

        <div className="min-h-[420px] overflow-hidden rounded-[10px] bg-[#e8ece8]">
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
    <article className="mb-2.5 rounded-[10px] bg-brand p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-bold text-white">{route.name}</h2>
          <p className="mt-0.5 text-xs text-white/60">
            Route {route.routeNumber} ({route.id}) · Eco-Aide: {route.ecoAide}
          </p>
        </div>

        <RouteStatusPill status={route.status} />
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        <span className="rounded-xl bg-white/15 px-2.5 py-[3px] text-[11.5px] font-medium text-white">{route.collectionDay}</span>
        <span className="rounded-xl bg-white/15 px-2.5 py-[3px] text-[11.5px] font-medium text-white">{route.startTime}</span>
        <span className="rounded-xl bg-white/15 px-2.5 py-[3px] text-[11.5px] font-medium text-white">{route.wasteType}</span>
        <span className="rounded-xl bg-white/15 px-2.5 py-[3px] text-[11.5px] font-medium text-white">{route.stops} Stops</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="cursor-pointer rounded-md border-0 bg-white/10 px-[13px] py-[5px] text-xs font-medium text-white">
          Edit Route
        </button>

        <button type="button" onClick={onAssign} className="cursor-pointer rounded-md border-0 bg-white/10 px-[13px] py-[5px] text-xs font-medium text-white">
          Assign Eco-Aide
        </button>

        <button type="button" onClick={onView} className="cursor-pointer rounded-md border-0 bg-green-400 px-[13px] py-[5px] text-xs font-bold text-brand">
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
      <div className="flex flex-col gap-3.5">
        <FormField label="Route Name">
          <input
            value={formValue.name}
            onChange={(event) => {
              updateField("name", event.target.value);
            }}
            placeholder="e.g. Brgy. Poblacion Loop"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </FormField>

        <FormField label="Barangay Coverage">
          <input
            value={formValue.barangay}
            onChange={(event) => {
              updateField("barangay", event.target.value);
            }}
            placeholder="e.g. Brgy. Poblacion"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </FormField>

        <FormField label="Waypoints / Collection Points">
          <input
            value={formValue.waypoints}
            onChange={(event) => {
              updateField("waypoints", event.target.value);
            }}
            placeholder="e.g. Stop A, Stop B, Stop C"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </FormField>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <FormField label="Waste Type">
            <select
              value={formValue.wasteType}
              onChange={(event) => {
                updateField("wasteType", event.target.value as WasteType);
              }}
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              {COLLECTION_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <FormField label="Start Time">
            <input
              value={formValue.startTime}
              onChange={(event) => {
                updateField("startTime", event.target.value);
              }}
              placeholder="e.g. 10:00 AM"
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </FormField>

          <FormField label="Route Type">
            <select
              value={formValue.routeType}
              onChange={(event) => {
                updateField("routeType", event.target.value);
              }}
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
        <input value={route.name} disabled className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-2.5 py-2 text-[13px] text-gray-500" />
      </FormField>

      <FormField label="Select Eco-Aide">
        <select
          value={assignedEcoAide}
          onChange={(event) => {
            setAssignedEcoAide(event.target.value);
          }}
          className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
      <div className="grid gap-[18px_40px] rounded-xl bg-brand px-8 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
        <div className="flex flex-col gap-2.5">
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

        <div className="min-h-[240px] overflow-hidden rounded-[10px]">
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
  const widthClass = width === 820 ? "max-w-[820px]" : "max-w-[560px]";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[14px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${widthClass}`}>
        <div className="mb-[18px] flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-extrabold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500">
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
    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
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
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-gray-700">
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
    <p className="m-0 text-sm text-white/90">
      <strong>{label}:</strong> {value}
    </p>
  );
}

function RouteStatusPill({ status }: { status: RouteStatus }) {
  const statusClass =
    status === "In Progress"
      ? "border-amber-400 bg-amber-100 text-amber-800"
      : status === "Completed"
        ? "border-green-400 bg-green-100 text-green-800"
        : "border-red-400 bg-red-100 text-orange-800";

  return (
    <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-[3px] text-xs font-bold ${statusClass}`}>
      {status}
    </span>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center bg-[#e8ece8] text-gray-800">
      <div className="text-[56px] opacity-50">◇</div>
      <p className="mt-2 text-[13px] text-gray-500">Map preview placeholder</p>
    </div>
  );
}

function Pagination() {
  return (
    <div className="mt-3.5 flex items-center justify-center gap-1.5">
      <button type="button" className="cursor-pointer rounded-[7px] border border-gray-200 bg-white px-2.5 py-[3px] text-[22px] text-gray-700">
        ‹
      </button>
      <button type="button" className="h-8 w-8 cursor-pointer rounded-[7px] border-0 bg-brand font-bold text-white">
        1
      </button>
      <button type="button" className="cursor-pointer rounded-[7px] border border-gray-200 bg-white px-2.5 py-[3px] text-[22px] text-gray-700">
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
