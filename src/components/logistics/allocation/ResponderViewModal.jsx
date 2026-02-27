// components/logistics/allocation/ResponderViewModal.jsx
import {
  User, Phone, Mail, Home, MapPin,
  Shield, Award, CheckCircle, AlertCircle,
  Calendar, Clock, FileText, Truck,
  PhoneCall, MessageSquare, ExternalLink,
  X, Printer, Share2, Navigation,
  Activity, ThermometerSnowflake, ShieldCheck,
  ShieldAlert, Package, Star, BadgeCheck
} from "lucide-react";
import { useState } from "react";

const ResponderViewModal = ({ responder, isOpen, onClose }) => {
  if (!isOpen || !responder) return null;

  // Helper functions
  const formatPhone = (phone) => {
    if (!phone) return "Not provided";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2 $3');
    }
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '($1) $2 $3');
    }
    return phone;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Parse JSON fields
  const parseArrayField = (field) => {
    if (!field) return [];
    try {
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        if (field.startsWith('[') || field.startsWith('{')) {
          return JSON.parse(field);
        }
        return field.split(',').map(item => item.trim()).filter(item => item);
      }
      return [];
    } catch {
      return [];
    }
  };

  const certifications = parseArrayField(responder.certifications);
  const capabilities = parseArrayField(responder.handling_capabilities);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'on duty': return 'bg-blue-100 text-blue-800';
      case 'off duty': return 'bg-gray-100 text-gray-800';
      case 'on leave': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return <CheckCircle size={16} className="text-green-600" />;
      case 'on duty': return <Activity size={16} className="text-blue-600" />;
      case 'off duty': return <Clock size={16} className="text-gray-600" />;
      case 'on leave': return <AlertCircle size={16} className="text-red-600" />;
      case 'suspended': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center p-4 z-[100] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-blue-300/50">
        {/* Header */}
        <div className="p-6 border-b-2 border-blue-300/50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
              <User className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900">
                Responder Profile
              </h2>
              <p className="text-gray-600">
                Complete responder information and capabilities
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:rotate-90 transform"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-300">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {responder.user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_APP_URL || ''}${responder.user.profile_image}`}
                      alt={responder.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                      {responder.full_name?.charAt(0) || "R"}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-bold text-blue-900 mb-2">
                        {responder.full_name}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-semibold text-gray-700">
                          {responder.responder_code}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 ${getStatusColor(responder.status)}`}>
                          {getStatusIcon(responder.status)}
                          {responder.status || "Available"}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-3">
                        Licensed Responder • {responder.license_number ? `License: ${responder.license_number}` : "License Pending"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(responder.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <div className="space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                  <Phone className="text-blue-600" size={24} />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Contact Number</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPhone(responder.contact_number || responder.user?.phone)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Email Address</p>
                        <p className="text-lg font-bold text-gray-900">
                          {responder.user?.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {responder.user?.address && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Home className="text-blue-600 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Complete Address</p>
                          <p className="font-bold text-gray-900">{responder.user.address}</p>
                          {(responder.user.barangay || responder.user.city) && (
                            <p className="text-gray-700 mt-1">
                              {responder.user.barangay && `${responder.user.barangay}, `}
                              {responder.user.city}
                              {responder.user.zip_code && ` ${responder.user.zip_code}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Assignment Card */}
              {responder.current_asset_id && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                    <Truck className="text-green-600" size={24} />
                    Current Assignment
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <Truck className="text-green-600" size={24} />
                      <div>
                        <p className="text-sm text-green-600 font-medium">Assigned Vehicle</p>
                        <p className="text-xl font-bold text-gray-900">
                          {responder.currentAsset?.plate_number || responder.currentAsset?.asset_code || "Vehicle"}
                        </p>
                        <p className="text-gray-700">
                          {responder.currentAsset?.type || "Vehicle Type"} • {responder.currentAsset?.model || "Model"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Professional Information */}
            <div className="space-y-6">
              {/* Certifications Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                  <Award className="text-amber-600" size={24} />
                  Certifications & Training
                </h3>
                <div className="space-y-3">
                  {certifications.length > 0 ? (
                    certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                        <BadgeCheck size={18} className="text-amber-600" />
                        <span className="font-medium text-amber-900">{cert}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Award size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No certifications recorded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Handling Capabilities Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                  <Shield className="text-purple-600" size={24} />
                  Special Handling Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {capabilities.length > 0 ? (
                    capabilities.map((capability, index) => {
                      let bgColor = "bg-gray-100 text-gray-800";
                      let icon = Shield;
                      
                      if (capability.toLowerCase().includes('cold')) {
                        bgColor = "bg-blue-100 text-blue-800";
                        icon = ThermometerSnowflake;
                      } else if (capability.toLowerCase().includes('narcotic')) {
                        bgColor = "bg-purple-100 text-purple-800";
                        icon = ShieldAlert;
                      } else if (capability.toLowerCase().includes('high') || capability.toLowerCase().includes('value')) {
                        bgColor = "bg-amber-100 text-amber-800";
                        icon = ShieldCheck;
                      } else if (capability.toLowerCase().includes('general')) {
                        bgColor = "bg-green-100 text-green-800";
                        icon = Package;
                      }
                      
                      const Icon = icon;
                      
                      return (
                        <div key={index} className={`flex items-center gap-2 px-4 py-2 rounded-full ${bgColor} font-medium`}>
                          <Icon size={14} />
                          <span>{capability}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-full py-4">
                      <Shield size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Standard handling capabilities only</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                <Activity className="text-green-600" size={24} />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-900 mb-1">98%</p>
                  <p className="text-sm text-green-700 font-medium">Completion Rate</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-900 mb-1">4.8</p>
                  <p className="text-sm text-blue-700 font-medium">Avg. Rating</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-900 mb-1">156</p>
                  <p className="text-sm text-purple-700 font-medium">Total Assignments</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-amber-900 mb-1">2</p>
                  <p className="text-sm text-amber-700 font-medium">Active Now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 flex items-center gap-2">
              <PhoneCall size={20} />
              Call Responder
            </button>
            <button className="px-6 py-3 border-2 border-blue-300 text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2">
              <MessageSquare size={20} />
              Send Message
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2">
              <Printer size={20} />
              Print Profile
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 ml-auto">
              <ExternalLink size={20} />
              View Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderViewModal;