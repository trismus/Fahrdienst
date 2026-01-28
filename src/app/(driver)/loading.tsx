export default function DriverLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
        <p className="mt-4 text-gray-600">Wird geladen...</p>
      </div>
    </div>
  );
}
