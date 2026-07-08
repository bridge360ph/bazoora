import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "../../../components/Button";
import {
  ECO_AIDE_ROUTE_OPTIONS,
  INITIAL_HAULING_REQUESTS,
} from "../haulingRequests.data";
import type {
  HaulingRequest,
  HaulingRequestStatus,
  SenderFilter,
  WasteFilter,
} from "../haulingRequests.types";

type ModalMode = "details" | "approve" | "deny" | null;

const senderFilters: SenderFilter[] = ["All", "Residents", "Business"];

const wasteFilters: WasteFilter[] = [
  "All",
  "Recyclable",
  "Regular/Non-Recyclable",
];

export function HaulingRequestManagementPage() {
  const [requests, setRequests] = useState<HaulingRequest[]>(
    INITIAL_HAULING_REQUESTS,
  );
  const [senderFilter, setSenderFilter] = useState<SenderFilter>("All");
  const [wasteFilter, setWasteFilter] = useState<WasteFilter>("All");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<HaulingRequest | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedEcoAideRoute, setSelectedEcoAideRoute] = useState(
    ECO_AIDE_ROUTE_OPTIONS[0],
  );
  const [denialReason, setDenialReason] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSender =
        senderFilter === "All" ||
        (senderFilter === "Business" && request.sentBy === "Business") ||
        (senderFilter === "Residents" && request.sentBy === "Resident");

      const matchesWaste =
        wasteFilter === "All" || request.wasteType === wasteFilter;

      const normalizedSearch = searchValue.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        request.id.toLowerCase().includes(normalizedSearch) ||
        request.location.toLowerCase().includes(normalizedSearch) ||
        request.sentByName.toLowerCase().includes(normalizedSearch);

      return matchesSender && matchesWaste && matchesSearch;
    });
  }, [requests, searchValue, senderFilter, wasteFilter]);

  function openDetails(request: HaulingRequest) {
    setSelectedRequest(request);
    setModalMode("details");
  }

  function openApproveModal(request: HaulingRequest) {
    setSelectedRequest(request);
    setSelectedEcoAideRoute(ECO_AIDE_ROUTE_OPTIONS[0]);
    setModalMode("approve");
  }

  function openDenyModal(request: HaulingRequest) {
    setSelectedRequest(request);
    setDenialReason("");
    setModalMode("deny");
  }

  function closeModal() {
    setSelectedRequest(null);
    setModalMode(null);
  }

  function approveRequest() {
    if (!selectedRequest) {
      return;
    }

    const updatedRequest: HaulingRequest = {
      ...selectedRequest,
      status: "Approved",
      assignedEcoAide: selectedEcoAideRoute,
    };

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === selectedRequest.id ? updatedRequest : request,
      ),
    );

    setSelectedRequest(updatedRequest);
    setModalMode("details");
  }

  function denyRequest() {
    if (!selectedRequest) {
      return;
    }

    const updatedRequest: HaulingRequest = {
      ...selectedRequest,
      status: "Denied",
      denialReason: denialReason.trim() || "No reason provided.",
    };

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === selectedRequest.id ? updatedRequest : request,
      ),
    );

    setSelectedRequest(updatedRequest);
    setModalMode("details");
  }

  return (
    <main style={pageStyle}>
      <section style={topBarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Hauling Request Management</h1>
          <p style={pageSubtitleStyle}>
            Review, approve, deny, and assign hauling requests.
          </p>
        </div>
      </section>

      <section style={filterRowStyle}>
        <select
          value={senderFilter}
          onChange={(event) => {
            setSenderFilter(event.target.value as SenderFilter);
          }}
          style={filterButtonStyle}
        >
          {senderFilters.map((sender) => (
            <option key={sender} value={sender}>
              {sender === "All" ? "Filter by Sender" : sender}
            </option>
          ))}
        </select>

        <select
          value={wasteFilter}
          onChange={(event) => {
            setWasteFilter(event.target.value as WasteFilter);
          }}
          style={filterButtonStyle}
        >
          {wasteFilters.map((waste) => (
            <option key={waste} value={waste}>
              {waste === "All" ? "Filter by Waste Type" : waste}
            </option>
          ))}
        </select>

        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
          }}
          placeholder="Search request by ID, location, or sender..."
          style={searchInputStyle}
        />
      </section>

      <section style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#145c38" }}>
                {[
                  "Image",
                  "Request ID",
                  "Location",
                  "Waste Type",
                  "Sent By",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} style={tableHeaderStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyCellStyle}>
                    No requests match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} style={tableRowStyle}>
                    <td style={tableCellStyle}>
                      <ImagePlaceholder />
                    </td>
                    <td style={tableCellStyle}>{request.id}</td>
                    <td style={tableCellStyle}>{request.location}</td>
                    <td style={tableCellStyle}>{request.wasteType}</td>
                    <td style={tableCellStyle}>{request.sentBy}</td>
                    <td style={tableCellStyle}>
                      <RequestStatusPill status={request.status} />
                    </td>
                    <td style={tableCellStyle}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          openDetails(request);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination />
      </section>

      {modalMode === "details" && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={closeModal}
          onApprove={() => {
            openApproveModal(selectedRequest);
          }}
          onDeny={() => {
            openDenyModal(selectedRequest);
          }}
        />
      )}

      {modalMode === "approve" && selectedRequest && (
        <ApproveRequestModal
          selectedEcoAideRoute={selectedEcoAideRoute}
          setSelectedEcoAideRoute={setSelectedEcoAideRoute}
          onApprove={approveRequest}
          onClose={() => {
            setModalMode("details");
          }}
        />
      )}

      {modalMode === "deny" && selectedRequest && (
        <DenyRequestModal
          request={selectedRequest}
          denialReason={denialReason}
          setDenialReason={setDenialReason}
          onDeny={denyRequest}
          onClose={() => {
            setModalMode("details");
          }}
        />
      )}
    </main>
  );
}

