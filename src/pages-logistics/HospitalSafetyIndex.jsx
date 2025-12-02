import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Droplets, 
  Fuel, 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Building2,
  TrendingDown,
  TrendingUp,
  Clock,
  RefreshCw,
  Shield,
  AlertOctagon,
  Users,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getHsiDashboard, 
  getHospitalCompliance,
  HSI_CONSTANTS,
  getSafetyCategoryInfo,
  formatSurvivalHours 
} from '@/services/hsiApi';
import hospitalService from '@/services/hospitalService';

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
      <Badge className={`${colorClasses[info.color]} border`}>
        Category {category}: {info.label}
      </Badge>
    );
  };

  const ResourceStatusCard = ({ title, icon: Icon, current, required, unit, status }) => {
    const percent = required > 0 ? Math.min((current / required) * 100, 100) : 0;
    const isCompliant = current >= required;
    
    return (
      <Card className={`${!isCompliant ? 'border-red-200 bg-red-50/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${isCompliant ? 'text-green-600' : 'text-red-600'}`} />
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            {isCompliant ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-medium">{formatSurvivalHours(current)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HSI Required</span>
              <span className="font-medium">{formatSurvivalHours(required)}</span>
            </div>
            <Progress 
              value={percent} 
              className={`h-2 ${!isCompliant ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`} 
            />
            <div className="text-xs text-center text-muted-foreground">
              {percent.toFixed(0)}% of HSI requirement
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Hospital Safety Index
          </h1>
          <p className="text-muted-foreground">
            WHO/DOH Hospital Safety Index Compliance Dashboard
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Hospitals</CardDescription>
              <CardTitle className="text-3xl">{dashboardData.total_hospitals}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{dashboardData.hospitals_in_disaster_mode} in disaster mode</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardDescription>Category A (Safe)</CardDescription>
              <CardTitle className="text-3xl text-green-700">
                {dashboardData.safety_categories?.A || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Likely to remain functional</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <CardDescription>Category B (Intervention)</CardDescription>
              <CardTitle className="text-3xl text-yellow-700">
                {dashboardData.safety_categories?.B || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Intervention recommended</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardDescription>Category C (Urgent)</CardDescription>
              <CardTitle className="text-3xl text-red-700">
                {dashboardData.safety_categories?.C || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertOctagon className="h-4 w-4" />
                <span>Urgent action required</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts */}
      {dashboardData?.total_critical_alerts > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertOctagon className="h-5 w-5" />
              Critical Alerts ({dashboardData.total_critical_alerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dashboardData.critical_resources || {}).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                    <p className="text-sm text-muted-foreground">
                      {data.hospitals?.join(', ')}
                    </p>
                  </div>
                  <Badge variant="destructive">{data.count} critical</Badge>
                </div>
              ))}
              {Object.entries(dashboardData.critical_tanks || {}).map(([tankType, data]) => (
                <div key={tankType} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <span className="font-medium capitalize">{tankType.replace('_', ' ')} Tanks</span>
                    <p className="text-sm text-muted-foreground">
                      {data.hospitals?.join(', ')}
                    </p>
                  </div>
                  <Badge variant="destructive">{data.count} critical</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hospital Selector & Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hospital Compliance Details</CardTitle>
            <select
              value={selectedHospital || ''}
              onChange={(e) => setSelectedHospital(Number(e.target.value))}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {hospitalCompliance ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Hospital Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Safety Index</CardDescription>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-4xl">
                          {hospitalCompliance.assessment?.overall_index?.toFixed(1) || 'N/A'}
                        </CardTitle>
                        {hospitalCompliance.assessment?.category && (
                          <SafetyCategoryBadge category={hospitalCompliance.assessment.category} />
                        )}
                      </div>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Bed Capacity</CardDescription>
                      <CardTitle className="text-2xl">
                        {hospitalCompliance.capacity?.routine_beds || 0} / {hospitalCompliance.capacity?.maximum_beds || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        {hospitalCompliance.capacity?.disaster_mode_active ? (
                          <Badge variant="destructive">Disaster Mode Active</Badge>
                        ) : (
                          <Badge variant="secondary">Normal Operations</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Vendor Agreements</CardDescription>
                      <CardTitle className="text-2xl">
                        {hospitalCompliance.vendor_agreements?.active || 0} Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {hospitalCompliance.vendor_agreements?.auto_trigger_enabled || 0} with auto-trigger
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* WHO Scoring Breakdown */}
                {hospitalCompliance.assessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">WHO Safety Index Breakdown</CardTitle>
                      <CardDescription>
                        Structural (50%) + Non-Structural (30%) + Emergency Management (20%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 2: Structural Safety (50%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.structural_score?.toFixed(1)}%</span>
                          </div>
                          <Progress value={hospitalCompliance.assessment.structural_score} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 3: Non-Structural Safety (30%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.non_structural_score?.toFixed(1)}%</span>
                          </div>
                          <Progress value={hospitalCompliance.assessment.non_structural_score} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Module 4: Emergency Management (20%)</span>
                            <span className="font-medium">{hospitalCompliance.assessment.emergency_mgmt_score?.toFixed(1)}%</span>
                          </div>
                          <Progress value={hospitalCompliance.assessment.emergency_mgmt_score} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Water */}
                  <ResourceStatusCard
                    title="Water Reserve"
                    icon={Droplets}
                    current={hospitalCompliance.water?.survival_hours || 0}
                    required={HSI_CONSTANTS.WATER_MINIMUM_HOURS}
                    unit="hours"
                    status={hospitalCompliance.water?.meets_hsi}
                  />

                  {/* Fuel */}
                  <ResourceStatusCard
                    title="Fuel Reserve"
                    icon={Fuel}
                    current={hospitalCompliance.fuel?.survival_hours || 0}
                    required={HSI_CONSTANTS.FUEL_MINIMUM_HOURS}
                    unit="hours"
                    status={hospitalCompliance.fuel?.meets_hsi}
                  />

                  {/* Oxygen */}
                  {hospitalCompliance.oxygen && (
                    <ResourceStatusCard
                      title="Oxygen Reserve"
                      icon={Wind}
                      current={hospitalCompliance.oxygen.survival_hours || 0}
                      required={HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS}
                      unit="hours"
                      status={hospitalCompliance.oxygen.meets_hsi}
                    />
                  )}
                </div>

                {/* Tank Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tank Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Water Tanks</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Count</span>
                            <span>{hospitalCompliance.water?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span>{(hospitalCompliance.water?.total_liters || 0).toLocaleString()} L</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Required (72h)</span>
                            <span>{(hospitalCompliance.water?.required_72h_liters || 0).toLocaleString()} L</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Fuel className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">Fuel Tanks</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Count</span>
                            <span>{hospitalCompliance.fuel?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span>{(hospitalCompliance.fuel?.total_liters || 0).toLocaleString()} L</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Daily Usage</span>
                            <span>{(hospitalCompliance.fuel?.daily_usage_liters || 0).toLocaleString()} L/day</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generator Status */}
                {hospitalCompliance.generator && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generator Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className={`text-2xl mb-1 ${hospitalCompliance.generator.starts_within_10s ? 'text-green-600' : 'text-red-600'}`}>
                            {hospitalCompliance.generator.starts_within_10s ? '✓' : '✗'}
                          </div>
                          <div className="text-sm text-muted-foreground">Starts within 10s</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            {hospitalCompliance.generator.coverage_percent}%
                          </div>
                          <div className="text-sm text-muted-foreground">Load Coverage</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold mb-1">
                            {formatSurvivalHours(hospitalCompliance.generator.fuel_reserve_hours)}
                          </div>
                          <div className="text-sm text-muted-foreground">Fuel Reserve</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assessment">
                {hospitalCompliance.assessment ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Latest Assessment</CardTitle>
                      <CardDescription>
                        Conducted on {new Date(hospitalCompliance.assessment.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">Overall Safety Index</div>
                            <div className="text-3xl font-bold">
                              {hospitalCompliance.assessment.overall_index?.toFixed(1)}
                            </div>
                          </div>
                          <SafetyCategoryBadge category={hospitalCompliance.assessment.category} />
                        </div>
                        <Button className="w-full" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Assessment Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assessment on record</p>
                      <Button className="mt-4">
                        Start New Assessment
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a hospital to view compliance details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalSafetyIndex;
