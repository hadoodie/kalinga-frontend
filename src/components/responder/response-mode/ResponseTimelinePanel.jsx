import React from "react";
import { Clock } from "lucide-react";

export default function ResponseTimelinePanel({ incident }) {
  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex-none flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Response Timeline
        </h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          Live Updates
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
          {incident?.history?.length ? (
            incident.history.map((entry, index) => (
              <div key={entry.id || index} className="relative">
                <div
                  className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                    index === 0 ? "bg-primary" : "bg-gray-300"
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {entry.status?.replace(/_/g, " ")}
                  </p>
                  <span className="text-xs text-gray-500 font-mono">
                    {entry.created_at_human ||
                      (entry.created_at
                        ? new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "")}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                )}
              </div>
            ))
          ) : (
            <div className="relative">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p className="text-sm font-semibold text-gray-900">
                  Incident Created
                </p>
                <span className="text-xs text-gray-500 font-mono">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Waiting for updates...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
