// src/components/logistics/registry/ScheduledReports.jsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Mail, 
  Calendar,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { mockAssetService } from '../../../../services/mockAssetService';

const ScheduledReports = () => {
  const [schedules, setSchedules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableCustomReports, setAvailableCustomReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    reportSource: '', // 'template' or 'custom'
    reportId: '',
    format: 'pdf',
    recipients: [],
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: true
  });

  // Load initial data
  useEffect(() => {
    loadSchedules();
    loadAvailableReports();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await mockAssetService.getScheduledReports();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadAvailableReports = async () => {
    try {
      const [templates, customReports] = await Promise.all([
        mockAssetService.getReportTemplates(),
        mockAssetService.getSavedReports()
      ]);
      setAvailableTemplates(templates);
      setAvailableCustomReports(customReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const createSchedule = async () => {
    setLoading(true);
    try {
      await mockAssetService.createScheduledReport(newSchedule);
      await loadSchedules();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (scheduleId, enabled) => {
    try {
      await mockAssetService.updateScheduledReport(scheduleId, { enabled });
      await loadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await mockAssetService.deleteScheduledReport(scheduleId);
        await loadSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const runScheduleNow = async (scheduleId) => {
    try {
      await mockAssetService.runScheduledReport(scheduleId);
      await loadSchedules(); // Refresh to update last run
    } catch (error) {
      console.error('Error running schedule:', error);
    }
  };

  const resetForm = () => {
    setNewSchedule({
      name: '',
      description: '',
      reportSource: '',
      reportId: '',
      format: 'pdf',
      recipients: [],
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      enabled: true
    });
  };

  const availableReports = newSchedule.reportSource === 'template' 
    ? availableTemplates 
    : availableCustomReports;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Scheduled Reports</h1>
              <p className="text-gray-600">Automate report delivery via email</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{schedule.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{schedule.description}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                schedule.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {schedule.enabled ? 'Active' : 'Paused'}
              </div>
            </div>

            {/* Schedule Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="capitalize">{schedule.frequency} at {schedule.time}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="capitalize">{schedule.format}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{schedule.recipients.length} recipients</span>
              </div>

              {/* Last Run */}
              {schedule.lastRun && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4" />
                  <span>Last run: {new Date(schedule.lastRun).toLocaleDateString()}</span>
                  {schedule.lastRunStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => runScheduleNow(schedule.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
              
              <button
                onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                  schedule.enabled
                    ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => deleteSchedule(schedule.id)}
                className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No scheduled reports</h3>
          <p className="text-gray-600 mb-6">Create your first automated report schedule</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Create Schedule
          </button>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        
          
        
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create Scheduled Report</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Daily Asset Report"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Brief description of this schedule"
                  />
                </div>
              </div>

              {/* Report Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Source *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewSchedule(prev => ({ ...prev, reportSource: 'template', reportId: '' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      newSchedule.reportSource === 'template'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-800">Template</div>
                    <div className="text-sm text-gray-600 mt-1">Use pre-built report template</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNewSchedule(prev => ({ ...prev, reportSource: 'custom', reportId: '' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      newSchedule.reportSource === 'custom'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-800">Custom Report</div>
                    <div className="text-sm text-gray-600 mt-1">Use saved custom report</div>
                  </button>
                </div>
              </div>

              {/* Report Selection */}
              {newSchedule.reportSource && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Report *
                  </label>
                  <select
                    value={newSchedule.reportId}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, reportId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Choose a report...</option>
                    {availableReports.map(report => (
                      <option key={report.id} value={report.id}>
                        {report.title || report.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Schedule Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency *
                  </label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format *
                  </label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients *
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {newSchedule.recipients.map((email, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {email}
                      <button
                        type="button"
                        onClick={() => setNewSchedule(prev => ({
                          ...prev,
                          recipients: prev.recipients.filter((_, i) => i !== index)
                        }))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const email = e.target.value.trim();
                        if (email && !newSchedule.recipients.includes(email)) {
                          setNewSchedule(prev => ({
                            ...prev,
                            recipients: [...prev.recipients, email]
                          }));
                          e.target.value = '';
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      const email = input.value.trim();
                      if (email && !newSchedule.recipients.includes(email)) {
                        setNewSchedule(prev => ({
                          ...prev,
                          recipients: [...prev.recipients, email]
                        }));
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSchedule}
                disabled={!newSchedule.name || !newSchedule.reportSource || !newSchedule.reportId || newSchedule.recipients.length === 0 || loading}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;