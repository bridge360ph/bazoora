import { useState, useMemo, useEffect } from "react";
import { Button, MapPreviewPlaceholder, PaginationControls, StatCard } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue, RouteStatusFilter } from "./route.types";
import { useRoutes } from "./hooks/useRoutes";
import { useCreateRoute } from "./hooks/useCreateRoute";
import { useUpdateRoute } from "./hooks/useUpdateRoute";
import { RouteFiltersBar } from "./components/RouteFiltersBar";
import { RouteCard } from "./components/RouteCard";
import { RouteFormModal } from "./components/RouteFormModal";
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
};

export function AdminRouteManagementPage() {
  const { data: routes, isLoading, isError, error, refetch } = useRoutes();
  const createRouteMutation = useCreateRoute();
  const updateRouteMutation = useUpdateRoute();

  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [routeForm, setRouteForm] = useState<RouteFormValue>(emptyRouteForm);
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
        // route.assignedEcoAideId.toLowerCase().includes(normalizedSearch) ||
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
    });
    setModalMode("edit");
  }

  function openAssignModal(route: Route) {
    setSelectedRoute(route);
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

  function handleCreateRoute() {
    createRouteMutation.mutate(routeForm, {
      onSuccess: () => {
        refetch();
        closeModal();
        setSuccessMessage("Route created successfully.");
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
          refetch();
          closeModal();
          setSuccessMessage("Route updated successfully.");
        },
      },
    );
  }

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
          formValue={routeForm}
          setFormValue={setRouteForm}
          onSave={handleCreateRoute}
          onClose={closeModal}
          isSubmitting={createRouteMutation.isPending}
          errorMessage={createRouteMutation.error?.message ?? null}
        />
      )}

      {modalMode === "edit" && selectedRoute && (
        <RouteFormModal
          mode="edit"
          route={selectedRoute}
          formValue={routeForm}
          setFormValue={setRouteForm}
          onSave={handleSaveEditedRoute}
          onClose={closeModal}
          isSubmitting={updateRouteMutation.isPending}
          errorMessage={updateRouteMutation.error?.message ?? null}
        />
      )}

      {modalMode === "details" && selectedRoute && (
        <RouteDetailsModal route={selectedRoute} onClose={closeModal} />
      )}
    </div>
  );
}
