import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Route } from "@bazoora/shared";
import {
  buildFreeRouteName,
  type EditableRouteStop,
  type RouteFormValue,
  type RouteStatusFilter,
} from "./route.types";
import { useRoutes } from "./hooks/useRoutes";
import { useCreateRoute } from "./hooks/useCreateRoute";
import { useUpdateRoute } from "./hooks/useUpdateRoute";
import { useAssignRouteEcoAide } from "../route-assignment/hooks/useAssignRouteEcoAide";
import { useAssignRouteTruck } from "../route-assignment/hooks/useAssignRouteTruck";
import { useDeleteRoute } from "./hooks/useDeleteRoute";
import { ROUTE_STATUS_FILTERS } from "./routeFilters.constants";
import { AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  AdminEmptySlot,
  AdminLoadingList,
  AdminNotice,
  AdminRefreshButton,
  AdminSearchInput,
  BUTTON_CLASSES,
} from "@/components/admin/AdminControls";
import { AdminPagination, paginate } from "@/components/admin/AdminPagination";
import { RouteCard } from "./components/RouteCard";
import { RouteFormModal } from "./components/RouteFormModal";
import { AssignEcoAideModal } from "./components/AssignEcoAideModal";
import { RouteDetailsModal } from "./components/RouteDetailsModal";
import { AssignRouteTruckModal } from "./components/AssignRouteTruckModal";
import { DeleteRouteModal } from "./components/DeleteRouteModal";
import {
  RouteTypeChooserModal,
  type RouteKind,
} from "./components/RouteTypeChooserModal";
import { PaidRouteFormModal } from "./components/PaidRouteFormModal";

type ModalMode =
  | "chooseType"
  | "create"
  | "createPaid"
  | "edit"
  | "assign"
  | "assignTruck"
  | "delete"
  | "details"
  | null;

const ROUTES_PAGE_SIZE = 10;

const emptyRouteForm: RouteFormValue = {
  name: "",
  barangay: "",
  waypoints: "",
  wasteType: "BIODEGRADABLE",
  collectionDay: "Sunday",
  startTime: "",
  routeType: "Free",
  assignedEcoAideId: null,
  assignedTruckId: null,
  stops: [],
  collectionDate: "",
  startBranchId: null,
};

/**
 * Stops for the edit form. Routes saved with map positions use them; older
 * routes only have waypoint names, which show as stops still to be located.
 */
function toEditableStops(route: Route): EditableRouteStop[] {
  if (route.stopLocations && route.stopLocations.length > 0) {
    return route.stopLocations.map((stop, index) => ({
      id: `saved-${index}`,
      ...stop,
    }));
  }

  return route.waypoints
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `legacy-${index}`,
      name,
      address: "",
      lat: null,
      lng: null,
    }));
}

