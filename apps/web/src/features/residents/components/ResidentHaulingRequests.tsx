"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  createResidentHaulingRequest,
  listMyHaulingRequests,
  uploadImage,
} from "@/features/hauling-requests/api";
import type { HaulingRequest } from "@bazoora/shared";

type RequestTab = "new" | "history";

type WasteType =
  | "RESIDUAL"
  | "NON_BIODEGRADABLE"
  | "HAZARDOUS"
  | "BIODEGRADABLE";

const wasteTypeLabels: Record<WasteType, string> = {
  RESIDUAL: "Residual Waste",
  NON_BIODEGRADABLE: "Non-Biodegradable Waste",
  HAZARDOUS: "Hazardous Waste",
  BIODEGRADABLE: "Biodegradable Waste",
};

const wasteTypes: WasteType[] = [
  "RESIDUAL",
  "NON_BIODEGRADABLE",
  "HAZARDOUS",
  "BIODEGRADABLE",
];

function getStatusClasses(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";

    case "DENIED":
      return "bg-red-100 text-red-700";

    case "PENDING":
    default:
      return "bg-orange-100 text-orange-700";
  }
}

export default function ResidentHaulingRequests(): React.ReactNode {
  const [activeTab, setActiveTab] =
    useState<RequestTab>("new");

  const [requests, setRequests] =
    useState<HaulingRequest[]>([]);

  const [selectedRequest, setSelectedRequest] =
    useState<HaulingRequest | null>(null);

  const [refreshHistory, setRefreshHistory] =
    useState(0);

  useEffect(() => {
  if (activeTab !== "history") return;

  async function loadRequestHistory() {
    try {
      const history = await listMyHaulingRequests();
      setRequests(history);
    } catch (error) {
      console.error(
        "Failed to load hauling requests:",
        error,
      );
      setRequests([]);
    }
  }

  void loadRequestHistory();
}, [activeTab, refreshHistory]);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section
          className={`rounded-xl border border-gray-200 bg-white shadow-sm ${
            activeTab === "history"
              ? "w-full"
              : "w-90 self-center"
          }`}
        >
          {/* Tabs */}
          <div className="flex justify-center gap-12 pt-6">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`relative px-5 pb-3 text-xs font-bold ${
                activeTab === "new"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              NEW REQUEST

              {activeTab === "new" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`relative px-5 pb-3 text-xs font-bold ${
                activeTab === "history"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              REQUEST HISTORY

              {activeTab === "history" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div
            key={activeTab}
            className="report-slide-in"
          >
            {activeTab === "new" ? (
              <NewRequest
                onSubmitted={() => {
                  setRefreshHistory((value) => value + 1);
                  setActiveTab("history");
                }}
              />
            ) : (
              <RequestHistory
                requests={requests}
                onSelectRequest={setSelectedRequest}
              />
            )}
          </div>

          {/* Details modal */}
          {selectedRequest && (
            <RequestDetailsModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function NewRequest({
  onSubmitted,
}: {
  onSubmitted: () => void;
}): React.ReactNode {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [wasteType, setWasteType] =
    useState<WasteType | "">("");

  const [address, setAddress] =
    useState("");

  const [pickupDate, setPickupDate] =
    useState("");

  const [note, setNote] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be smaller than 10MB.");
      return;
    }

    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function removePhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (!wasteType) {
      setError("Please select a waste type.");
      return;
    }

    const trimmedAddress = address.trim()

    if (trimmedAddress.length < 5) {
      setError("Pickup address must be at least 5 characters.");
      return;
    }

    if (!pickupDate) {
      setError("Please select a pickup date.");
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl: string | undefined;

      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);

        imageUrl = await uploadImage(
          base64,
          selectedFile.type,
        );
      }

      await createResidentHaulingRequest({
        requestAddress: trimmedAddress,
        senderType: "RESIDENT",
        wasteType,
        pickupDate: new Date(
          pickupDate,
        ).toISOString(),
        ...(imageUrl && { imageUrl }),
        ...(note.trim() && {
          note: note.trim(),
        }),
      });

      setSuccess(true);

      setWasteType("");
      setAddress("");
      setPickupDate("");
      setNote("");
      removePhoto();

      onSubmitted();
    } catch (submitError) {
      console.error(
        "Failed to submit hauling request:",
        submitError,
      );

      setError(
        "Failed to submit your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full px-6 pb-6 pt-5"
    >
      {/* Request ID */}
      <div>
        <label className="text-[10px] font-medium text-gray-700">
          Request ID
        </label>

        <div className="mt-1.5 flex h-9 items-center rounded-md border border-surface-border bg-[#f8fbf9] px-3 text-xs text-surface-muted">
          Generated automatically after submission
        </div>
      </div>

      {/* Photo Attachment */}
      <div className="mt-4">
        <label className="text-[10px] font-medium text-gray-700">
          Photo Attachment (optional)
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {!previewUrl ? (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-1.5 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white transition hover:bg-gray-50"
          >
            <Camera className="h-6 w-6 text-surface-muted" />

            <span className="mt-2 text-[10px] font-medium text-surface-muted">
              Tap to upload/capture issue photo
            </span>

            <span className="mt-1 text-[8px] tracking-wider text-gray-400">
              JPG, PNG, WEBP UP TO 10MB
            </span>
          </button>
        ) : (
          <div className="relative mt-1.5 overflow-hidden rounded-lg border border-surface-border">
            <img
              src={previewUrl}
              alt="Selected hauling request"
              className="h-32 w-full object-cover"
            />

            <button
              type="button"
              onClick={removePhoto}
              aria-label="Remove photo"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="bg-white px-3 py-2 text-[9px] text-gray-500">
              {selectedFile?.name}
            </div>
          </div>
        )}
      </div>

      {/* Waste Type */}
      <div className="mt-4">
        <label
          htmlFor="waste-type"
          className="text-[10px] font-medium text-gray-700"
        >
          Waste Type
        </label>

        <div className="relative mt-1.5">
          <select
            id="waste-type"
            value={wasteType}
            onChange={(event) =>
              setWasteType(
                event.target.value as WasteType | "",
              )
            }
            className="h-9 w-full appearance-none rounded-md border border-surface-border bg-white px-3 pr-9 text-xs text-gray-700 outline-none focus:border-brand-secondary"
          >
            <option value="">
              Select type...
            </option>

            {wasteTypes.map((type) => (
              <option key={type} value={type}>
                {wasteTypeLabels[type]}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-muted" />
        </div>
      </div>

      {/* Pickup Address */}
      <div className="mt-4">
        <label
          htmlFor="pickup-address"
          className="text-[10px] font-medium text-gray-700"
        >
          Pickup Address
        </label>

        <input
          id="pickup-address"
          type="text"
          value={address}
          onChange={(event) =>
            setAddress(event.target.value)
          }
          placeholder="Enter pickup address..."
          className="mt-1.5 h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
        />
      </div>

      {/* Pickup Date */}
      <div className="mt-4">
        <label
          htmlFor="pickup-date"
          className="text-[10px] font-medium text-gray-700"
        >
          Preferred Pickup Date
        </label>

        <input
          id="pickup-date"
          type="datetime-local"
          value={pickupDate}
          onChange={(event) =>
            setPickupDate(event.target.value)
          }
          min={getMinimumDateTime()}
          className="mt-1.5 h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-700 outline-none focus:border-brand-secondary"
        />
      </div>

      {/* Request Details */}
      <div className="mt-4">
        <label
          htmlFor="request-details"
          className="text-[10px] font-medium text-gray-700"
        >
          Request Details
        </label>

        <textarea
          id="request-details"
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          maxLength={500}
          placeholder="Describe your request..."
          className="mt-1.5 h-25 w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
        />

        <p className="mt-1 text-right text-[8px] text-gray-400">
          {note.length}/500
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-[10px] text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="mt-4 rounded-md bg-green-50 px-3 py-2 text-[10px] text-green-700"
        >
          Request submitted successfully.
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#222] text-[10px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "SUBMITTING..."
          : "SUBMIT REQUEST"}

        {!isSubmitting && <span>→</span>}
      </button>
    </form>
  );
}

function RequestHistory({
  requests,
  onSelectRequest,
}: {
  requests: HaulingRequest[];
  onSelectRequest: (request: HaulingRequest) => void;
}): React.ReactNode {
  const [currentPage, setCurrentPage] = useState(1);
  const [slidingDirection, setSlideDirection] = useState<
    "left" | "right"
  >("left");
  const itemsPerPage = 8;
  const totalPages = Math.ceil(
    requests.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="px-6 pb-6 pt-5">
      <div 
        key={currentPage}
        className={`space-y-3 ${
          slidingDirection === "left"
            ? "page-slide-left"
            : "page-slide-right"
          }`}
        >
        {paginatedRequests.map((request) => (
          <div
            key={request.requestId}
            className="flex min-h-20 items-center justify-between rounded-md border border-gray-200 bg-white px-5"
          >
            <div className="min-w-0">
              <p className="text-[7px] text-gray-400">
                {new Date(
                  request.pickupDate,
                ).toLocaleDateString()}
              </p>

              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {wasteTypeLabels[request.wasteType]}
              </p>

              <p className="text-[10px] text-gray-500">
                ID: {request.requestNumber}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${getStatusClasses(
                  request.status,
                )}`}
              >
                {request.status}
              </span>

              <button
                type="button"
                onClick={() =>
                  onSelectRequest(request)
                }
                className="text-[8px] font-medium text-gray-700 hover:text-brand-secondary"
              >
                Details ›
              </button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-400">
            No hauling requests yet.
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            setSlideDirection("right");
            setCurrentPage((page) =>
              Math.min(page - 1, 1),
            );
          }}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="flex h-7 w-7 items-center justify-center bg-blue-100 text-xs text-blue-700">
          {currentPage}
        </span>

        <button
          type="button"
          onClick={() => {
            setSlideDirection("left");
            setCurrentPage((page) =>
              Math.min(page + 1, totalPages),
            );
          }}
            
          className="text-gray-500 hover:text-gray-800"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}

function RequestDetailsModal({
  request,
  onClose,
}: {
  request: HaulingRequest;
  onClose: () => void;
}): React.ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] text-gray-400">
              REQUEST DETAILS
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-800">
              {request.requestNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close request details"
            className="text-xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-[9px] text-gray-400">
              WASTE TYPE
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {wasteTypeLabels[request.wasteType]}
            </p>
          </div>

          <div>
            <p className="text-[9px] text-gray-400">
              PICKUP DATE
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {new Date(
                request.pickupDate,
              ).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-[9px] text-gray-400">
              ADDRESS
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {request.requestAddress}
            </p>
          </div>

          <div>
            <p className="text-[9px] text-gray-400">
              STATUS
            </p>

            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[7px] font-bold ${getStatusClasses(
                request.status,
              )}`}
            >
              {request.status}
            </span>
          </div>

          {request.note && (
            <div>
              <p className="text-[9px] text-gray-400">
                NOTE
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {request.note}
              </p>
            </div>
          )}

          {request.imageUrl && (
            <div>
              <p className="text-[9px] text-gray-400">
                ATTACHED PHOTO
              </p>

              <img
                src={request.imageUrl}
                alt="Hauling request attachment"
                className="mt-1.5 max-h-48 w-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(
          new Error("Failed to read image file."),
        );
        return;
      }

      const base64 = result.split(",")[1];

      if (!base64) {
        reject(
          new Error("Invalid image data."),
        );
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(
        new Error("Failed to read image file."),
      );
    };

    reader.readAsDataURL(file);
  });
}

function getMinimumDateTime(): string {
  const now = new Date();

  const offset =
    now.getTimezoneOffset() * 60000;

  return new Date(
    now.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}