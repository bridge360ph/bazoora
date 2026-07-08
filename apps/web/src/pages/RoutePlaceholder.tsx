// Temporary stand-in for a screen that hasn't been built yet.
// To ship a real screen: swap this element in App.tsx for your page component,
// e.g. <Route path="fleet" element={<FleetManagementPage />} />
export function RoutePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          This screen is coming soon. Replace this placeholder with your page
          component in <code className="rounded bg-gray-200 px-1">App.tsx</code>.
        </p>
      </div>
    </div>
  );
}
