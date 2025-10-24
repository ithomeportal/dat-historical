'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchFiles();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Success! Uploaded ${data.rowCount} rows from ${data.filename}`);
        setFile(null);
        // Refresh stats and files
        fetchStats();
        fetchFiles();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              DAT Historical Archive
            </h1>
            <p className="text-lg text-gray-600">
              Route Pricing Data Management System
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        {/* Stats Dashboard */}
        {loadingStats ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <p className="text-gray-500">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Rows</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalRows?.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Files</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalFiles}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Unique Routes</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.uniqueRoutes?.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Date Range</div>
              <div className="text-sm font-semibold text-gray-900">
                {stats.dateRange?.earliest_date ? new Date(stats.dateRange.earliest_date).toLocaleDateString() : 'N/A'}
                <br />
                to {stats.dateRange?.latest_date ? new Date(stats.dateRange.latest_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        ) : null}

        {/* Equipment Breakdown */}
        {stats?.equipmentBreakdown && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Equipment Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.equipmentBreakdown.map((item: any, index: number) => (
                <div key={index} className="border rounded p-3">
                  <div className="text-sm font-medium text-gray-500">{item.equipment}</div>
                  <div className="text-xl font-bold text-gray-900">
                    {parseInt(item.count).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New CSV File</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>

            {file && (
              <div className="text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.startsWith('Success')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Recent Files */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Uploaded Files</h2>
          {files.length === 0 ? (
            <p className="text-gray-500">No files uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.slice(0, 20).map((file: any) => (
                    <tr key={file.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {file.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.file_date ? new Date(file.file_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.row_count?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.upload_date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
