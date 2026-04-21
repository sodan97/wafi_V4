import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface Column<T> {
  Header: string;
  accessor: keyof T;
  Cell?: React.FC<{ value: any; row: { original: T } }>;
  getRowClassName?: (row: T) => string;
  isNumeric?: boolean;
  isDate?: boolean;
  isTime?: boolean;
  filterOptions?: string[];
}


interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  exportFilename?: string;
  getRowClassName?: (row: T) => string;
}

const DataTable = <T extends object>({ columns, data, exportFilename = 'data', getRowClassName }: DataTableProps<T>) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [timeRange, setTimeRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const filteredAndSortedData = useMemo(() => {
    let filteredData = data.filter(row => {
      return columns.every(col => {
        const filterValue = filters[col.accessor as string]?.toLowerCase() || '';
        const rowValue = String(row[col.accessor]).toLowerCase();

        if (col.isDate && (dateRange.start || dateRange.end)) {
          const parts = rowValue.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const rowDate = new Date(`${year}-${month}-${day}`);

            if (dateRange.start) {
              const startDate = new Date(dateRange.start);
              startDate.setHours(0, 0, 0, 0);
              if (rowDate < startDate) return false;
            }
            if (dateRange.end) {
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999);
              if (rowDate > endDate) return false;
            }
          }
        }

        if (col.isTime && (timeRange.start || timeRange.end)) {
          const rowTime = rowValue;
          if (timeRange.start && rowTime < timeRange.start) return false;
          if (timeRange.end && rowTime > timeRange.end) return false;
        }

        if (filterValue === '') return true;

        return rowValue.includes(filterValue);
      });
    });

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, filters, sortConfig, columns, dateRange, timeRange]);

  const totalSum = useMemo(() => {
    const totalColumn = columns.find(col => col.isNumeric);
    if (!totalColumn) return null;

    return filteredAndSortedData.reduce((sum, row) => {
      const value = String(row[totalColumn.accessor]).replace(/\s/g, '');
      return sum + (parseFloat(value) || 0);
    }, 0);
  }, [filteredAndSortedData, columns]);

  const handleFilterChange = (accessor: keyof T, value: string) => {
    setFilters(prev => ({ ...prev, [accessor as string]: value }));
  };

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCsv = () => {
    const headers = columns.map(c => c.Header).join(',');
    const rows = filteredAndSortedData.map(row =>
        columns.map(col => `"${String(row[col.accessor]).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const csvString = `${headers}\n${rows}`;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFilename}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXlsx = () => {
    const dataToExport = filteredAndSortedData.map(row => {
      let newRow: Record<string, any> = {};
      columns.forEach(col => {
        newRow[col.Header] = row[col.accessor];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportFilename}.xlsx`);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4 items-center flex-wrap">
                <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Date début</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-xs p-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Date fin</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-xs p-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Heure début</label>
                    <input
                        type="time"
                        value={timeRange.start}
                        onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-xs p-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Heure fin</label>
                    <input
                        type="time"
                        value={timeRange.end}
                        onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-xs p-2 border border-gray-300 rounded"
                    />
                </div>
                {totalSum !== null && (
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Total Filtré</label>
                        <div className="text-lg font-bold text-green-600 bg-green-50 px-4 py-2 rounded">
                            {totalSum.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={exportToCsv} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    Exporter en CSV
                </button>
                <button onClick={exportToXlsx} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    Exporter en Excel
                </button>
            </div>
        </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.accessor as string} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col">
                    <button onClick={() => requestSort(col.accessor)} className="font-bold text-left mb-1 flex items-center gap-1">
                      {col.Header}
                      {sortConfig?.key === col.accessor && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </button>
                    {col.filterOptions ? (
                      <select
                        value={filters[col.accessor as string] || ''}
                        onChange={e => handleFilterChange(col.accessor, e.target.value)}
                        className="text-xs p-1 border border-gray-300 rounded"
                      >
                        <option value="">Tous</option>
                        {col.filterOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : !col.isDate && !col.isTime ? (
                      <input
                        type="text"
                        placeholder={`Filtrer...`}
                        value={filters[col.accessor as string] || ''}
                        onChange={e => handleFilterChange(col.accessor, e.target.value)}
                        className="text-xs p-1 border border-gray-300 rounded"
                      />
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.map((row, rowIndex) => {
              const rowClassFromColumns = [
                ...columns.map(c => (c.getRowClassName ? c.getRowClassName(row) : '')),
                getRowClassName ? getRowClassName(row) : ''
              ].filter(Boolean).join(' ');
              return (
                <tr key={rowIndex} className={`hover:bg-gray-50 ${rowClassFromColumns}`}>
                  {columns.map(col => (
                    <td key={col.accessor as string} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${col.Cell ? 'relative' : ''}`}>
                      {col.Cell ? (
                        <col.Cell value={row[col.accessor]} row={{ original: row }} />
                      ) : (
                      String(row[col.accessor])
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedData.length === 0 && (
            <p className="text-center py-10 text-gray-500">Aucune donnée à afficher.</p>
        )}
      </div>
    </div>
  );
};

export default DataTable;
