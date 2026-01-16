// src/components/RequestSupply.jsx
import { useState, useEffect } from "react";
import { 
  X, 
  Package, 
  AlertCircle, 
  Save, 
  Send, 
  Trash2,
  Loader2,
  Building,
  Clock,
  Shield
} from "lucide-react";
import requestService from "../../services/requestService";

export default function RequestSupply({ 
  isOpen, 
  onClose, 
  initialResource,
  editingDraft = null,
  mode = "create" // "create", "edit-draft", "submit-draft"
}) {
  const [form, setForm] = useState({
    quantity: "",
    urgency_level: "Medium",
    handling_class: "General",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form based on mode and data
  useEffect(() => {
    if (isOpen) {
      setError("");
      
      if (mode === "edit-draft" && editingDraft) {
        // Populate form with draft data
        setForm({
          quantity: editingDraft.quantity?.toString() || "",
          urgency_level: editingDraft.urgency_level || "Medium",
          handling_class: editingDraft.handling_class || "General",
          reason: editingDraft.reason || "",
        });
      } else if (mode === "submit-draft" && editingDraft) {
        // Populate form with draft data (read-only for submission)
        setForm({
          quantity: editingDraft.quantity?.toString() || "",
          urgency_level: editingDraft.urgency_level || "Medium",
          handling_class: editingDraft.handling_class || "General",
          reason: editingDraft.reason || "",
        });
      } else if (initialResource) {
        // New request from resource management
        setForm(prev => ({
          ...prev,
          quantity: "",
          reason: `Low stock: ${initialResource.resource.name} (${initialResource.resource.currentStock} remaining)`,
        }));
      } else {
        // Fresh form
        setForm({
          quantity: "",
          urgency_level: "Medium",
          handling_class: "General",
          reason: "",
        });
      }
    }
  }, [isOpen, initialResource, editingDraft, mode]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle textarea changes specifically
  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveDraft = async () => {
    if (!form.quantity) {
      setError("Quantity is required");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const payload = {
        resource_id: mode.startsWith("draft") ? editingDraft.resource_id : initialResource?.resource?.id,
        quantity: Number(form.quantity),
        urgency_level: form.urgency_level,
        handling_class: form.handling_class,
        reason: form.reason,
      };

      if (mode === "edit-draft" && editingDraft) {
        // Update existing draft
        await requestService.updateDraft(editingDraft.id, payload);
        alert("Draft updated successfully!");
      } else {
        // Create new draft
        await requestService.saveDraft(payload);
        alert("Draft saved successfully!");
      }

      onClose(true); // Pass success flag
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!form.quantity) {
      setError("Quantity is required");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      if (mode === "submit-draft" && editingDraft) {
        // Submit existing draft directly
        await requestService.submitFromDraft(editingDraft.id);
        alert("Draft submitted successfully!");
      } else if (mode === "edit-draft" && editingDraft) {
        // Update draft and submit
        const payload = {
          resource_id: editingDraft.resource_id,
          quantity: Number(form.quantity),
          urgency_level: form.urgency_level,
          handling_class: form.handling_class,
          reason: form.reason,
        };
        await requestService.updateDraft(editingDraft.id, payload);
        await requestService.submitFromDraft(editingDraft.id);
        alert("Draft updated and submitted successfully!");
      } else {
        // Create and submit new request (original functionality)
        const payload = {
          resource_id: initialResource.resource.id,
          quantity: Number(form.quantity),
          urgency_level: form.urgency_level,
          handling_class: form.handling_class,
          reason: form.reason,
        };
        await requestService.submitRequest(payload);
        alert("Request submitted successfully!");
      }

      onClose(true); // Pass success flag
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!editingDraft?.id || !confirm("Are you sure you want to delete this draft?")) {
      return;
    }

    setLoading(true);
    try {
      await requestService.deleteDraft(editingDraft.id);
      alert("Draft deleted successfully!");
      onClose(true); // Pass success flag
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete draft");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "edit-draft":
        return "Edit Draft Request";
      case "submit-draft":
        return "Submit Draft Request";
      default:
        return "Request Supply";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "edit-draft":
        return loading ? "Updating..." : "Update & Submit";
      case "submit-draft":
        return loading ? "Submitting..." : "Submit Request";
      default:
        return loading ? "Submitting..." : "Submit Request";
    }
  };

  const isFormReadOnly = mode === "submit-draft";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-md border border-gray-300 w-full max-w-2xl">
        {/* Header */}
        <div className="bg-green-800 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-700 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{getTitle()}</h2>
                {initialResource && (
                  <p className="text-green-100 mt-1 flex items-center gap-2">
                    <Building size={16} />
                    {initialResource.resource.name} • {initialResource.hospital.name}
                  </p>
                )}
                {editingDraft && (
                  <p className="text-green-100 mt-1 flex items-center gap-2">
                    <Package size={16} />
                    Draft • {editingDraft.resource_name}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => onClose()}
              className="p-2 hover:bg-green-700 rounded-lg transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Quantity Field */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
            <label className="block text-sm font-semibold text-green-900 mb-3">
              Quantity Needed
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Enter quantity"
              required
              disabled={isFormReadOnly || loading}
            />
          </div>

          {/* Urgency and Handling Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urgency Level */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
              <label className="block text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Urgency Level
              </label>
              <select
                name="urgency_level"
                value={form.urgency_level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-600"
                disabled={isFormReadOnly || loading}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical (Emergency)</option>
              </select>
            </div>

            {/* Handling Class */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
              <label className="block text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Shield size={16} />
                Handling Class
              </label>
              <select
                name="handling_class"
                value={form.handling_class}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-600"
                disabled={isFormReadOnly || loading}
              >
                <option value="General">General</option>
                <option value="ColdChain">Cold Chain</option>
                <option value="Narcotics">Narcotics</option>
                <option value="HighValue">High-Value</option>
              </select>
            </div>
          </div>

          {/* Reason Field */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
            <label className="block text-sm font-semibold text-green-900 mb-3">
              Reason for Request
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleTextareaChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Explain why this resource is needed and any specific requirements..."
              disabled={isFormReadOnly || loading}
            />
            <p className="text-xs text-gray-600 mt-2">
              {isFormReadOnly ? "This field cannot be edited during submission" : "Optional but recommended for better coordination"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-300">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left Side Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onClose()}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 bg-white text-green-900 rounded-lg hover:bg-gray-100 font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
              
              {/* Delete Draft button - only show for draft modes */}
              {(mode === "edit-draft" || mode === "submit-draft") && (
                <button
                  onClick={handleDeleteDraft}
                  disabled={loading}
                  className="px-6 py-3 border border-red-300 bg-white text-red-700 rounded-lg hover:bg-red-50 font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {loading ? "Deleting..." : "Delete Draft"}
                </button>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex flex-wrap gap-3">
              {/* Save/Update Draft button - hide for submit-draft mode */}
              {mode !== "submit-draft" && (
                <button
                  onClick={handleSaveDraft}
                  disabled={loading || !form.quantity}
                  className="px-6 py-3 border border-green-300 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {mode === "edit-draft" ? "Update Draft" : "Save Draft"}
                </button>
              )}

              <button
                onClick={handleSubmitRequest}
                disabled={loading || !form.quantity}
                className="px-8 py-3 bg-green-800 hover:bg-green-700 text-white rounded-lg font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {getSubmitButtonText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}