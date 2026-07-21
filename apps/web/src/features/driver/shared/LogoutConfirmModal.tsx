import { Icon } from "./icons";
import { icons } from "./iconData";

/* Shared "are you sure you want to log out" confirmation, used by every
   page's avatar-menu Logout action (not just Settings) so logging out
   always requires an explicit confirm, everywhere in the app. */
export function LogoutConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <Icon icon={icons.logout} size={18} />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">Log Out?</div>
            <div className="text-xs opacity-55">You'll need to sign in again to access your route.</div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 bg-white border border-gray-200 text-slate-700 rounded-xl py-2.5 font-bold text-sm cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-bold text-sm cursor-pointer"
            onClick={onConfirm}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmModal;