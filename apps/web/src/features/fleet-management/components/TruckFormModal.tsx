import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { TruckFormValue, TruckStatus } from "../fleet.types";

interface TruckFormModalProps {
  title: string;
  formValue: TruckFormValue;
  setFormValue: Dispatch<SetStateAction<TruckFormValue>>;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

export function TruckFormModal({
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
    <Modal title={title} onClose={onClose} width={560}>
      <div style={formGridStyle}>
        <FormField label="Assigned Driver">
          <input
            value={formValue.assignedDriver}
            onChange={(event) => {
              updateField("assignedDriver", event.target.value);
            }}
            placeholder="e.g. Henry Correa"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Plate Number">
          <input
            value={formValue.plateNumber}
            onChange={(event) => {
              updateField("plateNumber", event.target.value);
            }}
            placeholder="e.g. GTM-5895"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Truck Model">
          <input
            value={formValue.model}
            onChange={(event) => {
              updateField("model", event.target.value);
            }}
            placeholder="e.g. Isuzu Elf"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Capacity (kg)">
          <input
            value={formValue.capacity}
            onChange={(event) => {
              updateField("capacity", event.target.value);
            }}
            placeholder="e.g. 7000"
            style={inputStyle}
            type="number"
          />
        </FormField>

        <FormField label="Status">
          <select
            value={formValue.status}
            onChange={(event) => {
              updateField("status", event.target.value as TruckStatus);
            }}
            style={inputStyle}
          >
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </FormField>
      </div>

      <ModalFooter saveLabel={saveLabel} onSave={onSave} onClose={onClose} />
    </Modal>
  );
}

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  padding: "8px 10px",
  fontSize: 13,
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#111827",
};
