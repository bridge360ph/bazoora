import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Plus,
  Route as RouteIcon,
  Truck as TruckIcon,
  UserRound,
  UsersRound,
} from "lucide-react";
import { FleetDriversView } from "./components/FleetDriversView";
import { AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  AdminEmptySlot,
  AdminLoadingList,
  AdminNotice,
  AdminPill,
  AdminSearchInput,
  BUTTON_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/AdminControls";
import { AdminListCard, AdminMeta } from "@/components/admin/AdminListCard";
import { AdminPagination, paginate } from "@/components/admin/AdminPagination";
import type {
  DriverFormValue,
  FleetAssignmentOption,
  Truck,
  TruckFormValue,
  TruckStatusFilter,
} from "./fleet.types";
import {
  createDriver,
  createTruck,
  deleteTruck,
  FLEET_DRIVERS_QUERY_KEY,
  fetchFleetAssignmentOptions,
  fetchTrucks,
  updateTruck,
  updateTruckAssignment,
} from "./fleet.api";
import { TruckStatusPill } from "./components/TruckStatusPill";
import { TruckFormModal } from "./components/TruckFormModal";
import { AssignTruckModal } from "./components/AssignTruckModal";
import { DriverFormModal } from "./components/DriverFormModal";
import { RemoveTruckModal } from "./components/RemoveTruckModal";
import { TruckBranchMeta, WasteTypePill } from "./components/TruckBranchBadges";
import { BRANCHES, branchById } from "@/lib/branches";
import { useAuthStore, type UserRole } from "@/stores/auth-store";

type ModalMode = "register" | "edit" | "assign" | "addDriver" | "remove" | null;

type FleetView = "trucks" | "drivers";

// Roles that POST /auth/register-staff allows to create drivers, in the
// store's lowercase form (see mapApiRole in features/auth/roles.ts).
const DRIVER_CREATOR_ROLES: UserRole[] = [
  "super_admin",
  "government_agency",
  "hauling_org",
];

const emptyDriverForm: DriverFormValue = {
  name: "",
  email: "",
  password: "",
};

const TRUCKS_PAGE_SIZE = 10;

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
  branchId: "",
  wasteType: "",
  assignedDriver: "",
};

// "" lists every branch; "none" lists trucks with no branch set yet.
const NO_BRANCH_FILTER = "none";

