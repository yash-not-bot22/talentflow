import React, { useState, useEffect } from 'react';
import { useJobs, useJobOperations } from '../hooks/useJobs';
import { JobsEndpointTester } from '../components/JobsEndpointTester';
import { CandidatesEndpointTester } from '../../candidates/components/CandidatesEndpointTester';
import { AssessmentsEndpointTester } from '../../assessments/components/AssessmentsEndpointTester';
import { DatabaseDiagnostics } from '../../../components/DatabaseDiagnostics';
import { Notification } from '../../../components/Notification';
import { useNotifications } from '../../../hooks/useNotifications';
import type { Job } from '../../../db';

export function JobsBoard() {
  console.log('🔧 JobsBoard component rendering...');
  
  const {
    jobs,
    filters,
    pagination,
    loading,
    error,
    updateFilters,
    updatePagination,
    refreshJobs,
  } = useJobs();

  const { createJob, updateJob, reorderJob, selectedJob, selectJob } = useJobOperations();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    status: 'active' as 'active' | 'archived',
    tags: '',
    order: '',
  });

  const [updateForm, setUpdateForm] = useState({
    title: '',
    status: 'active' as 'active' | 'archived',
    tags: '',
    order: '',
  });

  // Debug logging
  useEffect(() => {
    console.log('🔧 Modal states - showCreateForm:', showCreateForm, 'showUpdateForm:', showUpdateForm);
    console.log('🔧 Current jobs count:', jobs.length);
    console.log('🔧 Loading state:', loading);
    console.log('🔧 Selected job:', selectedJob);
    if (error) console.log('🔧 Error state:', error);
  }, [showCreateForm, showUpdateForm, jobs.length, loading, error, selectedJob]);

  // Debug modal rendering
  useEffect(() => {
    console.log('🔧 CREATE MODAL - Should render?', showCreateForm);
    console.log('🔧 UPDATE MODAL - Should render?', showUpdateForm && selectedJob);
  }, [showCreateForm, showUpdateForm, selectedJob]);

  // Handle create job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Create Job form submitted with data:', createForm);
    
    try {
      console.log('🌐 Calling createJob API...');
      const jobData: any = {
        title: createForm.title,
        status: createForm.status,
        tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };
      
      // Only include order if provided
      if (createForm.order && createForm.order.trim() !== '') {
        const orderNum = parseInt(createForm.order.trim());
        if (!isNaN(orderNum) && orderNum > 0) {
          jobData.order = orderNum;
        }
      }
      
      const result = await createJob(jobData);
      console.log('✅ Create Job API response:', result);
      
      setCreateForm({ title: '', status: 'active', tags: '', order: '' });
      setShowCreateForm(false);
      refreshJobs(); // Refresh the jobs list
      showSuccess('Job Created', `Successfully created job "${createForm.title}"`);
    } catch (err) {
      console.error('❌ Failed to create job:', err);
      showError('Failed to Create Job', err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  // Handle update job
  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    console.log('🚀 Update Job form submitted with data:', updateForm, 'for job:', selectedJob.id);

    try {
      console.log('🌐 Calling updateJob API...');
      const updateData: any = {
        title: updateForm.title,
        status: updateForm.status,
        tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };
      
      // Only include order if provided and different from current
      if (updateForm.order && updateForm.order.trim() !== '') {
        const orderNum = parseInt(updateForm.order.trim());
        if (!isNaN(orderNum) && orderNum > 0) {
          updateData.order = orderNum;
        }
      }
      
      const result = await updateJob(selectedJob.id, updateData);
      console.log('✅ Update Job API response:', result);
      
      setShowUpdateForm(false);
      selectJob(null);
      refreshJobs(); // Refresh the jobs list
      showSuccess('Job Updated', `Successfully updated job "${updateForm.title}"`);
    } catch (err) {
      console.error('❌ Failed to update job:', err);
      showError('Failed to Update Job', err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  // Handle reorder job (simple up/down for testing)
  const handleReorderJob = async (job: Job, direction: 'up' | 'down') => {
    const sortedJobs = [...jobs].sort((a, b) => a.order - b.order);
    const currentIndex = sortedJobs.findIndex(j => j.id === job.id);
    
    if (currentIndex === -1) return;
    
    let targetOrder: number;
    if (direction === 'up' && currentIndex > 0) {
      targetOrder = sortedJobs[currentIndex - 1].order;
    } else if (direction === 'down' && currentIndex < sortedJobs.length - 1) {
      targetOrder = sortedJobs[currentIndex + 1].order;
    } else {
      return; // Can't move further
    }

    try {
      await reorderJob(job.id, job.order, targetOrder);
      showSuccess('Job Reordered', `Successfully moved "${job.title}"`);
    } catch (err) {
      console.error('Failed to reorder job:', err);
      showError(
        'Failed to Reorder Job', 
        `Could not move "${job.title}". Changes have been rolled back.`
      );
    }
  };

  // Open update form with job data
  const openUpdateForm = (job: Job) => {
    console.log('🔧 Edit Job button clicked for job:', job.title);
    console.log('🔧 Before setState - showUpdateForm:', showUpdateForm);
    console.log('🔧 Before setState - selectedJob:', selectedJob);
    selectJob(job);
    setUpdateForm({
      title: job.title,
      status: job.status,
      tags: job.tags.join(', '),
      order: job.order.toString(),
    });
    setShowUpdateForm(true);
    console.log('🔧 After setState called - should be true');
    // Force a re-render check
    setTimeout(() => {
      console.log('🔧 After timeout - showUpdateForm:', showUpdateForm);
      console.log('🔧 After timeout - selectedJob:', selectedJob);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Database Diagnostics */}
      <DatabaseDiagnostics />
      
      {/* Endpoint Testers */}
      <JobsEndpointTester />
      <CandidatesEndpointTester />
      <AssessmentsEndpointTester />
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs Board</h1>
            <p className="text-gray-600 mt-1">Manage your job postings and candidates</p>
          </div>
          <button
            onClick={() => {
              console.log('🔧 Create Job button clicked');
              console.log('🔧 Before setState - showCreateForm:', showCreateForm);
              setShowCreateForm(true);
              console.log('🔧 After setState called - should be true');
              // Force a re-render check
              setTimeout(() => {
                console.log('🔧 After timeout - showCreateForm:', showCreateForm);
              }, 100);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
          >
            + Create Job
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Reload page
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search jobs..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as any })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value as any })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="order">Order</option>
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={refreshJobs}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No jobs yet</h3>
            <p className="text-gray-500 mt-2">Get started by creating your first job posting!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {jobs
              .sort((a, b) => a.order - b.order)
              .map((job, index) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status === 'active' ? '● Active' : '○ Archived'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>Position #{job.order}</span>
                        <span>•</span>
                        <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      {/* Reorder buttons */}
                      <button
                        onClick={() => handleReorderJob(job, 'up')}
                        disabled={index === 0 || loading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReorderJob(job, 'down')}
                        disabled={index === jobs.length - 1 || loading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Edit button */}
                      <button
                        onClick={() => openUpdateForm(job)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 rounded-lg shadow">
          <div className="flex justify-between items-center w-full">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => updatePagination({ page: pagination.page - 1 })}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => updatePagination({ page: pagination.page + 1 })}
                disabled={!pagination.hasMore || loading}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug: Show modal states */}
      <div className="fixed top-4 right-4 bg-yellow-100 p-2 text-xs z-50 border rounded">
        Create Modal: {showCreateForm ? 'TRUE' : 'FALSE'} | 
        Update Modal: {showUpdateForm ? 'TRUE' : 'FALSE'} |
        Selected Job: {selectedJob ? selectedJob.title : 'NONE'}
      </div>

      {/* Create Job Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreateForm(false);
          }
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: '#111827'
            }}>Create New Job</h2>
            
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Job Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Senior React Developer"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="remote, senior, react, typescript"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Order (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={createForm.order}
                  onChange={(e) => setCreateForm({ ...createForm, order: e.target.value })}
                  placeholder="Leave empty to add at end"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px'
                }}>Specify position in job list. Other jobs will be reordered automatically.</p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Job Modal */}
      {showUpdateForm && selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowUpdateForm(false);
            selectJob(null);
          }
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: '#111827'
            }}>Edit Job: {selectedJob.title}</h2>
            
            <form onSubmit={handleUpdateJob} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Job Title *</label>
                <input
                  type="text"
                  required
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                  placeholder="e.g. Senior React Developer"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={updateForm.tags}
                  onChange={(e) => setUpdateForm({ ...updateForm, tags: e.target.value })}
                  placeholder="remote, senior, react, typescript"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Order</label>
                <input
                  type="number"
                  min="1"
                  value={updateForm.order}
                  onChange={(e) => setUpdateForm({ ...updateForm, order: e.target.value })}
                  placeholder="Position in job list"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px'
                }}>Change position in job list. Other jobs will be reordered automatically.</p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    selectJob(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  Update Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}