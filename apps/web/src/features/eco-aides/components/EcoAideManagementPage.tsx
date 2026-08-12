import { useEffect, useMemo, useState } from "react";
import type { Route } from "@bazoora/shared";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button, StatCard } from "@bazoora/ui";
import {
  archiveEcoAide,
  createEcoAide,
  deactivateEcoAide,
  getEcoAides,
  suspendEcoAide,
  updateEcoAide,
  type ApiEcoAide,
} from "../api";
import { fetchRoutes } from "../../route-management/routeService";
import {
  assignRouteEcoAideRequest,
  fetchEcoAideUsers,
} from "../../route-assignment/routeAssignmentApi";
import { listTrucks } from "../../trucks/api";
import type { Truck } from "../../trucks/schemas";
import type {
  EcoAide,
  EcoAideManagementTab,
  EcoAideStatus,
  EcoAideStatusFilter,
} from "../ecoAides.types";

type ModalMode = "view" | "edit" | "create" | "suspend" | "deactivate" | "archive" | null;

const statusFilters: EcoAideStatusFilter[] = [
  "All",
  "Active",
  "On Route",
  "Off Duty",
];

function mapApiEcoAide(apiEcoAide: ApiEcoAide): EcoAide {
  const status: EcoAideStatus =
    apiEcoAide.status === "SUSPENDED"
      ? "Suspended"
      : apiEcoAide.status === "DEACTIVATED"
        ? "Deactivated"
        : apiEcoAide.availability === "ON_ROUTE"
          ? "On Route"
          : apiEcoAide.availability === "OFF_DUTY"
            ? "Off Duty"
            : "Active";

  return {
    id: apiEcoAide.ecoAideId,
    name: apiEcoAide.name,
    addedDate: new Date(apiEcoAide.createdAt).toLocaleDateString("en-PH"),
    status,
    contactNumber: apiEcoAide.phone ?? "",
    birthdate: apiEcoAide.birthdate ?? "",
    address: apiEcoAide.address ?? "",
    assignedRoute: apiEcoAide.assignedRoute
      ? `RT-${String(apiEcoAide.assignedRoute.routeNumber).padStart(3, "0")}`
      : "",
    assignedTruck:
      apiEcoAide.assignedRoute?.assignedTruck?.truckNumber ?? "",
    email: apiEcoAide.email,
  };
}


const emptyEcoAideForm: EcoAideFormValue = {
  name: "",
  status: "Active",
  contactNumber: "",
  birthdate: "",
  address: "",
  assignedRoute: "",
  assignedTruck: "",
  email: "",
  password: "",
};