export function AdminFleetManagementPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<FleetView>("trucks");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [statusFilter, setStatusFilter] = useState<TruckStatusFilter>("All");
  const [branchFilter, setBranchFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(TRUCKS_PAGE_SIZE);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [truckForm, setTruckForm] = useState<TruckFormValue>(emptyTruckForm);
  const [assignedRoute, setAssignedRoute] = useState("");
  const [assignedEcoAide, setAssignedEcoAide] = useState("");
  const [routeOptions, setRouteOptions] =
    useState<FleetAssignmentOption[]>([]);
  const [ecoAideOptions, setEcoAideOptions] =
    useState<FleetAssignmentOption[]>([]);
  const [driverOptions, setDriverOptions] =
    useState<FleetAssignmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [driverForm, setDriverForm] = useState<DriverFormValue>(emptyDriverForm);
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const userRole = useAuthStore((state) => state.user?.role);
  const canAddDriver = userRole !== undefined && DRIVER_CREATOR_ROLES.includes(userRole);

  useEffect(() => {
    let isMounted = true;

    async function loadFleetData() {
      try {
        setIsLoading(true);
        setRequestError("");

        const [truckRecords, assignmentOptions] = await Promise.all([
          fetchTrucks(),
          fetchFleetAssignmentOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        setTrucks(truckRecords);
        setRouteOptions(assignmentOptions.routes);
        setEcoAideOptions(assignmentOptions.ecoAides);
        setDriverOptions(assignmentOptions.drivers);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRequestError(
          error instanceof Error
            ? error.message
            : "Fleet records could not be loaded.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFleetData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Search applies before the status tabs, so each tab count shows what
  // that tab would list.
  const searchedTrucks = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return trucks.filter(
      (truck) =>
        (branchFilter === "" ||
          (branchFilter === NO_BRANCH_FILTER
            ? branchById(truck.branchId) === null
            : truck.branchId === branchFilter)) &&
        (normalizedSearch.length === 0 ||
          truck.id.toLowerCase().includes(normalizedSearch) ||
          truck.plateNumber.toLowerCase().includes(normalizedSearch) ||
          truck.model.toLowerCase().includes(normalizedSearch) ||
          truck.assignedDriver.toLowerCase().includes(normalizedSearch)),
    );
  }, [branchFilter, searchValue, trucks]);
  const trucksWithoutBranch = trucks.filter(
    (truck) => branchById(truck.branchId) === null || truck.wasteType === null,
  ).length;

  const filteredTrucks = useMemo(
    () =>
      statusFilter === "All"
        ? searchedTrucks
        : searchedTrucks.filter((truck) => truck.status === statusFilter),
    [searchedTrucks, statusFilter],
  );

  const statusCounts: Record<TruckStatusFilter, number> = {
    All: searchedTrucks.length,
    Active: searchedTrucks.filter((truck) => truck.status === "Active").length,
    Idle: searchedTrucks.filter((truck) => truck.status === "Idle").length,
    "Under Maintenance": searchedTrucks.filter((truck) => truck.status === "Under Maintenance")
      .length,
  };

  const pagination = paginate(filteredTrucks, page, rowsPerPage);

  function openRegisterModal() {
    setTruckForm(emptyTruckForm);
    setSelectedTruck(null);
    setModalError("");
    setModalMode("register");
  }

  function openEditModal(truck: Truck) {
    setSelectedTruck(truck);
    setTruckForm({
      plateNumber: truck.plateNumber,
      model: truck.model,
      capacity: truck.capacity.replace(" kg", ""),
      status: truck.status,
      branchId: branchById(truck.branchId)?.id ?? "",
      wasteType: truck.wasteType ?? "",
      assignedDriver: truck.assignedDriver,
      assignedDriverId: truck.assignedDriverId ?? "",
    });
    setModalError("");
    setModalMode("edit");
  }

  async function openAssignModal(truck: Truck) {
    try {
      setRequestError("");

      const assignmentOptions = await fetchFleetAssignmentOptions();

      setRouteOptions(assignmentOptions.routes);
      setEcoAideOptions(assignmentOptions.ecoAides);
      setDriverOptions(assignmentOptions.drivers);

      setSelectedTruck(truck);
      setAssignedRoute(truck.assignedRouteId ?? "");
      setAssignedEcoAide(truck.assignedEcoAideId ?? "");
      setModalError("");
      setModalMode("assign");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load Fleet assignment options.",
      );
    }
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setSelectedTruck(null);
    setModalMode(null);
    setModalError("");
  }

  function openAddDriverModal() {
    setDriverForm(emptyDriverForm);
    setModalError("");
    setModalMode("addDriver");
  }

  function openRemoveModal(truck: Truck) {
    setSelectedTruck(truck);
    setModalError("");
    setModalMode("remove");
  }

  async function saveDriver() {
    try {
      setIsSaving(true);
      setModalError("");

      await createDriver(driverForm);

      // Reload so the new driver shows up in the Assigned Driver dropdown.
      const assignmentOptions = await fetchFleetAssignmentOptions();
      setRouteOptions(assignmentOptions.routes);
      setEcoAideOptions(assignmentOptions.ecoAides);
      setDriverOptions(assignmentOptions.drivers);

      // The Drivers view lists the new account.
      await queryClient.invalidateQueries({ queryKey: FLEET_DRIVERS_QUERY_KEY });

      setModalMode(null);
      setDriverForm(emptyDriverForm);
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "The driver could not be added.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // A removed driver leaves their truck driverless, so the truck list and
  // the driver dropdown are reloaded.
  async function reloadAfterDriverChange() {
    try {
      const [truckRecords, assignmentOptions] = await Promise.all([
        fetchTrucks(),
        fetchFleetAssignmentOptions(),
      ]);
      setTrucks(truckRecords);
      setDriverOptions(assignmentOptions.drivers);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Fleet records could not be refreshed.",
      );
    }
  }

  async function removeTruck() {
    if (!selectedTruck) {
      return;
    }

    try {
      setIsSaving(true);
      setModalError("");

      await deleteTruck(selectedTruck.databaseId);

      setTrucks((currentTrucks) =>
        currentTrucks.filter(
          (truck) => truck.databaseId !== selectedTruck.databaseId,
        ),
      );
      setSelectedTruck(null);
      setModalMode(null);
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "The truck could not be removed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function registerTruck() {
    try {
      setModalError("");

      const createdTruck = await createTruck(truckForm);
      setTrucks((currentTrucks) => [createdTruck, ...currentTrucks]);
      closeModal();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "The truck could not be registered.",
      );
    }
  }

  async function saveEditedTruck() {
    if (!selectedTruck) {
      return;
    }

    try {
      setModalError("");

      const updatedTruck = await updateTruck(
        selectedTruck.databaseId,
        truckForm,
      );

      setTrucks((currentTrucks) =>
        currentTrucks.map((truck) =>
          truck.databaseId === updatedTruck.databaseId
            ? updatedTruck
            : truck,
        ),
      );

      closeModal();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "The truck could not be updated.",
      );
    }
  }

  async function saveTruckAssignment() {
    if (!selectedTruck || !assignedRoute) {
      return;
    }

    try {
      setModalError("");

      const updatedTruck = await updateTruckAssignment(
        selectedTruck.databaseId,
        assignedRoute,
        assignedEcoAide,
      );

      setTrucks((currentTrucks) =>
        currentTrucks.map((truck) =>
          truck.databaseId === updatedTruck.databaseId
            ? updatedTruck
            : truck,
        ),
      );

      closeModal();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "The truck assignment could not be saved.",
      );
    }
  }

  return (
    <AdminPage fill>
      <AdminPanel className="h-full min-h-0">
        <div className="flex shrink-0 justify-center px-6 pt-5">
          <FleetViewSwitch view={view} onChange={setView} />
        </div>

        {view === "drivers" ? (
          <FleetDriversView
            canAddDriver={canAddDriver}
            onAddDriver={openAddDriverModal}
            onDriverRemoved={() => {
              void reloadAfterDriverChange();
            }}
          />
        ) : (
        <>
        <AdminTabs
          tabs={statusFilters.map((filter) => ({
            value: filter,
            label: filter === "All" ? "ALL" : filter.toUpperCase(),
            count: statusCounts[filter],
          }))}
          active={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          actions={
            <button type="button" onClick={openRegisterModal} className={BUTTON_CLASSES.primary}>
              <Plus className="h-3.5 w-3.5" />
              Register Truck
            </button>
          }
        />

        <div className="flex shrink-0 flex-col gap-2 px-6 pt-5 sm:flex-row">
          <div className="min-w-0 flex-auto">
            <AdminSearchInput
              value={searchValue}
              onChange={(value) => {
                setSearchValue(value);
                setPage(1);
              }}
              placeholder="Search truck by ID, plate no., model, or driver"
            />
          </div>
          <select
            aria-label="Filter by branch"
            value={branchFilter}
            onChange={(event) => {
              setBranchFilter(event.target.value);
              setPage(1);
            }}
            className={`${INPUT_CLASSES} cursor-pointer sm:w-56`}
          >
            <option value="">All branches</option>
            <option value={NO_BRANCH_FILTER}>No branch set</option>
            {BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
          {requestError && (
            <div className="mb-3">
              <AdminNotice tone="error" onDismiss={() => setRequestError("")}>
                {requestError}
              </AdminNotice>
            </div>
          )}

          {!isLoading && trucksWithoutBranch > 0 && (
            <div className="mb-3">
              <AdminNotice tone="info">
                {trucksWithoutBranch === 1 ? "1 truck has" : `${trucksWithoutBranch} trucks have`} no
                branch or waste type set. Edit {trucksWithoutBranch === 1 ? "it" : "them"} to set
                both. Until then {trucksWithoutBranch === 1 ? "it is" : "they are"} not offered when
                checking hauling requests.
              </AdminNotice>
            </div>
          )}

          {isLoading ? (
            <AdminLoadingList />
          ) : (
            <>
              <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
                {pagination.pageItems.map((truck) => (
                  <AdminListCard
                    key={truck.id}
                    accentClassName={truckAccentClass(truck.status)}
                    onOpen={() => openEditModal(truck)}
                    aside={
                      <>
                        <TruckStatusPill status={truck.status} />
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openEditModal(truck)} className={BUTTON_CLASSES.link}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void openAssignModal(truck);
                            }}
                            className={BUTTON_CLASSES.link}
                          >
                            Assign
                          </button>
                          <button type="button" onClick={() => openRemoveModal(truck)} className={BUTTON_CLASSES.linkDanger}>
                            Remove
                          </button>
                        </div>
                      </>
                    }
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-bold text-gray-800">{truck.plateNumber}</p>
                      {truck.model && <AdminPill>{truck.model}</AdminPill>}
                      {truck.capacity && <AdminPill>{truck.capacity}</AdminPill>}
                      <WasteTypePill wasteType={truck.wasteType} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-500">ID: {truck.id}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
                      <TruckBranchMeta branchId={truck.branchId} />
                      <AdminMeta icon={<UserRound className="h-3 w-3 shrink-0 text-gray-400" />}>
                        {truck.assignedDriver || "No driver yet"}
                      </AdminMeta>
                      {truck.assignedRoute && (
                        <AdminMeta icon={<RouteIcon className="h-3 w-3 shrink-0 text-gray-400" />}>
                          {truck.assignedRoute}
                        </AdminMeta>
                      )}
                      <AdminMeta icon={<CalendarDays className="h-3 w-3 shrink-0 text-gray-400" />}>
                        Registered {truck.registeredDate}
                      </AdminMeta>
                    </div>
                  </AdminListCard>
                ))}

                {pagination.total === 0 ? (
                  <AdminEmptySlot>
                    {trucks.length === 0
                      ? "No trucks yet. Register one to get started."
                      : "No trucks match the current filter."}
                  </AdminEmptySlot>
                ) : (
                  pagination.page === pagination.totalPages && <AdminEmptySlot>No more trucks</AdminEmptySlot>
                )}
              </div>

              <AdminPagination
                {...pagination}
                onPageChange={setPage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>
        </>
        )}
      </AdminPanel>

      {modalMode === "register" && (
        <TruckFormModal
          title="Register Garbage Truck"
          formValue={truckForm}
          setFormValue={setTruckForm}
          saveLabel="Register"
          driverOptions={driverOptions}
          errorMessage={modalError}
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
          driverOptions={driverOptions}
          errorMessage={modalError}
          onSave={saveEditedTruck}
          onClose={closeModal}
        />
      )}

      {modalMode === "addDriver" && (
        <DriverFormModal
          formValue={driverForm}
          setFormValue={setDriverForm}
          isSaving={isSaving}
          error={modalError}
          onSave={() => {
            void saveDriver();
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === "remove" && selectedTruck && (
        <RemoveTruckModal
          truck={selectedTruck}
          isSaving={isSaving}
          error={modalError}
          onConfirm={() => {
            void removeTruck();
          }}
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
          routeOptions={routeOptions}
          ecoAideOptions={ecoAideOptions}
          errorMessage={modalError}
          onSave={saveTruckAssignment}
          onClose={closeModal}
        />
      )}
    </AdminPage>
  );
}

function FleetViewSwitch({
  view,
  onChange,
}: {
  view: FleetView;
  onChange: (view: FleetView) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5" role="tablist">
      {(["trucks", "drivers"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={view === option}
          onClick={() => onChange(option)}
          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded px-4 text-xs font-semibold transition ${
            view === option ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {option === "trucks" ? <TruckIcon className="h-3.5 w-3.5" /> : <UsersRound className="h-3.5 w-3.5" />}
          {option === "trucks" ? "Trucks" : "Drivers"}
        </button>
      ))}
    </div>
  );
}

function truckAccentClass(status: Truck["status"]): string {
  if (status === "Active") return "border-l-emerald-400";
  if (status === "Idle") return "border-l-amber-400";
  return "border-l-red-400";
}

