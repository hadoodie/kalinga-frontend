import { useState } from "react";
import { cn } from "@/lib/utils";

const doctors = [
  // Physicians
  { name: "Dr. Maria Santos", type: "Physician", category: "physicians", photo: "/images/doctors/maria-santos.jpg" },
  { name: "Dr. Juan Dela Cruz", type: "Physician", category: "physicians", photo: "/images/doctors/juan-dela-cruz.jpg" },
  { name: "Dr. Sunshine Malibago", type: "Physician", category: "physicians", photo: "/images/doctors/sunshine-malibago.jpg" },

  // Nurses
  { name: "Nurse Ana Lopez", type: "Nurse", category: "nurses", photo: "/images/nurses/ana-lopez.jpg" },
  { name: "Nurse Mark Reyes", type: "Nurse", category: "nurses", photo: "/images/nurses/mark-reyes.jpg" },
  { name: "Nurse Elpidio Ramos", type: "Nurse", category: "nurses", photo: "/images/nurses/elpidio-ramos.jpg" },

  // EMTs
  { name: "EMT Carlo Mendoza", type: "EMT", category: "EMTs", photo: "/images/emts/carlo-mendoza.jpg" },
  { name: "EMT Sarah Lim", type: "EMT", category: "EMTs", photo: "/images/emts/sarah-lim.jpg" },
  { name: "EMT Gen Ryv Cachero", type: "EMT", category: "EMTs", photo: "/images/emts/gen-ryv-cachero.jpg" },
];

const categories = ["all", "physicians", "nurses", "EMTs"];

export const DoctorsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredDoctors = doctors.filter(
    (doc) => activeCategory === "all" || doc.category === activeCategory
  );

  return (
    <section id="doctors" className="py-24 px-4 relative bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-5 text-center">
          Mga <span className="text-highlight">Doktor</span> na Handa Kayong <span className="text-highlight">Tulungan</span>
        </h2>
        <p className="mb-10 text-center">
          <span className="font-bold">Iba’t ibang espesyalista, iisang layunin, ang kaligtasan ng lahat</span>
          <br></br>Kilalanin sila at alamin ang kanilang mga tungkulin, designasyon, at lokasyon
        </p>

        {/* Category buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category, key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2 rounded-full transition-colors duration-300 capitalize",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70 text-foreground hover:bg-secondary"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Doctors list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc, key) => (
            <div
              key={key}
              className="bg-card p-6 rounded-lg shadow-xs card-hover flex flex-col items-center text-center"
            >
              {/* Photo */}
              <img
                src={doc.photo}
                alt={doc.name}
                className="w-32 h-32 object-cover rounded-full mb-4 border border-gray-200 shadow-sm"
              />

              {/* Name + Type */}
              <h3 className="font-semibold text-lg">{doc.name}</h3>
              <p className="text-muted-foreground">{doc.type}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
