'use client';

interface Props {
  rows: string[][];
  filename: string;
}

export default function ExportCsvButton({ rows, filename }: Props) {
  function handleExport() {
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas, quotes, or newlines
            const escaped = cell.replace(/"/g, '""');
            return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
          })
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="border border-[#1A3265] text-[#7AAAC8] text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0F2040] hover:text-[#EAF4FF] transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  );
}
