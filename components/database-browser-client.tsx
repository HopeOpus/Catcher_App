'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Table,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface DatabaseTable {
  table_name: string;
  row_count: number;
}

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function DatabaseBrowserClient() {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [message, setMessage] = useState('Checking secure database access...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTables = async () => {
    const response = await fetch('/api/database/tables', {
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || 'Failed to load tables');
    }

    setTables(Array.isArray(result?.tables) ? result.tables : []);
  };

  const testConnection = async () => {
    setIsRefreshing(true);
    setConnectionStatus('connecting');
    setMessage('Testing connection...');

    try {
      const response = await fetch('/api/database/test', {
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Connection failed');
      }

      setConnectionStatus('connected');
      setMessage('Connected securely to the application database.');
      await loadTables();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Connection failed';
      setConnectionStatus('error');
      setTables([]);
      setTableData(null);
      setSelectedTable(null);
      setMessage(`Connection failed: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setMessage(`Loading ${tableName}...`);

    try {
      const response = await fetch(
        `/api/database/table-data?tableName=${encodeURIComponent(tableName)}`,
        {
          cache: 'no-store',
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load table data');
      }

      setTableData({
        columns: Array.isArray(result?.columns) ? result.columns : [],
        rows: Array.isArray(result?.rows) ? result.rows : [],
      });
      setMessage(`Loaded ${result?.rows?.length ?? 0} rows from ${tableName}.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load table data';
      setTableData(null);
      setMessage(`Failed to load table data: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsRefreshing(true);
      setConnectionStatus('connecting');
      setMessage('Testing connection...');

      try {
        const response = await fetch('/api/database/test', {
          cache: 'no-store',
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.error || 'Connection failed');
        }

        const tablesResponse = await fetch('/api/database/tables', {
          cache: 'no-store',
        });
        const tablesResult = await tablesResponse.json().catch(() => null);

        if (!tablesResponse.ok) {
          throw new Error(tablesResult?.error || 'Failed to load tables');
        }

        setConnectionStatus('connected');
        setMessage('Connected securely to the application database.');
        setTables(Array.isArray(tablesResult?.tables) ? tablesResult.tables : []);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Connection failed';
        setConnectionStatus('error');
        setTables([]);
        setTableData(null);
        setSelectedTable(null);
        setMessage(`Connection failed: ${errorMessage}`);
      } finally {
        setIsRefreshing(false);
      }
    };

    void initialize();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const formatCellValue = (value: unknown) => {
    if (value === null) {
      return 'NULL';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-[#0F2651]">Database Browser</h1>
            <p className="text-gray-600">
              Internal tool for inspecting the application database safely.
            </p>
          </div>
          <Button
            onClick={() => {
              void testConnection();
            }}
            disabled={isRefreshing}
            className="bg-[#36689e] text-white hover:bg-[#0F2651]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Connection
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Secure Internal Access</CardTitle>
          <CardDescription>
            This browser uses the server-side application database configuration only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Database Target</p>
              <p className="mt-1 text-base font-semibold text-[#0F2651]">
                Application PostgreSQL database
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(connectionStatus)}>
                {getStatusIcon(connectionStatus)}
                <span className="ml-2 capitalize">{connectionStatus}</span>
              </Badge>
            </div>
          </div>
          <div
            className={`mt-4 rounded p-3 ${
              connectionStatus === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        </CardContent>
      </Card>

      {connectionStatus === 'connected' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0F2651]">Tables</CardTitle>
                <CardDescription>Application database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tables.map((table) => (
                    <button
                      key={table.table_name}
                      type="button"
                      className={`w-full rounded-lg border-2 p-3 text-left ${
                        selectedTable === table.table_name
                          ? 'border-[#36689e] bg-[#36689e]/10'
                          : 'border-gray-200 hover:border-[#36689e] hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        void loadTableData(table.table_name);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Table className="h-4 w-4 text-[#36689e]" />
                          <span className="font-medium">{table.table_name}</span>
                        </div>
                        <Badge variant="secondary">{table.row_count} rows</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedTable && tableData ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-[#0F2651]">{selectedTable}</CardTitle>
                      <CardDescription>{tableData.rows.length} rows found</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        void loadTableData(selectedTable);
                      }}
                      className="border-[#36689e] text-[#0F2651]"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {tableData.columns.map((column) => (
                            <th
                              key={column}
                              className="border-b px-4 py-2 text-left text-sm font-semibold text-gray-700"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            {tableData.columns.map((column) => (
                              <td key={column} className="border-b px-4 py-2 text-sm">
                                {formatCellValue(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0F2651]">Select a Table</CardTitle>
                  <CardDescription>
                    Choose a table from the left to inspect its rows.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-8 text-center text-gray-500">
                    <Table className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p>Select a table to view its data</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
