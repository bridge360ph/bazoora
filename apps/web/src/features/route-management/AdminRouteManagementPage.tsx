import { useState, useMemo, useEffect } from "react";
import { Button, MapPreviewPlaceholder, PaginationControls, StatCard } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue, RouteStatusFilter } from "./route.types";
import { useRoutes } from "./hooks/useRoutes";
import { useCreateRoute } from "./hooks/useCreateRoute";
import { useUpdateRoute } from "./hooks/useUpdateRoute";
import { useAssignRouteEcoAide } from "../route-assignment/hooks/useAssignRouteEcoAide";
import { useAssignRouteTruck } from "../route-assignment/hooks/useAssignRouteTruck";
import { useDeleteRoute } from "./hooks/useDeleteRoute";
import { RouteFiltersBar } from "./components/RouteFiltersBar";
import { RouteCard } from "./components/RouteCard";
import { RouteFormModal } from "./components/RouteFormModal";
import { AssignEcoAideModal } from "./components/AssignEcoAideModal";
import { RouteDetailsModal } from "./components/RouteDetailsModal";
import { AssignRouteTruckModal } from "./components/AssignRouteTruckModal";
import { DeleteRouteModal } from "./components/DeleteRouteModal";

type ModalMode =
  | "create"
  | "edit"
  | "assign"
  | "assignTruck"
  | "delete"
  | "details"
  | null;

const ROUTES_PAGE_SIZE = 4;

const emptyRouteForm: RouteFormValue = {
  name: "",
  barangay: "",
  waypoints: "",
  wasteType: "Regular",
  collectionDay: "Sunday",
  startTime: "",
  routeType: "Free",
  assignedEcoAideId: null,
  assignedTruckId: null,
};

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

  const filteredRoutes = useMemo(() => {
    if (!routes) {
      return [];
    }

    return routes.filter((route) => {
      const matchesStatus =
        statusFilter === "All" || route.status === statusFilter;

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        route.id.toLowerCase().includes(normalizedSearch) ||
        route.name.toLowerCase().includes(normalizedSearch) ||
        route.barangay.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [routes, searchValue, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoutes.length / ROUTES_PAGE_SIZE),
  );

  const paginatedRoutes = filteredRoutes.slice(
    (page - 1) * ROUTES_PAGE_SIZE,
    page * ROUTES_PAGE_SIZE,
  );

  const handleStatusFilterChange = (value: RouteStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const completedCount =
    routes?.filter((route) => route.status === "Completed").length ?? 0;

  const inProgressCount =
    routes?.filter((route) => route.status === "In Progress").length ?? 0;

  const notStartedCount =
    routes?.filter((route) => route.status === "Not Started").length ?? 0;

  function openCreateModal() {
    assignTruckMutation.reset();
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
      routeType: route.routeType,
      assignedEcoAideId: route.assignedEcoAideId ?? null,
      assignedTruckId: route.assignedTruckId ?? null,
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
    <div className="p-6">
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreateModal}>+ Create Route</Button>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-4">
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Not Started" value={notStartedCount} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
        <div>
          <RouteFiltersBar
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
          />

          {isLoading && (
            <div className="py-16 text-center text-sm text-gray-400">
              Loading routes…
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-red-600">
                Couldn&apos;t load routes
                {error instanceof Error ? `: ${error.message}` : "."}
              </p>
              <Button variant="secondary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <div>
                {paginatedRoutes.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    {routes && routes.length === 0
                      ? "No routes have been created yet."
                      : "No routes match the current filter."}
                  </div>
                ) : (
                  paginatedRoutes.map((route) => (
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
                  ))
                )}
              </div>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              />
            </>
          )}
        </div>

        <div className="min-h-[420px] overflow-hidden rounded-xl bg-[#e8ece8]">
          <MapPreviewPlaceholder />
        </div>
      </div>

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
    </div>
  );
}
