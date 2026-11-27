import { useState, type ReactNode } from "react";
import type {
  IncidentReport,
  IncidentStatus,
  UpdateIncidentReportInput,
} from "@bazoora/shared";
import { Loader2 } from "lucide-react";

import {
  AdminModalShell,
  BUTTON_CLASSES,
  DetailField,
} from "@/features/hauling-requests/components/AdminModalShell";
import { formatDateTime } from "@/features/hauling-requests/haulingRequestFormat";
import {
  INCIDENT_STATUS_LABEL,
  IncidentStatusBadge,
  isClosedIncident,
} from "./IncidentStatusBadge";

const ADMIN_NOTES_MAX_LENGTH = 1000;

const STATUS_OPTIONS: IncidentStatus[] = [
  "PENDING",
  "INVESTIGATING",
  "RESOLVED",
  "DENIED",
];

/**
 * Shows an incident report and lets an admin change its status and notes.
 * RESOLVED and DENIED close a report: after that only the notes can change.
 */
export function IncidentReviewModal({
  report,
  onClose,
  onSave,
  isSubmitting,
  errorMessage,
}: {
  report: IncidentReport;
  onClose: () => void;
  onSave: (input: UpdateIncidentReportInput) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}): ReactNode {
  const isClosed = isClosedIncident(report.status);
  const [status, setStatus] = useState<IncidentStatus>(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes ?? "");

  const statusChanged = status !== report.status;
  const notesChanged = adminNotes.trim() !== (report.adminNotes ?? "").trim();
  const hasChanges = statusChanged || notesChanged;
  const willClose = statusChanged && isClosedIncident(status);

  function handleSave() {
    const input: UpdateIncidentReportInput = {};
    if (statusChanged) input.status = status;
    if (notesChanged) input.adminNotes = adminNotes.trim();
    onSave(input);
  }

  return (
    <AdminModalShell
      eyebrow="INCIDENT REPORT"
      title={report.reportNumber}
      onClose={onClose}
      dismissible={!isSubmitting}
      maxWidthClassName="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={BUTTON_CLASSES.ghost}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSubmitting}
            className={willClose && status === "DENIED" ? BUTTON_CLASSES.danger : BUTTON_CLASSES.primary}
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {willClose ? `Mark as ${INCIDENT_STATUS_LABEL[status].toLowerCase()}` : "Save changes"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="CATEGORY">{report.category}</DetailField>
          <DetailField label="STATUS">
            <IncidentStatusBadge status={report.status} />
          </DetailField>
          <DetailField label="REPORTED BY">
            {report.reporterName ?? "Unknown user"}
          </DetailField>
          <DetailField label="FILED">{formatDateTime(report.createdAt)}</DetailField>
          <DetailField label="ROUTE">{report.routeName ?? "—"}</DetailField>
          <DetailField label="STOP">{report.stopName ?? "—"}</DetailField>
          {report.resolvedAt && (
            <DetailField label="CLOSED">{formatDateTime(report.resolvedAt)}</DetailField>
          )}
        </div>

        <DetailField label="DESCRIPTION">
          <p className="whitespace-pre-wrap break-words font-normal text-gray-700">
            {report.description}
          </p>
        </DetailField>

        {report.imageUrl && (
          <DetailField label="PHOTO">
            <a href={report.imageUrl} target="_blank" rel="noreferrer">
              <img
                src={report.imageUrl}
                alt={`Photo attached to ${report.reportNumber}`}
                className="max-h-64 w-full rounded-md border border-gray-200 object-cover"
              />
            </a>
          </DetailField>
        )}

        <div className="border-t border-gray-100 pt-5">
          <label className="block text-[10px] font-semibold tracking-wider text-gray-400">
            UPDATE STATUS
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as IncidentStatus)}
              disabled={isClosed || isSubmitting}
              className="mt-1.5 h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs font-medium text-gray-700 outline-none focus:border-brand-secondary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INCIDENT_STATUS_LABEL[option]}
                </option>
              ))}
            </select>
          </label>
          {isClosed ? (
            <p className="mt-1 text-[10px] text-gray-400">
              This report is closed. Its status can no longer change, but you can still edit the notes.
            </p>
          ) : (
            willClose && (
              <p className="mt-1 text-[10px] text-orange-600">
                Saving closes this report. Its status cannot be changed afterwards.
              </p>
            )
          )}

          <label className="mt-4 block text-[10px] font-semibold tracking-wider text-gray-400">
            ADMIN NOTES
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              maxLength={ADMIN_NOTES_MAX_LENGTH}
              disabled={isSubmitting}
              rows={4}
              placeholder="What was done about this report?"
              className="mt-1.5 w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-xs font-normal text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary disabled:opacity-50"
            />
          </label>
          <p className="mt-0.5 text-right text-[10px] text-gray-400">
            {adminNotes.length}/{ADMIN_NOTES_MAX_LENGTH}
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
    </AdminModalShell>
  );
}
