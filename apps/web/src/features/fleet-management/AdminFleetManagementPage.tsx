import { useEffect, useMemo, useState } from "react";
import { Button, FilterByDropdown, PaginationControls, StatCard } from "@bazoora/ui";
import type {
  FleetAssignmentOption,
  Truck,
  TruckFormValue,
  TruckStatusFilter,
} from "./fleet.types";
import {
  createTruck,
  fetchFleetAssignmentOptions,
  fetchTrucks,
  updateTruck,
  updateTruckAssignment,
} from "./fleet.api";
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
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [statusFilter, setStatusFilter] = useState<TruckStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
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
      assignedDriverId: truck.assignedDriverId ?? "",
    });
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
    setSelectedTruck(null);
    setModalMode(null);
  }

  async function registerTruck() {
    try {
      setRequestError("");

      const createdTruck = await createTruck(truckForm);
      setTrucks((currentTrucks) => [createdTruck, ...currentTrucks]);
      closeModal();
    } catch (error) {
      setRequestError(
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
      setRequestError("");

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
      setRequestError(
        error instanceof Error
          ? error.message
          : "The truck could not be updated.",
      );
    }
  }

  async function saveTruckAssignment() {
    if (!selectedTruck || !assignedRoute || !assignedEcoAide) {
      return;
    }

    try {
      setRequestError("");

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
      setRequestError(
        error instanceof Error
          ? error.message
          : "The truck assignment could not be saved.",
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
            Manage garbage trucks, truck status, and truck assignments.
          </p>
        </div>

        <Button onClick={openRegisterModal}>+ Register Truck</Button>
      </section>

      {requestError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {requestError}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Loading fleet records...
        </div>
      )}

      <section className="mb-4 grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Idle" value={idleCount} />
        <StatCard label="Under Maintenance" value={maintenanceCount} />
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
            setSearchValue(event.target.value);
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
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-[14px] py-[10px] text-left text-[12px] font-bold text-white"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedTrucks.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-7 text-center text-[13px] text-gray-400"
                  >
                    No trucks match the current filter.
                  </td>
                </tr>
              ) : (
                paginatedTrucks.map((truck) => (
                  <tr key={truck.id} className="border-b border-gray-200">
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.id}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.plateNumber}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.model}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.capacity}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      <TruckStatusPill status={truck.status} />
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.assignedDriver}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      {truck.registeredDate}
                    </td>
                    <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-gray-900">
                      <div className="flex flex-wrap items-center gap-2">
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

        <div className="px-0 pt-[10px] pb-[18px]">
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
          driverOptions={driverOptions}
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
          routeOptions={routeOptions}
          ecoAideOptions={ecoAideOptions}
          onSave={saveTruckAssignment}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

