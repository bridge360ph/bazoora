// import { FormField, Modal, ModalFooter } from "@bazoora/ui";
// import type { Route } from "@bazoora/shared";

// interface AssignEcoAideModalProps {
//   route: Route;
//   assignedEcoAide: string;
//   setAssignedEcoAide: (ecoAide: string) => void;
//   onSave: () => void;
//   onClose: () => void;
//   isSubmitting?: boolean;
// }

// export function AssignEcoAideModal({
//   route,
//   assignedEcoAide,
//   setAssignedEcoAide,
//   onSave,
//   onClose,
//   isSubmitting = false,
// }: AssignEcoAideModalProps) {
//   return (
//     <Modal title={`Assign Eco-Aide to R${route.routeNumber}`} onClose={onClose} width={480}>
//       <div className="flex flex-col gap-4">
//         <FormField label="Route">
//           <input
//             value={route.name}
//             disabled
//             className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
//           />
//         </FormField>

//         <FormField label="Select Eco-Aide">
//           <select
//             value={assignedEcoAide}
//             onChange={(event) => {
//               setAssignedEcoAide(event.target.value);
//             }}
//             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
//           >
//             {ECO_AIDE_OPTIONS.map((ecoAide) => (
//               <option key={ecoAide} value={ecoAide}>
//                 {ecoAide}
//               </option>
//             ))}
//           </select>
//         </FormField>
//       </div>

//       <ModalFooter
//         saveLabel={isSubmitting ? "Saving..." : "Save"}
//         onSave={onSave}
//         onClose={onClose}
//       />
//     </Modal>
//   );
// }
