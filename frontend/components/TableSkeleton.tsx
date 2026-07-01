"use client";

export default function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
