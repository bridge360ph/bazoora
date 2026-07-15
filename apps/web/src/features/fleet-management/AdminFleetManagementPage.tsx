import { useMemo, useState } from "react";
import { Button, FilterByDropdown, PaginationControls, StatCard } from "@bazoora/ui";
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
