import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Film,
  FolderOpen,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
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
  setAssessmentPassed,
} from "@/services/trainingService";

const CONTENT_TYPES = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "video", label: "Video", icon: Film },
  { value: "document", label: "Document", icon: FileText },
];

const CATEGORIES = [
  "general",
  "medical",
  "emergency",
  "professional",
  "mental",
  "community",
  "compliance",
];

const TARGET_AUDIENCES = ["Responders", "Students", "LGU Staff", "All"];
const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const ASSESSMENT_TYPES = ["Quiz", "Practical Test", "Simulation", "Evaluation Form"];
const DELIVERY_MODES = ["Online", "On-site", "Hybrid"];
const MODULE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const initialModuleForm = {
  moduleCode: "",
  title: "",
  description: "",
  category: "general",
  targetAudience: "",
  difficultyLevel: "beginner",
  estimatedDuration: "",
  learningObjectives: "",
  prerequisites: "",
  keyTopics: "",
  requiredMaterials: "",
  references: "",
  assessmentType: "",
  passingCriteria: "",
  assessmentMaterials: "",
  certificationEnabled: false,
  trainerName: "",
  schedule: "",
  deliveryMode: "online",
  maxParticipants: "",
  version: "1",
  status: "draft",
  trainerNotes: "",
  participantFeedback: "",
  signatories: [{ name: "", title: "" }],
  evaluationFormQuestions: [],
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Training & Capability Uplift"
        description="Create and manage online training courses. Upload PDFs, videos, and documents. Content appears in the Responder Online Training module."
        actions={
          <button
            type="button"
            onClick={() => {
              if (showCreate || editingId) {
                closeForm();
              } else {
                setCreateForm(initialModuleForm);
                setShowCreate(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
          >
            <GraduationCap className="h-4 w-4" />
            {showCreate || editingId ? "Cancel" : "Create course"}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {(showCreate || editingId) && (
        <form
          onSubmit={handleCreateCourse}
          className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm space-y-8"
        >
          <h3 className="text-xl font-semibold text-foreground">
            {editingId ? "Edit Training Module" : "Create Training Module"}
          </h3>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Basic Information
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80">Module ID / Code</label>
                <input
                  type="text"
                  value={createForm.moduleCode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, moduleCode: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="e.g. TRN-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Module Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="Course title"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Module Description / Overview</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={3}
                placeholder="Brief summary of the module"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80">Training Category / Type</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Target Audience</label>
                <select
                  value={createForm.targetAudience}
                  onChange={(e) => setCreateForm((f) => ({ ...f, targetAudience: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  <option value="">Select</option>
                  {TARGET_AUDIENCES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Difficulty Level</label>
                <select
                  value={createForm.difficultyLevel}
                  onChange={(e) => setCreateForm((f) => ({ ...f, difficultyLevel: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Estimated Duration</label>
                <input
                  type="text"
                  value={createForm.estimatedDuration}
                  onChange={(e) => setCreateForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="e.g. 2 hours or 90 minutes"
                />
              </div>
            </div>
          </div>

          {/* Learning Structure */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Learning Structure
            </h4>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Learning Objectives (one per line)</label>
              <textarea
                value={createForm.learningObjectives}
                onChange={(e) => setCreateForm((f) => ({ ...f, learningObjectives: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={3}
                placeholder="What learners will achieve"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Prerequisites (if any, one per line)</label>
              <textarea
                value={createForm.prerequisites}
                onChange={(e) => setCreateForm((f) => ({ ...f, prerequisites: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={2}
                placeholder="Prior knowledge or modules required"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Key Topics / Lessons (one per line)</label>
              <textarea
                value={createForm.keyTopics}
                onChange={(e) => setCreateForm((f) => ({ ...f, keyTopics: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={3}
                placeholder="Main subjects covered"
              />
            </div>
          </div>

          {/* Content & Materials - note */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
            <span className="font-medium text-primary">Content & Materials:</span> After creating the module, expand it below and add sections. Upload PDFs, videos, slides, and manuals to each section (Firebase Storage).
          </div>

          {/* Assessment & Evaluation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Assessment & Evaluation
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80">Assessment Type</label>
                <select
                  value={createForm.assessmentType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, assessmentType: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  <option value="">Select</option>
                  {ASSESSMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="certificationEnabled"
                  checked={createForm.certificationEnabled}
                  onChange={(e) => setCreateForm((f) => ({ ...f, certificationEnabled: e.target.checked }))}
                  className="rounded border-border/60"
                />
                <label htmlFor="certificationEnabled" className="text-sm font-medium text-foreground/80">
                  Certification / Completion status
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Passing Criteria</label>
              <input
                type="text"
                value={createForm.passingCriteria}
                onChange={(e) => setCreateForm((f) => ({ ...f, passingCriteria: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                placeholder="e.g. 70% or above"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Assessment Materials (notes)</label>
              <textarea
                value={createForm.assessmentMaterials}
                onChange={(e) => setCreateForm((f) => ({ ...f, assessmentMaterials: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={2}
                placeholder="Question banks, scenarios, etc."
              />
            </div>
            {createForm.assessmentType === "Evaluation Form" && (
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground/90">Evaluation Form Questions</h4>
                <p className="text-xs text-foreground/60">Define the form responders will fill. Options are required for radio/checkbox.</p>
                {(createForm.evaluationFormQuestions || []).map((eq, eqIdx) => (
                  <div key={eqIdx} className="rounded-lg border border-border/40 bg-background p-3 space-y-2">
                    <input
                      type="text"
                      value={eq.question ?? ""}
                      onChange={(e) => {
                        const list = [...(createForm.evaluationFormQuestions || [])];
                        if (!list[eqIdx]) list[eqIdx] = { question: "", type: "text" };
                        list[eqIdx] = { ...list[eqIdx], question: e.target.value };
                        setCreateForm((f) => ({ ...f, evaluationFormQuestions: list }));
                      }}
                      placeholder="Question text"
                      className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={eq.type ?? "text"}
                        onChange={(e) => {
                          const list = [...(createForm.evaluationFormQuestions || [])];
                          if (!list[eqIdx]) list[eqIdx] = { question: "", type: "text" };
                          list[eqIdx] = { ...list[eqIdx], type: e.target.value };
                          setCreateForm((f) => ({ ...f, evaluationFormQuestions: list }));
                        }}
                        className="rounded border border-border/60 bg-background px-2 py-1 text-sm"
                      >
                        <option value="text">Text (short)</option>
                        <option value="textarea">Textarea (long)</option>
                        <option value="radio">Radio (single choice)</option>
                        <option value="checkbox">Checkbox (multiple)</option>
                      </select>
                      {(eq.type === "radio" || eq.type === "checkbox") && (
                        <input
                          type="text"
                          value={Array.isArray(eq.options) ? eq.options.join(", ") : ""}
                          onChange={(e) => {
                            const list = [...(createForm.evaluationFormQuestions || [])];
                            if (!list[eqIdx]) list[eqIdx] = { question: "", type: "text" };
                            list[eqIdx] = { ...list[eqIdx], options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                            setCreateForm((f) => ({ ...f, evaluationFormQuestions: list }));
                          }}
                          placeholder="Options (comma-separated)"
                          className="flex-1 min-w-[160px] rounded border border-border/60 bg-background px-2 py-1 text-sm"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const list = (createForm.evaluationFormQuestions || []).filter((_, i) => i !== eqIdx);
                          setCreateForm((f) => ({ ...f, evaluationFormQuestions: list }));
                        }}
                        className="rounded p-1.5 text-foreground/50 hover:text-rose-600"
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCreateForm((f) => ({
                      ...f,
                      evaluationFormQuestions: [...(f.evaluationFormQuestions || []), { question: "", type: "text" }],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add evaluation question
                </button>
              </div>
            )}
            {(createForm.certificationEnabled || (createForm.signatories?.length ?? 0) > 0) && (
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Certificate Signatories (name & title shown on certificate)
                </label>
                <div className="space-y-3">
                  {(createForm.signatories || [{ name: "", title: "" }]).map((sig, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const s = [...(createForm.signatories || [])];
                          if (!s[idx]) s[idx] = { name: "", title: "" };
                          s[idx] = { ...s[idx], name: e.target.value };
                          setCreateForm((f) => ({ ...f, signatories: s }));
                        }}
                        className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground text-sm"
                        placeholder="Signatory name"
                      />
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => {
                          const s = [...(createForm.signatories || [])];
                          if (!s[idx]) s[idx] = { name: "", title: "" };
                          s[idx] = { ...s[idx], title: e.target.value };
                          setCreateForm((f) => ({ ...f, signatories: s }));
                        }}
                        className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground text-sm"
                        placeholder="Title / position"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const s = (createForm.signatories || []).filter((_, i) => i !== idx);
                          setCreateForm((f) => ({ ...f, signatories: s.length ? s : [{ name: "", title: "" }] }));
                        }}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Remove signatory"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((f) => ({
                        ...f,
                        signatories: [...(f.signatories || []), { name: "", title: "" }],
                      }))
                    }
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add signatory
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Administration & Tracking */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Administration & Tracking
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80">Trainer / Facilitator Name</label>
                <input
                  type="text"
                  value={createForm.trainerName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, trainerName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Training Schedule / Availability</label>
                <input
                  type="text"
                  value={createForm.schedule}
                  onChange={(e) => setCreateForm((f) => ({ ...f, schedule: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="e.g. Always available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Delivery Mode</label>
                <select
                  value={createForm.deliveryMode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, deliveryMode: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  <option value="online">Online</option>
                  <option value="on-site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Max Participants</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.maxParticipants}
                  onChange={(e) => setCreateForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-foreground/80">Version Number</label>
                <input
                  type="text"
                  value={createForm.version}
                  onChange={(e) => setCreateForm((f) => ({ ...f, version: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80">Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                >
                  {MODULE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content references */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Content & Materials (references)
            </h4>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Required Materials / Equipment</label>
              <textarea
                value={createForm.requiredMaterials}
                onChange={(e) => setCreateForm((f) => ({ ...f, requiredMaterials: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={2}
                placeholder="Materials or equipment needed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80">References / Sources</label>
              <textarea
                value={createForm.references}
                onChange={(e) => setCreateForm((f) => ({ ...f, references: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={2}
                placeholder="External references or sources"
              />
            </div>
          </div>

          {/* Feedback & Improvement */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-border/60 pb-2">
              Feedback & Improvement
            </h4>
            <div>
              <label className="block text-sm font-medium text-foreground/80">Trainer Notes / Remarks</label>
              <textarea
                value={createForm.trainerNotes}
                onChange={(e) => setCreateForm((f) => ({ ...f, trainerNotes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                rows={2}
                placeholder="Internal notes"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Save changes" : "Create Training Module"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-foreground/70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Courses</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Expand a course to add sections and upload PDFs, videos, or documents to Firebase Storage. Responders see these in Online Training.
        </p>
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
          <span className="font-medium text-primary">How to upload:</span> Create a course → Expand it (click the row) → Add section → Click &quot;Upload PDF, video, or document&quot; → Choose file → Add. Files are stored in Firebase Storage.
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-background/40 py-12 text-center text-sm text-foreground/60">
            No courses yet. Create one above, then expand it, add a section, and use &quot;Upload PDF, video, or document&quot; to upload files to Firebase Storage.
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {courses.map((course) => {
              const isExpanded = expandedId === course.id;
              const sectionCount = (course.sections || []).length;
              const itemCount = (course.sections || []).reduce((acc, s) => acc + (s.items?.length ?? 0), 0);
              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-border/60 bg-background/60"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId((id) => (id === course.id ? null : course.id))}
                    className="flex w-full items-center gap-3 p-4 text-left"
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
                                .filter((p) => p.videoSubmission || p.evalFormSubmission)
                                .map((p) => (
                                  <li key={p.progressId} className="rounded-lg border border-border/40 bg-background/60 p-3 text-sm">
                                    <div className="mb-2 font-medium text-foreground/90">User ID: {p.userId}</div>
                                    {p.videoSubmission?.downloadURL && (
                                      <div className="mb-2">
                                        <a
                                          href={p.videoSubmission.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          Watch video submission
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
                              {submissionsByCourse[course.id].filter((p) => p.videoSubmission || p.evalFormSubmission).length === 0 && (
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