export function EcoAideManagementPage() {
  const [activeTab, setActiveTab] = useState<EcoAideManagementTab>("all");
  const [ecoAides, setEcoAides] = useState<EcoAide[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [statusFilter, setStatusFilter] = useState<EcoAideStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [selectedEcoAide, setSelectedEcoAide] = useState<EcoAide | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formValue, setFormValue] =
    useState<EcoAideFormValue>(emptyEcoAideForm);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEcoAides() {
      try {
        const records = await getEcoAides();

        if (!cancelled) {
          setEcoAides(records.map(mapApiEcoAide));
        }
      } catch {
        if (!cancelled) {
          setEcoAides([]);
        }
      }
    }

    async function loadRoutes() {
      try {
        const records = await fetchRoutes();

        if (!cancelled) {
          setRoutes(records);
        }
      } catch {
        if (!cancelled) {
          setRoutes([]);
        }
      }
    }

    async function loadTrucks() {
      try {
        const records = await listTrucks();

        if (!cancelled) {
          setTrucks(records);
        }
      } catch {
        if (!cancelled) {
          setTrucks([]);
        }
      }
    }

    void loadEcoAides();
    void loadRoutes();
    void loadTrucks();

    return () => {
      cancelled = true;
    };
  }, []);


  const filteredEcoAides = useMemo(() => {
    return ecoAides.filter((ecoAide) => {
      const matchesStatus =
        statusFilter === "All" ||
        ecoAide.status === statusFilter ||
        false;

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ecoAide.name.toLowerCase().includes(normalizedSearch) ||
        ecoAide.id.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [ecoAides, searchValue, statusFilter]);

  const activeCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Active",
  ).length;

  const suspendedCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Suspended",
  ).length;

  const deactivatedCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Deactivated",
  ).length;

  function openViewProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setModalMode("view");
  }

  function openEditProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setFormValue({
      name: ecoAide.name,
      status: ecoAide.status,
      contactNumber: ecoAide.contactNumber,
      birthdate: ecoAide.birthdate,
      address: ecoAide.address,
      assignedRoute: ecoAide.assignedRoute,
      assignedTruck: ecoAide.assignedTruck,
      email: ecoAide.email,
          password: "",
    });
    setModalMode("edit");
  }

  function openCreateAccount() {
    setSelectedEcoAide(null);
    setFormValue(emptyEcoAideForm);
    setModalMode("create");
  }

  function openSuspendModal(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setReason("");
    setModalMode("suspend");
  }

  function openDeactivateModal(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setReason("");
    setModalMode("deactivate");
  }

  function openArchiveModal(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setModalMode("archive");
  }

  function closeModal() {
    setSelectedEcoAide(null);
    setModalMode(null);
    setReason("");
  }

  async function saveEditedEcoAide(
    validatedFormValue: EcoAideFormValue,
  ) {
    if (!selectedEcoAide) {
      return;
    }

    await updateEcoAide(selectedEcoAide.id, {
      name: validatedFormValue.name,
      phone: validatedFormValue.contactNumber,
      birthdate: validatedFormValue.birthdate,
      address: validatedFormValue.address,
      status:
        validatedFormValue.status === "Suspended"
          ? "SUSPENDED"
          : validatedFormValue.status === "Deactivated"
            ? "DEACTIVATED"
            : "ACTIVE",
      availability:
        validatedFormValue.status === "On Route"
          ? "ON_ROUTE"
          : validatedFormValue.status === "Off Duty"
            ? "OFF_DUTY"
            : "AVAILABLE",
    });

    const ecoAideUsers = await fetchEcoAideUsers();
    const currentUser = ecoAideUsers.find(
      (ecoAide) =>
        ecoAide.userNumber === selectedEcoAide.id,
    );

    const oldRoute = routes.find(
      (route) =>
        route.routeDisplayNumber === selectedEcoAide.assignedRoute,
    );

    const newRoute = routes.find(
      (route) =>
        route.routeDisplayNumber ===
        validatedFormValue.assignedRoute,
    );

    if (currentUser) {
      if (
        oldRoute &&
        oldRoute.id !== newRoute?.id
      ) {
        await assignRouteEcoAideRequest(
          oldRoute.id,
          null,
        );
      }

      if (
        newRoute &&
        newRoute.id !== oldRoute?.id
      ) {
        await assignRouteEcoAideRequest(
          newRoute.id,
          currentUser.id,
        );
      }
    }

    const refreshedEcoAides = await getEcoAides();
    setEcoAides(refreshedEcoAides.map(mapApiEcoAide));

    closeModal();
  }

  async function createEcoAideAccount(
    validatedFormValue: EcoAideFormValue,
  ) {
    const created = await createEcoAide({
      name: validatedFormValue.name,
      email: validatedFormValue.email,
      password: validatedFormValue.password,
      phone: validatedFormValue.contactNumber,
      birthdate: validatedFormValue.birthdate,
      address: validatedFormValue.address,
      status: "ACTIVE",
      availability:
        validatedFormValue.status === "On Route"
          ? "ON_ROUTE"
          : validatedFormValue.status === "Off Duty"
            ? "OFF_DUTY"
            : "AVAILABLE",
    });

    const selectedRoute = routes.find(
      (route) =>
        route.routeDisplayNumber ===
        validatedFormValue.assignedRoute,
    );

    if (selectedRoute) {
      const ecoAideUsers = await fetchEcoAideUsers();

      const createdUser = ecoAideUsers.find(
        (ecoAide) =>
          ecoAide.userNumber === created.ecoAideId,
      );

      if (!createdUser) {
        throw new Error(
          "Created Eco-Aide could not be resolved for route assignment.",
        );
      }

      await assignRouteEcoAideRequest(
        selectedRoute.id,
        createdUser.id,
      );
    }

    const refreshedEcoAides = await getEcoAides();
    setEcoAides(refreshedEcoAides.map(mapApiEcoAide));

    closeModal();
  }

  async function confirmArchive() {
    if (!selectedEcoAide) {
      return;
    }

    await archiveEcoAide(selectedEcoAide.id);

    const refreshedEcoAides = await getEcoAides();
    setEcoAides(refreshedEcoAides.map(mapApiEcoAide));

    closeModal();
  }

  async function confirmStatusChange(
    status: "Suspended" | "Deactivated",
  ) {
    if (!selectedEcoAide) {
      return;
    }

    if (status === "Suspended") {
      await suspendEcoAide(selectedEcoAide.id);
    } else {
      await deactivateEcoAide(selectedEcoAide.id);
    }

    const refreshedEcoAides = await getEcoAides();
    setEcoAides(refreshedEcoAides.map(mapApiEcoAide));

    closeModal();
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2 border-b border-gray-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSearchValue("");
            }}
            className={`cursor-pointer border-0 bg-transparent px-0 py-2 text-[13px] text-gray-900 ${activeTab === "all" ? "border-b-2 border-gray-900 font-bold" : "font-medium"}`}
          >
            All Eco-Aides ({ecoAides.length})
          </button>


        </div>

        <Button onClick={openCreateAccount}>+ Add Eco-Aide</Button>
      </section>

      <section className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <StatCard label="Total Eco-Aides" value={ecoAides.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Suspended" value={suspendedCount} />
        <StatCard label="Deactivated" value={deactivatedCount} />
      </section>

      <section className="mb-0 flex flex-wrap items-stretch">
        {activeTab === "all" ? (
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as EcoAideStatusFilter);
            }}
            className="min-w-[150px] cursor-pointer border-0 bg-brand px-3 py-2.5 text-[13px] text-white"
          >
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "Filter by Status" : status}
              </option>
            ))}
          </select>
        ) : (
          <button type="button" className="min-w-[150px] cursor-pointer border-0 bg-brand px-3 py-2.5 text-[13px] text-white">
            Filter by Date
          </button>
        )}

        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
          }}
          placeholder={
            activeTab === "all"
              ? "Search Eco-Aide by name or ID..."
              : "Search approval request by name or date..."
          }
          className="min-w-[240px] flex-1 border border-gray-300 px-3 py-2.5 text-[13px] outline-none"
        />
      </section>

      <AllEcoAidesTable
          ecoAides={filteredEcoAides}
          onViewProfile={openViewProfile}
          onEdit={openEditProfile}
          onSuspend={openSuspendModal}
          onDeactivate={openDeactivateModal}
          onArchive={openArchiveModal}
        />

      {modalMode === "view" && selectedEcoAide && (
        <ViewProfileModal
          ecoAide={selectedEcoAide}
          onEdit={() => {
            openEditProfile(selectedEcoAide);
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === "edit" && (
        <EditEcoAideModal
          mode="edit"
          title="Edit Eco-Aide Profile"
          formValue={formValue}
          setFormValue={setFormValue}
          routes={routes}
          trucks={trucks}
          onSave={saveEditedEcoAide}
          onClose={closeModal}
        />
      )}

      {modalMode === "create" && (
        <EditEcoAideModal
          mode="create"
          title="Create Eco-Aide Account"
          formValue={formValue}
          setFormValue={setFormValue}
          routes={routes}
          trucks={trucks}
          onSave={createEcoAideAccount}
          onClose={closeModal}
          saveLabel="Create"
        />
      )}

      {modalMode === "suspend" && selectedEcoAide && (
        <ConfirmActionModal
          title="Suspend Eco-Aide"
          warning="This will immediately restrict the Eco-Aide's access to the platform."
          message={`Are you sure you want to suspend ${selectedEcoAide.name}?`}
          reasonLabel="Reason for suspension"
          reason={reason}
          setReason={setReason}
          confirmLabel="Confirm"
          onConfirm={() => {
            confirmStatusChange("Suspended");
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === "deactivate" && selectedEcoAide && (
        <ConfirmActionModal
          title="Deactivate Eco-Aide"
          warning="This will immediately restrict the Eco-Aide's access to the platform."
          message={`Are you sure you want to deactivate ${selectedEcoAide.name}?`}
          reasonLabel="Reason for deactivation"
          reason={reason}
          setReason={setReason}
          confirmLabel="Confirm"
          onConfirm={() => {
            confirmStatusChange("Deactivated");
          }}
          onClose={closeModal}
        />
      )}
      {modalMode === "archive" && selectedEcoAide && (
        <ConfirmActionModal
          title="Archive Eco-Aide"
          warning="This will remove the Eco-Aide from the active management list."
          message={`Are you sure you want to archive ${selectedEcoAide.name}?`}
          reasonLabel="Reason for archiving"
          reason={reason}
          setReason={setReason}
          confirmLabel="Archive"
          onConfirm={() => {
            void confirmArchive();
          }}
          onClose={closeModal}
        />
      )}

    </main>
  );
}

interface AllEcoAidesTableProps {
  ecoAides: EcoAide[];
  onViewProfile: (ecoAide: EcoAide) => void;
  onEdit: (ecoAide: EcoAide) => void;
  onSuspend: (ecoAide: EcoAide) => void;
  onDeactivate: (ecoAide: EcoAide) => void;
  onArchive: (ecoAide: EcoAide) => void;
}

function AllEcoAidesTable({
  ecoAides,
  onViewProfile,
  onEdit,
  onSuspend,
  onDeactivate,
  onArchive,
}: AllEcoAidesTableProps) {
  return (
    <section className="overflow-hidden rounded-b-[10px] border border-gray-200 bg-white">
      <div className="px-3.5 py-[18px] text-sm font-bold text-gray-900">Eco-Aides</div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-brand">
              {[
                "Eco-Aide ID â†“",
                "Eco-Aide Name",
                "Added",
                "Status",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3.5 py-2.5 text-left text-xs font-bold text-white">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ecoAides.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-7 text-center text-[13px] text-gray-400">
                  No Eco-Aides found.
                </td>
              </tr>
            ) : (
              ecoAides.map((ecoAide) => (
                <tr key={ecoAide.id} className="border-b border-gray-200">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{ecoAide.id}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{ecoAide.name}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{ecoAide.addedDate}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">
                    <StatusPill status={ecoAide.status} />
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-[10px] border-0 bg-gray-500 px-2.5 py-[3px] text-xs text-white hover:bg-gray-600"
                        onClick={() => {
                          onViewProfile(ecoAide);
                        }}
                      >
                        View Profile
                      </button>

                      <ActionMenu
                        ecoAide={ecoAide}
                        onEdit={onEdit}
                        onSuspend={onSuspend}
                        onDeactivate={onDeactivate}
                        onArchive={onArchive}
                      />
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
  );
}

interface ActionMenuProps {
  ecoAide: EcoAide;
  onEdit: (ecoAide: EcoAide) => void;
  onSuspend: (ecoAide: EcoAide) => void;
  onDeactivate: (ecoAide: EcoAide) => void;
  onArchive: (ecoAide: EcoAide) => void;
}

function ActionMenu({
  ecoAide,
  onEdit,
  onSuspend,
  onDeactivate,
  onArchive,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((currentValue) => !currentValue);
        }}
        className="cursor-pointer border-0 bg-transparent text-sm font-extrabold text-gray-900"
      >
        ...
      </button>

          <button
            type="button"
            className="w-full cursor-pointer border-0 bg-transparent px-3 py-1.5 text-left text-[13px] hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onArchive(ecoAide);
            }}
          >
            Archive
          </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 min-w-[100px] border border-gray-200 bg-white py-1.5 shadow-lg">
          <button
            type="button"
            className="w-full cursor-pointer border-0 bg-transparent px-3 py-1.5 text-left text-[13px] hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onEdit(ecoAide);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            className="w-full cursor-pointer border-0 bg-transparent px-3 py-1.5 text-left text-[13px] hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onSuspend(ecoAide);
            }}
          >
            Suspend
          </button>

          <button
            type="button"
            className="w-full cursor-pointer border-0 bg-transparent px-3 py-1.5 text-left text-[13px] hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onDeactivate(ecoAide);
            }}
          >
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
}

interface ViewProfileModalProps {
  ecoAide: EcoAide;
  onEdit: () => void;
  onClose: () => void;
}

function ViewProfileModal({ ecoAide, onEdit, onClose }: ViewProfileModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[570px] rounded-[10px] bg-white p-7">
        <h2 className="mb-[18px] text-[22px] font-extrabold text-neutral-950">View profile - {ecoAide.name}</h2>

        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-black text-[32px]">EA</div>

          <div className="flex-1">
            <div className="text-base font-extrabold">{ecoAide.name}</div>
            <div className="text-[13px]">{ecoAide.id}</div>
          </div>

          <StatusPill status={ecoAide.status} />
        </div>

        <div className="my-4 border-t border-gray-300" />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          <InfoBlock label="Contact number" value={ecoAide.contactNumber} />
          <InfoBlock label="Birthdate" value={ecoAide.birthdate} />
          <InfoBlock label="Assigned Route" value={ecoAide.assignedRoute} />
          <InfoBlock label="Address" value={ecoAide.address} />
          <InfoBlock label="Assigned Truck" value={ecoAide.assignedTruck} />
        </div>

        <div className="mt-3 font-semibold">
          Assignment history
        </div>



        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={onEdit}>Edit Profile</Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

type EcoAideFormValue = Omit<EcoAide, "id" | "addedDate"> & { password: string };

type EcoAideFormErrors = Partial<
  Record<keyof EcoAideFormValue, string>
>;

const ECO_AIDE_NAME_PATTERN = /^[\p{L} .'-]+$/u;
const PH_MOBILE_PATTERN = /^09\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ECO_AIDE_STATUSES: EcoAideStatus[] = [
  "Active",
  "On Route",
  "Off Duty",
  "Suspended",
  "Deactivated",
];

const CREATE_ECO_AIDE_STATUSES: EcoAideStatus[] = [
  "Active",
  "On Route",
  "Off Duty",
];

interface EditEcoAideModalProps {
  mode: "create" | "edit";
  title: string;
  formValue: EcoAideFormValue;
  setFormValue: Dispatch<
    SetStateAction<EcoAideFormValue>
  >;
  routes: Route[];
  trucks: Truck[];
  onSave: (validatedValue: EcoAideFormValue) => void;
  onClose: () => void;
  saveLabel?: string;
}

function EditEcoAideModal({
  mode,
  title,
  formValue,
  setFormValue,
  routes,
  trucks,
  onSave,
  onClose,
  saveLabel = "Save",
}: EditEcoAideModalProps) {
  const [errors, setErrors] =
    useState<EcoAideFormErrors>({});

  const isCreateMode = mode === "create";

  function updateField<Key extends keyof EcoAideFormValue>(
    key: Key,
    value: EcoAideFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));
  }

  function validateFieldValue(
    key: keyof EcoAideFormValue,
    value: EcoAideFormValue[keyof EcoAideFormValue],
  ): string | undefined {
    const stringValue =
      typeof value === "string" ? value.trim() : "";

    if (key === "name") {
      if (!stringValue) {
        return "Eco-Aide name is required.";
      }

      if (stringValue.length < 2) {
        return "Name must contain at least 2 characters.";
      }

      if (stringValue.length > 100) {
        return "Name must not exceed 100 characters.";
      }

      if (!ECO_AIDE_NAME_PATTERN.test(stringValue)) {
        return "Use letters, spaces, periods, hyphens, or apostrophes only.";
      }
    }

    if (key === "contactNumber") {
      if (!stringValue) {
        return "Contact number is required.";
      }

      if (!PH_MOBILE_PATTERN.test(stringValue)) {
        return "Enter exactly 11 digits starting with 09.";
      }
    }

    if (key === "birthdate") {
      if (!stringValue) {
        return "Birthdate is required.";
      }

      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        stringValue,
      );

      if (!match) {
        return "Enter a valid birthdate.";
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const birthdate = new Date(year, month - 1, day);

      const isValidDate =
        birthdate.getFullYear() === year &&
        birthdate.getMonth() === month - 1 &&
        birthdate.getDate() === day;

      if (!isValidDate) {
        return "Enter a valid birthdate.";
      }

      const today = new Date();

      if (birthdate > today) {
        return "Birthdate cannot be in the future.";
      }

      let age = today.getFullYear() - year;

      const birthdayHasNotOccurred =
        today.getMonth() < month - 1 ||
        (today.getMonth() === month - 1 &&
          today.getDate() < day);

      if (birthdayHasNotOccurred) {
        age -= 1;
      }

      if (age < 18) {
        return "Eco-Aide must be at least 18 years old.";
      }
    }

    if (key === "address") {
      if (!stringValue) {
        return "Address is required.";
      }

      if (stringValue.length < 5) {
        return "Address must contain at least 5 characters.";
      }

      if (stringValue.length > 255) {
        return "Address must not exceed 255 characters.";
      }
    }

    if (key === "assignedTruck" && !stringValue) {
      return "Select a truck assignment.";
    }

    if (key === "assignedRoute" && !stringValue) {
      return "Select a route assignment.";
    }

    if (
      key === "status" &&
      !(isCreateMode
        ? CREATE_ECO_AIDE_STATUSES
        : ALLOWED_ECO_AIDE_STATUSES
      ).includes(value as EcoAideStatus)
    ) {
      return "Select a valid Eco-Aide status.";
    }

    if (key === "password" && isCreateMode) {
      if (!stringValue) {
        return "Initial password is required.";
      }

      if (!/[a-z]/.test(stringValue)) {
        return "Password must contain at least one lowercase letter.";
      }

      if (!/[A-Z]/.test(stringValue)) {
        return "Password must contain at least one uppercase letter.";
      }

      if (!/\d/.test(stringValue)) {
        return "Password must contain at least one number.";
      }

      if (!/[^A-Za-z0-9]/.test(stringValue)) {
        return "Password must contain at least one special character.";
      }
    }

    if (key === "email" && isCreateMode) {
      if (!stringValue) {
        return "Email address is required.";
      }

      if (stringValue.length > 254) {
        return "Email address is too long.";
      }

      if (!EMAIL_PATTERN.test(stringValue)) {
        return "Enter a valid email address.";
      }
    }

    return undefined;
  }

  function validateOneField(
    key: keyof EcoAideFormValue,
  ) {
    const error = validateFieldValue(
      key,
      formValue[key],
    );

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: error,
    }));
  }

  function validateForm(
    value: EcoAideFormValue,
  ): EcoAideFormErrors {
    const fields: Array<keyof EcoAideFormValue> = [
      "name",
      "contactNumber",
      "birthdate",
      "address",
      "assignedTruck",
      "assignedRoute",
      "status",
    ];

    if (isCreateMode) {
      fields.push("email", "password");
    }

    const validationErrors: EcoAideFormErrors = {};

    for (const field of fields) {
      const error = validateFieldValue(
        field,
        value[field],
      );

      if (error) {
        validationErrors[field] = error;
      }
    }

    return validationErrors;
  }

  function handleSubmit() {
    const normalizedValue: EcoAideFormValue = {
      ...formValue,
      name: formValue.name
        .trim()
        .replace(/\s+/g, " "),
      contactNumber: formValue.contactNumber.trim(),
      birthdate: formValue.birthdate.trim(),
      address: formValue.address
        .trim()
        .replace(/\s+/g, " "),
      assignedTruck: formValue.assignedTruck.trim(),
      assignedRoute: formValue.assignedRoute.trim(),
      email: formValue.email.trim().toLowerCase(),
    };

    const validationErrors =
      validateForm(normalizedValue);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setFormValue(normalizedValue);
    onSave(normalizedValue);
  }

  const today = new Date();

  const latestAllowedBirthdate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  const birthdateMax = [
    latestAllowedBirthdate.getFullYear(),
    String(
      latestAllowedBirthdate.getMonth() + 1,
    ).padStart(2, "0"),
    String(latestAllowedBirthdate.getDate()).padStart(
      2,
      "0",
    ),
  ].join("-");

  function getInputClassName(
    field: keyof EcoAideFormValue,
  ) {
    return `box-border w-full rounded-md border px-2.5 py-2 text-[13px] outline-none placeholder:text-gray-400 ${
      errors[field]
        ? "border-red-500 focus:border-red-600"
        : "border-gray-300 focus:border-brand"
    }`;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-[10px] bg-white p-7">
        <h2 className="mb-[18px] text-[22px] font-extrabold text-neutral-950">
          {title}
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          <FormField
            label="Eco-Aide Name"
            required
            error={errors.name}
          >
            <input
              value={formValue.name}
              maxLength={100}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => {
                updateField("name", event.target.value);
              }}
              onBlur={() => {
                validateOneField("name");
              }}
              className={getInputClassName("name")}
            />
          </FormField>

          <FormField
            label="Contact Number"
            required
            error={errors.contactNumber}
          >
            <input
              type="tel"
              value={formValue.contactNumber}
              inputMode="numeric"
              maxLength={11}
              pattern="09[0-9]{9}"
              autoComplete="tel"
              placeholder="09123456789"
              aria-invalid={Boolean(
                errors.contactNumber,
              )}
              onChange={(event) => {
                const digitsOnly = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 11);

                updateField(
                  "contactNumber",
                  digitsOnly,
                );
              }}
              onBlur={() => {
                validateOneField("contactNumber");
              }}
              className={getInputClassName(
                "contactNumber",
              )}
            />
          </FormField>

          <FormField
            label="Birthdate"
            required
            error={errors.birthdate}
          >
            <input
              type="date"
              max={birthdateMax}
              value={formValue.birthdate}
              aria-invalid={Boolean(errors.birthdate)}
              onChange={(event) => {
                updateField(
                  "birthdate",
                  event.target.value,
                );
              }}
              onBlur={() => {
                validateOneField("birthdate");
              }}
              className={getInputClassName("birthdate")}
            />
          </FormField>

          <FormField
            label="Address"
            required
            error={errors.address}
          >
            <input
              value={formValue.address}
              maxLength={255}
              placeholder="123 Mabini St., Quezon City"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.address)}
              onChange={(event) => {
                updateField(
                  "address",
                  event.target.value,
                );
              }}
              onBlur={() => {
                validateOneField("address");
              }}
              className={getInputClassName("address")}
            />
          </FormField>

          <FormField
            label="Truck Assignment"
          >
            <input
              type="text"
              value={formValue.assignedTruck}
              readOnly
              placeholder="Derived from selected route"
              className={getInputClassName("assignedTruck")}
            />
          </FormField>

          <FormField
            label="Route Assignment"
            required
            error={errors.assignedRoute}
          >
            <select
              value={formValue.assignedRoute}
              aria-invalid={Boolean(
                errors.assignedRoute,
              )}
              onChange={(event) => {
                const selectedRoute = routes.find(
                  (route) =>
                    route.routeDisplayNumber === event.target.value,
                );

                const selectedTruck = selectedRoute?.assignedTruckId
                  ? trucks.find(
                      (truck) =>
                        truck.id === selectedRoute.assignedTruckId,
                    )
                  : undefined;

                updateField(
                  "assignedRoute",
                  event.target.value,
                );

                updateField(
                  "assignedTruck",
                  selectedTruck?.truckNumber ?? "",
                );
              }}
              onBlur={() => {
                validateOneField("assignedRoute");
              }}
              className={getInputClassName(
                "assignedRoute",
              )}
            >
              <option value="">Select route</option>
              {routes.map((route) => (
                <option
                  key={route.id}
                  value={route.routeDisplayNumber}
                >
                  {route.routeDisplayNumber} - {route.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Status"
            required
            error={errors.status}
          >
            <select
              value={formValue.status}
              aria-invalid={Boolean(errors.status)}
              onChange={(event) => {
                updateField(
                  "status",
                  event.target.value as EcoAideStatus,
                );
              }}
              onBlur={() => {
                validateOneField("status");
              }}
              className={getInputClassName("status")}
            >
              {(isCreateMode
                ? CREATE_ECO_AIDE_STATUSES
                : ALLOWED_ECO_AIDE_STATUSES
              ).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </FormField>

          {isCreateMode && (
            <FormField
              label="Email Address"
              required
              error={errors.email}
            >
              <input
                type="email"
                value={formValue.email}
                maxLength={254}
                placeholder="juan.delacruz@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => {
                  updateField(
                    "email",
                    event.target.value,
                  );
                }}
                onBlur={() => {
                  validateOneField("email");
                }}
                className={getInputClassName("email")}
              />
            </FormField>
          )}

          {isCreateMode && (
            <FormField
              label="Initial Password"
              required
              error={errors.password}
            >
              <input
                type="password"
                value={formValue.password}
                autoComplete="new-password"
                placeholder="Enter initial password"
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => {
                  updateField("password", event.target.value);
                }}
                onBlur={() => {
                  validateOneField("password");
                }}
                className={getInputClassName("password")}
              />
            </FormField>
          )}
        </div>

        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={handleSubmit}>
            {saveLabel}
          </Button>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmActionModalProps {
  title: string;
  warning: string;
  message: string;
  reasonLabel: string;
  reason: string;
  setReason: (reason: string) => void;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmActionModal({
  title,
  warning,
  message,
  reasonLabel,
  reason,
  setReason,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[390px] rounded-[10px] bg-white p-6">
        <h2 className="mb-[18px] text-[22px] font-extrabold text-neutral-950">{title}</h2>

        <div className="rounded-md border border-red-200 bg-rose-50 px-2.5 py-2 text-xs text-red-600">Info: {warning}</div>

        <p className="mt-[18px] text-sm">{message}</p>

        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
          {reasonLabel}
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            placeholder="Enter reason..."
            className="min-h-[70px] w-full resize-y rounded-md border border-gray-300 px-2.5 py-2 text-[13px] box-border"
          />
        </label>

        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={onConfirm}> {confirmLabel}</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}

function FormField({
  label,
  children,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
      <span>
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="ml-1 text-red-600"
          >
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span
          role="alert"
          className="text-xs font-normal text-red-600"
        >
          {error}
        </span>
      )}
    </label>
  );
}

interface InfoBlockProps {
  label: string;
  value: string;
}

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div>
      <div className="text-[13px] font-bold">{label}</div>
      <div className="text-[13px]">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: EcoAideStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-[3px] text-[11px] font-bold ${getStatusClassName(status)}`}
    >
      {status}
    </span>
  );
}

function Pagination() {
  return (
    <div className="flex items-center justify-center gap-3.5 pb-[18px] pt-[110px]">
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500"
      >
        ?
      </button>
      <button
        type="button"
        className="h-[34px] w-[34px] cursor-pointer rounded-[10px] border-0 bg-brand font-bold text-white"
      >
        1
      </button>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500"
      >
        ?
      </button>
    </div>
  );
}

function getStatusClassName(status: EcoAideStatus) {
  if (status === "Active") {
    return "bg-green-100 text-green-800";
  }

  if (status === "On Route") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "Off Duty") {
    return "bg-gray-100 text-gray-600";
  }

  if (status === "Suspended") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-200 text-gray-700";
}
