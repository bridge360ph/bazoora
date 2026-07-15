import type { Dispatch, SetStateAction } from "react";
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
      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <FormField label="Assigned Driver">
          <input
            value={formValue.assignedDriver}
            onChange={(event) => {
              updateField("assignedDriver", event.target.value);
            }}
            placeholder="e.g. Henry Correa"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
          />
        </FormField>

        <FormField label="Plate Number">
          <input
            value={formValue.plateNumber}
            onChange={(event) => {
              updateField("plateNumber", event.target.value);
            }}
            placeholder="e.g. GTM-5895"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
          />
        </FormField>

        <FormField label="Truck Model">
          <input
            value={formValue.model}
            onChange={(event) => {
              updateField("model", event.target.value);
            }}
            placeholder="e.g. Isuzu Elf"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
          />
        </FormField>

        <FormField label="Capacity (kg)">
          <input
            value={formValue.capacity}
            onChange={(event) => {
              updateField("capacity", event.target.value);
            }}
            placeholder="e.g. 7000"
            type="number"
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
          />
        </FormField>

        <FormField label="Status">
          <select
            value={formValue.status}
            onChange={(event) => {
              updateField("status", event.target.value as TruckStatus);
            }}
            className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
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