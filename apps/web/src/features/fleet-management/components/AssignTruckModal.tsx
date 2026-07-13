import type { CSSProperties } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { Truck } from "../fleet.types";

interface AssignTruckModalProps {
  truck: Truck;
  assignedRoute: string;
  setAssignedRoute: (route: string) => void;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  routeOptions: string[];
  ecoAideOptions: string[];
  onSave: () => void;
  onClose: () => void;
}

export function AssignTruckModal({
  truck,
  assignedRoute,
  setAssignedRoute,
  assignedEcoAide,
  setAssignedEcoAide,
  routeOptions,
  ecoAideOptions,
  onSave,
  onClose,
}: AssignTruckModalProps) {
  return (
    <Modal title="Assign Truck" onClose={onClose} width={430}>
      <FormField label="Truck ID">
        <div style={inlineFieldRowStyle}>
          <input value={truck.id} disabled style={disabledInputStyle} />
          <input value={truck.model} disabled style={disabledInputStyle} />
        </div>
      </FormField>

      <FormField label="Assigned Route ID">
        <select
          value={assignedRoute}
          onChange={(event) => {
            setAssignedRoute(event.target.value);
          }}
          style={inputStyle}
        >
          {routeOptions.map((route) => (
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
          style={inputStyle}
        >
          {ecoAideOptions.map((ecoAide) => (
            <option key={ecoAide} value={ecoAide}>
              {ecoAide}
            </option>
          ))}
        </select>
      </FormField>

      <ModalFooter saveLabel="Save" onSave={onSave} onClose={onClose} />
    </Modal>
  );
}

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

const disabledInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#f9fafb",
  color: "#6b7280",
};

const inlineFieldRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};
