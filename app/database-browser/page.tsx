'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function DatabaseBrowser() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setConnectionStatus('connecting');
    setMessage('Testing connection...');

    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionUrl }),
      });

      const result = await response.json();

      if (response.ok) {
        setConnectionStatus('connected');
        setMessage('Connected successfully.');
        localStorage.setItem('database_url', connectionUrl);
        await loadTables();
        return;
      }

      setConnectionStatus('error');
      setMessage(`Connection failed: ${result.error}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionStatus('error');
      setMessage(`Connection failed: ${errorMessage}`);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch('/api/database/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionUrl }),
      });

      const result = await response.json();

      if (response.ok) {
        setTables(result.tables);
        return;
      }

      setMessage(`Failed to load tables: ${result.error}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tables';
      setMessage(`Failed to load tables: ${errorMessage}`);
    }
  };

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setMessage('Loading table data...');

    try {
      const response = await fetch('/api/database/table-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionUrl, tableName }),
      });

      const result = await response.json();

      if (response.ok) {
        setTableData(result);
        setMessage(`Loaded ${result.rows.length} rows from ${tableName}.`);
        return;
      }

      setMessage(`Failed to load table data: ${result.error}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load table data';
      setMessage(`Failed to load table data: ${errorMessage}`);
    }
  };

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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-[#0F2651]">Database Browser</h1>
            <p className="text-gray-600">Visual tool to explore your Neon PostgreSQL database</p>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={testConnection}
              disabled={connectionStatus === 'connecting'}
              className="bg-[#36689e] text-white hover:bg-[#0F2651]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Connection Status</CardTitle>
          <CardDescription>Configure and test your database connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="connectionUrl">Database Connection URL</Label>
              <Input
                id="connectionUrl"
                placeholder="postgresql://username:password@host:port/database"
                value={connectionUrl}
                onChange={(event) => setConnectionUrl(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Connection Status</Label>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(connectionStatus)}>
                  {getStatusIcon(connectionStatus)}
                  <span className="ml-2 capitalize">{connectionStatus}</span>
                </Badge>
                {connectionStatus === 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTables}
                    className="border-[#36689e] text-[#0F2651]"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Refresh Tables
                  </Button>
                )}
              </div>
            </div>
          </div>
          {message && (
            <div className={`mt-4 rounded p-3 ${connectionStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {connectionStatus === 'connected' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0F2651]">Tables</CardTitle>
                <CardDescription>Your database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tables.map((table) => (
                    <div
                      key={table.table_name}
                      className={`cursor-pointer rounded-lg border-2 p-3 ${
                        selectedTable === table.table_name
                          ? 'border-[#36689e] bg-[#36689e]/10'
                          : 'border-gray-200 hover:border-[#36689e] hover:bg-gray-50'
                      }`}
                      onClick={() => loadTableData(table.table_name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Table className="h-4 w-4 text-[#36689e]" />
                          <span className="font-medium">{table.table_name}</span>
                        </div>
                        <Badge variant="secondary">{table.row_count} rows</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedTable && tableData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#0F2651]">{selectedTable}</CardTitle>
                      <CardDescription>{tableData.rows.length} rows found</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => loadTableData(selectedTable)}
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
                          {tableData.columns.map((column, index) => (
                            <th key={index} className="border-b px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {tableData.columns.map((column, cellIndex) => (
                              <td key={cellIndex} className="border-b px-4 py-2 text-sm">
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
                  <CardDescription>Click on a table from the sidebar to view its data</CardDescription>
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
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Get Your Connection URL</h3>
              <p className="text-sm text-gray-600">
                From your Neon dashboard, go to your project and copy the connection string.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Test Connection</h3>
              <p className="text-sm text-gray-600">
                Paste the URL in the field above and click `Test Connection`.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Explore Data</h3>
              <p className="text-sm text-gray-600">
                Once connected, you`ll see all your tables and can view their data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
