import React, { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileQuestion,
  Search,
  CalendarDays,
  Activity,
  X,
} from "lucide-react";

export default function PCRHistoryView() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get("/patient-care-reports");
        const nextReports = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        setReports(nextReports);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getCaseNumber = (report) => report.case_number || report.case_no || "N/A";

  const getChiefComplaint = (report) =>
    report.physiological_status?.chief_complaint ||
    report.physiological_status?.chiefComplaint ||
    "N/A";

  const getGcsTotal = (report) =>
    report.gcs?.total || report.vitals?.[0]?.gcs?.total || "N/A";

  const isReportSynced = (report) => {
    const normalizedStatus = String(report.status || "").toLowerCase();
    return report.synced === true || normalizedStatus === "submitted";
  };

  const getLatestVitals = (report) => {
    const vitals = Array.isArray(report.vitals) ? report.vitals : [];
    const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;

    return {
      bp: latest?.bp || "N/A",
      pulse: latest?.pulse || "N/A",
      spo2: latest?.spo2 || "N/A",
    };
  };

  const getGcsBreakdown = (report) => {
    const gcs = report?.gcs || report?.vitals?.[0]?.gcs || {};
    const eyes = gcs.eyes ?? "N/A";
    const verbal = gcs.verbal ?? "N/A";
    const motor = gcs.motor ?? "N/A";
    const total = gcs.total ?? getGcsTotal(report);

    return { eyes, verbal, motor, total };
  };

  const getSortValue = (report, key) => {
    if (key === "case_number") return getCaseNumber(report).toLowerCase();
    if (key === "created_at") return new Date(report.created_at || 0).getTime();
    if (key === "patient_name") return (report.patient_details?.name || "").toLowerCase();
    return "";
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={14} className="text-slate-300" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    );
  };

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase().trim();

    return (reports || []).filter((report) => {
      const bySearch =
        !query ||
        report.patient_details?.name?.toLowerCase().includes(query) ||
        getCaseNumber(report).toLowerCase().includes(query);

      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "synced" && isReportSynced(report)) ||
        (statusFilter === "pending" && !isReportSynced(report));

      return bySearch && byStatus;
    });
  }, [reports, search, statusFilter]);

  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports];

    sorted.sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredReports, sortConfig]);

  const totalResults = sortedReports.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedReports.slice(start, end);
  }, [sortedReports, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedReport(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasReports = reports.length > 0;
  const hasFilteredReports = sortedReports.length > 0;
  const isSearching = search.trim().length > 0;

  const renderStatusBadge = (report) => {
    if (isReportSynced(report)) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Submitted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        Pending Sync
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />

          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-6 gap-0 border-b border-slate-200 bg-slate-50 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 h-5 w-28 animate-pulse rounded bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Responder Archive
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">PCR History</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review submitted patient care reports and soft copy records.
              </p>
            </div>

            <div className="w-full md:w-80">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Search by Patient or Case No.
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white">
                <Search size={16} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Type patient or case number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="w-full md:w-52">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">All</option>
                <option value="synced">Synced</option>
                <option value="pending">Pending Sync</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div
            className={`w-full transition-all duration-200 ease-out ${
              selectedReport ? "md:w-[62%]" : "md:w-full"
            }`}
          >
            {!hasReports ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <FileQuestion size={56} className="text-slate-400" />
                <h2 className="mt-4 text-xl font-bold text-slate-900">No PCR Reports Yet</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Submitted Patient Care Reports will appear here once responders complete and sync entries.
                </p>
              </div>
            ) : !hasFilteredReports ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <FileQuestion size={56} className="text-slate-400" />
                <h2 className="mt-4 text-xl font-bold text-slate-900">No Matching Results</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {isSearching
                    ? "No reports match your current search. Try a different keyword."
                    : statusFilter !== "all"
                    ? "No reports match the selected status filter."
                    : "No reports found."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            <button
                              type="button"
                              onClick={() => handleSort("case_number")}
                              className="inline-flex items-center gap-1 hover:text-slate-800"
                            >
                              Case No.
                              {renderSortIcon("case_number")}
                            </button>
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            <button
                              type="button"
                              onClick={() => handleSort("created_at")}
                              className="inline-flex items-center gap-1 hover:text-slate-800"
                            >
                              Date
                              {renderSortIcon("created_at")}
                            </button>
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            <button
                              type="button"
                              onClick={() => handleSort("patient_name")}
                              className="inline-flex items-center gap-1 hover:text-slate-800"
                            >
                              Patient Name
                              {renderSortIcon("patient_name")}
                            </button>
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            Chief Complaint
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            GCS Score
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            Status
                          </th>
                          <th className="border-b border-slate-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedReports.map((report) => {
                          const isSelected = selectedReport?.id === report.id;

                          return (
                            <tr
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`cursor-pointer transition-colors duration-200 ${
                                isSelected
                                  ? "bg-blue-50 border-l-4 border-blue-600"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-bold text-slate-900">
                                {getCaseNumber(report)}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-500">
                                {new Date(report.created_at).toLocaleString()}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-900">
                                {report.patient_details?.name || "N/A"}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                                {getChiefComplaint(report)}
                              </td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                  <Activity size={14} />
                                  {getGcsTotal(report)}
                                </span>
                              </td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                {renderStatusBadge(report)}
                              </td>
                              <td
                                className="border-b border-slate-100 px-4 py-4 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReport(report)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                  >
                                    <Eye size={14} />
                                    View
                                  </button>
                                  {report.soft_copy_path ? (
                                    <a
                                      href={report.soft_copy_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
                                    >
                                      <Download size={14} />
                                      PDF
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400">No PDF</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 md:hidden">
                  {paginatedReports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;

                    return (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-colors duration-200 ${
                          isSelected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                            Case No. {getCaseNumber(report)}
                          </span>
                          {renderStatusBadge(report)}
                        </div>

                        <p className="text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </p>

                        <p className="mt-2 text-base font-bold text-slate-900">
                          {report.patient_details?.name || "N/A"}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {getChiefComplaint(report)}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                            <Activity size={14} />
                            GCS: {getGcsTotal(report)}
                          </span>
                        </div>

                        <div
                          className="mt-3 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {report.soft_copy_path ? (
                            <a
                              href={report.soft_copy_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
                            >
                              <Download size={14} />
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No PDF</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-600">
                      Showing {totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, totalResults)} of {totalResults} results
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-semibold text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedReport && (
            <aside className="hidden md:flex md:w-[38%] shrink-0 translate-x-0 transform transition-all duration-200 ease-out">
              <div className="sticky top-4 flex h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Case Number</p>
                      <h3 className="text-lg font-bold text-slate-900">{getCaseNumber(selectedReport)}</h3>
                      <div className="mt-2">{renderStatusBadge(selectedReport)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(null)}
                      className="rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
                      aria-label="Close preview"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-4">
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Patient Summary</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-slate-900"><span className="font-semibold">Name:</span> {selectedReport.patient_details?.name || "N/A"}</p>
                      <p className="text-slate-900"><span className="font-semibold">Age:</span> {selectedReport.patient_details?.age ?? "N/A"}</p>
                      <p className="text-slate-900"><span className="font-semibold">Chief Complaint:</span> {getChiefComplaint(selectedReport)}</p>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Latest Vitals</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">BP</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{getLatestVitals(selectedReport).bp}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Pulse</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{getLatestVitals(selectedReport).pulse}</p>
                      </div>
                      <div
                        className={`rounded-xl border p-3 ${
                          Number(getLatestVitals(selectedReport).spo2) > 0 && Number(getLatestVitals(selectedReport).spo2) < 94
                            ? "border-red-200 bg-red-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">SpO2</p>
                        <p
                          className={`mt-1 text-base font-bold ${
                            Number(getLatestVitals(selectedReport).spo2) > 0 && Number(getLatestVitals(selectedReport).spo2) < 94
                              ? "text-red-700"
                              : "text-slate-900"
                          }`}
                        >
                          {getLatestVitals(selectedReport).spo2}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">GCS Breakdown</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Eyes</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).eyes}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Verbal</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).verbal}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Motor</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).motor}</p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600">Total</p>
                        <p className="mt-1 text-base font-bold text-blue-800">{getGcsBreakdown(selectedReport).total}</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
                  {selectedReport.soft_copy_path ? (
                    <a
                      href={selectedReport.soft_copy_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                    >
                      <Download size={16} />
                      Download PDF
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
                    >
                      No PDF Available
                    </button>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setSelectedReport(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] translate-y-0 transform overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Case Number</p>
                  <h3 className="text-lg font-bold text-slate-900">{getCaseNumber(selectedReport)}</h3>
                  <div className="mt-2">{renderStatusBadge(selectedReport)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto p-4 pb-24">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Patient Summary</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-900"><span className="font-semibold">Name:</span> {selectedReport.patient_details?.name || "N/A"}</p>
                  <p className="text-slate-900"><span className="font-semibold">Age:</span> {selectedReport.patient_details?.age ?? "N/A"}</p>
                  <p className="text-slate-900"><span className="font-semibold">Chief Complaint:</span> {getChiefComplaint(selectedReport)}</p>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Latest Vitals</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">BP</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{getLatestVitals(selectedReport).bp}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Pulse</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{getLatestVitals(selectedReport).pulse}</p>
                  </div>
                  <div
                    className={`rounded-xl border p-3 ${
                      Number(getLatestVitals(selectedReport).spo2) > 0 && Number(getLatestVitals(selectedReport).spo2) < 94
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">SpO2</p>
                    <p
                      className={`mt-1 text-base font-bold ${
                        Number(getLatestVitals(selectedReport).spo2) > 0 && Number(getLatestVitals(selectedReport).spo2) < 94
                          ? "text-red-700"
                          : "text-slate-900"
                      }`}
                    >
                      {getLatestVitals(selectedReport).spo2}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">GCS Breakdown</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Eyes</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).eyes}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Verbal</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).verbal}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Motor</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{getGcsBreakdown(selectedReport).motor}</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600">Total</p>
                    <p className="mt-1 text-base font-bold text-blue-800">{getGcsBreakdown(selectedReport).total}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
              {selectedReport.soft_copy_path ? (
                <a
                  href={selectedReport.soft_copy_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  <Download size={16} />
                  Download PDF
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
                >
                  No PDF Available
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}