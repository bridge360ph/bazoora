import { useEffect, useMemo, useState } from "react";
import type { Route } from "@bazoora/shared";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  CalendarDays,
  Phone,
  Plus,
  Route as RouteIcon,
  Truck as TruckIcon,
} from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  AdminEmptySlot,
  AdminSearchInput,
  BUTTON_CLASSES,
} from "@/components/admin/AdminControls";
import { AdminListCard, AdminMeta } from "@/components/admin/AdminListCard";
import { AdminModalShell, DetailField } from "@/components/admin/AdminModalShell";
import { AdminPagination, paginate } from "@/components/admin/AdminPagination";
import { PhilippineAddressFields } from "../../settings/components/PhilippineAddressFields";
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
  EcoAideStatus,
  EcoAideStatusFilter,
} from "../ecoAides.types";

type ModalMode = "view" | "edit" | "create" | "suspend" | "deactivate" | "archive" | null;

const statusFilters: EcoAideStatusFilter[] = [
  "All",
  "Active",
  "On Route",
  "Off Duty",
  "Suspended",
  "Deactivated",
];

const ECO_AIDES_PAGE_SIZE = 10;

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
  availability: "Available",
  contactNumber: "",
  birthdate: "",
  address: "",
  assignedRoute: "",
  assignedTruck: "",
  email: "",
  password: "",
};

