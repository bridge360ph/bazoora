import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Mail, Route as RouteIcon, Truck as TruckIcon, UserPlus } from "lucide-react";

import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  AdminEmptySlot,
  AdminLoadingList,
  AdminNotice,
  AdminRefreshButton,
  AdminSearchInput,
  BUTTON_CLASSES,
} from "@/components/admin/AdminControls";
import { AdminListCard, AdminMeta } from "@/components/admin/AdminListCard";
import { AdminPagination, paginate } from "@/components/admin/AdminPagination";
import { AdminModalShell } from "@/components/admin/AdminModalShell";
import { FLEET_DRIVERS_QUERY_KEY, deleteDriver, fetchDrivers } from "../fleet.api";
import type { FleetDriver } from "../fleet.types";

type DriverFilter = "all" | "withTruck" | "noTruck";

const DRIVERS_PAGE_SIZE = 10;

function formatAddedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function matchesSearch(driver: FleetDriver, search: string): boolean {
  if (!search) return true;

  return [
    driver.name,
    driver.email,
    driver.userNumber,
    driver.truck?.truckNumber,
    driver.truck?.plateNumber,
    driver.truck?.route?.routeDisplayNumber,
  ].some((value) => value?.toLowerCase().includes(search) ?? false);
}

/**
 * The Drivers view of Fleet Management: every driver account, with the
 * truck assigned to them and the route that truck is on.
 */
export function FleetDriversView({
  canAddDriver,
  onAddDriver,
  onDriverRemoved,
}: {
  canAddDriver: boolean;
  onAddDriver: () => void;
  /** Called after a driver is removed, so the truck list can refresh. */
  onDriverRemoved: () => void;
}): ReactNode {
  const queryClient = useQueryClient();
  const [driverToRemove, setDriverToRemove] = useState<FleetDriver | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: (driver: FleetDriver) => deleteDriver(driver.id),
    onSuccess: async (_result, driver) => {
      await queryClient.invalidateQueries({ queryKey: FLEET_DRIVERS_QUERY_KEY });
      setDriverToRemove(null);
      setNotice(`${driver.name} was removed.`);
      onDriverRemoved();
    },
  });

  const {
    data: drivers = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: FLEET_DRIVERS_QUERY_KEY,
    queryFn: fetchDrivers,
  });

  const [filter, setFilter] = useState<DriverFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DRIVERS_PAGE_SIZE);

  // Search applies before the tabs, so each tab count shows what that tab
  // would list.
  const searched = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return drivers.filter((driver) => matchesSearch(driver, search));
  }, [drivers, searchValue]);

  const withTruck = searched.filter((driver) => driver.truck !== null);
  const noTruck = searched.filter((driver) => driver.truck === null);
  const visible = filter === "withTruck" ? withTruck : filter === "noTruck" ? noTruck : searched;
  const pagination = paginate(visible, page, rowsPerPage);

  return (
    <>
      <AdminTabs
        tabs={[
          { value: "all" as const, label: "ALL", count: searched.length },
          { value: "withTruck" as const, label: "WITH TRUCK", count: withTruck.length },
          { value: "noTruck" as const, label: "NO TRUCK", count: noTruck.length, highlight: true },
        ]}
        active={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        actions={
          <>
            <AdminRefreshButton
              onClick={() => void refetch()}
              isRefreshing={isFetching}
              label="Refresh drivers"
            />
            {canAddDriver && (
              <button type="button" onClick={onAddDriver} className={BUTTON_CLASSES.primary}>
                <UserPlus className="h-3.5 w-3.5" />
                Add Driver
              </button>
            )}
          </>
        }
      />

      <div className="shrink-0 px-6 pt-5">
        <AdminSearchInput
          value={searchValue}
          onChange={(value) => {
            setSearchValue(value);
            setPage(1);
          }}
          placeholder="Search driver by name, email, ID, truck or plate no."
        />
      </div>

      <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
        {notice && (
          <div className="mb-3">
            <AdminNotice tone="success" onDismiss={() => setNotice(null)}>
              {notice}
            </AdminNotice>
          </div>
        )}

        {isLoading ? (
          <AdminLoadingList />
        ) : isError ? (
          <AdminNotice tone="error">
            {error instanceof Error ? error.message : "Drivers could not be loaded."}
          </AdminNotice>
        ) : (
          <>
            <div className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1">
              {pagination.pageItems.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onRemove={() => {
                    removeMutation.reset();
                    setDriverToRemove(driver);
                  }}
                />
              ))}

              {pagination.total === 0 ? (
                <AdminEmptySlot>
                  {drivers.length === 0
                    ? "No drivers yet. Add one to get started."
                    : filter === "noTruck"
                      ? "Every driver has a truck."
                      : "No drivers match the current filter."}
                </AdminEmptySlot>
              ) : (
                pagination.page === pagination.totalPages && (
                  <AdminEmptySlot>No more drivers</AdminEmptySlot>
                )
              )}
            </div>

            <AdminPagination
              {...pagination}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {driverToRemove && (
        <RemoveDriverModal
          driver={driverToRemove}
          isRemoving={removeMutation.isPending}
          errorMessage={removeMutation.error instanceof Error ? removeMutation.error.message : null}
          onConfirm={() => removeMutation.mutate(driverToRemove)}
          onClose={() => setDriverToRemove(null)}
        />
      )}
    </>
  );
}

