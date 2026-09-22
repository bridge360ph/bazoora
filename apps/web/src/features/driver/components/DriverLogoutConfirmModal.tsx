import { Icon } from "../shared/icons";
import { icons } from "../shared/iconData";

interface DriverLogoutConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DriverLogoutConfirmModal({
  onCancel,
  onConfirm,
}: DriverLogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Icon icon={icons.logout} size={18} />
          </div>

          <div>
            <div className="text-base font-bold text-slate-900">
              Log Out?
            </div>
            <div className="text-xs opacity-55">
              You'll need to sign in again to access your route.
            </div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 cursor-pointer rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverLogoutConfirmModal;

