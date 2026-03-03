import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCourses } from "@/services/trainingService";
import { FaBookOpen, FaSpinner } from "react-icons/fa";

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listCourses()
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <FaSpinner className="h-8 w-8 animate-spin text-[var(--training-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
        {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-600 dark:border-gray-600 dark:bg-gray-800/40 dark:text-gray-400">
        <FaBookOpen className="mx-auto mb-2 h-10 w-10 text-gray-400" />
        <p>No courses available yet. Check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <div
          key={course.id}
          onClick={() => navigate(`/responder/modules/${course.id}`)}
          className="cursor-pointer rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg dark:bg-gray-800/60"
        >
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {course.description || "Training course for responders."}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            {course.category ? String(course.category).charAt(0).toUpperCase() + String(course.category).slice(1) : "General"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Courses;
