import { useState, useMemo } from "react";
import { Button, MapPreviewPlaceholder, PaginationControls, StatCard } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue, RouteStatusFilter } from "./route.types";
import { useRoutes } from "./hooks/useRoutes";
import { useCreateRoute } from "./hooks/useCreateRoute";
import { useUpdateRoute } from "./hooks/useUpdateRoute";
import { useAssignRouteEcoAide } from "../route-assignment/hooks/useAssignRouteEcoAide";
import { useAssignRouteTruck } from "../route-assignment/hooks/useAssignRouteTruck";
import { RouteFiltersBar } from "./components/RouteFiltersBar";
import { RouteCard } from "./components/RouteCard";
import { RouteFormModal } from "./components/RouteFormModal";
import { AssignEcoAideModal } from "./components/AssignEcoAideModal";
import { RouteDetailsModal } from "./components/RouteDetailsModal";

type ModalMode = "create" | "edit" | "assign" | "details" | null;

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

  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [routeForm, setRouteForm] = useState<RouteFormValue>(emptyRouteForm);
  const [assignedEcoAide, setAssignedEcoAide] = useState("");

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
      assignedEcoAideId: route.assignedEcoAideId,
      assignedTruckId: route.assignedTruckId,
    });
    setModalMode("edit");
  }

  function openAssignModal(route: Route) {
    setSelectedRoute(route);
    setAssignedEcoAide(route.assignedEcoAideId ?? "");
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

  /**
   * Applies whichever assignments were picked in the create/edit form, one
   * at a time, using the existing /assign-eco-aide and /assign-truck
   * endpoints. The route list is refreshed and the modal closed only once
   * the whole chain completes. If an assignment fails, its mutation's
   * `error` is left set for the modal to display and the chain stops there
   * (the modal stays open).
   */
  function applyTruckAssignment(routeId: string) {
    if (!routeForm.assignedTruckId) {
      refetch();
      closeModal();
      return;
    }

    assignTruckMutation.mutate(
      { routeId, truckId: routeForm.assignedTruckId },
      {
        onSuccess: () => {
          refetch();
          closeModal();
        },
      },
    );
  }

  function applyEcoAideAssignment(routeId: string) {
    if (!routeForm.assignedEcoAideId) {
      applyTruckAssignment(routeId);
      return;
    }

    assignEcoAideMutation.mutate(
      { routeId, ecoAide: routeForm.assignedEcoAideId },
      {
        onSuccess: () => {
          applyTruckAssignment(routeId);
        },
      },
    );
  }

  function handleCreateRoute() {
    createRouteMutation.mutate(routeForm, {
      onSuccess: (createdRoute) => {
        applyEcoAideAssignment(createdRoute.id);
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
          applyEcoAideAssignment(selectedRoute.id);
        },
      },
    );
  }

  function handleSaveEcoAideAssignment() {
    if (!selectedRoute) {
      return;
    }

    assignEcoAideMutation.mutate(
      { routeId: selectedRoute.id, ecoAide: assignedEcoAide },
      {
        onSuccess: () => {
          refetch();
          closeModal();
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
        assignTruckMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreateModal}>+ Create Route</Button>
      </div>

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
                    No routes match the current filter.
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
                      onView={() => {
                        openDetails(route);
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

      {modalMode === "details" && selectedRoute && (
        <RouteDetailsModal route={selectedRoute} onClose={closeModal} />
      )}
    </div>
  );
}