interface RequestDetailsModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onApprove: () => void;
  onDeny: () => void;
}

function RequestDetailsModal({
  request,
  onClose,
  onApprove,
  onDeny,
}: RequestDetailsModalProps) {
  return (
    <ModalShell title={request.id} width={820} onClose={onClose}>
      <div style={detailsImageWrapperStyle}>
        <LargeImagePlaceholder />
      </div>

      <div style={detailsTableStyle}>
        <DetailRow label="Location" value={request.fullLocation} />
        <DetailRow label="Waste Type" value={request.wasteType} />
        <DetailRow label="Fee Classification" value={request.feeClassification} />
        <DetailRow label="Sent By" value={request.sentByName} />
        <DetailRow label="Date Requested" value={request.dateRequested} />
        <DetailRow label="Date Needed" value={request.dateNeeded} />
        <DetailRow label="Status" value={request.status} />

        {request.assignedEcoAide && (
          <DetailRow
            label="Assigned Eco-Aide / Route"
            value={request.assignedEcoAide}
          />
        )}

        {request.denialReason && (
          <DetailRow label="Denial Reason" value={request.denialReason} />
        )}
      </div>

      {request.status === "Pending" ? (
        <div style={detailsActionsStyle}>
          <Button onClick={onApprove}>Approve</Button>
          <button type="button" onClick={onDeny} style={dangerButtonStyle}>
            Deny
          </button>
        </div>
      ) : (
        <div style={detailsActionsStyle}>
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
        </div>
      )}
    </ModalShell>
  );
}

interface ApproveRequestModalProps {
  selectedEcoAideRoute: string;
  setSelectedEcoAideRoute: (value: string) => void;
  onApprove: () => void;
  onClose: () => void;
}

function ApproveRequestModal({
  selectedEcoAideRoute,
  setSelectedEcoAideRoute,
  onApprove,
  onClose,
}: ApproveRequestModalProps) {
  return (
    <ModalShell title="Approve Request" width={420} onClose={onClose}>
      <FormField label="Assign Eco-Aide and Route">
        <select
          value={selectedEcoAideRoute}
          onChange={(event) => {
            setSelectedEcoAideRoute(event.target.value);
          }}
          style={inputStyle}
        >
          {ECO_AIDE_ROUTE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <div style={modalFooterStyle}>
        <Button onClick={onApprove}>Approve</Button>
        <Button variant="secondary" onClick={onClose}>
          × Close
        </Button>
      </div>
    </ModalShell>
  );
}

interface DenyRequestModalProps {
  request: HaulingRequest;
  denialReason: string;
  setDenialReason: (value: string) => void;
  onDeny: () => void;
  onClose: () => void;
}

function DenyRequestModal({
  request,
  denialReason,
  setDenialReason,
  onDeny,
  onClose,
}: DenyRequestModalProps) {
  return (
    <ModalShell title={`Deny Request - ${request.id}`} width={440} onClose={onClose}>
      <FormField label="Provide a reason for denial">
        <textarea
          value={denialReason}
          onChange={(event) => {
            setDenialReason(event.target.value);
          }}
          placeholder="Enter reason..."
          style={textareaStyle}
        />
      </FormField>

      <div style={modalFooterStyle}>
        <button type="button" onClick={onDeny} style={dangerButtonStyle}>
          Deny
        </button>
        <Button variant="secondary" onClick={onClose}>
          × Close
        </Button>
      </div>
    </ModalShell>
  );
}

interface ModalShellProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
}

