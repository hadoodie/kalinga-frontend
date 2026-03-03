// src/components/logistics/ResourceMngmt/DeliveryConfirmModal.jsx
import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Upload,
  Camera,
  FileCheck,
  Package,
  Truck,
  Clock,
  User,
  Shield,
  AlertCircle,
  Download
} from 'lucide-react';

const DeliveryConfirmModal = ({ delivery, onConfirm, onClose }) => {
  const [step, setStep] = useState(1); // 1: Verify, 2: Upload, 3: Confirm
  const [podFiles, setPodFiles] = useState([]);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type === 'image/jpeg' || 
      file.type === 'image/png' || 
      file.type === 'application/pdf'
    );
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setPodFiles(prev => [...prev, ...validFiles]);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const removeFile = (index) => {
    setPodFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Final submission
    const confirmationData = {
      deliveryId: delivery.id,
      podFiles,
      verificationNotes,
      signature,
      confirmedAt: new Date().toISOString(),
      verifiedBy: 'Hospital Admin',
      location: 'Main Warehouse, Hospital A'
    };

    onConfirm(confirmationData);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Delivery Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-300 rounded-xl p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          Delivery Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <label className="block text-sm font-medium text-gray-600 mb-1">Resource</label>
            <p className="font-bold text-green-800 text-lg">{delivery.resource}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
            <p className="font-bold text-green-800 text-2xl">{delivery.quantity} units</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-600 mb-1">Delivery ID</label>
            <p className="font-mono font-bold text-blue-800">{delivery.id}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
            <p className="font-bold text-blue-800">{delivery.vehicle || 'DOH Van REF-07'}</p>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Pre-Confirmation Checklist
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="check1"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="check1" className="text-gray-700 font-medium">
              I have physically received and counted the delivered items
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="check2"
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="check2" className="text-gray-700 font-medium">
              Item condition matches the delivery note (no damages)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="check3"
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="check3" className="text-gray-700 font-medium">
              Quantity matches the allocation request exactly
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="check4"
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="check4" className="text-gray-700 font-medium">
              Storage location and temperature requirements are met
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-gray-300 rounded-xl p-5">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Verification Notes (Optional)
        </label>
        <textarea
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows="3"
          placeholder="Any discrepancies, special handling notes, or observations..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-xl p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Proof of Delivery (POD) Upload
        </h3>
        <p className="text-blue-700 text-sm">
          Upload delivery receipt, photos of delivered items, or signed delivery note.
          Maximum 5 files, 10MB each. Accepted formats: JPG, PNG, PDF
        </p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center bg-green-50 hover:bg-green-100 transition-colors">
        <input
          type="file"
          id="pod-upload"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="pod-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-bold text-gray-700 mb-2">Click to upload POD files</p>
            <p className="text-sm text-gray-600">or drag and drop files here</p>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, PDF up to 10MB</p>
          </div>
        </label>
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {podFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700">Uploaded Files</h4>
          {podFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Camera Capture Option */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              Take Photo
            </h4>
            <p className="text-sm text-purple-700">Capture delivery photos using your camera</p>
          </div>
          <button
            onClick={() => {/* Camera implementation */}}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Open Camera
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Final Verification */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-300 rounded-xl p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Final Confirmation
        </h3>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-emerald-200">
            <label className="block text-sm font-medium text-gray-600 mb-2">Authorized Signatory</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Enter your full name as signature"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              This will serve as your digital signature for the delivery confirmation
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-emerald-200">
            <label className="block text-sm font-medium text-gray-600 mb-2">Location of Receipt</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>Main Warehouse - Hospital A</option>
              <option>Emergency Department Store</option>
              <option>Pharmacy Storage</option>
              <option>Central Supply Room</option>
              <option>Other (specify in notes)</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800">Important Notice</p>
                <p className="text-sm text-amber-700 mt-1">
                  By confirming this delivery, you acknowledge that:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                  <li>All items have been received in satisfactory condition</li>
                  <li>Quantities match the allocation request</li>
                  <li>Stock levels will be updated automatically</li>
                  <li>This confirmation is final and cannot be reversed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
            step === stepNumber
              ? 'bg-green-600 text-white border-green-600'
              : step > stepNumber
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-gray-100 text-gray-400 border-gray-300'
          }`}>
            {step > stepNumber ? <CheckCircle className="w-6 h-6" /> : stepNumber}
          </div>
          <span className={`text-xs font-medium mt-2 ${
            step >= stepNumber ? 'text-green-700' : 'text-gray-500'
          }`}>
            {stepNumber === 1 ? 'Verify' : stepNumber === 2 ? 'Upload' : 'Confirm'}
          </span>
        </div>
      ))}
      <div className="flex-1 h-1 bg-gray-300 -mt-5 mx-2"></div>
      <div className="flex-1 h-1 bg-gray-300 -mt-5 mx-2"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-green-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Confirm Delivery Receipt</h2>
                <p className="text-green-100">Hospital A - Proof of Delivery (POD) Confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="mb-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-300">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={step === 1 && !isVerified}
                className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  step === 1 && !isVerified
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                }`}
              >
                {step < 3 ? (
                  <>
                    Continue to {step === 1 ? 'Upload' : 'Confirm'}
                    <span className="ml-1">→</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Delivery & Update Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <div className="bg-gray-50 border-t border-gray-300 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Session expires in: 14:32</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Logged in as: Hospital Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure • Encrypted • Audit Trail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmModal;