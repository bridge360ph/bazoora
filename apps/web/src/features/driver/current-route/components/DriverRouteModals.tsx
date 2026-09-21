interface DriverRouteModalsProps {
  locationExplanationOpen: boolean;
  locationPermissionOpen: boolean;
  startRouteConfirmOpen: boolean;
  confirmOpen: boolean;
  tooFarModalOpen: boolean;
  distanceRemaining: number;

  onLocationExplanationContinue: () => void;
  onRequestLocation: () => void;
  onStartRouteCancel: () => void;
  onStartRouteConfirm: () => void;
  onLogoutCancel: () => void;
  onLogoutConfirm: () => void;
  onTooFarClose: () => void;
}

export default function DriverRouteModals({
  locationExplanationOpen,
  locationPermissionOpen,
  startRouteConfirmOpen,
  confirmOpen,
  tooFarModalOpen,
  distanceRemaining,

  onLocationExplanationContinue,
  onRequestLocation,
  onStartRouteCancel,
  onStartRouteConfirm,
  onLogoutCancel,
  onLogoutConfirm,
  onTooFarClose,
}: DriverRouteModalsProps) {
  return (
    <>
      {locationExplanationOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Location Access
            </h2>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Bazoora needs access to your
              location while you are using
              the driver route feature. Your
              location helps the app show
              your position on the route map
              and provide accurate route
              tracking.
            </p>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Please understand that
              location access is required
              before you can view and use
              the route map.
            </p>

            <button
              type="button"
              onClick={
                onLocationExplanationContinue
              }
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {locationPermissionOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Allow Location Access
            </h2>

            <p className="mt-3 text-sm leading-5 text-slate-500">
              Allow Bazoora to access your
              location so your position can
              be displayed on the route map.
            </p>

            <button
              type="button"
              onClick={onRequestLocation}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Allow Location Access
            </button>
          </div>
        </div>
      )}

      {startRouteConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Start Route?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Starting the route will enable
              GPS tracking and allow Bazoora
              to provide your route
              directions and estimated
              arrival time.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onStartRouteCancel}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onStartRouteConfirm}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
              >
                Start Route
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6">
            <div>
              <div className="text-base font-bold text-slate-900">
                Log Out?
              </div>

              <div className="text-xs opacity-55">
                You'll need to sign in again
                to access your route.
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-slate-700"
                onClick={onLogoutCancel}
              >
                Cancel
              </button>

              <button
                type="button"
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white"
                onClick={onLogoutConfirm}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {tooFarModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              You're not at the collection point
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Move closer before marking
              this stop as complete.
            </p>

            <p className="mt-2 text-sm font-medium">
              Distance remaining:{" "}
              {distanceRemaining} m
            </p>

            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-white"
              onClick={onTooFarClose}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

