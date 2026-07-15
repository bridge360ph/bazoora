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
        <div className="grid grid-cols-2 gap-2">
          <input
            value={truck.id}
            disabled
            className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-[10px] py-2 text-[13px] text-gray-500"
          />
          <input
            value={truck.model}
            disabled
            className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-[10px] py-2 text-[13px] text-gray-500"
          />
        </div>
      </FormField>

      <FormField label="Assigned Route ID">
        <select
          value={assignedRoute}
          onChange={(event) => {
            setAssignedRoute(event.target.value);
          }}
          className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
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
          className="box-border w-full rounded-[7px] border border-gray-300 bg-white px-[10px] py-2 text-[13px] text-gray-900"
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