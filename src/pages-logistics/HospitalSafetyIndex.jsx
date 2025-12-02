import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Fuel, 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Building2,
  RefreshCw,
  Shield,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { 
  getHsiDashboard, 
  getHospitalCompliance,
  HSI_CONSTANTS,
  getSafetyCategoryInfo,
  formatSurvivalHours 
} from '@/services/hsiApi';
import hospitalService from '@/services/hospitalService';

// Simple Badge Component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const HospitalSafetyIndex = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalCompliance, setHospitalCompliance] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchHospitalCompliance(selectedHospital);
    }
  }, [selectedHospital]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getHsiDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch HSI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const hospitals = await hospitalService.getAll();
      setHospitals(hospitals);
      if (hospitals.length > 0) {
        setSelectedHospital(hospitals[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const fetchHospitalCompliance = async (hospitalId) => {
    try {
      const response = await getHospitalCompliance(hospitalId);
      setHospitalCompliance(response.data.data);
    } catch (error) {
      console.error('Failed to fetch hospital compliance:', error);
    }
  };

  const SafetyCategoryBadge = ({ category }) => {
    const info = getSafetyCategoryInfo(category);
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[info.color]}`}>
        Category {category}: {info.label}
      </span>
    );
  };

  const ResourceStatusCard = ({ title, icon: Icon, current, required }) => {
    const percent = required > 0 ? Math.min((current / required) * 100, 100) : 0;
    const isCompliant = current >= required;
    
    return (
      <div className={`rounded-lg border p-4 ${!isCompliant ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isCompliant ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {isCompliant ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current</span>
            <span className="font-medium">{formatSurvivalHours(current)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">HSI Required</span>
            <span className="font-medium">{formatSurvivalHours(required)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${!isCompliant ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            {percent.toFixed(0)}% of HSI requirement
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-green-600" />
            Hospital Safety Index
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            WHO/DOH Hospital Safety Index Compliance Dashboard
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* System Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Hospitals</p>
            <p className="text-3xl font-bold">{dashboardData.total_hospitals}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Building2 className="h-4 w-4" />
              <span>{dashboardData.hospitals_in_disaster_mode} in disaster mode</span>
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category A (Safe)</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              {dashboardData.safety_categories?.A || 0}
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
              <CheckCircle className="h-4 w-4" />
              <span>Likely to remain functional</span>
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category B (Intervention)</p>
            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
              {dashboardData.safety_categories?.B || 0}
            </p>
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Intervention recommended</span>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category C (Urgent)</p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              {dashboardData.safety_categories?.C || 0}
            </p>
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
              <AlertOctagon className="h-4 w-4" />
              <span>Urgent action required</span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {dashboardData?.total_critical_alerts > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-900/30 p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
            <AlertOctagon className="h-5 w-5" />
            Critical Alerts ({dashboardData.total_critical_alerts})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dashboardData.critical_resources || {}).map(([category, data]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
                <div>
                  <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.hospitals?.join(', ')}
                  </p>
                </div>
                <Badge variant="destructive">{data.count} critical</Badge>
              </div>
            ))}
            {Object.entries(dashboardData.critical_tanks || {}).map(([tankType, data]) => (
              <div key={tankType} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
                <div>
                  <span className="font-medium capitalize">{tankType.replace('_', ' ')} Tanks</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.hospitals?.join(', ')}
                  </p>
                </div>
                <Badge variant="destructive">{data.count} critical</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital Selector & Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Hospital Compliance Details</h2>
          <select
            value={selectedHospital || ''}
            onChange={(e) => setSelectedHospital(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="p-4">
          {hospitalCompliance ? (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {['overview', 'resources', 'assessment'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors -mb-px
                      ${activeTab === tab 
                        ? 'border-b-2 border-green-600 text-green-600' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Safety Index</p>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold">
                          {hospitalCompliance.assessment?.overall_index?.toFixed(1) || 'N/A'}
                        </span>
                        {hospitalCompliance.assessment?.category && (
                          <SafetyCategoryBadge category={hospitalCompliance.assessment.category} />
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bed Capacity</p>
                      <p className="text-2xl font-bold">
                        {hospitalCompliance.capacity?.routine_beds || 0} / {hospitalCompliance.capacity?.maximum_beds || 0}
                      </p>
                      <div className="mt-2">
                        {hospitalCompliance.capacity?.disaster_mode_active ? (
                          <Badge variant="destructive">Disaster Mode Active</Badge>
                        ) : (
                          <Badge variant="secondary">Normal Operations</Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vendor Agreements</p>
                      <p className="text-2xl font-bold">
                        {hospitalCompliance.vendor_agreements?.active || 0} Active
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {hospitalCompliance.vendor_agreements?.auto_trigger_enabled || 0} with auto-trigger
                      </p>
                    </div>
                  </div>

                  {/* WHO Scoring Breakdown */}
                  {hospitalCompliance.assessment && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h3 className="text-lg font-medium mb-1">WHO Safety Index Breakdown</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Structural (50%) + Non-Structural (30%) + Emergency Management (20%)
                      </p>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 2: Structural Safety (50%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.structural_score?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${hospitalCompliance.assessment.structural_score || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 3: Non-Structural Safety (30%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.non_structural_score?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${hospitalCompliance.assessment.non_structural_score || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 4: Emergency Management (20%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.emergency_mgmt_score?.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${hospitalCompliance.assessment.emergency_mgmt_score || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ResourceStatusCard
                      title="Water Reserve"
                      icon={Droplets}
                      current={hospitalCompliance.water?.survival_hours || 0}
                      required={HSI_CONSTANTS.WATER_MINIMUM_HOURS}
                    />
                    <ResourceStatusCard
                      title="Fuel Reserve"
                      icon={Fuel}
                      current={hospitalCompliance.fuel?.survival_hours || 0}
                      required={HSI_CONSTANTS.FUEL_MINIMUM_HOURS}
                    />
                    {hospitalCompliance.oxygen && (
                      <ResourceStatusCard
                        title="Oxygen Reserve"
                        icon={Wind}
                        current={hospitalCompliance.oxygen.survival_hours || 0}
                        required={HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS}
                      />
                    )}
                  </div>

                  {/* Tank Details */}
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-medium mb-4">Tank Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Water Tanks</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Count</span>
                            <span>{hospitalCompliance.water?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Total</span>
                            <span>{(hospitalCompliance.water?.total_liters || 0).toLocaleString()} L</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Required (72h)</span>
                            <span>{(hospitalCompliance.water?.required_72h_liters || 0).toLocaleString()} L</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Fuel className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">Fuel Tanks</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Count</span>
                            <span>{hospitalCompliance.fuel?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Total</span>
                            <span>{(hospitalCompliance.fuel?.total_liters || 0).toLocaleString()} L</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Daily Usage</span>
                            <span>{(hospitalCompliance.fuel?.daily_usage_liters || 0).toLocaleString()} L/day</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generator Status */}
                  {hospitalCompliance.generator && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h3 className="text-lg font-medium mb-4">Generator Status</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className={`text-2xl mb-1 ${hospitalCompliance.generator.starts_within_10s ? 'text-green-600' : 'text-red-600'}`}>
                            {hospitalCompliance.generator.starts_within_10s ? '✓' : '✗'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Starts within 10s</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            {hospitalCompliance.generator.coverage_percent}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Load Coverage</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            {formatSurvivalHours(hospitalCompliance.generator.fuel_reserve_hours)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Fuel Reserve</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assessment Tab */}
              {activeTab === 'assessment' && (
                <div>
                  {hospitalCompliance.assessment ? (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <h3 className="text-lg font-medium mb-1">Latest Assessment</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Conducted on {new Date(hospitalCompliance.assessment.date).toLocaleDateString()}
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium">Overall Safety Index</div>
                            <div className="text-3xl font-bold">
                              {hospitalCompliance.assessment.overall_index?.toFixed(1)}
                            </div>
                          </div>
                          <SafetyCategoryBadge category={hospitalCompliance.assessment.category} />
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <FileText className="h-4 w-4" />
                          View Full Assessment Report
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No assessment on record</p>
                      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Start New Assessment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Select a hospital to view compliance details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalSafetyIndex;
