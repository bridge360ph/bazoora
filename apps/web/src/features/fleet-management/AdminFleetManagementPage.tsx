import { useEffect, useMemo, useState } from "react";

import {
  Button,
  FilterByDropdown,
  PaginationControls,
  StatCard,
} from "@bazoora/ui";

import { ECO_AIDE_OPTIONS } from "./fleet.mockData";

import type {
  Driver,
  FleetRoute,
  Truck,
  TruckFormValue,
  TruckStatusFilter,
} from "./fleet.types";

import { TruckStatusPill } from "./components/TruckStatusPill";
import { TruckFormModal } from "./components/TruckFormModal";
import { AssignTruckModal } from "./components/AssignTruckModal";

type ModalMode =
  | "register"
  | "edit"
  | "assign"
  | null;

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

const API_URL = import.meta.env.VITE_API_URL;

type ApiTruck = {
  id: string;
  truckNumber?: string | null;
  plateNumber: string;
  model?: string | null;
  capacity?: string | null;
  status: string;
  assignedDriverId?: string | null;
  assignedDriver?: string | null;
  registeredDate?: string;
  plannedRoute?: unknown[];
};

type ApiDriversResponse = {
  success?: boolean;
  data?: Driver[];
};

export function AdminFleetManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<FleetRoute[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<TruckStatusFilter>("All");

  const [searchValue, setSearchValue] = useState("");

  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [selectedTruck, setSelectedTruck] =
    useState<Truck | null>(null);

  /*
   * Assigned Driver textbox.
   * The user enters the driver's registered email.
   */
  const [assignedDriverName, setAssignedDriverName] =
    useState("");

  /*
   * Assigned Route.
   *
   * This stores the displayed route option,
   * for example:
   *
   * Route 001
   * Route 002
   */
  const [assignedRoute, setAssignedRoute] =
    useState("");

  const [assignedEcoAide, setAssignedEcoAide] =
    useState(ECO_AIDE_OPTIONS[0]);

  const [truckForm, setTruckForm] =
    useState<TruckFormValue>(
      emptyTruckForm,
    );

  // ============================
  // Fetch Trucks
  // ============================

  async function fetchTrucks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/trucks`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch trucks: ${response.status}`,
        );
      }

      const result = await response.json();

      const apiTrucks: ApiTruck[] =
        Array.isArray(result)
          ? result
          : Array.isArray(result.data)
            ? result.data
            : [];

      const formattedTrucks: Truck[] =
        apiTrucks.map((truck) => ({
          id: truck.id,

          plateNumber:
            truck.plateNumber,

          model:
            truck.model ||
            "Unspecified Model",

          capacity:
            truck.capacity ||
            "0 kg",

          status:
            truck.status ===
            "Under Maintenance"
              ? "Under Maintenance"
              : truck.status === "Active"
                ? "Active"
                : "Idle",

          assignedDriver:
            truck.assignedDriver ||
            "Unassigned",

          registeredDate:
            truck.registeredDate
              ? new Date(
                  truck.registeredDate,
                ).toLocaleDateString(
                  "en-GB",
                )
              : "—",
        }));

      setTrucks(formattedTrucks);
    } catch (err) {
      console.error(
        "Failed to load trucks:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load trucks.",
      );

      setTrucks([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // Fetch Drivers
  // ============================

  async function fetchDrivers() {
    try {
      setLoadingDrivers(true);

      const response = await fetch(
        `${API_URL}/auth/drivers`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch drivers: ${response.status}`,
        );
      }

      const result =
        (await response.json()) as ApiDriversResponse;

      setDrivers(
        Array.isArray(result.data)
          ? result.data
          : [],
      );
    } catch (err) {
      console.error(
        "Failed to load drivers:",
        err,
      );

      setDrivers([]);

      window.alert(
        "Failed to load drivers. Please try again.",
      );
    } finally {
      setLoadingDrivers(false);
    }
  }

  // ============================
  // Fetch Routes
  // ============================

  async function fetchRoutes() {
    try {
      setLoadingRoutes(true);

      const response = await fetch(
        `${API_URL}/routes`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch routes: ${response.status}`,
        );
      }

      const result = await response.json();

      setRoutes(
        Array.isArray(result.data)
          ? result.data
          : [],
      );
    } catch (err) {
      console.error(
        "Failed to load routes:",
        err,
      );

      setRoutes([]);

      window.alert(
        "Failed to load routes. Please try again.",
      );
    } finally {
      setLoadingRoutes(false);
    }
  }

  useEffect(() => {
    void fetchTrucks();
    void fetchDrivers();
    void fetchRoutes();
  }, []);

  // ============================
  // Route Options
  // ============================

  const routeOptions = useMemo(() => {
    return routes.map(
      (route) =>
        `Route ${String(
          route.routeNumber,
        ).padStart(3, "0")}`,
    );
  }, [routes]);

  // ============================
  // Filtering
  // ============================

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      const matchesStatus =
        statusFilter === "All" ||
        truck.status === statusFilter;

      const normalizedSearch =
        searchValue
          .trim()
          .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        truck.id
          .toLowerCase()
          .includes(normalizedSearch) ||
        truck.plateNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        truck.model
          .toLowerCase()
          .includes(normalizedSearch) ||
        truck.assignedDriver
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    searchValue,
    statusFilter,
    trucks,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTrucks.length /
        TRUCKS_PAGE_SIZE,
    ),
  );

  const paginatedTrucks =
    filteredTrucks.slice(
      (page - 1) *
        TRUCKS_PAGE_SIZE,
      page *
        TRUCKS_PAGE_SIZE,
    );

  // ============================
  // Statistics
  // ============================

  const activeCount =
    trucks.filter(
      (truck) =>
        truck.status === "Active",
    ).length;

  const idleCount =
    trucks.filter(
      (truck) =>
        truck.status === "Idle",
    ).length;

  const maintenanceCount =
    trucks.filter(
      (truck) =>
        truck.status ===
        "Under Maintenance",
    ).length;

  // ============================
  // Modal Controls
  // ============================

  function openRegisterModal() {
    setTruckForm(
      emptyTruckForm,
    );

    setSelectedTruck(null);

    setModalMode("register");
  }

  function openEditModal(
    truck: Truck,
  ) {
    setSelectedTruck(truck);

    setTruckForm({
      plateNumber:
        truck.plateNumber,

      model:
        truck.model,

      capacity:
        truck.capacity.replace(
          / kg$/,
          "",
        ),

      status:
        truck.status,

      assignedDriver:
        truck.assignedDriver ===
        "Unassigned"
          ? ""
          : truck.assignedDriver,
    });

    setModalMode("edit");
  }

  function openAssignModal(
    truck: Truck,
  ) {
    setSelectedTruck(truck);

    /*
     * Keep the currently assigned driver
     * in the textbox.
     */
    setAssignedDriverName(
      truck.assignedDriver ===
        "Unassigned"
        ? ""
        : truck.assignedDriver,
    );

    /*
     * Reset route selection.
     *
     * The route list comes directly from
     * the database.
     */
    setAssignedRoute(
      routeOptions[0] ?? "",
    );

    setAssignedEcoAide(
      ECO_AIDE_OPTIONS[0],
    );

    setModalMode("assign");

    /*
     * Refresh driver and route lists
     * whenever the Assign modal opens.
     */
    void fetchDrivers();
    void fetchRoutes();
  }

  function closeModal() {
    setSelectedTruck(null);

    setAssignedDriverName("");

    setAssignedRoute("");

    setModalMode(null);
  }

  // ============================
  // Register Truck
  // ============================

  async function registerTruck() {
    try {
      setError("");

      const response =
        await fetch(
          `${API_URL}/trucks`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              plateNumber:
                truckForm.plateNumber.trim() ||
                "NEW-0000",

              model:
                truckForm.model.trim() ||
                "Unspecified Model",

              capacity:
                truckForm.capacity.trim() ||
                "0 kg",

              status:
                truckForm.status,
            }),
          },
        );

      if (!response.ok) {
        const result =
          await response.json();

        throw new Error(
          result?.message ||
            `Failed to register truck: ${response.status}`,
        );
      }

      await fetchTrucks();

      closeModal();
    } catch (err) {
      console.error(
        "Failed to register truck:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to register truck.",
      );
    }
  }

  // ============================
  // Edit Truck
  // ============================

  async function saveEditedTruck() {
    if (!selectedTruck) {
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `${API_URL}/trucks/${selectedTruck.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              plateNumber:
                truckForm.plateNumber.trim(),

              model:
                truckForm.model.trim(),

              capacity:
                truckForm.capacity.trim(),

              status:
                truckForm.status,
            }),
          },
        );

      if (!response.ok) {
        const result =
          await response.json();

        throw new Error(
          result?.message ||
            `Failed to update truck: ${response.status}`,
        );
      }

      await fetchTrucks();

      closeModal();
    } catch (err) {
      console.error(
        "Failed to update truck:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update truck.",
      );
    }
  }

  // ============================
  // Assign / Unassign Driver + Route
  // ============================

  async function saveTruckAssignment() {
    if (!selectedTruck) {
      return;
    }

    const driverInput =
      assignedDriverName.trim();

    // ============================
    // Find selected driver
    // ============================

    let selectedDriver:
      | Driver
      | undefined;

    if (driverInput) {
      selectedDriver =
        drivers.find(
          (driver) =>
            driver.email.toLowerCase() ===
            driverInput.toLowerCase(),
        );

      if (!selectedDriver) {
        window.alert(
          `Driver not found.

Please enter one of these registered driver emails:

${drivers
  .map(
    (driver) =>
      driver.email,
  )
  .join("\n")}`,
        );

        return;
      }

      /*
       * Prevent assigning a driver who
       * already belongs to another truck.
       */
      if (
        selectedDriver.assignedTruck &&
        selectedDriver.assignedTruck.id !==
          selectedTruck.id
      ) {
        window.alert(
          `This driver is already assigned to truck ${selectedDriver.assignedTruck.plateNumber}.`,
        );

        return;
      }
    }

    // ============================
    // Find selected route
    // ============================

    const selectedRoute =
      routes.find(
        (route) =>
          `Route ${String(
            route.routeNumber,
          ).padStart(3, "0")}` ===
          assignedRoute,
      );

    if (
      assignedRoute &&
      !selectedRoute
    ) {
      window.alert(
        "The selected route could not be found. Please refresh the route list and try again.",
      );

      return;
    }

    /*
     * Prevent assigning a route that is
     * already assigned to another truck.
     */
    if (
      selectedRoute?.assignedTruckId &&
      selectedRoute.assignedTruckId !==
        selectedTruck.id
    ) {
      window.alert(
        "This route is already assigned to another truck.",
      );

      return;
    }

    try {
      setError("");

      // ============================
      // Save Driver Assignment
      // ============================

      const truckResponse =
        await fetch(
          `${API_URL}/trucks/${selectedTruck.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              assignedDriverId:
                selectedDriver?.id ??
                null,
            }),
          },
        );

      const truckResult =
        await truckResponse.json();

      if (
        !truckResponse.ok ||
        truckResult.success === false
      ) {
        window.alert(
          truckResult?.message ||
            "Failed to assign driver.",
        );

        return;
      }

      // ============================
      // Save Route Assignment
      // ============================

      if (selectedRoute) {
        const routeResponse =
          await fetch(
            `${API_URL}/routes/${selectedRoute.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                assignedTruckId:
                  selectedTruck.id,
              }),
            },
          );

        const routeResult =
          await routeResponse.json();

        if (
          !routeResponse.ok ||
          routeResult.success === false
        ) {
          window.alert(
            routeResult?.message ||
              "Driver was assigned, but the route assignment failed.",
          );

          await fetchTrucks();
          await fetchDrivers();
          await fetchRoutes();

          return;
        }
      }

      // ============================
      // Refresh Data
      // ============================

      await fetchTrucks();
      await fetchDrivers();
      await fetchRoutes();

      window.alert(
        "Truck assignment saved successfully.",
      );

      closeModal();
    } catch (err) {
      console.error(
        "Failed to save truck assignment:",
        err,
      );

      window.alert(
        "Failed to save truck assignment. Please try again.",
      );
    }
  }

  // ============================
  // Unassign Driver
  // ============================

  async function unassignDriver(
    truck: Truck,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to unassign the driver from truck ${truck.plateNumber}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `${API_URL}/trucks/${truck.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              assignedDriverId: null,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        window.alert(
          result?.message ||
            "Failed to unassign driver.",
        );

        return;
      }

      await fetchTrucks();
      await fetchDrivers();

      window.alert(
        "Driver unassigned successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to unassign driver:",
        err,
      );

      window.alert(
        "Failed to unassign driver. Please try again.",
      );
    }
  }

  // ============================
  // Delete Truck
  // ============================

  async function deleteTruck(
    truck: Truck,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete truck ${truck.plateNumber}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `${API_URL}/trucks/${truck.id}`,
          {
            method: "DELETE",
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 409
        ) {
          window.alert(
            result?.message ||
              "This truck cannot be deleted because it is currently assigned. Please unassign the driver or route first.",
          );
        } else {
          window.alert(
            result?.message ||
              "Failed to delete truck.",
          );
        }

        return;
      }

      setTrucks(
        (currentTrucks) =>
          currentTrucks.filter(
            (currentTruck) =>
              currentTruck.id !==
              truck.id,
          ),
      );

      setPage(
        (currentPage) =>
          Math.min(
            currentPage,
            Math.max(
              1,
              Math.ceil(
                (filteredTrucks.length - 1) /
                  TRUCKS_PAGE_SIZE,
              ),
            ),
          ),
      );

      await fetchDrivers();
      await fetchRoutes();

      window.alert(
        "Truck deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to delete truck:",
        err,
      );

      window.alert(
        "Failed to delete truck. Please try again.",
      );
    }
  }

  return (
    <div className="p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-gray-900">
            Fleet Management
          </h1>

          <p className="mt-[6px] text-[13px] text-gray-500">
            Manage garbage trucks,
            truck status, and truck
            assignments.
          </p>
        </div>

        <Button
          onClick={
            openRegisterModal
          }
        >
          + Register Truck
        </Button>
      </section>

      <section className="mb-4 grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <StatCard
          label="Active"
          value={activeCount}
        />

        <StatCard
          label="Idle"
          value={idleCount}
        />

        <StatCard
          label="Under Maintenance"
          value={
            maintenanceCount
          }
        />
      </section>

      <section className="flex flex-wrap items-stretch">
        <FilterByDropdown
          label="Filter by Status"
          value={statusFilter}
          options={statusFilters}
          allValue="All"
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />

        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(
              event.target.value,
            );
            setPage(1);
          }}
          placeholder="Search truck by ID, plate no., model, or driver..."
          className="min-w-[240px] flex-1 border border-gray-300 px-3 py-[10px] text-[13px] outline-none"
        />
      </section>

      <section className="overflow-hidden rounded-b-[10px] border border-gray-200 bg-white">
        <div className="px-[14px] py-[18px] text-[14px] font-bold text-gray-900">
          Fleet List
        </div>

        {loading ? (
          <div className="p-7 text-center text-[13px] text-gray-400">
            Loading trucks...
          </div>
        ) : error ? (
          <div className="p-7 text-center text-[13px] text-red-500">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full border-collapse">
              <thead>
                <tr className="bg-[#145c38]">
                  {[
                    "Truck ID",
                    "Plate No.",
                    "Model",
                    "Capacity",
                    "Truck Status",
                    "Assigned Driver",
                    "Registered",
                    "Actions",
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-[14px] py-[10px] text-left text-[12px] font-bold text-white"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {paginatedTrucks.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-7 text-center text-[13px] text-gray-400"
                    >
                      No trucks match
                      the current
                      filter.
                    </td>
                  </tr>
                ) : (
                  paginatedTrucks.map(
                    (truck) => (
                      <tr
                        key={
                          truck.id
                        }
                        className="border-b border-gray-200"
                      >
                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {truck.id}
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {
                            truck.plateNumber
                          }
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {truck.model}
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {
                            truck.capacity
                          }
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          <TruckStatusPill
                            status={
                              truck.status
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {
                            truck.assignedDriver
                          }
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          {
                            truck.registeredDate
                          }
                        </td>

                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                openEditModal(
                                  truck,
                                );
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                openAssignModal(
                                  truck,
                                );
                              }}
                            >
                              Assign
                            </Button>

                            {truck.assignedDriver !==
                              "Unassigned" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  void unassignDriver(
                                    truck,
                                  );
                                }}
                              >
                                Unassign Driver
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                void deleteTruck(
                                  truck,
                                );
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-0 pt-[10px] pb-[18px]">
          <PaginationControls
            page={page}
            totalPages={
              totalPages
            }
            onPrev={() =>
              setPage(
                (current) =>
                  Math.max(
                    1,
                    current - 1,
                  ),
              )
            }
            onNext={() =>
              setPage(
                (current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
              )
            }
          />
        </div>
      </section>

      {modalMode ===
        "register" && (
        <TruckFormModal
          title="Register Garbage Truck"
          formValue={
            truckForm
          }
          setFormValue={
            setTruckForm
          }
          saveLabel="Register"
          onSave={
            registerTruck
          }
          onClose={
            closeModal
          }
        />
      )}

      {modalMode === "edit" &&
        selectedTruck && (
          <TruckFormModal
            title="Edit Garbage Truck"
            formValue={
              truckForm
            }
            setFormValue={
              setTruckForm
            }
            saveLabel="Save"
            onSave={
              saveEditedTruck
            }
            onClose={
              closeModal
            }
          />
        )}

      {modalMode === "assign" &&
        selectedTruck && (
          <AssignTruckModal
            truck={
              selectedTruck
            }

            assignedDriverName={
              assignedDriverName
            }

            setAssignedDriverName={
              setAssignedDriverName
            }

            assignedRoute={
              assignedRoute
            }

            setAssignedRoute={
              setAssignedRoute
            }

            assignedEcoAide={
              assignedEcoAide
            }

            setAssignedEcoAide={
              setAssignedEcoAide
            }

            drivers={
              drivers
            }

            routeOptions={
              routeOptions
            }

            ecoAideOptions={
              ECO_AIDE_OPTIONS
            }

            onSave={
              saveTruckAssignment
            }

            onClose={
              closeModal
            }
          />
        )}
    </div>
  );
}

