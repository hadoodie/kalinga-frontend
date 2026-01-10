import { useState, useEffect } from "react";
import { Check, X, Eye, Loader2, FileCheck } from "lucide-react";
import api from "@/services/api";

const getImageUrl = (path) => {
  if (!path) return null;
  const baseURL = "http://localhost:8000"; 
  return `${baseURL}/storage/${path}`;
};

export const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); 
  const [processing, setProcessing] = useState(false);

  // Fetch pending requests
  const fetchRequests = async () => {
    try {
      const response = await api.get("/admin/verifications");
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle Approve
  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to verify this user?")) return;
    setProcessing(true);
    try {
      await api.post(`/admin/verifications/${id}/approve`);
      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedReq(null);
      alert("User verified successfully!");
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Failed to approve user.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    setProcessing(true);
    try {
      await api.post(`/admin/verifications/${id}/reject`, { reason });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedReq(null);
      alert("User rejected.");
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Failed to reject user.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Verification Requests</h2>
        <p className="text-muted-foreground">
          Review and approve user identity documents.
        </p>
      </div>

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <FileCheck className="mx-auto mb-4 h-10 w-10 opacity-50" />
          <p>No pending verification requests.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{req.first_name} {req.last_name}</h3>
                  <p className="text-xs text-muted-foreground">{req.id_type}</p>
                  <p className="mt-1 text-xs font-medium text-blue-600">
                    ID: {req.id_number}
                  </p>
                </div>
                <div className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">
                  PENDING
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedReq(req)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  <Eye className="h-4 w-4" /> Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-bold">Review Application</h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row">
              {/* Left: Image */}
              <div className="flex flex-1 items-center justify-center rounded-xl bg-gray-100 p-4">
                <img
                  src={getImageUrl(selectedReq.front_image_path)}
                  alt="ID Document"
                  className="max-h-[500px] w-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
              </div>

              {/* Right: Data */}
              <div className="w-full space-y-6 lg:w-80">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Provided Information</h4>
                  
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500">Full Name</span>
                      <span className="font-medium">{selectedReq.first_name} {selectedReq.middle_name} {selectedReq.last_name}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Date of Birth</span>
                      <span className="font-medium">{selectedReq.date_of_birth}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Address</span>
                      <span className="font-medium">{selectedReq.address}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">ID Type</span>
                      <span className="font-medium">{selectedReq.id_type}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">ID Number</span>
                      <span className="font-medium">{selectedReq.id_number}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedReq.id)}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve & Verify
                  </button>
                  <button
                    onClick={() => handleReject(selectedReq.id)}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="animate-spin" /> : <X className="h-4 w-4" />}
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};