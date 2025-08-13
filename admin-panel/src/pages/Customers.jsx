import React, { useState, useEffect } from 'react';
import {
  PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon,
  UserIcon, EnvelopeIcon, LockClosedIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../api/axiosInstance';
import ConfirmDialog from '../components/ConfirmDialog';

const itemsPerPage = 8;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '',
    phone: '', address: '',
    password: '', confirmPassword: ''
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchCustomers = async (signal = null) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/customers', {
        params: { page: currentPage, limit: itemsPerPage, q: searchTerm || undefined },
        signal,
      });
      const { data, meta } = res.data || {};
      setCustomers(data || []);
      const total = meta?.total ?? 0;
      setTotalItems(total);
      const pages = meta?.totalPages ?? Math.ceil(total / itemsPerPage);
      setTotalPages(Math.max(1, pages || 1));
      setError('');
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return;
      setError(err?.response?.data?.error?.message || 'Failed to fetch customers. Please try again.');
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [currentPage, searchTerm]);

  const requestDelete = (customer) => {
    setToDelete(customer);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setConfirmLoading(true);
    try {
      await axiosInstance.delete(`/customers/${toDelete._id}`);
      setSuccess('Customer deleted successfully!');
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        await fetchCustomers();
      }
    } catch {
      setError('Failed to delete customer. Please try again.');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const openCreateModal = () => {
    setCurrentCustomer(null);
    setFormData({
      name: '', email: '',
      phone: '', address: '',
      password: '', confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      password: '', confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (currentCustomer) {
        if (formData.password) {
          if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            setLoading(false);
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
          }
        }

        await axiosInstance.patch(`/customers/${currentCustomer._id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          password: formData.password || undefined,
        });
        setSuccess('Customer updated successfully!');
      } else {
        if (!formData.password || formData.password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        await axiosInstance.post('/customers', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          password: formData.password,
        });
        setSuccess('Customer created successfully!');
        setCurrentPage(1);
      }
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      const apiMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
      setError(apiMsg || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
      await fetchCustomers();
    }
  };

  const TableSkeleton = () => (
    <>
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" /></td>
          <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" /></td>
          <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" /></td>
          <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" /></td>
          <td className="py-4 px-6 text-right">
            <div className="flex justify-end space-x-2">
              <div className="h-8 w-8 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Customer Management</h1>
        <p className="text-gray-600">Manage your customers with ease. Create, edit, and delete customer records.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg"><p className="text-sm text-green-700">{success}</p></div>}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-1/3">
            <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); }}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={openCreateModal}
              className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Customer
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
                      <p className="text-gray-500">Try adjusting your search or add a new customer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {customer.name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openEditModal(customer)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => requestDelete(customer)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            {totalItems > 0 ? (
              <>
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
              </>
            ) : ('No results')}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 text-sm rounded-md ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-white/80" aria-hidden="true" onClick={() => setIsModalOpen(false)} />
          <div
            className="relative z-10 flex min-h-full items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white text-left shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{currentCustomer ? 'Edit Customer' : 'Create New Customer'}</h3>
                      <p className="text-gray-500 mt-1">{currentCustomer ? 'Update customer details' : 'Add a new customer to your system'}</p>
                    </div>
                    <button type="button" className="text-gray-400 hover:text-gray-500 transition-colors" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text" name="name" value={formData.name} onChange={handleInputChange} required
                        placeholder="Full Name"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleInputChange} required
                        placeholder="Email Address"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password" name="password" value={formData.password} onChange={handleInputChange}
                        required={!currentCustomer}
                        placeholder={currentCustomer ? 'New password (optional, min 8 chars)' : 'Password (min 8 chars)'}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {(!currentCustomer || formData.password) && (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                          required={!currentCustomer || !!formData.password}
                          placeholder="Confirm Password"
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md transition-all disabled:opacity-70">
                    {loading ? (currentCustomer ? 'Updating...' : 'Creating...') : (currentCustomer ? 'Update Customer' : 'Create Customer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        loading={confirmLoading}
        title="Delete customer"
        message={toDelete ? `Are you sure you want to delete "${toDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Customers;