function RemoveDriverModal({
  driver,
  isRemoving,
  errorMessage,
  onConfirm,
  onClose,
}: {
  driver: FleetDriver;
  isRemoving: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onClose: () => void;
}): ReactNode {
  return (
    <AdminModalShell
      eyebrow="REMOVE DRIVER"
      title={driver.name}
      onClose={onClose}
      dismissible={!isRemoving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isRemoving} className={BUTTON_CLASSES.ghost}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isRemoving} className={BUTTON_CLASSES.danger}>
            {isRemoving ? "Removing..." : "Remove Driver"}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-700">
        This deletes the driver account for <strong>{driver.email}</strong>. They will no longer be
        able to sign in.
      </p>
      {driver.truck && (
        <p className="mt-3 text-sm text-gray-700">
          Truck {driver.truck.truckNumber ?? ""} ({driver.truck.plateNumber}) stays in the fleet with
          no driver. Assign a new driver from the truck&apos;s Edit window.
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </p>
      )}
    </AdminModalShell>
  );
}

function DriverCard({ driver, onRemove }: { driver: FleetDriver; onRemove: () => void }): ReactNode {
  const { truck } = driver;

  return (
    <AdminListCard
      accentClassName={truck ? "border-l-emerald-400" : "border-l-orange-400"}
      aside={
        <>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
              truck ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}
          >
            {truck ? "WITH TRUCK" : "NO TRUCK"}
          </span>
          <button type="button" onClick={onRemove} className={BUTTON_CLASSES.linkDanger}>
            Remove
          </button>
        </>
      }
    >
      <p className="text-sm font-bold text-gray-800">{driver.name}</p>
      <p className="mt-0.5 text-[10px] text-gray-500">ID: {driver.userNumber ?? "Not set"}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
        <AdminMeta icon={<Mail className="h-3 w-3 shrink-0 text-gray-400" />}>{driver.email}</AdminMeta>
        <AdminMeta icon={<TruckIcon className="h-3 w-3 shrink-0 text-gray-400" />}>
          {truck
            ? `${truck.truckNumber ?? "Truck"} (${truck.plateNumber}) · ${truck.status}`
            : "No truck yet"}
        </AdminMeta>
        {truck && (
          <AdminMeta icon={<RouteIcon className="h-3 w-3 shrink-0 text-gray-400" />}>
            {truck.route ? `${truck.route.routeDisplayNumber} · ${truck.route.name}` : "Truck not on a route"}
          </AdminMeta>
        )}
        <AdminMeta icon={<CalendarDays className="h-3 w-3 shrink-0 text-gray-400" />}>
          Added {formatAddedDate(driver.addedAt)}
        </AdminMeta>
      </div>
    </AdminListCard>
  );
}