export function AdminRouteManagementPage() {
  const { data: routes, isLoading, isError, error, refetch } = useRoutes();
  const createRouteMutation = useCreateRoute();
  const updateRouteMutation = useUpdateRoute();
  const assignEcoAideMutation = useAssignRouteEcoAide();
  const assignTruckMutation = useAssignRouteTruck();
  const deleteRouteMutation = useDeleteRoute();

  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROUTES_PAGE_SIZE);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [routeForm, setRouteForm] = useState<RouteFormValue>(emptyRouteForm);
  const [assignedEcoAide, setAssignedEcoAide] = useState<string | null>(null);
  const [assignedTruck, setAssignedTruck] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  // Search applies before the status tabs, so each tab count shows what
  // that tab would list.
  const searchedRoutes = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return (routes ?? []).filter(
      (route) =>
        normalizedSearch.length === 0 ||
        route.id.toLowerCase().includes(normalizedSearch) ||
        route.routeDisplayNumber.toLowerCase().includes(normalizedSearch) ||
        route.name.toLowerCase().includes(normalizedSearch) ||
        route.barangay.toLowerCase().includes(normalizedSearch),
    );
  }, [routes, searchValue]);

  const filteredRoutes = useMemo(
    () =>
      statusFilter === "All"
        ? searchedRoutes
        : searchedRoutes.filter((route) => route.status === statusFilter),
    [searchedRoutes, statusFilter],
  );

  const statusCounts: Record<RouteStatusFilter, number> = {
    All: searchedRoutes.length,
    "In Progress": searchedRoutes.filter((route) => route.status === "In Progress").length,
    "Not Started": searchedRoutes.filter((route) => route.status === "Not Started").length,
    Completed: searchedRoutes.filter((route) => route.status === "Completed").length,
  };

  const pagination = paginate(filteredRoutes, page, rowsPerPage);

  const handleStatusFilterChange = (value: RouteStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  function openCreateModal() {
    setSelectedRoute(null);
    setModalMode("chooseType");
  }

  function handleChooseRouteType(kind: RouteKind) {
    if (kind === "Paid") {
      setModalMode("createPaid");
      return;
    }

    assignTruckMutation.reset();
    setRouteForm({ ...emptyRouteForm, routeType: "Free" });
    setModalMode("create");
  }

  function openEditModal(route: Route) {
    setSelectedRoute(route);
    setRouteForm({
      // Weekly routes take the name built from their barangay, day and time.
      name:
        route.routeType === "Paid"
          ? route.name
          : buildFreeRouteName(
              route.barangay,
              route.wasteType,
              route.collectionDay,
              route.startTime,
            ) ||
            route.name,
      barangay: route.barangay,
      waypoints: route.waypoints,
      wasteType: route.wasteType,
      collectionDay: route.collectionDay,
      startTime: route.startTime,
      routeType: route.routeType,
      assignedEcoAideId: route.assignedEcoAideId ?? null,
      assignedTruckId: route.assignedTruckId ?? null,
      stops: toEditableStops(route),
      collectionDate: route.collectionDate ?? "",
      startBranchId: route.startBranchId ?? null,
    });
    assignTruckMutation.reset();
    setModalMode("edit");
  }

  function openAssignModal(route: Route) {
    setSelectedRoute(route);
    setAssignedEcoAide(route.assignedEcoAideId ?? null);
    setModalMode("assign");
  }

  function openAssignTruckModal(route: Route) {
    assignTruckMutation.reset();
    setSelectedRoute(route);
    setAssignedTruck(route.assignedTruckId ?? null);
    setModalMode("assignTruck");
  }

  function openDeleteModal(route: Route) {
    deleteRouteMutation.reset();
    setSelectedRoute(route);
    setModalMode("delete");
  }

  function handleSaveTruckAssignment() {
    if (!selectedRoute) {
      return;
    }

    assignTruckMutation.mutate(
      { routeId: selectedRoute.id, truckId: assignedTruck },
      {
        onSuccess: () => {
          refetch();
          closeModal();
          setSuccessMessage(
            assignedTruck
              ? "Truck assigned successfully."
              : "Truck unassigned successfully.",
          );
        },
      },
    );
  }

  function handleDeleteRoute() {
    if (!selectedRoute) {
      return;
    }

    deleteRouteMutation.mutate(selectedRoute.id, {
      onSuccess: () => {
        refetch();
        closeModal();
        setSuccessMessage("Route deleted successfully.");
      },
    });
  }

  function openDetails(route: Route) {
    setSelectedRoute(route);
    setModalMode("details");
  }

  function closeModal() {
    setSelectedRoute(null);
    setModalMode(null);
  }

  /**
   * Applies whichever assignments were picked in the create/edit form, one
   * at a time, using the existing /assign-eco-aide
   * endpoint. The route list is refreshed and the modal closed only once
   * the whole chain completes. If an assignment fails, its mutation's
   * `error` is left set for the modal to display and the chain stops there
   * (the modal stays open).
   */

    function finishFormSave(successMessage: string) {
      refetch();
      closeModal();
      setSuccessMessage(successMessage);
    }

    /**
     * Saves the truck picked in the form through /assign-truck, but only
     * when it differs from what the route already has.
     */
    function applyTruckAssignment(
      routeId: string,
      previousTruckId: string | null,
      successMessage: string,
    ) {
      if (routeForm.assignedTruckId === previousTruckId) {
        finishFormSave(successMessage);
        return;
      }

      assignTruckMutation.mutate(
        { routeId, truckId: routeForm.assignedTruckId },
        {
          onSuccess: () => {
            finishFormSave(successMessage);
          },
        },
      );
    }

    function applyEcoAideAssignment(
      routeId: string,
      previousTruckId: string | null,
      successMessage: string,
    ) {
      if (!routeForm.assignedEcoAideId) {
        applyTruckAssignment(routeId, previousTruckId, successMessage);
        return;
      }

      assignEcoAideMutation.mutate(
        { routeId, ecoAide: routeForm.assignedEcoAideId },
        {
          onSuccess: () => {
            applyTruckAssignment(routeId, previousTruckId, successMessage);
          },
        },
      );
    }

  function handleCreateRoute() {
    createRouteMutation.mutate(routeForm, {
      onSuccess: (createdRoute) => {
        applyEcoAideAssignment(createdRoute.id, null, "Route created successfully.");
      },
    });
  }

  function handleSaveEditedRoute() {
    if (!selectedRoute) {
      return;
    }

    updateRouteMutation.mutate(
      { routeId: selectedRoute.id, formValue: routeForm },
      {
        onSuccess: () => {
          applyEcoAideAssignment(
            selectedRoute.id,
            selectedRoute.assignedTruckId,
            "Route updated successfully.",
          );
        },
      },
    );
  }

  function handleSaveEcoAideAssignment() {
    if (!selectedRoute || !assignedEcoAide) {
      return;
    }

    assignEcoAideMutation.mutate(
      { routeId: selectedRoute.id, ecoAide: assignedEcoAide },
      {
        onSuccess: () => {
          refetch();
          closeModal();
          setSuccessMessage("Eco-Aide assigned successfully.");
        },
      },
    );
  }

  const formMutationError =
    createRouteMutation.error?.message ??
    updateRouteMutation.error?.message ??
    assignEcoAideMutation.error?.message ??
    assignTruckMutation.error?.message ??
    null;

  const isFormSubmitting =
    modalMode === "create"
      ? createRouteMutation.isPending ||
        assignEcoAideMutation.isPending ||
        assignTruckMutation.isPending
      : updateRouteMutation.isPending ||
        assignEcoAideMutation.isPending ||
        assignTruckMutation.isPending

  return (
    <AdminPage fill>
      <AdminPanel className="h-full min-h-0">
        <AdminTabs
          tabs={ROUTE_STATUS_FILTERS.map((filter) => ({
            value: filter,
            label: filter.toUpperCase(),
            count: statusCounts[filter],
          }))}
          active={statusFilter}
          onChange={handleStatusFilterChange}
          actions={
            <>
              <AdminRefreshButton onClick={refetch} isRefreshing={isLoading} label="Refresh routes" />
              <button type="button" onClick={openCreateModal} className={BUTTON_CLASSES.primary}>
                <Plus className="h-3.5 w-3.5" />
                Create Route
              </button>
            </>
          }
        />

        <div className="shrink-0 px-6 pt-5">
          <AdminSearchInput
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search route by ID, name or barangay"
          />
        </div>

        <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
          {successMessage && (
            <div className="mb-3">
              <AdminNotice tone="success" onDismiss={() => setSuccessMessage(null)}>
                {successMessage}
              </AdminNotice>
            </div>
          )}

          {isLoading && <AdminLoadingList />}

          {isError && (
            <AdminEmptySlot>
              <div className="flex flex-col items-center gap-3">
                <p className="text-red-600">
                  Couldn&apos;t load routes
                  {error instanceof Error ? `: ${error.message}` : "."}
                </p>
                <button type="button" onClick={() => refetch()} className={BUTTON_CLASSES.ghost}>
                  Retry
                </button>
              </div>
            </AdminEmptySlot>
          )}

          {!isLoading && !isError && (
            <>
              <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
                {pagination.pageItems.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onEdit={() => {
                      openEditModal(route);
                    }}
                    onAssign={() => {
                      openAssignModal(route);
                    }}
                    onAssignTruck={() => {
                      openAssignTruckModal(route);
                    }}
                    onView={() => {
                      openDetails(route);
                    }}
                    onDelete={() => {
                      openDeleteModal(route);
                    }}
                  />
                ))}

                {pagination.total === 0 ? (
                  <AdminEmptySlot>
                    {routes && routes.length === 0
                      ? "No routes have been created yet."
                      : "No routes match the current filter."}
                  </AdminEmptySlot>
                ) : (
                  pagination.page === pagination.totalPages && <AdminEmptySlot>No more routes</AdminEmptySlot>
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
      </AdminPanel>

      {modalMode === "chooseType" && (
        <RouteTypeChooserModal
          onChoose={handleChooseRouteType}
          onClose={closeModal}
        />
      )}

      {modalMode === "createPaid" && (
        <PaidRouteFormModal
          onClose={closeModal}
          onCreated={(route, request) => {
            refetch();
            closeModal();
            setSuccessMessage(
              `Paid route ${route.routeDisplayNumber} created for ${request.requestNumber}.`,
            );
          }}
        />
      )}

      {modalMode === "create" && (
        <RouteFormModal
          mode="create"
          routes={routes ?? []}
          formValue={routeForm}
          setFormValue={setRouteForm}
          onSave={handleCreateRoute}
          onClose={closeModal}
          isSubmitting={isFormSubmitting}
          errorMessage={formMutationError}
        />
      )}

      {modalMode === "edit" && selectedRoute && (
        <RouteFormModal
          mode="edit"
          route={selectedRoute}
          routes={routes ?? []}
          formValue={routeForm}
          setFormValue={setRouteForm}
          onSave={handleSaveEditedRoute}
          onClose={closeModal}
          isSubmitting={isFormSubmitting}
          errorMessage={formMutationError}
        />
      )}

      {modalMode === "assign" && selectedRoute && (
        <AssignEcoAideModal
          route={selectedRoute}
          routes={routes ?? []}
          assignedEcoAide={assignedEcoAide}
          setAssignedEcoAide={setAssignedEcoAide}
          onSave={handleSaveEcoAideAssignment}
          onClose={closeModal}
          isSubmitting={assignEcoAideMutation.isPending}
          errorMessage={assignEcoAideMutation.error?.message ?? null}
        />
      )}

      {modalMode === "assignTruck" && selectedRoute && (
        <AssignRouteTruckModal
          route={selectedRoute}
          assignedTruck={assignedTruck}
          setAssignedTruck={setAssignedTruck}
          onSave={handleSaveTruckAssignment}
          onClose={closeModal}
          isSubmitting={assignTruckMutation.isPending}
          errorMessage={assignTruckMutation.error?.message ?? null}
        />
      )}

      {modalMode === "delete" && selectedRoute && (
        <DeleteRouteModal
          route={selectedRoute}
          onConfirm={handleDeleteRoute}
          onClose={closeModal}
          isSubmitting={deleteRouteMutation.isPending}
          errorMessage={deleteRouteMutation.error?.message ?? null}
        />
      )}

      {modalMode === "details" && selectedRoute && (
        <RouteDetailsModal route={selectedRoute} onClose={closeModal} />
      )}
    </AdminPage>
  );
}
