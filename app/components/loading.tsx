export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-64">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
