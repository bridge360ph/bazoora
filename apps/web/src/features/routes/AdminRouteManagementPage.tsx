import { useEffect, useState } from "react";

type RouteStop = {
  id?: string;
  routeId?: string;
  stopNumber: number;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

type RouteData = {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
  stops: number;
  routeType: string;
  assignedTruckId?: string | null;
  assignedEcoAideId?: string | null;
  assignedTruck?: {
    id: string;
    truckNumber?: string | null;
    plateNumber: string;
  } | null;
  assignedEcoAide?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  routeStops?: RouteStop[];
};

type RouteForm = {
  name: string;
  barangay: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
  routeType: string;
};

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm: RouteForm = {
  name: "",
  barangay: "",
  wasteType: "Regular",
  collectionDay: "Monday",
  startTime: "",
  status: "Not Started",
  routeType: "Collection",
};

export function AdminRouteManagementPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const [collectionPoints, setCollectionPoints] = useState<RouteStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/routes`);

      if (!response.ok) {
        throw new Error("Failed to fetch routes.");
      }

      const data = await response.json();

      console.log("GET /routes response:", data);

      const routeData: RouteData[] = Array.isArray(data)
        ? data
        : Array.isArray(data.routes)
          ? data.routes
          : Array.isArray(data.data)
            ? data.data
            : [];

      setRoutes(routeData);
    } catch (err) {
      console.error(err);
      setError("Unable to load routes.");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openCreateForm = () => {
    setEditingRoute(null);
    setForm(emptyForm);
    setCollectionPoints([]);
    setError("");
    setShowForm(true);
  };

  const fetchCollectionPoints = async (routeId: string) => {
    try {
      setLoadingStops(true);
      setError("");

      const response = await fetch(`${API_URL}/routes/${routeId}/stops`);

      if (!response.ok) {
        throw new Error("Failed to load collection points.");
      }

      const data = await response.json();

      const stops: RouteStop[] = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

      setCollectionPoints(stops);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load collection points.",
      );
      setCollectionPoints([]);
    } finally {
      setLoadingStops(false);
    }
  };

  const openEditForm = async (route: RouteData) => {
    setEditingRoute(route);

    setForm({
      name: route.name,
      barangay: route.barangay,
      wasteType: route.wasteType,
      collectionDay: route.collectionDay,
      startTime: route.startTime,
      status: route.status,
      routeType: route.routeType,
    });

    setCollectionPoints([]);
    setError("");
    setShowForm(true);

    await fetchCollectionPoints(route.id);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingRoute(null);
    setForm(emptyForm);
    setCollectionPoints([]);
  };

  const updateField = (field: keyof RouteForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addCollectionPoint = () => {
    setCollectionPoints((current) => [
      ...current,
      {
        stopNumber: current.length + 1,
        address: "",
        latitude: null,
        longitude: null,
      },
    ]);
  };

  const updateCollectionPoint = (
    index: number,
    field: keyof Pick<RouteStop, "address">,
    value: string,
  ) => {
    setCollectionPoints((current) =>
      current.map((point, pointIndex) =>
        pointIndex === index
          ? {
              ...point,
              [field]: value,
            }
          : point,
      ),
    );
  };

  const removeCollectionPoint = (index: number) => {
    setCollectionPoints((current) =>
      current
        .filter((_, pointIndex) => pointIndex !== index)
        .map((point, pointIndex) => ({
          ...point,
          stopNumber: pointIndex + 1,
        })),
    );
  };

  const saveRoute = async () => {
    if (!form.name.trim() || !form.barangay.trim()) {
      setError("Route name and barangay are required.");
      return;
    }

    const invalidPoint = collectionPoints.some(
      (point) => !point.address.trim(),
    );

    if (invalidPoint) {
      setError("Please enter an address for every collection point.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = editingRoute
        ? `${API_URL}/routes/${editingRoute.id}`
        : `${API_URL}/routes`;

      const method = editingRoute ? "PATCH" : "POST";

      const routeBody = {
        ...form,
        // Keep legacy fields for backend compatibility.
        waypoints: "",
        stops: collectionPoints.length,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(routeBody),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => null);

        throw new Error(
          responseData?.error ||
            `Failed to ${editingRoute ? "update" : "create"} route.`,
        );
      }

      const responseData = await response.json().catch(() => null);

      const savedRoute: RouteData | null =
        responseData?.data && typeof responseData.data === "object"
          ? responseData.data
          : null;

      const routeId = editingRoute?.id || savedRoute?.id;

      if (!routeId) {
        throw new Error(
          "Route was saved, but its ID could not be determined.",
        );
      }

      if (editingRoute) {
        const originalStops = editingRoute.routeStops || [];

        const currentStopIds = new Set(
          collectionPoints
            .map((point) => point.id)
            .filter((id): id is string => Boolean(id)),
        );

        // Delete collection points that were removed from the form.
        for (const originalStop of originalStops) {
          if (!currentStopIds.has(originalStop.id!)) {
            const deleteResponse = await fetch(
              `${API_URL}/routes/${routeId}/stops/${originalStop.id}`,
              {
                method: "DELETE",
              },
            );

            if (!deleteResponse.ok) {
              throw new Error(
                `Failed to remove collection point ${originalStop.stopNumber}.`,
              );
            }
          }
        }

        // Update existing collection points.
        for (let index = 0; index < collectionPoints.length; index += 1) {
          const point = collectionPoints[index];

          if (!point.id) continue;

          const updateResponse = await fetch(
            `${API_URL}/routes/${routeId}/stops/${point.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: point.address.trim(),
                latitude: point.latitude ?? null,
                longitude: point.longitude ?? null,
              }),
            },
          );

          if (!updateResponse.ok) {
            throw new Error(
              `Failed to update collection point ${index + 1}.`,
            );
          }
        }

        // Add newly created collection points.
        for (const point of collectionPoints) {
          if (point.id) continue;

          const createStopResponse = await fetch(
            `${API_URL}/routes/${routeId}/stops`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: point.address.trim(),
              }),
            },
          );

          if (!createStopResponse.ok) {
            throw new Error(
              `Failed to add collection point ${point.stopNumber}.`,
            );
          }
        }
      } else {
        // Create collection points after the route itself exists.
        for (const point of collectionPoints) {
          const createStopResponse = await fetch(
            `${API_URL}/routes/${routeId}/stops`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: point.address.trim(),
              }),
            },
          );

          if (!createStopResponse.ok) {
            throw new Error(
              `Failed to add collection point ${point.stopNumber}.`,
            );
          }
        }
      }

      await fetchRoutes();
      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to save route.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRoute = async (route: RouteData) => {
    const confirmed = window.confirm(
      `Delete Route ${route.routeNumber} - ${route.name}?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/routes/${route.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => null);

        throw new Error(
          responseData?.error || "Failed to delete route.",
        );
      }

      await fetchRoutes();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to delete route.",
      );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Route Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, manage, and assign collection routes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-[#1f5c45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174936]"
        >
          + Create Route
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading routes...
          </div>
        ) : routes.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No routes yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create your first collection route to get started.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 rounded-lg bg-[#1f5c45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#174936]"
            >
              Create Route
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Route
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Barangay
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Collection
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Stops
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Truck
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Eco-Aide
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        Route {route.routeNumber}
                      </div>

                      <div className="text-sm text-gray-500">
                        {route.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {route.barangay}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-800">
                        {route.collectionDay}
                      </div>

                      <div className="text-xs text-gray-500">
                        {route.startTime || "No start time"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {route.stops}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {route.assignedTruck
                        ? route.assignedTruck.truckNumber ||
                          route.assignedTruck.plateNumber
                        : "Unassigned"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {route.assignedEcoAide?.name ||
                        route.assignedEcoAide?.email ||
                        "Unassigned"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {route.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(route)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRoute(route)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingRoute ? "Edit Route" : "Create Route"}
                </h2>

                <p className="text-sm text-gray-500">
                  Configure the collection route details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Route Name
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="e.g. Morning Residential Route"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Barangay
                </span>

                <input
                  value={form.barangay}
                  onChange={(event) =>
                    updateField("barangay", event.target.value)
                  }
                  placeholder="Barangay"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Route Type
                </span>

                <select
                  value={form.routeType}
                  onChange={(event) =>
                    updateField("routeType", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                >
                  <option value="Collection">Collection</option>

                  <option value="Special Collection">
                    Special Collection
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Collection Day
                </span>

                <select
                  value={form.collectionDay}
                  onChange={(event) =>
                    updateField("collectionDay", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time
                </span>

                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    updateField("startTime", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Waste Type
                </span>

                <select
                  value={form.wasteType}
                  onChange={(event) =>
                    updateField("wasteType", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                >
                  <option value="Regular">Regular</option>

                  <option value="Recyclable">Recyclable</option>

                  <option value="Regular/Non-Recyclable">
                    Regular/Non-Recyclable
                  </option>
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                >
                  <option value="Not Started">Not Started</option>

                  <option value="In Progress">In Progress</option>

                  <option value="Completed">Completed</option>
                </select>
              </label>

              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-medium text-gray-700">
                      Collection Points
                    </span>

                    <p className="mt-1 text-xs text-gray-500">
                      Enter the exact address for each collection point.
                      Coordinates will be generated automatically later.
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {collectionPoints.length}{" "}
                    {collectionPoints.length === 1
                      ? "collection point"
                      : "collection points"}
                  </span>
                </div>

                {loadingStops ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Loading collection points...
                  </div>
                ) : collectionPoints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                    <p className="text-sm text-gray-500">
                      No collection points added yet.
                    </p>

                    <button
                      type="button"
                      onClick={addCollectionPoint}
                      className="mt-3 rounded-lg border border-[#1f5c45] px-4 py-2 text-sm font-medium text-[#1f5c45] hover:bg-[#f0f7f3]"
                    >
                      + Add Collection Point
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collectionPoints.map((point, index) => (
                      <div
                        key={point.id || `new-${index}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f5c45] text-sm font-semibold text-white">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <label>
                              <span className="mb-1 block text-xs font-medium text-gray-600">
                                Collection Point {index + 1}
                              </span>

                              <input
                                value={point.address}
                                onChange={(event) =>
                                  updateCollectionPoint(
                                    index,
                                    "address",
                                    event.target.value,
                                  )
                                }
                                placeholder="Enter exact collection address"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f5c45]"
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCollectionPoint(index)}
                            className="mt-5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addCollectionPoint}
                      className="w-full rounded-lg border border-dashed border-[#1f5c45] px-4 py-2.5 text-sm font-medium text-[#1f5c45] hover:bg-[#f0f7f3]"
                    >
                      + Add Collection Point
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveRoute}
                disabled={saving || loadingStops}
                className="rounded-lg bg-[#1f5c45] px-5 py-2 text-sm font-semibold text-white hover:bg-[#174936] disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingRoute
                    ? "Save Changes"
                    : "Create Route"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

