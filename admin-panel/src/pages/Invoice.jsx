import React, { useState, useEffect } from 'react';
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, DocumentTextIcon,
  XMarkIcon, ChevronDownIcon, CheckIcon, ClockIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';

const itemsPerPage = 10;

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  currency: z.string().min(1, 'Currency is required'),
  items: z.array(
    z.object({
      sku: z.string().min(1, 'SKU is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Price must be positive'),
    })
  ).min(1, 'At least one item is required'),
});

const StatusBadge = ({ status }) => {
  const statusMap = {
    paid: { color: 'bg-green-100 text-green-800', icon: CheckIcon },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
    overdue: { color: 'bg-red-100 text-red-800', icon: ClockIcon }
  };
  const StatusIcon = (statusMap[status]?.icon || ClockIcon);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[status]?.color || 'bg-gray-100 text-gray-800'}`}>
      <StatusIcon className="h-3.5 w-3.5 mr-1" />
      {status}
    </span>
  );
};

const TableSkeleton = () => (
  <>
    {Array.from({ length: itemsPerPage }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-2/3" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2" /></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-full w-20" /></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-md" />
            <div className="h-8 w-8 bg-gray-200 rounded-md" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customers, setCustomers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      currency: 'USD',
      items: [{ sku: '', quantity: 1, unitPrice: 0 }],
    }
  });

  const items = watch('items');
  const currency = watch('currency');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const customersRes = await axiosInstance.get('/customers');
        setCustomers(customersRes.data?.data || []);

        // Invoices
        const invoicesRes = await axiosInstance.get('/invoices', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            q: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
          }
        });

        setInvoices(invoicesRes.data?.data || []);
        setTotalPages(invoicesRes.data?.meta?.totalPages || 1);
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/invoices', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          q: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      setInvoices(response.data?.data || []);
      setTotalPages(response.data?.meta?.totalPages || 1);
    } catch {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCurrentInvoice(null);
    reset({
      customerId: '',
      currency: 'USD',
      items: [{ sku: '', quantity: 1, unitPrice: 0 }],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setCurrentInvoice(invoice);
    reset({
      customerId: invoice.customerId,
      currency: invoice.currency,
      items: invoice.items,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const invoiceTotal = data.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

      if (currentInvoice) {
        await axiosInstance.patch(`/invoices/${currentInvoice._id}`, { ...data, invoiceTotal });
        toast.success('Invoice updated successfully');
      } else {
        await axiosInstance.post('/invoices', { ...data, invoiceTotal });
        toast.success('Invoice created successfully');
        setCurrentPage(1);
      }

      setIsModalOpen(false);
      await fetchInvoices();
    } catch (error) {
      const msg = error?.response?.data?.error?.message || error?.response?.data?.message || 'An error occurred';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await axiosInstance.delete(`/invoices/${id}`);
      toast.success('Invoice deleted successfully');
      await fetchInvoices();
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const addItem = () => {
    setValue('items', [...items, { sku: '', quantity: 1, unitPrice: 0 }]);
  };
  const removeItem = (index) => {
    if (items.length <= 1) return;
    const next = [...items];
    next.splice(index, 1);
    setValue('items', next);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage and track your invoices</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              onClick={() => setIsDropdownOpen((v) => !v)}
            >
              {statusFilter === 'all' ? 'All Statuses' : statusFilter}
              <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" />
            </button>

            {isDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {['all', 'paid', 'pending', 'overdue'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setIsDropdownOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === s ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {s === 'all' ? 'All Statuses' : s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        New Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const customer = customers.find(c => (c._id || c.id) === inv.customerId);
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{inv._id.slice(-6)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{customer?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={inv.status || 'pending'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-500" />
                          {Number(inv.invoiceTotal || 0).toFixed(2)} {inv.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => openEditModal(inv)} className="text-blue-600 hover:text-blue-900" title="Edit">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(inv._id)} className="text-red-600 hover:text-red-900" title="Delete">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoices.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Page {currentPage} / {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 text-sm rounded-md ${currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setIsModalOpen(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentInvoice ? `Edit Invoice #${currentInvoice._id.slice(-6)}` : 'Create New Invoice'}
                    </h3>
                  </div>
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setIsModalOpen(false)}>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('customerId')}
                        className={`block w-full pl-3 pr-10 py-2.5 border ${errors.customerId ? 'border-red-300' : 'border-gray-300'}
                          rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select a customer</option>
                        {customers.map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                      {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('currency')}
                        className={`block w-full pl-3 pr-10 py-2.5 border ${errors.currency ? 'border-red-300' : 'border-gray-300'}
                          rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h4>
                    {errors.items && <p className="mb-4 text-sm text-red-600">{errors.items.message}</p>}

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register(`items.${index}.sku`)}
                              className={`block w-full pl-3 pr-10 py-2.5 border ${errors.items?.[index]?.sku ? 'border-red-300' : 'border-gray-300'}
                                rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            />
                            {errors.items?.[index]?.sku && <p className="mt-1 text-sm text-red-600">{errors.items[index]?.sku?.message}</p>}
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              min="1"
                              className={`block w-full pl-3 pr-10 py-2.5 border ${errors.items?.[index]?.quantity ? 'border-red-300' : 'border-gray-300'}
                                rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            />
                            {errors.items?.[index]?.quantity && <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>}
                          </div>

                          <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">{currency}</span>
                              </div>
                              <input
                                type="number"
                                {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                min="0"
                                step="0.01"
                                className={`block w-full pl-12 pr-10 py-2.5 border ${errors.items?.[index]?.unitPrice ? 'border-red-300' : 'border-gray-300'}
                                  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              />
                            </div>
                            {errors.items?.[index]?.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.items[index]?.unitPrice?.message}</p>}
                          </div>

                          <div className="col-span-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="inline-flex items-center px-3 py-2 rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="mt-4 inline-flex items-center px-3 py-2 rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between py-2 text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            {currency} {items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-200 mt-2 pt-2">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-blue-600">
                            {currency} {items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
                    >
                      {loading ? (currentInvoice ? 'Updating...' : 'Creating...') : (currentInvoice ? 'Update Invoice' : 'Create Invoice')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
