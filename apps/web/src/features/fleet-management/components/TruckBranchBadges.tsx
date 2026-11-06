import type { ReactNode } from "react";
import type { WasteType } from "@bazoora/shared";
import { MapPin } from "lucide-react";
import { AdminMeta } from "@/components/admin/AdminListCard";
import { AdminPill } from "@/components/admin/AdminControls";
import { branchById } from "@/lib/branches";
import { WASTE_TYPE_LABELS } from "@/features/route-management/routeFilters.constants";

const WASTE_TYPE_PILL_CLASSES: Record<WasteType, string> = {
  BIODEGRADABLE: "bg-green-50 text-green-700",
  RESIDUAL: "bg-gray-100 text-gray-700",
  NON_BIODEGRADABLE: "bg-sky-50 text-sky-700",
  HAZARDOUS: "bg-red-50 text-red-700",
};

/** The truck's branch, or a warning when none is set yet. */
export function TruckBranchMeta({ branchId }: { branchId: string | null }): ReactNode {
  const branch = branchById(branchId);

  if (!branch) {
    return (
      <AdminPill className="bg-amber-50 font-semibold text-amber-700">
        NO BRANCH
      </AdminPill>
    );
  }

  return (
    <AdminMeta icon={<MapPin className="h-3 w-3 shrink-0 text-gray-400" />}>
      {branch.name}
    </AdminMeta>
  );
}

export function WasteTypePill({ wasteType }: { wasteType: WasteType | null }): ReactNode {
  if (!wasteType) {
    return (
      <AdminPill className="bg-amber-50 font-semibold text-amber-700">
        NO WASTE TYPE
      </AdminPill>
    );
  }

  return (
    <AdminPill className={WASTE_TYPE_PILL_CLASSES[wasteType]}>
      {WASTE_TYPE_LABELS[wasteType]}
    </AdminPill>
  );
}