function ModalShell({ title, children, onClose, width = 560 }: ModalShellProps) {
  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalCardStyle, maxWidth: width }}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{title}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      {children}
    </label>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div style={detailRowStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function RequestStatusPill({ status }: { status: HaulingRequestStatus }) {
  return (
    <span style={{ ...statusPillStyle, ...getRequestStatusStyle(status) }}>
      {status}
    </span>
  );
}

function getRequestStatusStyle(status: HaulingRequestStatus): CSSProperties {
  if (status === "Approved") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "Denied") {
    return {
      background: "#fee2e2",
      color: "#9a3412",
    };
  }

  return {
    background: "#fef3c7",
    color: "#92400e",
  };
}

function ImagePlaceholder() {
  return <div style={imagePlaceholderStyle}>×</div>;
}

function LargeImagePlaceholder() {
  return <div style={largeImagePlaceholderStyle}>×</div>;
}

function Pagination() {
  return (
    <div style={paginationStyle}>
      <button type="button" style={paginationArrowStyle}>
        ‹
      </button>
      <button type="button" style={paginationActiveStyle}>
        1
      </button>
      <button type="button" style={paginationArrowStyle}>
        ›
      </button>
    </div>
  );
}

const pageStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const pageSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 16,
  alignItems: "stretch",
  flexWrap: "wrap",
};

const filterButtonStyle: CSSProperties = {
  minWidth: 180,
  border: "none",
  background: "#062f22",
  color: "#ffffff",
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 8,
};

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 260,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 920,
  borderCollapse: "collapse",
};

const tableHeaderStyle: CSSProperties = {
  color: "#ffffff",
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 12.5,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
};

const tableCellStyle: CSSProperties = {
  padding: "10px 16px",
  fontSize: 13,
  color: "#374151",
  whiteSpace: "nowrap",
};

const emptyCellStyle: CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 13,
};

const statusPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
};

const imagePlaceholderStyle: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 6,
  background: "#d1d5db",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  fontWeight: 300,
};

const largeImagePlaceholderStyle: CSSProperties = {
  width: 320,
  height: 180,
  borderRadius: 10,
  background: "#d1d5db",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 48,
  fontWeight: 300,
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  padding: "16px 0",
  borderTop: "1px solid #f3f4f6",
};

const paginationArrowStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontSize: 22,
  cursor: "pointer",
  borderRadius: 7,
  padding: "3px 10px",
};

const paginationActiveStyle: CSSProperties = {
  border: "none",
  borderRadius: 7,
  background: "#1a3a2e",
  color: "#ffffff",
  width: 32,
  height: 32,
  fontWeight: 700,
  cursor: "pointer",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const modalCardStyle: CSSProperties = {
  width: "100%",
  background: "#ffffff",
  borderRadius: 14,
  padding: 24,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 18,
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 22,
  cursor: "pointer",
  color: "#6b7280",
};

const detailsImageWrapperStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 22,
};

const detailsTableStyle: CSSProperties = {
  background: "#1a3a2e",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 24,
};

const detailRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 1fr",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const detailLabelStyle: CSSProperties = {
  background: "rgba(0,0,0,0.2)",
  padding: "13px 18px",
  fontSize: 14,
  fontWeight: 700,
  color: "#ffffff",
};

const detailValueStyle: CSSProperties = {
  padding: "13px 18px",
  fontSize: 14,
  color: "rgba(255,255,255,0.9)",
  background: "rgba(255,255,255,0.06)",
};

const detailsActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 14,
  flexWrap: "wrap",
};

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#111827",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: "vertical",
  fontFamily: "inherit",
};

const dangerButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "#ffffff",
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalFooterStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginTop: 20,
  flexWrap: "wrap",
};