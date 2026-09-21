import { FormField, Modal, ModalFooter } from "@bazoora/ui";

import type { Driver, Truck } from "../fleet.types";

interface AssignTruckModalProps {
  truck: Truck;

  assignedDriverName: string;
  setAssignedDriverName: (driver: string) => void;
  drivers: Driver[];

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
  assignedDriverName,
  setAssignedDriverName,
  drivers,
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
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />

          <input
            value={truck.model}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />
        </div>
      </FormField>

      <FormField label="Assigned Driver">
        <input
          type="text"
          value={assignedDriverName}
          onChange={(event) => setAssignedDriverName(event.target.value)}
          placeholder="Enter driver name or email"
          list="driver-options"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />

        <datalist id="driver-options">
          {drivers.map((driver) => (
            <option
              key={driver.id}
              value={driver.name || driver.email}
            />
          ))}
        </datalist>
      </FormField>

      <FormField label="Assigned Route ID">
        <select
          value={assignedRoute}
          onChange={(event) => setAssignedRoute(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
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
          onChange={(event) => setAssignedEcoAide(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        >
          {ecoAideOptions.map((ecoAide) => (
            <option key={ecoAide} value={ecoAide}>
              {ecoAide}
            </option>
          ))}
        </select>
      </FormField>

      <ModalFooter
        saveLabel="Save"
        onSave={onSave}
        onClose={onClose}
      />
    </Modal>
  );
}

