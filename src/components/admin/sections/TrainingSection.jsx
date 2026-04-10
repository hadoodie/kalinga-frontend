import {
  CalendarDays,
  ClipboardCheck,
  DownloadCloud,
  GraduationCap,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseFile,
  getProgressByCourse,
  watchProgressByCourse,
  setAssessmentPassed,
} from "@/services/trainingService";

const trainingTracks = [
  {
    title: "Incident Command System 300",
    owner: "BFP Region 2",
    schedule: "Oct 14 • 0800H-1700H",
    slots: "18 of 24 seats",
    status: "Confirming",
  },
  {
    title: "Water Rescue Refresher",
    owner: "PCG",
    schedule: "Oct 21 • 0700H-1900H",
    slots: "12 of 18 seats",
    status: "Open",
  },
  {
    title: "Public Information Officer Playbook",
    owner: "PIO Network",
    schedule: "Nov 05 • 1300H-1700H",
    slots: "Fully booked",
    status: "Waitlist",
  },
];

const statusTone = {
  Confirming: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Waitlist: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

export const TrainingSection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [createForm, setCreateForm] = useState(initialModuleForm);
  const [creating, setCreating] = useState(false);
  const [addingSection, setAddingSection] = useState(null);
  const [newSectionHeading, setNewSectionHeading] = useState("");
  const [addingItem, setAddingItem] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("pdf");
  const [uploadingFile, setUploadingFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [addingQuestion, setAddingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ q: "", option1: "", option2: "", option3: "", option4: "", answer: 0 });
  const [submissionsByCourse, setSubmissionsByCourse] = useState({});
  const [markingPassed, setMarkingPassed] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCourses();
      setCourses(list);
    } catch (e) {
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (!expandedId) return undefined;
    const expandedCourse = courses.find((c) => c.id === expandedId);
    if (!expandedCourse) return undefined;
    const isSubmissionOnly =
      expandedCourse.assessmentType === "Practical Test" ||
      expandedCourse.assessmentType === "Simulation" ||
      expandedCourse.assessmentType === "Evaluation Form";
    if (!isSubmissionOnly) return undefined;

    const unsub = watchProgressByCourse(
      expandedCourse.id,
      (list) => {
        setSubmissionsByCourse((prev) => ({ ...prev, [expandedCourse.id]: list }));
      },
      (e) => {
        setError(e.message || "Failed to load submissions");
      }
    );
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [expandedId, courses]);

  const loadSubmissionsForCourse = async (courseId) => {
    try {
      const list = await getProgressByCourse(courseId);
      setSubmissionsByCourse((prev) => ({ ...prev, [courseId]: list }));
    } catch (e) {
      setError(e.message || "Failed to load submissions");
    }
  };

  const handleSetAssessmentPassed = async (userId, courseId, passed) => {
    const key = `${userId}_${courseId}`;
    setMarkingPassed(key);
    setError(null);
    try {
      await setAssessmentPassed(userId, courseId, passed);
      await loadSubmissionsForCourse(courseId);
    } catch (e) {
      setError(e.message || "Failed to update status");
    } finally {
      setMarkingPassed(null);
    }
  };

  const parseLines = (text) =>
    (text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const courseToForm = (course) => ({
    moduleCode: course.moduleCode ?? "",
    title: course.title ?? "",
    description: course.description ?? "",
    category: course.category ?? "general",
    targetAudience: course.targetAudience ?? "",
    difficultyLevel: course.difficultyLevel ?? "beginner",
    estimatedDuration: course.estimatedDuration ?? "",
    learningObjectives: Array.isArray(course.learningObjectives) ? course.learningObjectives.join("\n") : "",
    prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites.join("\n") : "",
    keyTopics: Array.isArray(course.keyTopics) ? course.keyTopics.join("\n") : "",
    requiredMaterials: course.requiredMaterials ?? "",
    references: course.references ?? "",
    assessmentType: course.assessmentType ?? "",
    passingCriteria: course.passingCriteria ?? "",
    assessmentMaterials: course.assessmentMaterials ?? "",
    certificationEnabled: Boolean(course.certificationEnabled),
    trainerName: course.trainerName ?? "",
    schedule: course.schedule ?? "",
    deliveryMode: course.deliveryMode ?? "online",
    maxParticipants: course.maxParticipants != null ? String(course.maxParticipants) : "",
    version: course.version ?? "1",
    status: course.status ?? "draft",
    trainerNotes: course.trainerNotes ?? "",
    participantFeedback: course.participantFeedback ?? "",
    signatories:
      Array.isArray(course.signatories) && course.signatories.length > 0
        ? course.signatories.map((s) => ({ name: s.name ?? "", title: s.title ?? "" }))
        : [{ name: "", title: "" }],
    evaluationFormQuestions: Array.isArray(course.evaluationFormQuestions) ? course.evaluationFormQuestions : [],
  });

  const openEditForm = (course) => {
    setCreateForm(courseToForm(course));
    setEditingId(course.id);
    setShowCreate(false);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setCreateForm(initialModuleForm);
  };

  const buildPayload = () => ({
    moduleCode: createForm.moduleCode.trim(),
    title: createForm.title.trim(),
    description: createForm.description.trim(),
    category: createForm.category,
    targetAudience: createForm.targetAudience || undefined,
    difficultyLevel: createForm.difficultyLevel,
    estimatedDuration: createForm.estimatedDuration.trim() || undefined,
    learningObjectives: parseLines(createForm.learningObjectives),
    prerequisites: parseLines(createForm.prerequisites),
    keyTopics: parseLines(createForm.keyTopics),
    requiredMaterials: createForm.requiredMaterials.trim() || undefined,
    references: createForm.references.trim() || undefined,
    assessmentType: createForm.assessmentType || undefined,
    passingCriteria: createForm.passingCriteria.trim() || undefined,
    assessmentMaterials: createForm.assessmentMaterials.trim() || undefined,
    certificationEnabled: Boolean(createForm.certificationEnabled),
    trainerName: createForm.trainerName.trim() || undefined,
    schedule: createForm.schedule.trim() || undefined,
    deliveryMode: createForm.deliveryMode,
    maxParticipants: createForm.maxParticipants ? Number(createForm.maxParticipants) : null,
    version: createForm.version.trim() || "1",
    status: createForm.status,
    trainerNotes: createForm.trainerNotes.trim() || undefined,
    participantFeedback: createForm.participantFeedback.trim() || undefined,
    signatories: (createForm.signatories || [])
      .filter((s) => (s.name || "").trim() || (s.title || "").trim())
      .map((s) => ({ name: (s.name || "").trim(), title: (s.title || "").trim() })),
    evaluationFormQuestions: Array.isArray(createForm.evaluationFormQuestions) ? createForm.evaluationFormQuestions : [],
  });

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setCreating(true);
    setError(null);
    const isEdit = Boolean(editingId);
    try {
      if (isEdit) {
        await updateCourse(editingId, buildPayload());
      } else {
        await createCourse({ ...buildPayload(), sections: [] });
      }
      closeForm();
      await loadCourses();
    } catch (e) {
      setError(e.message || (isEdit ? "Failed to update module" : "Failed to create course"));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Delete this course and all its content?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteCourse(id);
      setExpandedId((prev) => (prev === id ? null : prev));
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to delete course");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSection = async (courseId) => {
    if (!newSectionHeading.trim()) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const sections = [...(course.sections || []), { heading: newSectionHeading.trim(), items: [] }];
    setError(null);
    try {
      await updateCourse(courseId, { sections });
      setNewSectionHeading("");
      setAddingSection(null);
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to add section");
    }
  };

  const handleAddContentItem = async (courseId, sectionIndex) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const sections = [...(course.sections || [])];
    const section = sections[sectionIndex];
    if (!section) return;
    const fileInput = document.getElementById(`file-${courseId}-${sectionIndex}`);
    if (!fileInput?.files?.length && !newItemTitle.trim()) return;

    setUploadingFile(`${courseId}-${sectionIndex}`);
    setError(null);
    try {
      let downloadURL = "";
      let storagePath = "";
      if (fileInput?.files?.length) {
        const file = fileInput.files[0];
        const type = newItemType;
        const { downloadURL: url, storagePath: path } = await uploadCourseFile(courseId, file, type);
        downloadURL = url;
        storagePath = path;
      }
      const title = newItemTitle.trim() || (fileInput?.files?.[0]?.name ?? "Untitled");
      const items = [...(section.items || []), { title, type: newItemType, downloadURL, storagePath, order: section.items?.length ?? 0 }];
      sections[sectionIndex] = { ...section, items };
      await updateCourse(courseId, { sections });
      setNewItemTitle("");
      setNewItemType("pdf");
      setAddingItem(null);
      if (fileInput) fileInput.value = "";
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to add content");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleRemoveContentItem = async (courseId, sectionIndex, itemIndex) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const sections = [...(course.sections || [])];
    const section = sections[sectionIndex];
    if (!section?.items) return;
    const items = section.items.filter((_, i) => i !== itemIndex);
    sections[sectionIndex] = { ...section, items };
    setError(null);
    try {
      await updateCourse(courseId, { sections });
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to remove content");
    }
  };

  const handleRemoveSection = async (courseId, sectionIndex) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const sections = (course.sections || []).filter((_, i) => i !== sectionIndex);
    setError(null);
    try {
      await updateCourse(courseId, { sections });
      setAddingSection(null);
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to remove section");
    }
  };

  const handleSavePassingScore = async (courseId, value) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const passingCriteria = value.trim() === "" ? "70" : value.replace(/%/g, "").trim();
    setError(null);
    try {
      await updateCourse(courseId, { passingCriteria });
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to update passing score");
    }
  };

  const handleAddAssessmentQuestion = (courseId, type) => {
    setAddingQuestion(`${courseId}_${type}`);
    setNewQuestion({ q: "", option1: "", option2: "", option3: "", option4: "", answer: 0 });
  };

  const handleSaveAssessmentQuestion = async (courseId, type) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const { q, option1, option2, option3, option4, answer } = newQuestion;
    if (!q.trim()) return;
    const options = [option1, option2, option3, option4].filter((o) => o.trim());
    if (options.length < 2) return;
    const assessments = { ...(course.assessments || { pretest: [], quiz: [], final: [] }) };
    if (!Array.isArray(assessments[type])) assessments[type] = [];
    assessments[type] = [...assessments[type], { q: q.trim(), options, answer: Number(answer) }];
    setError(null);
    try {
      await updateCourse(courseId, { assessments });
      setAddingQuestion(null);
      setNewQuestion({ q: "", option1: "", option2: "", option3: "", option4: "", answer: 0 });
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to add question");
    }
  };

  const handleRemoveAssessmentQuestion = async (courseId, type, index) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const assessments = { ...(course.assessments || { pretest: [], quiz: [], final: [] }) };
    const list = [...(assessments[type] || [])];
    list.splice(index, 1);
    assessments[type] = list;
    setError(null);
    try {
      await updateCourse(courseId, { assessments });
      await loadCourses();
    } catch (e) {
      setError(e.message || "Failed to remove question");
    }
  };

  const extractUserIdFromStoragePath = (storagePath) => {
    if (!storagePath || typeof storagePath !== "string") return "";
    const parts = storagePath.split("/").filter(Boolean);
    const submissionsIndex = parts.indexOf("submissions");
    if (submissionsIndex < 0 || submissionsIndex + 1 >= parts.length) return "";
    return parts[submissionsIndex + 1] || "";
  };

  const extractFileName = (submission) => {
    const storagePath = submission?.videoSubmission?.storagePath;
    if (storagePath && typeof storagePath === "string") {
      const fromPath = storagePath.split("/").filter(Boolean).pop();
      if (fromPath) return decodeURIComponent(fromPath);
    }
    const fileUrl = submission?.videoSubmission?.downloadURL;
    if (fileUrl && typeof fileUrl === "string") {
      try {
        const decoded = decodeURIComponent(fileUrl);
        const marker = "/o/";
        const markerIndex = decoded.indexOf(marker);
        if (markerIndex >= 0) {
          const objectPath = decoded.slice(markerIndex + marker.length).split("?")[0];
          const fromUrl = objectPath.split("/").filter(Boolean).pop();
          if (fromUrl) return fromUrl;
        }
      } catch {
        return "";
      }
    }
    return "";
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Training & Capability Uplift"
        description="Coordinate competency-building with partner agencies. Track enrolments, certification currency, and capability uplifts requested from the training cluster."
        actions={
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <DownloadCloud className="h-4 w-4" />
              Import training plan
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
              <GraduationCap className="h-4 w-4" />
              Request workshop
            </button>
          </div>
        }
      />

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            {trainingTracks.map((track) => (
              <div
                key={track.title}
                className="rounded-2xl border border-border/60 bg-background/60 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {track.title}
                    </p>
                    <p className="text-xs text-foreground/60">
                      Lead agency: {track.owner}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone[track.status]
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-foreground/70" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-foreground/70" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-foreground/60">
                        {course.moduleCode ? `${course.moduleCode} · ` : ""}
                        {course.category} · {course.status || "draft"} · {sectionCount} section(s) · {itemCount} item(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      disabled={deletingId === course.id}
                      className="rounded-lg p-2 text-foreground/50 hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50"
                      aria-label="Delete course"
                    >
                      {deletingId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/60 p-4 pt-2">
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => openEditForm(course)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium text-foreground/80 hover:border-primary/40 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit module details
                        </button>
                      </div>

                      {/* Assessments: passing score + pretest / quiz / final questions */}
                      <div className="mb-6 rounded-xl border border-border/40 bg-background/40 p-4">
                        <h4 className="mb-3 font-medium text-foreground">Assessments (for certification)</h4>
                        <p className="mb-3 text-xs text-foreground/60">
                          Set passing score and add questions for Pre-test, Quiz, and Final. Responders must pass all assessments (at this score) and complete all content to earn the certificate.
                        </p>
                        <div className="mb-4 flex items-center gap-2">
                          <label className="text-sm text-foreground/80">Passing score (%):</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={course.passingCriteria ? String(course.passingCriteria).replace(/%/g, "") : "70"}
                            onBlur={(e) => handleSavePassingScore(course.id, e.target.value)}
                            className="w-20 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
                          />
                        </div>
                        {["pretest", "quiz", "final"].map((atype) => {
                          const questions = (course.assessments && course.assessments[atype]) || [];
                          const key = `${course.id}_${atype}`;
                          const isAdding = addingQuestion === key;
                          const typeLabel = atype === "pretest" ? "Pre-test" : atype === "quiz" ? "Quiz" : "Final Assessment";
                          return (
                            <div key={atype} className="mb-4 rounded-lg border border-border/40 bg-background/60 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{typeLabel}</span>
                                {!isAdding && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddAssessmentQuestion(course.id, atype)}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                                    Add question
                                  </button>
                                )}
                              </div>
                              {questions.length > 0 && (
                                <ul className="mb-2 space-y-1 text-sm text-foreground/80">
                                  {questions.map((q, qi) => (
                                    <li key={qi} className="flex items-center justify-between rounded bg-background/60 px-2 py-1.5">
                                      <span className="truncate flex-1">{q.q}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAssessmentQuestion(course.id, atype, qi)}
                                        className="rounded p-1 text-foreground/50 hover:text-rose-600"
                                        aria-label="Remove question"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {isAdding && (
                                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-sm">
                                  <input
                                    type="text"
                                    value={newQuestion.q}
                                    onChange={(e) => setNewQuestion((n) => ({ ...n, q: e.target.value }))}
                                    placeholder="Question text"
                                    className="mb-2 w-full rounded border border-border/60 bg-background px-2 py-1.5"
                                  />
                                  {[1, 2, 3, 4].map((i) => (
                                    <input
                                      key={i}
                                      type="text"
                                      value={newQuestion[`option${i}`]}
                                      onChange={(e) => setNewQuestion((n) => ({ ...n, [`option${i}`]: e.target.value }))}
                                      placeholder={`Option ${i}`}
                                      className="mb-1.5 w-full rounded border border-border/60 bg-background px-2 py-1"
                                    />
                                  ))}
                                  <div className="mt-2 flex items-center gap-2">
                                    <label className="text-foreground/70">Correct answer:</label>
                                    <select
                                      value={newQuestion.answer}
                                      onChange={(e) => setNewQuestion((n) => ({ ...n, answer: Number(e.target.value) }))}
                                      className="rounded border border-border/60 bg-background px-2 py-1"
                                    >
                                      <option value={0}>Option 1</option>
                                      <option value={1}>Option 2</option>
                                      <option value={2}>Option 3</option>
                                      <option value={3}>Option 4</option>
                                    </select>
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveAssessmentQuestion(course.id, atype)}
                                      className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                                    >
                                      Save question
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAddingQuestion(null)}
                                      className="rounded border border-border/60 px-2 py-1 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {(course.assessmentType === "Practical Test" || course.assessmentType === "Simulation" || course.assessmentType === "Evaluation Form") && (
                        <div className="mb-6 rounded-xl border border-border/40 bg-background/40 p-4">
                          <h4 className="mb-3 font-medium text-foreground">Submissions (review &amp; re-evaluate)</h4>
                          <p className="mb-3 text-xs text-foreground/60">
                            Responders submit {course.assessmentType === "Evaluation Form" ? "evaluation forms" : "videos"}. Review and mark as passed or failed.
                          </p>
                          <button
                            type="button"
                            onClick={() => loadSubmissionsForCourse(course.id)}
                            className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium text-foreground/80 hover:border-primary/40"
                          >
                            Load submissions
                          </button>
                          {Array.isArray(submissionsByCourse[course.id]) && (
                            <ul className="space-y-3">
                              {submissionsByCourse[course.id]
                                .filter((p) => p.videoSubmission || p.evalFormSubmission || p.assessmentResults?.final)
                                .map((p) => (
                                  <li key={p.progressId} className="rounded-lg border border-border/40 bg-background/60 p-3 text-sm">
                                    <div className="mb-2 font-medium text-foreground/90">
                                      User ID: {p.userId || extractUserIdFromStoragePath(p.videoSubmission?.storagePath) || "Unknown"}
                                    </div>
                                    {p.videoSubmission?.downloadURL && (
                                      <div className="mb-3 space-y-2">
                                        <div className="text-xs text-foreground/70">
                                          File Name: {extractFileName(p) || "Unknown file"}
                                        </div>
                                        <video
                                          controls
                                          preload="metadata"
                                          className="w-full max-w-md rounded border border-border/40 bg-black"
                                          src={p.videoSubmission.downloadURL}
                                        >
                                          Your browser cannot play this uploaded video format.
                                        </video>
                                        <a
                                          href={p.videoSubmission.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-block text-primary hover:underline"
                                        >
                                          Open video in new tab
                                        </a>
                                      </div>
                                    )}
                                    {p.evalFormSubmission && typeof p.evalFormSubmission === "object" && (
                                      <div className="mb-2 space-y-1 rounded bg-background/80 p-2">
                                        {Object.entries(p.evalFormSubmission).map(([k, v]) => {
                                          const qIndex = k.replace(/^q/, "");
                                          const label = Array.isArray(course.evaluationFormQuestions)?.[Number(qIndex)]?.question || k;
                                          return (
                                            <div key={k}>
                                              <span className="text-foreground/60">{label}:</span> {String(v)}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {!p.videoSubmission?.downloadURL && !p.evalFormSubmission && (
                                      <div className="mb-2 rounded bg-amber-500/10 p-2 text-xs text-foreground/80">
                                        No attachment metadata found for this submission record. You can still set grading status.
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className={p.assessmentResults?.final?.passed ? "text-green-600 font-medium" : "text-foreground/70"}>
                                        {p.assessmentResults?.final?.passed ? "Passed" : "Pending / Failed"}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={markingPassed === `${p.userId}_${course.id}`}
                                        onClick={() => handleSetAssessmentPassed(p.userId, course.id, true)}
                                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {markingPassed === `${p.userId}_${course.id}` ? "..." : "Mark passed"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={markingPassed === `${p.userId}_${course.id}`}
                                        onClick={() => handleSetAssessmentPassed(p.userId, course.id, false)}
                                        className="rounded border border-border/60 px-2 py-1 text-xs font-medium hover:bg-rose-500/10 text-rose-600 disabled:opacity-50"
                                      >
                                        Mark failed
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              {submissionsByCourse[course.id].filter((p) => p.videoSubmission || p.evalFormSubmission || p.assessmentResults?.final).length === 0 && (
                                <li className="text-foreground/60 text-sm">No submissions yet.</li>
                              )}
                            </ul>
                          )}
                        </div>
                      )}

                      {(course.sections || []).length === 0 && (
                        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90">
                          <span className="font-medium">Add a section first, then upload files.</span> After adding a section (e.g. &quot;Materials&quot; or &quot;Videos&quot;), use &quot;Upload PDF, video, or document&quot; inside it to upload to Firebase Storage.
                        </div>
                      )}
                      {(course.sections || []).map((section, sIdx) => (
                        <div
                          key={sIdx}
                          className="mb-6 rounded-xl border border-border/40 bg-background/40 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium text-foreground">
                              <FolderOpen className="h-4 w-4" />
                              {section.heading}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(course.id, sIdx)}
                              className="rounded p-1.5 text-foreground/50 hover:bg-rose-500/10 hover:text-rose-600"
                              aria-label="Remove section"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <ul className="mt-3 space-y-2">
                            {(section.items || []).map((item, iIdx) => (
                              <li
                                key={iIdx}
                                className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm"
                              >
                                <span className="flex items-center gap-2 text-foreground">
                                  {item.type === "video" ? (
                                    <Film className="h-4 w-4 text-foreground/60" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-foreground/60" />
                                  )}
                                  {item.title}
                                  {item.downloadURL ? (
                                    <span className="text-xs text-foreground/50">(file)</span>
                                  ) : null}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveContentItem(course.id, sIdx, iIdx)}
                                  className="rounded p-1 text-foreground/50 hover:text-rose-600"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                          {addingItem === `${course.id}-${sIdx}` ? (
                            <div className="mt-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4">
                              <p className="mb-3 text-sm font-medium text-foreground">
                                Upload to Firebase Storage
                              </p>
                              <input
                                type="text"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                placeholder="Item title (or use file name)"
                                className="mb-3 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                              />
                              <div className="mb-3 flex gap-4">
                                {CONTENT_TYPES.map(({ value, label }) => (
                                  <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`type-${course.id}-${sIdx}`}
                                      checked={newItemType === value}
                                      onChange={() => setNewItemType(value)}
                                    />
                                    {label}
                                  </label>
                                ))}
                              </div>
                              <label className="mb-3 flex cursor-pointer flex-col gap-1 text-sm">
                                <span className="font-medium text-foreground/80">Choose file (PDF, video, or document)</span>
                                <input
                                  id={`file-${course.id}-${sIdx}`}
                                  type="file"
                                  accept=".pdf,.doc,.docx,.mp4,.webm,.mov,.avi,.mkv,.txt"
                                  className="block w-full text-sm text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer"
                                />
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddContentItem(course.id, sIdx)}
                                  disabled={uploadingFile === `${course.id}-${sIdx}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                >
                                  {uploadingFile === `${course.id}-${sIdx}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="h-3.5 w-3.5" />
                                  )}
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingItem(null);
                                    setNewItemTitle("");
                                  }}
                                  className="rounded-lg border border-border/60 px-3 py-1.5 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingItem(`${course.id}-${sIdx}`)}
                              className="mt-2 inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:border-primary hover:bg-primary/10"
                            >
                              <Upload className="h-4 w-4" />
                              Upload PDF, video, or document (Firebase Storage)
                            </button>
                          )}
                        </div>
                      ))}

                      {addingSection === course.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSectionHeading}
                            onChange={(e) => setNewSectionHeading(e.target.value)}
                            placeholder="Section heading (e.g. General Information)"
                            className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSection(course.id)}
                            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                          >
                            Add section
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingSection(null);
                              setNewSectionHeading("");
                            }}
                            className="rounded-lg border border-border/60 px-3 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingSection(course.id)}
                          className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:border-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4" />
                          Add section (then upload PDFs, videos, documents)
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {track.schedule}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    {track.slots}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-full max-w-sm flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Capability requests
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                Coordinate with the training cluster for new requirements.
              </p>
            </div>
            <div className="space-y-4 text-sm text-foreground/70">
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                <p className="font-semibold text-primary">
                  Technical rescue training
                </p>
                <p className="text-xs text-primary/70">
                  Requested by Barangay DRRM Council — awaiting schedule slot.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="font-semibold text-foreground">
                  Emergency communications drill
                </p>
                <p className="text-xs text-foreground/60">
                  PIO cluster prepping joint exercise across LGU offices.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="font-semibold text-foreground">
                  Barangay ICS orientation
                </p>
                <p className="text-xs text-foreground/60">
                  Coordinating with municipal DILG officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
