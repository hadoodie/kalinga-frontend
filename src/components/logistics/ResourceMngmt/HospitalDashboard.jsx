// src/components/logistics/ResourceMngmt/HospitalDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Bell,
  FileText,
  Home,
  BarChart3,
  Settings,
  LogOut,
  User,
  ClipboardCheck,
  Upload,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

// Import all components from their respective files
import ResourceMngmt from '../ResourceMngmt'; // This is the main ResourceMngmt component
import AssetRegis from '../AssetRegis';
import RequestsView from './RequestsView';
import ReleaseRequestsTab from './ReleaseRequestsTab';
import NotificationCenter from './NotificationCenter';
import DeliveryConfirmModal from './DeliveryConfirmModal';
import ReleaseConfirmModal from './ReleaseConfirmModal';
import RequestSupply from '../RequestSupply';
import hospitalService from '../../../services/hospitalService';

const HospitalDashboard = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedReleaseRequest, setSelectedReleaseRequest] = useState(null);
  const [userRole, setUserRole] = useState('Hospital Admin');

  // ── Hospital context ───────────────────────────────────────
  const [hospitalId, setHospitalId] = useState(null);
  const [facility, setFacility] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    const loadHospitalContext = async () => {
      try {
        const hospitals = await hospitalService.getAll();
        const list = hospitals?.data ?? hospitals;
        if (Array.isArray(list) && list.length > 0) {
          const h = list[0];
          setHospitalId(h.id);
          setFacility({ id: h.id, name: h.name, location: h.address || h.location });
        }
      } catch (err) {
        console.error('Failed to load hospital context:', err);
      }
    };
    loadHospitalContext();
  }, []);

  const tabs = [
    { id: 'resources', label: 'My Resources', icon: <Package className="w-5 h-5" /> },
    { id: 'assets', label: 'My Assets', icon: <Truck className="w-5 h-5" /> },
    { id: 'requests', label: 'My Requests', icon: <FileText className="w-5 h-5" /> },
    { id: 'release', label: 'Release Requests', icon: <ClipboardCheck className="w-5 h-5" /> },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'resources':
        return <ResourceMngmt />;
      case 'assets':
        return <AssetRegis />;
      case 'requests':
        return hospitalId ? (
          <RequestsView facility={facility} hospitalId={hospitalId} />
        ) : (
          <div className="p-6 text-gray-500">Loading hospital context...</div>
        );
      case 'release':
        return hospitalId ? (
          <ReleaseRequestsTab hospitalId={hospitalId} facility={facility} />
        ) : (
          <div className="p-6 text-gray-500">Loading hospital context...</div>
        );
      default:
        return <ResourceMngmt />;
    }
  };

  const handleDeliveryConfirm = (deliveryData) => {
    console.log('Confirming delivery:', deliveryData);
    setShowDeliveryModal(false);
  };

  const handleReleaseConfirm = (releaseData) => {
    console.log('Confirming release:', releaseData);
    setShowReleaseModal(false);
  };

  const quickActions = [
    { 
      id: 'request-supply', 
      label: 'Request Supply', 
      icon: <Package className="w-5 h-5" />, 
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => setShowRequestModal(true),
    },
    { 
      id: 'view-deliveries', 
      label: 'View Deliveries', 
      icon: <Truck className="w-5 h-5" />, 
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => setActiveTab('requests'),
    },
    { 
      id: 'upload-pod', 
      label: 'Upload POD', 
      icon: <Upload className="w-5 h-5" />, 
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => {
        setSelectedDelivery({ id: '123', resource: 'IV Fluids', quantity: 500 });
        setShowDeliveryModal(true);
      }
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-green-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6 text-green-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Hospital Logistics Dashboard</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {facility ? facility.name : 'Department of Health - Healthcare Resource Management'}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <NotificationCenter />
              </div>
              
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  Quick Actions
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-green-300 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3">
                    {quickActions.map(action => (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-white ${action.color} rounded-lg mb-2 last:mb-0 font-semibold transition-colors`}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Hospital Admin</p>
                  <p className="text-xs text-gray-500">{facility?.name || 'General Hospital - Metro Manila'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <div className="container mx-auto px-6 mt-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-bold text-amber-800">System Notice</h3>
                <p className="text-amber-700">Live tracking is temporarily unavailable. Delivery updates will be sent via notifications.</p>
              </div>
            </div>
            <button className="text-amber-700 hover:text-amber-900 font-semibold">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} transition-all duration-300 flex-shrink-0`}>
            <div className="bg-white rounded-2xl border border-green-300 shadow-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-green-600" />
                {sidebarOpen && "Dashboard Navigation"}
              </h3>
              
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.id 
                        ? 'bg-white/20' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {tab.icon}
                    </div>
                    {sidebarOpen && (
                      <span className="font-semibold flex-1 text-left">{tab.label}</span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="border-t border-gray-300 my-6"></div>
              
              {sidebarOpen && (
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics & Reports</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                    <Settings className="w-5 h-5" />
                    <span>System Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-6">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6 shadow-lg">
                <h4 className="font-bold text-green-800 mb-4">Dashboard Summary</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-green-200">
                    <div>
                      <p className="text-sm text-gray-600">Pending Actions</p>
                      <p className="text-2xl font-bold text-green-700">4</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-blue-200">
                    <div>
                      <p className="text-sm text-gray-600">Active Deliveries</p>
                      <p className="text-2xl font-bold text-blue-700">3</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200">
                    <div>
                      <p className="text-sm text-gray-600">Available Assets</p>
                      <p className="text-2xl font-bold text-amber-700">8</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Tab Navigation Bar */}
            <div className="bg-white rounded-2xl border border-green-300 shadow-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-2.5 rounded-lg border font-bold transition-all flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-green-300'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full font-bold ${
                    userRole.includes('A') 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-green-100 text-green-800 border border-green-300'
                  }`}>
                    {userRole.includes('A') ? 'Hospital A (Receiving)' : 'Hospital B (Source)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-gray-300 shadow-xl overflow-hidden">
              <div className="border-b border-gray-300 p-6 bg-gradient-to-r from-gray-50 to-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {activeTab === 'resources' && 'Manage your hospital stock and request supplies'}
                      {activeTab === 'assets' && 'View and manage your hospital vehicles and equipment'}
                      {activeTab === 'requests' && 'Track your resource requests and delivery status'}
                      {activeTab === 'release' && 'Review and approve incoming stock release requests'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-700">Live Updates Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {renderActiveTab()}
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 uppercase font-semibold">Today's Activity</p>
                    <p className="text-3xl font-bold text-green-800 mt-2">12</p>
                    <p className="text-sm text-green-700 mt-1">Requests & Updates</p>
                  </div>
                  <div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-green-700" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 uppercase font-semibold">Response Time</p>
                    <p className="text-3xl font-bold text-blue-800 mt-2">2.4h</p>
                    <p className="text-sm text-blue-700 mt-1">Average delivery time</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center">
                    <Truck className="w-7 h-7 text-blue-700" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 uppercase font-semibold">Stock Accuracy</p>
                    <p className="text-3xl font-bold text-purple-800 mt-2">98.7%</p>
                    <p className="text-sm text-purple-700 mt-1">Inventory match rate</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center">
                    <ClipboardCheck className="w-7 h-7 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-green-200 bg-white/80 backdrop-blur-sm py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-800">DOH Healthcare Logistics</span>
              </div>
              <p className="text-sm text-gray-600">
                © 2025 Department of Health. Secure Healthcare Resource Management System.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-500">v2.5.1</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-green-700">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showDeliveryModal && (
        <DeliveryConfirmModal
          delivery={selectedDelivery}
          onConfirm={handleDeliveryConfirm}
          onClose={() => setShowDeliveryModal(false)}
        />
      )}

      {showReleaseModal && (
        <ReleaseConfirmModal
          request={selectedReleaseRequest}
          onConfirm={handleReleaseConfirm}
          onClose={() => setShowReleaseModal(false)}
        />
      )}

      {/* Request Supply Modal — triggered by Quick Action */}
      {showRequestModal && (
        <RequestSupply
          isOpen={showRequestModal}
          onClose={(success) => {
            setShowRequestModal(false);
            if (success && activeTab === 'requests') {
              // Trigger a re-fetch in RequestsView by switching tabs
              setActiveTab('resources');
              setTimeout(() => setActiveTab('requests'), 50);
            }
          }}
          initialResource={null}
          mode="create"
        />
      )}
    </div>
  );
};

export default HospitalDashboard;