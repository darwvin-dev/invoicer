import React, { useState, useEffect } from 'react';
import {
  CalendarIcon, DocumentTextIcon, ArrowDownTrayIcon,
  XMarkIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';
import { useForm } from 'react-hook-form';

const LIMIT = 10;

const DailyReports = () => {
  const [dailyReport, setDailyReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    register: dailyRegister,
    handleSubmit: handleDailySubmit,
    formState: { errors: dailyErrors },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      publish: false,
    },
  });

  const {
    register: listRegister,
    handleSubmit: handleListSubmit,
  } = useForm({
    defaultValues: {
      startDate: '',
      endDate: '',
    },
  });

  // ------ Helpers

  const toISOStart = (dateStr) =>
    dateStr ? new Date(`${dateStr}T00:00:00.000Z`).toISOString() : undefined;

  const toISOEnd = (dateStr) =>
    dateStr ? new Date(`${dateStr}T23:59:59.999Z`).toISOString() : undefined;

  // ------ API calls

  const fetchDailyReport = async (data) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/reports/daily', {
        params: {
          date: data.date,    
          publish: data.publish,
        },
      });
      setDailyReport(response.data);
      setIsDailyModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedReports = async (params= {}) => {
    try {
      setLoading(true);

      const query= {
        page: currentPage,
        limit: LIMIT,
      };

      if (params.startDate) query.from = toISOStart(params.startDate);
      if (params.endDate) query.to = toISOEnd(params.endDate);

      const response = await axiosInstance.get('/reports', { params: query });

      const items = response.data?.items ?? [];
      const total = response.data?.total ?? 0;

      setSavedReports(items);
      setTotalPages(Math.max(1, Math.ceil(total / LIMIT)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportById = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/reports/${id}`);
      setCurrentReport(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedReports();
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage and track system reports</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setIsDailyModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Daily Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <form onSubmit={handleListSubmit(fetchSavedReports)}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...listRegister('startDate')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                {...listRegister('endDate')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {savedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                    <p className="mt-1 text-sm text-gray-500">You can create your first report</p>
                  </td>
                </tr>
              ) : (
                savedReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{report._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.dateRange?.from
                        ? new Date(report.dateRange.from).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Daily
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.totalSalesAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Saved
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => fetchReportById(report._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {savedReports.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daily Report Modal */}
      {isDailyModalOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-sm">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-900">
                  Create Daily Report
                </h3>
                <button
                  onClick={() => setIsDailyModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleDailySubmit(fetchDailyReport)} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...dailyRegister('date')}
                    className={`block w-full pl-3 pr-10 py-2.5 border ${
                      dailyErrors.date ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {dailyErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{dailyErrors.date.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="publish"
                    type="checkbox"
                    {...dailyRegister('publish')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="publish" className="ml-2 block text-sm text-gray-900">
                    Publish Report
                  </label>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDailyModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
                  >
                    {loading ? 'Processing...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {isDetailModalOpen && currentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Report Details #{currentReport._id.slice(-6)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentReport.dateRange?.from
                      ? new Date(currentReport.dateRange.from).toLocaleDateString()
                      : '-'}
                    {' '}→{' '}
                    {currentReport.dateRange?.to
                      ? new Date(currentReport.dateRange.to).toLocaleDateString()
                      : '-'}
                    {currentReport.dateRange?.tz ? ` (${currentReport.dateRange.tz})` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">General Information</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created At:</span>
                        <span>
                          {currentReport.createdAt
                            ? new Date(currentReport.createdAt).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="text-green-600">Saved</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span>
                          {currentReport.totalSalesAmount?.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Summary</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Count:</span>
                        <span>{currentReport.items?.length ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timezone:</span>
                        <span>{currentReport.dateRange?.tz || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-4">Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(currentReport.items ?? []).map((row, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {row.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {row.totalQuantity}
                          </td>
                        </tr>
                      ))}
                      {(!currentReport.items || currentReport.items.length === 0) && (
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-sm text-gray-500">
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    // Simple JSON download
                    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `daily-report-${currentReport._id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;
