import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button, StatCard } from "@bazoora/ui";
import {
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_ECO_AIDES,
} from "../ecoAides.data";
import type {
  EcoAide,
  EcoAideApprovalRequest,
  EcoAideManagementTab,
  EcoAideStatus,
  EcoAideStatusFilter,
} from "../ecoAides.types";

type ModalMode = "view" | "edit" | "create" | "suspend" | "deactivate" | null;

const statusFilters: EcoAideStatusFilter[] = [
  "All",
  "Active",
  "On Route",
  "Off Duty",
];

const emptyEcoAideForm: Omit<EcoAide, "id" | "addedDate"> = {
  name: "",
  status: "Active",
  contactNumber: "",
  birthdate: "",
  address: "",
  assignedRoute: "",
  assignedTruck: "",
  totalRoutes: 0,
  completionRate: "0%",
  missedAssignment: 0,
  email: "",
};

export function EcoAideManagementPage() {
  const [activeTab, setActiveTab] = useState<EcoAideManagementTab>("all");
  const [ecoAides, setEcoAides] = useState<EcoAide[]>(INITIAL_ECO_AIDES);
  const [approvalRequests, setApprovalRequests] = useState<
    EcoAideApprovalRequest[]
  >(INITIAL_APPROVAL_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<EcoAideStatusFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [selectedEcoAide, setSelectedEcoAide] = useState<EcoAide | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formValue, setFormValue] =
    useState<Omit<EcoAide, "id" | "addedDate">>(emptyEcoAideForm);
  const [reason, setReason] = useState("");

  const filteredEcoAides = useMemo(() => {
    return ecoAides.filter((ecoAide) => {
      const matchesStatus =
        statusFilter === "All" ||
        ecoAide.status === statusFilter ||
        (statusFilter === "Active" && ecoAide.status === "On Duty");

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        ecoAide.name.toLowerCase().includes(normalizedSearch) ||
        ecoAide.id.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [ecoAides, searchValue, statusFilter]);

  const filteredApprovalRequests = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return approvalRequests.filter((request) => {
      return (
        normalizedSearch.length === 0 ||
        request.name.toLowerCase().includes(normalizedSearch) ||
        request.date.toLowerCase().includes(normalizedSearch) ||
        request.time.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [approvalRequests, searchValue]);

  const activeCount = ecoAides.filter(
    (ecoAide) => ecoAide.status === "Active" || ecoAide.status === "On Duty",
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
      totalRoutes: ecoAide.totalRoutes,
      completionRate: ecoAide.completionRate,
      missedAssignment: ecoAide.missedAssignment,
      email: ecoAide.email,
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

  function closeModal() {
    setSelectedEcoAide(null);
    setModalMode(null);
    setReason("");
  }

  function saveEditedEcoAide(
    validatedFormValue: EcoAideFormValue,
  ) {
    if (!selectedEcoAide) {
      return;
    }

    setEcoAides((currentEcoAides) =>
      currentEcoAides.map((ecoAide) =>
        ecoAide.id === selectedEcoAide.id
          ? {
              ...ecoAide,
              ...validatedFormValue,
            }
          : ecoAide,
      ),
    );

    closeModal();
  }

  function createEcoAideAccount(
    validatedFormValue: EcoAideFormValue,
  ) {
    const nextIdNumber = ecoAides.length + 1;

    const nextEcoAide: EcoAide = {
      id: `EA-${String(nextIdNumber).padStart(3, "0")}`,
      addedDate: new Date().toLocaleDateString("en-PH"),
      ...validatedFormValue,
    };

    setEcoAides((currentEcoAides) => [
      nextEcoAide,
      ...currentEcoAides,
    ]);

    closeModal();
  }

  function confirmStatusChange(status: "Suspended" | "Deactivated") {
    if (!selectedEcoAide) {
      return;
    }

    setEcoAides((currentEcoAides) =>
      currentEcoAides.map((ecoAide) =>
        ecoAide.id === selectedEcoAide.id
          ? {
              ...ecoAide,
              status,
            }
          : ecoAide,
      ),
    );

    closeModal();
  }

  function approveRequest(id: string) {
    setApprovalRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== id),
    );
  }

  function rejectRequest(id: string) {
    setApprovalRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== id),
    );
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

          <button
            type="button"
            onClick={() => {
              setActiveTab("approval");
              setSearchValue("");
            }}
            className={`cursor-pointer border-0 bg-transparent px-0 py-2 text-[13px] text-gray-900 ${activeTab === "approval" ? "border-b-2 border-gray-900 font-bold" : "font-medium"}`}
          >
            Approval queue ({approvalRequests.length})
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

      {activeTab === "all" ? (
        <AllEcoAidesTable
          ecoAides={filteredEcoAides}
          onViewProfile={openViewProfile}
          onEdit={openEditProfile}
          onSuspend={openSuspendModal}
          onDeactivate={openDeactivateModal}
        />
      ) : (
        <ApprovalQueueTable
          approvalRequests={filteredApprovalRequests}
          onApprove={approveRequest}
          onReject={rejectRequest}
        />
      )}

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
    </main>
  );
}

interface AllEcoAidesTableProps {
  ecoAides: EcoAide[];
  onViewProfile: (ecoAide: EcoAide) => void;
  onEdit: (ecoAide: EcoAide) => void;
  onSuspend: (ecoAide: EcoAide) => void;
  onDeactivate: (ecoAide: EcoAide) => void;
}

function AllEcoAidesTable({
  ecoAides,
  onViewProfile,
  onEdit,
  onSuspend,
  onDeactivate,
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
}

function ActionMenu({
  ecoAide,
  onEdit,
  onSuspend,
  onDeactivate,
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

interface ApprovalQueueTableProps {
  approvalRequests: EcoAideApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function ApprovalQueueTable({
  approvalRequests,
  onApprove,
  onReject,
}: ApprovalQueueTableProps) {
  return (
    <section className="min-h-[395px] overflow-hidden rounded-b-[10px] border border-gray-200 bg-white">
      <div className="px-3.5 py-[18px] text-sm font-bold text-gray-900">Approval Queue</div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-brand">
              {["Eco-Aide Name", "Date", "Time", "Actions"].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3.5 py-2.5 text-left text-xs font-bold text-white">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {approvalRequests.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-7 text-center text-[13px] text-gray-400">
                  No approval requests found.
                </td>
              </tr>
            ) : (
              approvalRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-200">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{request.name}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{request.date}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">{request.time}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px] text-gray-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onApprove(request.id);
                        }}
                        className="cursor-pointer rounded-xl border-0 bg-black px-3 py-1 text-xs text-white hover:bg-gray-800"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onReject(request.id);
                        }}
                        className="cursor-pointer rounded-xl border-0 bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-800"
                      >
                        Reject
                      </button>
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

        <div className="mt-1 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
          <HistoryCard label="Total Routes" value={ecoAide.totalRoutes} />
          <HistoryCard label="Completion Rate" value={ecoAide.completionRate} />
          <HistoryCard label="Missed Assignment" value={ecoAide.missedAssignment} />
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

type EcoAideFormValue = Omit<
  EcoAide,
  "id" | "addedDate"
>;

type EcoAideFormErrors = Partial<
  Record<keyof EcoAideFormValue, string>
>;

const ECO_AIDE_NAME_PATTERN = /^[\p{L} .'-]+$/u;
const PH_MOBILE_PATTERN = /^09\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ECO_AIDE_STATUSES: EcoAideStatus[] = [
  "Active",
  "On Duty",
  "On Route",
  "Off Duty",
  "Suspended",
  "Deactivated",
];

const CREATE_ECO_AIDE_STATUSES: EcoAideStatus[] = [
  "Active",
  "On Duty",
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
  onSave: (validatedValue: EcoAideFormValue) => void;
  onClose: () => void;
  saveLabel?: string;
}

function EditEcoAideModal({
  mode,
  title,
  formValue,
  setFormValue,
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
      fields.push("email");
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
            required
            error={errors.assignedTruck}
          >
            <select
              value={formValue.assignedTruck}
              aria-invalid={Boolean(
                errors.assignedTruck,
              )}
              onChange={(event) => {
                updateField(
                  "assignedTruck",
                  event.target.value,
                );
              }}
              onBlur={() => {
                validateOneField("assignedTruck");
              }}
              className={getInputClassName(
                "assignedTruck",
              )}
            >
              <option value="">Select truck</option>
              <option value="FL-001">FL-001</option>
              <option value="FL-002">FL-002</option>
              <option value="FL-003">FL-003</option>
            </select>
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
                updateField(
                  "assignedRoute",
                  event.target.value,
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
              <option value="RT-001">RT-001</option>
              <option value="RT-002">RT-002</option>
              <option value="RT-003">RT-003</option>
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

interface HistoryCardProps {
  label: string;
  value: string | number;
}

function HistoryCard({ label, value }: HistoryCardProps) {
  return (
    <div className="rounded-lg border border-gray-300 p-3">
      <div className="text-[13px] font-bold">{label}</div>
      <div className="text-[26px] font-extrabold">{value}</div>
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
      <button type="button" className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500">
        â€¹
      </button>
      <button type="button" className="h-[34px] w-[34px] cursor-pointer rounded-[10px] border-0 bg-brand font-bold text-white">
        1
      </button>
      <button type="button" className="cursor-pointer border-0 bg-transparent text-[22px] text-gray-500">
        â€º
      </button>
    </div>
  );
}

function getStatusClassName(status: EcoAideStatus) {
  if (status === "Active" || status === "On Duty") {
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