export function EcoAideManagementPage() {
  const [ecoAides, setEcoAides] = useState<EcoAide[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [statusFilter, setStatusFilter] = useState<EcoAideStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ECO_AIDES_PAGE_SIZE);
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


  // Search applies before the status tabs, so each tab count shows what
  // that tab would list.
  const searchedEcoAides = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return ecoAides.filter(
      (ecoAide) =>
        normalizedSearch.length === 0 ||
        ecoAide.name.toLowerCase().includes(normalizedSearch) ||
        ecoAide.id.toLowerCase().includes(normalizedSearch),
    );
  }, [ecoAides, searchValue]);

  const filteredEcoAides = useMemo(
    () =>
      statusFilter === "All"
        ? searchedEcoAides
        : searchedEcoAides.filter((ecoAide) => ecoAide.status === statusFilter),
    [searchedEcoAides, statusFilter],
  );

  const statusCounts = Object.fromEntries(
    statusFilters.map((filter) => [
      filter,
      filter === "All"
        ? searchedEcoAides.length
        : searchedEcoAides.filter((ecoAide) => ecoAide.status === filter).length,
    ]),
  ) as Record<EcoAideStatusFilter, number>;

  const pagination = paginate(filteredEcoAides, page, rowsPerPage);

  function openViewProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setModalMode("view");
  }

  function openEditProfile(ecoAide: EcoAide) {
    setSelectedEcoAide(ecoAide);
    setFormValue({
      name: ecoAide.name,
      status:
        ecoAide.status === "Suspended"
          ? "Suspended"
          : ecoAide.status === "Deactivated"
            ? "Deactivated"
            : "Active",
      availability:
        ecoAide.status === "On Route"
          ? "On Route"
          : ecoAide.status === "Off Duty"
            ? "Off Duty"
            : "Available",
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
        validatedFormValue.availability === "On Route"
          ? "ON_ROUTE"
          : validatedFormValue.availability === "Off Duty"
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
      status:
        validatedFormValue.status === "Suspended"
          ? "SUSPENDED"
          : validatedFormValue.status === "Deactivated"
            ? "DEACTIVATED"
            : "ACTIVE",
      availability:
        validatedFormValue.availability === "On Route"
          ? "ON_ROUTE"
          : validatedFormValue.availability === "Off Duty"
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
    <AdminPage fill>
      <AdminPanel className="h-full min-h-0">
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
            <button type="button" onClick={openCreateAccount} className={BUTTON_CLASSES.primary}>
              <Plus className="h-3.5 w-3.5" />
              Add Eco-Aide
            </button>
          }
        />

        <div className="shrink-0 px-6 pt-5">
          <AdminSearchInput
            value={searchValue}
            onChange={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
            placeholder="Search Eco-Aide by name or ID"
          />
        </div>

        <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
          <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
            {pagination.pageItems.map((ecoAide) => (
              <AdminListCard
                key={ecoAide.id}
                accentClassName={statusAccentClass(ecoAide.status)}
                onOpen={() => openViewProfile(ecoAide)}
                aside={
                  <>
                    <StatusPill status={ecoAide.status} />
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button type="button" onClick={() => openEditProfile(ecoAide)} className={BUTTON_CLASSES.link}>
                        Edit
                      </button>
                      <button type="button" onClick={() => openSuspendModal(ecoAide)} className={BUTTON_CLASSES.link}>
                        Suspend
                      </button>
                      <button type="button" onClick={() => openDeactivateModal(ecoAide)} className={BUTTON_CLASSES.linkDanger}>
                        Deactivate
                      </button>
                      <button type="button" onClick={() => openArchiveModal(ecoAide)} className={BUTTON_CLASSES.linkDanger}>
                        Archive
                      </button>
                    </div>
                  </>
                }
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-bold text-gray-800">{ecoAide.name}</p>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">ID: {ecoAide.id}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
                  <AdminMeta icon={<Phone className="h-3 w-3 shrink-0 text-gray-400" />}>
                    {ecoAide.contactNumber || "No contact number"}
                  </AdminMeta>
                  <AdminMeta icon={<RouteIcon className="h-3 w-3 shrink-0 text-gray-400" />}>
                    {ecoAide.assignedRoute || "No route yet"}
                  </AdminMeta>
                  <AdminMeta icon={<TruckIcon className="h-3 w-3 shrink-0 text-gray-400" />}>
                    {ecoAide.assignedTruck || "No truck yet"}
                  </AdminMeta>
                  <AdminMeta icon={<CalendarDays className="h-3 w-3 shrink-0 text-gray-400" />}>
                    Added {ecoAide.addedDate}
                  </AdminMeta>
                </div>
              </AdminListCard>
            ))}

            {pagination.total === 0 ? (
              <AdminEmptySlot>
                {ecoAides.length === 0 ? "No Eco-Aides yet. Add one to get started." : "No Eco-Aides match the current filter."}
              </AdminEmptySlot>
            ) : (
              pagination.page === pagination.totalPages && <AdminEmptySlot>No more Eco-Aides</AdminEmptySlot>
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
        </div>
      </AdminPanel>

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

    </AdminPage>
  );
}

function statusAccentClass(status: EcoAideStatus): string {
  if (status === "Active") return "border-l-emerald-400";
  if (status === "On Route") return "border-l-amber-400";
  if (status === "Suspended") return "border-l-red-400";
  return "border-l-gray-300";
}

interface ViewProfileModalProps {
  ecoAide: EcoAide;
  onEdit: () => void;
  onClose: () => void;
}

function ViewProfileModal({ ecoAide, onEdit, onClose }: ViewProfileModalProps) {
  return (
    <AdminModalShell
      eyebrow="ECO-AIDE PROFILE"
      title={ecoAide.name}
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={BUTTON_CLASSES.ghost}>
            Close
          </button>
          <button type="button" onClick={onEdit} className={BUTTON_CLASSES.primary}>
            Edit Profile
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-border text-sm font-bold text-brand-dark">
          {ecoAide.name
            .split(/\s+/)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase() || "EA"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800">{ecoAide.name}</p>
          <p className="text-[11px] text-gray-500">ID: {ecoAide.id}</p>
        </div>
        <StatusPill status={ecoAide.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <DetailField label="CONTACT NUMBER">{ecoAide.contactNumber || "N/A"}</DetailField>
        <DetailField label="BIRTHDATE">{ecoAide.birthdate || "N/A"}</DetailField>
        <DetailField label="ASSIGNED ROUTE">{ecoAide.assignedRoute || "No route yet"}</DetailField>
        <DetailField label="ASSIGNED TRUCK">{ecoAide.assignedTruck || "No truck yet"}</DetailField>
        <div className="col-span-2">
          <DetailField label="ADDRESS">{ecoAide.address || "N/A"}</DetailField>
        </div>
      </div>
    </AdminModalShell>
  );
}

type EcoAideAccountStatus =
  | "Active"
  | "Suspended"
  | "Deactivated";

type EcoAideAvailability =
  | "Available"
  | "On Route"
  | "Off Duty";

type EcoAideFormValue = Omit<
  EcoAide,
  "id" | "addedDate" | "status"
> & {
  status: EcoAideAccountStatus;
  availability: EcoAideAvailability;
  password: string;
};

type EcoAideFormErrors = Partial<
  Record<keyof EcoAideFormValue, string>
>;

interface EcoAideAddressValue {
  streetAddress: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  postalCode: string;
}

interface EcoAideAddressErrors {
  streetAddress?: string;
  region?: string;
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
  postalCode?: string;
}

const ECO_AIDE_NAME_PATTERN = /^[\p{L} .'-]+$/u;
const PH_MOBILE_PATTERN = /^09\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ECO_AIDE_STATUSES: EcoAideAccountStatus[] = [
  "Active",
  "Suspended",
  "Deactivated",
];

const CREATE_ECO_AIDE_STATUSES: EcoAideAccountStatus[] = [
  "Active",
];

const ALLOWED_ECO_AIDE_AVAILABILITIES: EcoAideAvailability[] = [
  "Available",
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

  const [addressValue, setAddressValue] =
    useState<EcoAideAddressValue>({
      streetAddress: formValue.address,
      region: "",
      province: "",
      cityMunicipality: "",
      barangay: "",
      postalCode: "",
    });

  const [addressErrors, setAddressErrors] =
    useState<EcoAideAddressErrors>({});

  const isCreateMode = mode === "create";

  // Records created before the structured address fields existed store the
  // whole address as one string, so region/province/city/barangay/ZIP start
  // empty here with nothing to prefill them from. Requiring them anyway would
  // force a full address re-entry just to change an unrelated field, so they
  // stay optional until the editor actually starts filling them in.
  const [startedWithLegacyAddress] = useState(
    () => !isCreateMode && Boolean(formValue.address),
  );

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

    if (key === "assignedRoute" && !stringValue) {
      return "Select a route assignment.";
    }

    if (
      key === "status" &&
      !(isCreateMode
        ? CREATE_ECO_AIDE_STATUSES
        : ALLOWED_ECO_AIDE_STATUSES
      ).includes(value as EcoAideAccountStatus)
    ) {
      return "Select a valid Eco-Aide status.";
    }

    if (
      key === "availability" &&
      !ALLOWED_ECO_AIDE_AVAILABILITIES.includes(
        value as EcoAideAvailability,
      )
    ) {
      return "Select a valid Eco-Aide availability.";
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
      "assignedRoute",
      "status",
      "availability",
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
    const normalizedAddress: EcoAideAddressValue = {
      streetAddress: addressValue.streetAddress
        .trim()
        .replace(/\s+/g, " "),
      region: addressValue.region.trim().replace(/\s+/g, " "),
      province: addressValue.province
        .trim()
        .replace(/\s+/g, " "),
      cityMunicipality: addressValue.cityMunicipality
        .trim()
        .replace(/\s+/g, " "),
      barangay: addressValue.barangay
        .trim()
        .replace(/\s+/g, " "),
      postalCode: addressValue.postalCode.trim(),
    };

    // Untouched means the editor has not begun replacing the legacy address,
    // so the record keeps the address it already had. Filling in any one of
    // the structured fields opts back into validating all of them.
    const structuredAddressUntouched =
      startedWithLegacyAddress &&
      !normalizedAddress.region &&
      !normalizedAddress.province &&
      !normalizedAddress.cityMunicipality &&
      !normalizedAddress.barangay &&
      !normalizedAddress.postalCode;

    const nextAddressErrors: EcoAideAddressErrors =
      structuredAddressUntouched
        ? {
            streetAddress: normalizedAddress.streetAddress
              ? undefined
              : "House/unit number and street are required.",
          }
        : {
            streetAddress: normalizedAddress.streetAddress
              ? undefined
              : "House/unit number and street are required.",
            region: normalizedAddress.region
              ? undefined
              : "Region is required.",
            province: normalizedAddress.province
              ? undefined
              : "Province is required.",
            cityMunicipality: normalizedAddress.cityMunicipality
              ? undefined
              : "City/Municipality is required.",
            barangay: normalizedAddress.barangay
              ? undefined
              : "Barangay is required.",
            postalCode: !normalizedAddress.postalCode
              ? "ZIP/postal code is required."
              : /^\d{4}$/.test(normalizedAddress.postalCode)
                ? undefined
                : "Enter a valid 4-digit Philippine ZIP/postal code.",
          };

    const hasAddressErrors = Object.values(
      nextAddressErrors,
    ).some(Boolean);

    setAddressErrors(nextAddressErrors);

    const combinedAddress = [
      normalizedAddress.streetAddress,
      normalizedAddress.barangay,
      normalizedAddress.cityMunicipality,
      normalizedAddress.province,
      normalizedAddress.region,
      normalizedAddress.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    const addressToSave = structuredAddressUntouched
      ? formValue.address
      : combinedAddress;

    const normalizedValue: EcoAideFormValue = {
      ...formValue,
      name: formValue.name
        .trim()
        .replace(/\s+/g, " "),
      contactNumber: formValue.contactNumber.trim(),
      birthdate: formValue.birthdate.trim(),
      address: addressToSave,
      assignedTruck: formValue.assignedTruck.trim(),
      assignedRoute: formValue.assignedRoute.trim(),
      email: formValue.email.trim().toLowerCase(),
    };

    const validationErrors =
      validateForm(normalizedValue);

    setErrors(validationErrors);

    if (
      hasAddressErrors ||
      Object.keys(validationErrors).length > 0
    ) {
      return;
    }

    setAddressValue(normalizedAddress);
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
    return `h-9 w-full rounded-md border bg-white px-3 text-xs outline-none placeholder:text-gray-400 ${
      errors[field]
        ? "border-red-500 focus:border-red-600"
        : "border-gray-300 focus:border-brand"
    }`;
  }

  return (
    <AdminModalShell
      eyebrow={mode === "create" ? "NEW ECO-AIDE" : "EDIT ECO-AIDE"}
      title={title}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={BUTTON_CLASSES.ghost}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className={BUTTON_CLASSES.primary}>
            {saveLabel}
          </button>
        </>
      }
    >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          <FormField
            label="Eco-Aide Name"
            required
            error={errors.name}
          >
            <input
              value={formValue.name}
              maxLength={100}
              placeholder="Enter the Eco-Aide's full name"
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
              placeholder="Enter an 11-digit mobile number"
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
            label="House/Unit Number and Street"
            required
            error={
              addressErrors.streetAddress ??
              errors.address
            }
          >
            <input
              value={addressValue.streetAddress}
              maxLength={255}
              placeholder="Enter house/unit number and street"
              autoComplete="street-address"
              aria-invalid={Boolean(
                addressErrors.streetAddress ??
                  errors.address,
              )}
              onChange={(event) => {
                setAddressValue((currentValue) => ({
                  ...currentValue,
                  streetAddress: event.target.value,
                }));

                setAddressErrors((currentErrors) => ({
                  ...currentErrors,
                  streetAddress: undefined,
                }));

                setErrors((currentErrors) => ({
                  ...currentErrors,
                  address: undefined,
                }));
              }}
              className={getInputClassName("address")}
            />
          </FormField>

          <div className="col-span-full">
            <PhilippineAddressFields
              value={{
                region: addressValue.region,
                province: addressValue.province,
                cityMunicipality:
                  addressValue.cityMunicipality,
                barangay: addressValue.barangay,
                postalCode: addressValue.postalCode,
              }}
              errors={{
                region: addressErrors.region,
                province: addressErrors.province,
                cityMunicipality:
                  addressErrors.cityMunicipality,
                barangay: addressErrors.barangay,
              }}
              onChange={(address) => {
                setAddressValue((currentValue) => ({
                  ...currentValue,
                  region: address.region,
                  province: address.province,
                  cityMunicipality:
                    address.cityMunicipality,
                  barangay: address.barangay,
                  postalCode: address.postalCode,
                }));

                setAddressErrors((currentErrors) => ({
                  ...currentErrors,
                  region: undefined,
                  province: undefined,
                  cityMunicipality: undefined,
                  barangay: undefined,
                  postalCode: undefined,
                }));
              }}
            />
          </div>

          <FormField
            label="ZIP/Postal Code"
            required
            error={addressErrors.postalCode}
          >
            <input
              value={addressValue.postalCode}
              maxLength={4}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Enter a 4-digit ZIP code"
              aria-invalid={Boolean(
                addressErrors.postalCode,
              )}
              onChange={(event) => {
                const digitsOnly = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4);

                setAddressValue((currentValue) => ({
                  ...currentValue,
                  postalCode: digitsOnly,
                }));

                setAddressErrors((currentErrors) => ({
                  ...currentErrors,
                  postalCode: undefined,
                }));
              }}
              className={getInputClassName("address")}
            />
            <span className="text-xs font-normal text-gray-500">
              Auto-filled when available. Otherwise,
              enter the correct 4-digit ZIP code.
            </span>
          </FormField>

          <FormField
            label="Truck Assignment"
          >
            <input
              type="text"
              value={formValue.assignedTruck}
              readOnly
              placeholder="No truck assigned to selected route"
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
                  event.target.value as EcoAideAccountStatus,
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

          <FormField
            label="Availability"
            required
            error={errors.availability}
          >
            <select
              value={formValue.availability}
              aria-invalid={Boolean(errors.availability)}
              onChange={(event) => {
                updateField(
                  "availability",
                  event.target.value as EcoAideAvailability,
                );
              }}
              onBlur={() => {
                validateOneField("availability");
              }}
              className={getInputClassName("availability")}
            >
              {ALLOWED_ECO_AIDE_AVAILABILITIES.map(
                (availability) => (
                  <option
                    key={availability}
                    value={availability}
                  >
                    {availability}
                  </option>
                ),
              )}
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
                placeholder="Enter the Eco-Aide's email address"
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
    </AdminModalShell>
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
    <AdminModalShell
      eyebrow="ECO-AIDE ACCOUNT"
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BUTTON_CLASSES.ghost}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={BUTTON_CLASSES.danger}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{warning}</p>

      <p className="mt-4 text-sm text-gray-700">{message}</p>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          {reasonLabel}
        </span>
        <textarea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
          placeholder="Enter reason..."
          className="min-h-20 w-full resize-y rounded-md border border-surface-border px-3 py-2 text-xs text-gray-800 outline-none focus:border-brand-secondary"
        />
      </label>
    </AdminModalShell>
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
    <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700 [&>span:first-child]:text-[10px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-wider [&>span:first-child]:text-gray-400 [&>span:first-child]:uppercase">
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

function StatusPill({ status }: { status: EcoAideStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getStatusClassName(status)}`}
    >
      {status.toUpperCase()}
    </span>
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
