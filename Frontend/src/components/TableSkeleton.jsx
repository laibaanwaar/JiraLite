function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
}

function TableSkeleton({ rows = 5, columns = 6 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`roles-skeleton-row-${rowIndex}`} className="bg-white">
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={`roles-skeleton-cell-${rowIndex}-${columnIndex}`} className="border-b border-slate-100 px-5 py-4">
          {columnIndex === 0 ? (
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-xl" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          ) : columnIndex === 2 ? (
            <SkeletonBlock className="h-4 w-40" />
          ) : columnIndex === 4 ? (
            <SkeletonBlock className="h-7 w-16 rounded-full" />
          ) : columnIndex === 5 ? (
            <div className="flex justify-end">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
            </div>
          ) : (
            <SkeletonBlock className="h-4 w-20" />
          )}
        </td>
      ))}
    </tr>
  ))
}

export default TableSkeleton
