// src/components/Courses.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const courses = [
  {
    id: "pdtc",
    title: "Professional Development Training Certificate (PDTC)",
    description: "Short description about Professional Development Training Certificate (PDTC) and why it’s useful.",
    progress: 40,
  },
  {
    id: "emcp",
    title: "Emergency Management Certificate Program",
    description: "Short description about Emergency Management Certificate Program and why it’s useful.",
    progress: 25,
  },
  {
    id: "bls-emr",
    title: "Basic Life Support / Emergency Medical Responder (EMR)",
    description: "Short description about Basic Life Support / Emergency Medical Responder (EMR) and why it’s useful.",
    progress: 60,
  },
];

const Courses = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {courses.map((course) => (
        <div
          key={course.id}
          onClick={() => navigate(`/modules/${course.id}`)}
          className="cursor-pointer bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-bold text-green-900">{course.title}</h3>
          <p className="text-gray-600 text-sm mt-2">{course.description}</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Courses;
