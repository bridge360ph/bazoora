import { useMemo, useState } from "react";
import { Button, StatCard } from "@bazoora/ui";
import {
  ECO_AIDE_OPTIONS,
  INITIAL_TRUCKS,
  ROUTE_OPTIONS,
} from "../fleet.data";
import type { Truck, TruckFormValue, TruckStatus, TruckStatusFilter } from "../fleet.types";

type ModalMode = "register" | "edit" | "assign" | null;

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

export function FleetManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>(INITIAL_TRUCKS);
  const [statusFilter, setStatusFilter] = useState<TruckStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
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
    <main className="flex-1 overflow-y-auto p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-gray-900">Fleet Management</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Manage garbage trucks, truck status, and truck assignments.
          </p>
        </div>

        <Button onClick={openRegisterModal}>+ Register Truck</Button>
      </section>

      <section className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Idle" value={idleCount} />
        <StatCard label="Under Maintenance" value={maintenanceCount} />
      </section>

      <section className="flex flex-wrap items-stretch">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as TruckStatusFilter);
          }}
          className="min-w-[170px] cursor-pointer border-0 bg-brand px-3 py-2.5 text-[13px] text-white"
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
          placeholder="Search truck by ID, plate no., model, or driver..."
          className="min-w-[240px] flex-1 border border-gray-300 px-3 py-2.5 text-[13px] outline-none"
        />
      </section>

      <section className="overflow-hidden rounded-b-[10px] border border-gray-200 bg-white">
        <div className="px-3.5 py-[18px] text-sm font-bold text-gray-900">Fleet List</div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-brand">
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
                  <th key={heading} className="whitespace-nowrap px-3.5 py-2.5 text-left text-xs font-bold text-white">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-7 text-center text-[13px] text-gray-400">
                    No trucks match the current filter.
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck) => (
                  <tr key={truck.id} className="border-b border-gray-200">
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.id}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.plateNumber}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.model}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.capacity}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">
                      <TruckStatusPill status={truck.status} />
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.assignedDriver}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{truck.registeredDate}</td>
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">
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

        <Pagination />
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
          onSave={saveTruckAssignment}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

interface TruckFormModalProps {
  title: string;
  formValue: TruckFormValue;
  setFormValue: React.Dispatch<React.SetStateAction<TruckFormValue>>;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

function TruckFormModal({
  title,
  formValue,
  setFormValue,
  saveLabel,
  onSave,
  onClose,
}: TruckFormModalProps) {
  function updateField<Key extends keyof TruckFormValue>(
    key: Key,
    value: TruckFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[560px] rounded-[14px] bg-white p-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h2 className="mb-5 text-lg font-extrabold text-gray-900">{title}</h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          <FormField label="Assigned Driver">
            <input
              value={formValue.assignedDriver}
              onChange={(event) => {
                updateField("assignedDriver", event.target.value);
              }}
              placeholder="e.g. Henry Correa"
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </FormField>

          <FormField label="Plate Number">
            <input
              value={formValue.plateNumber}
              onChange={(event) => {
                updateField("plateNumber", event.target.value);
              }}
              placeholder="e.g. GTM-5895"
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </FormField>

          <FormField label="Truck Model">
            <input
              value={formValue.model}
              onChange={(event) => {
                updateField("model", event.target.value);
              }}
              placeholder="e.g. Isuzu Elf"
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </FormField>

          <FormField label="Capacity (kg)">
            <input
              value={formValue.capacity}
              onChange={(event) => {
                updateField("capacity", event.target.value);
              }}
              placeholder="e.g. 7000"
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              type="number"
            />
          </FormField>

          <FormField label="Status">
            <select
              value={formValue.status}
              onChange={(event) => {
                updateField("status", event.target.value as TruckStatus);
              }}
              className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="Active">Active</option>
              <option value="Idle">Idle</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </FormField>
        </div>

        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={onSave}>{saveLabel}</Button>
          <Button variant="secondary" onClick={onClose}>
            × Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AssignTruckModalProps {
  truck: Truck;
  assignedRoute: string;
  setAssignedRoute: (route: string) => void;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function AssignTruckModal({
  truck,
  assignedRoute,
  setAssignedRoute,
  assignedEcoAide,
  setAssignedEcoAide,
  onSave,
  onClose,
}: AssignTruckModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[430px] rounded-[14px] bg-white p-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h2 className="mb-5 text-lg font-extrabold text-gray-900">Assign Truck</h2>

        <FormField label="Truck ID">
          <div className="grid grid-cols-2 gap-2">
            <input value={truck.id} disabled className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-2.5 py-2 text-[13px] text-gray-500" />
            <input value={truck.model} disabled className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-2.5 py-2 text-[13px] text-gray-500" />
          </div>
        </FormField>

        <FormField label="Assigned Route ID">
          <select
            value={assignedRoute}
            onChange={(event) => {
              setAssignedRoute(event.target.value);
            }}
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {ROUTE_OPTIONS.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Assigned Eco-Aide ID">
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

        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={onSave}>Save</Button>
          <Button variant="secondary" onClick={onClose}>
            × Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="mb-3.5 flex flex-col gap-1.5 text-[13px] font-semibold text-gray-700">
      {label}
      {children}
    </label>
  );
}

function TruckStatusPill({ status }: { status: TruckStatus }) {
  const statusClass =
    status === "Active"
      ? "bg-green-100 text-green-800"
      : status === "Idle"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-[3px] text-[11px] font-bold ${statusClass}`}
    >
      {status}
    </span>
  );
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-3.5 px-0 pb-[18px] pt-6">
      <button type="button" className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500">
        ‹
      </button>
      <button type="button" className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-0 bg-brand font-bold text-white">
        1
      </button>
      <button type="button" className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500">
        ›
      </button>
    </div>
  );
}
