import type { ReactNode } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

import type { PickupAddress } from "./types";
import { FieldLabel } from "./FormUi";

export default function PickupAddressList({
  addresses,
  activeIndex,
  isResolving,
  onSelect,
  onChange,
  onResolve,
  onAdd,
  onRemove,
}: {
  addresses: PickupAddress[];
  activeIndex: number;
  isResolving: boolean;
  onSelect: (index: number) => void;
  onChange: (index: number, value: string) => void;
  onResolve: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}): ReactNode {
  const canRemove = addresses.length > 1;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <FieldLabel>Pickup Addresses</FieldLabel>

        <span className="text-[8px] text-gray-400">
          {addresses.length} {addresses.length === 1 ? "location" : "locations"}
        </span>
      </div>

      <div className="space-y-2">
        {addresses.map((item, index) => (
          <PickupAddressRow
            key={item.id}
            item={item}
            index={index}
            isActive={index === activeIndex}
            isResolving={isResolving}
            canRemove={canRemove}
            onSelect={() => onSelect(index)}
            onChange={(value) => onChange(index, value)}
            onResolve={() => onResolve(index)}
            onRemove={() => onRemove(index)}
          />
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 text-[9px] font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
        >
          <Plus className="h-3.5 w-3.5" />
          ADD ANOTHER PICKUP ADDRESS
        </button>

        <p className="text-[8px] leading-relaxed text-gray-400">
          Select a pickup address, then click the map to choose its location.
        </p>
      </div>
    </div>
  );
}

function PickupAddressRow({
  item,
  index,
  isActive,
  isResolving,
  canRemove,
  onSelect,
  onChange,
  onResolve,
  onRemove,
}: {
  item: PickupAddress;
  index: number;
  isActive: boolean;
  isResolving: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onChange: (value: string) => void;
  onResolve: () => void;
  onRemove: () => void;
}): ReactNode {
  const number = index + 1;
  const isResolved = item.position !== null;

  return (
    <div
      className={`rounded-lg border p-2.5 transition ${
        isActive
          ? "border-brand-secondary bg-[#f8fbf9]"
          : "border-surface-border bg-white"
      }`}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Select pickup address ${number}`}
          className={`flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${
            isActive
              ? "bg-brand-secondary text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {number}
        </button>

        <div className="min-w-0 flex-1">
          <input
            id={`pickup-address-${index}`}
            type="text"
            value={item.address}
            onFocus={onSelect}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onResolve();
              }
            }}
            placeholder={`Enter pickup address ${number}...`}
            className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
          />

          <div className="mt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={onResolve}
              disabled={isResolving || !item.address.trim()}
              className="flex items-center gap-1 text-[8px] font-semibold text-gray-500 hover:text-brand-secondary disabled:opacity-40"
            >
              {isResolving && isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Search className="h-3 w-3" />
              )}
              FIND ON MAP
            </button>

            <span
              className={`text-[8px] ${
                isResolved ? "text-green-600" : "text-gray-400"
              }`}
            >
              {isResolved ? "Location selected" : "Not located"}
            </span>
          </div>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove pickup address ${number}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
