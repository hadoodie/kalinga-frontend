// src/components/logistics/registry/ SavedReportsManager.jsx
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
  RefreshCw,
  AlertCircle,
  Settings,
  Copy
} from 'lucide-react';
import { mockAssetService } from '../../../../services/mockAssetService';

const ScheduledReports = ({ prefillTemplate }) => {
  const [schedules, setSchedules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableCustomReports, setAvailableCustomReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'paused' | 'history'

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
    dayOfMonth: 1,
    time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: true,
    includeCharts: true,
    dataRange: 'last-30-days'
  });

  // Load initial data
  useEffect(() => {
    loadSchedules();
    loadAvailableReports();
  }, []);

  // Pre-fill form when template is provided
  useEffect(() => {
    if (prefillTemplate) {
      setNewSchedule(prev => ({
        ...prev,
        name: `Scheduled ${prefillTemplate.name}`,
        description: `Automated delivery: ${prefillTemplate.description}`,
        reportSource: 'template',
        reportId: prefillTemplate.id
      }));
      setShowCreateModal(true);
    }
  }, [prefillTemplate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await mockAssetService.getScheduledReports();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
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
      alert('Error creating schedule. Please try again.');
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
      alert('Error updating schedule. Please try again.');
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      try {
        await mockAssetService.deleteScheduledReport(scheduleId);
        await loadSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error deleting schedule. Please try again.');
      }
    }
  };

  const runScheduleNow = async (scheduleId) => {
    try {
      await mockAssetService.runScheduledReport(scheduleId);
      await loadSchedules(); // Refresh to update last run
      alert('Report scheduled to run immediately. Recipients will receive it shortly.');
    } catch (error) {
      console.error('Error running schedule:', error);
      alert('Error running schedule. Please try again.');
    }
  };

  const duplicateSchedule = async (schedule) => {
    const duplicatedSchedule = {
      ...schedule,
      name: `${schedule.name} (Copy)`,
      id: `schedule-${Date.now()}`,
      enabled: false
    };
    
    try {
      await mockAssetService.createScheduledReport(duplicatedSchedule);
      await loadSchedules();
      alert('Schedule duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating schedule:', error);
      alert('Error duplicating schedule. Please try again.');
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
      dayOfMonth: 1,
      time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      enabled: true,
      includeCharts: true,
      dataRange: 'last-30-days'
    });
  };

  const availableReports = newSchedule.reportSource === 'template' 
    ? availableTemplates 
    : availableCustomReports;

  const filteredSchedules = schedules.filter(schedule => {
    switch (activeTab) {
      case 'active':
        return schedule.enabled;
      case 'paused':
        return !schedule.enabled;
      case 'history':
        return schedule.lastRun; // Show schedules with run history
      default:
        return true;
    }
  });

  const getFrequencyLabel = (frequency, dayOfWeek, dayOfMonth) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly on ${days[dayOfWeek]}`;
      case 'monthly':
        return `Monthly on day ${dayOfMonth}`;
      default:
        return frequency;
    }
  };

  const getStatusColor = (schedule) => {
    if (!schedule.enabled) return 'gray';
    if (schedule.lastRunStatus === 'failed') return 'red';
    return 'green';
  };

  const getStatusIcon = (schedule) => {
    if (!schedule.enabled) return <Pause className="w-4 h-4" />;
    if (schedule.lastRunStatus === 'failed') return <XCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

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
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{schedules.filter(s => s.enabled).length} Active</span>
              </div>
              <div className="flex items-center gap-1">
                <Pause className="w-4 h-4 text-gray-500" />
                <span>{schedules.filter(s => !s.enabled).length} Paused</span>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-6">
          {[
            { id: 'active', label: 'Active', count: schedules.filter(s => s.enabled).length },
            { id: 'paused', label: 'Paused', count: schedules.filter(s => !s.enabled).length },
            { id: 'history', label: 'Run History', count: schedules.filter(s => s.lastRun).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && schedules.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduled reports...</p>
        </div>
      )}

      {/* Schedules Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-lg truncate">{schedule.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{schedule.description}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  getStatusColor(schedule) === 'green' 
                    ? 'bg-green-100 text-green-800' 
                    : getStatusColor(schedule) === 'red'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getStatusIcon(schedule)}
                  {schedule.enabled ? 'Active' : 'Paused'}
                </div>
              </div>

              {/* Schedule Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{getFrequencyLabel(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth)} at {schedule.time}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="capitalize">{schedule.format.toUpperCase()}</span>
                  {schedule.includeCharts && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Charts</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}</span>
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

                {/* Next Run */}
                {schedule.enabled && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Next: Tomorrow at {schedule.time}</span>
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
                
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                      schedule.enabled
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title={schedule.enabled ? 'Pause Schedule' : 'Activate Schedule'}
                  >
                    {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => duplicateSchedule(schedule)}
                    className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Duplicate Schedule"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSchedules.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {activeTab === 'active' && 'No active schedules'}
            {activeTab === 'paused' && 'No paused schedules'}
            {activeTab === 'history' && 'No run history'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'active' && 'Create your first automated report schedule to get started'}
            {activeTab === 'paused' && 'All your schedules are currently active'}
            {activeTab === 'history' && 'Run a schedule to see its history here'}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Create Schedule
            </button>
          )}
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create Scheduled Report</h2>
              <p className="text-gray-600 text-sm mt-1">Configure automated report delivery</p>
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
                    placeholder="Weekly Asset Report"
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
                
                {newSchedule.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day of Week *
                    </label>
                    <select
                      value={newSchedule.dayOfWeek}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}
                
                {newSchedule.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day of Month *
                    </label>
                    <select
                      value={newSchedule.dayOfMonth}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}
                
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
              </div>

              {/* Export Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Range
                  </label>
                  <select
                    value={newSchedule.dataRange}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, dataRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="last-7-days">Last 7 days</option>
                    <option value="last-30-days">Last 30 days</option>
                    <option value="last-90-days">Last 90 days</option>
                    <option value="last-year">Last year</option>
                    <option value="all-time">All time</option>
                  </select>
                </div>
              </div>

              {/* Additional Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSchedule.includeCharts}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Include charts and visualizations</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSchedule.enabled}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Activate schedule immediately</span>
                </label>
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
                        className="text-gray-500 hover:text-gray-700 ml-1"
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
                <p className="text-xs text-gray-500 mt-2">
                  Separate multiple emails with commas or press Enter after each
                </p>
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