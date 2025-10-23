// src/data/courseContent.js
const courseContent = {
  "1": {
    title: "Barangay First 1000 Days Facilitator's Guide eTraining",
    materials: [
      { name: "Facilitator’s Guide PDF", type: "pdf", link: "/materials/first1000days_guide.pdf" },
      { name: "Training Video", type: "video", link: "https://youtu.be/example1" },
    ],
    sections: [
      { title: "Introduction to the First 1000 Days Concept", minTime: 10 },
      { title: "Maternal Nutrition and Health", minTime: 10 },
      { title: "Infant and Young Child Feeding Practices", minTime: 10 },
      { title: "Micronutrient Supplementation and Immunization", minTime: 10 },
      { title: "Community Mobilization and Advocacy", minTime: 10 },
      { title: "Monitoring and Evaluation of Nutrition Programs", minTime: 10 },
    ],
    assessments: {
      pretest: [
        { q: "What does 'First 1000 Days' refer to?", options: ["From birth to age 3", "From conception to 2 years", "From 1 to 5 years", "From pregnancy to 3 years"], answer: 1 },
        { q: "Which nutrient is critical during pregnancy?", options: ["Protein", "Vitamin D", "Iron and Folate", "Zinc"], answer: 2 },
        { q: "Exclusive breastfeeding should last for how long?", options: ["2 months", "4 months", "6 months", "12 months"], answer: 2 },
        { q: "Complementary feeding starts at?", options: ["2 months", "4 months", "6 months", "1 year"], answer: 2 },
        { q: "Community mobilization ensures?", options: ["Individual effort only", "Collective participation", "Random actions", "Health facility only"], answer: 1 },
      ],
      quiz: [
        { q: "The First 1000 Days approach focuses on?", options: ["Adolescent health", "Early childhood nutrition", "Elderly care", "Dental health"], answer: 1 },
        { q: "Micronutrients prevent?", options: ["Obesity", "Deficiencies", "Stress", "Allergies"], answer: 1 },
        { q: "Key actors in barangay nutrition programs?", options: ["Barangay Nutrition Scholars", "Teachers only", "Parents only", "Officials only"], answer: 0 },
        { q: "Immunization protects from?", options: ["Malnutrition", "Infectious diseases", "Obesity", "Anemia only"], answer: 1 },
        { q: "Evaluation of programs helps?", options: ["Identify gaps and improve implementation", "End programs", "Avoid monitoring", "Skip reporting"], answer: 0 },
      ],
      final: [
        { q: "The goal of the First 1000 Days program is?", options: ["Prevent stunting and malnutrition", "Promote weight loss", "Focus on elderly", "Support hospitals only"], answer: 0 },
        { q: "Advocacy is key for?", options: ["Community awareness", "Isolation", "Policy avoidance", "Personal gain"], answer: 0 },
        { q: "Exclusive breastfeeding is recommended for?", options: ["6 months", "3 months", "12 months", "1 month"], answer: 0 },
        { q: "Proper complementary feeding begins when?", options: ["At 6 months", "At 2 months", "At 9 months", "At birth"], answer: 0 },
        { q: "Monitoring helps ensure?", options: ["Program success", "Irregular data", "Skipped reports", "No evaluation"], answer: 0 },
      ],
    },
  },

  "2": {
    title: "DOH Integrated People-Centered Health Services",
    materials: [
      { name: "IPCHS Framework PDF", type: "pdf", link: "/materials/ipchs_framework.pdf" },
      { name: "Introductory Video", type: "video", link: "https://youtu.be/example2" },
    ],
    sections: [
      { title: "Overview of IPCHS Framework", minTime: 10 },
      { title: "Empowering Individuals and Communities", minTime: 10 },
      { title: "Strengthening Governance and Accountability", minTime: 10 },
      { title: "Coordinating Services within and Across Sectors", minTime: 10 },
      { title: "Innovating Service Delivery Models", minTime: 10 },
      { title: "Monitoring and Evaluation for Quality Health Services", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "3": {
    title: "Integrated Course on Primary Care",
    materials: [
      { name: "Primary Care Guidebook", type: "pdf", link: "/materials/primarycare_guide.pdf" },
    ],
    sections: [
      { title: "Principles of Primary Health Care", minTime: 10 },
      { title: "Health Promotion and Disease Prevention", minTime: 10 },
      { title: "Community Diagnosis and Planning", minTime: 10 },
      { title: "Referral Systems and Coordination", minTime: 10 },
      { title: "Interprofessional Collaboration", minTime: 10 },
      { title: "Quality Improvement in Primary Care", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "4": {
    title: "Introduction to Seven Major Recommendations to Prevent Tuberculosis Transmission",
    materials: [
      { name: "TB Prevention Manual", type: "pdf", link: "/materials/tb_prevention.pdf" },
    ],
    sections: [
      { title: "Overview of TB Transmission", minTime: 10 },
      { title: "Administrative Controls", minTime: 10 },
      { title: "Environmental Controls", minTime: 10 },
      { title: "Personal Protective Equipment", minTime: 10 },
      { title: "Community and Health Facility Interventions", minTime: 10 },
      { title: "Monitoring and Compliance", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "5": {
    title: "Healthy Hearts Technical Package",
    materials: [
      { name: "HEARTS Framework Overview", type: "pdf", link: "/materials/hearts_framework.pdf" },
    ],
    sections: [
      { title: "Introduction to HEARTS Framework", minTime: 10 },
      { title: "Healthy Lifestyle Promotion", minTime: 10 },
      { title: "Evidence-based Treatment Protocols", minTime: 10 },
      { title: "Access to Essential Medicines and Technology", minTime: 10 },
      { title: "Risk-based Management Approach", minTime: 10 },
      { title: "Monitoring Cardiovascular Health Outcomes", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "6": {
    title: "Basic Course in Family Planning Final Exam and Certificate of Training",
    materials: [
      { name: "Family Planning Handbook", type: "pdf", link: "/materials/familyplanning_handbook.pdf" },
    ],
    sections: [
      { title: "Overview of Family Planning Principles", minTime: 10 },
      { title: "Counseling Techniques and Informed Choice", minTime: 10 },
      { title: "Modern Family Planning Methods", minTime: 10 },
      { title: "Eligibility Screening and Client Assessment", minTime: 10 },
      { title: "Service Delivery and Record-Keeping", minTime: 10 },
      { title: "Ethics and Client Rights in Family Planning", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "7": {
    title: "Nutrition Care Process for Clinical Nutritionist Dietitians",
    materials: [
      { name: "NCP Manual", type: "pdf", link: "/materials/ncp_manual.pdf" },
    ],
    sections: [
      { title: "Introduction to Nutrition Care Process (NCP)", minTime: 10 },
      { title: "Nutrition Assessment", minTime: 10 },
      { title: "Nutrition Diagnosis", minTime: 10 },
      { title: "Nutrition Intervention and Monitoring", minTime: 10 },
      { title: "Outcome Evaluation and Documentation", minTime: 10 },
      { title: "Case Studies and Application", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "8": {
    title: "Basic Life Support Online Training - Didactic [NCMH - 2025 BATCH 10]",
    materials: [
      { name: "BLS Manual", type: "pdf", link: "/materials/bls_manual.pdf" },
      { name: "Training Video", type: "video", link: "https://youtu.be/example3" },
    ],
    sections: [
      { title: "Introduction to Basic Life Support", minTime: 10 },
      { title: "CPR for Adults and Children", minTime: 10 },
      { title: "AED Usage and Safety", minTime: 10 },
      { title: "Rescue Breathing and Choking Management", minTime: 10 },
      { title: "Team Dynamics in Resuscitation", minTime: 10 },
      { title: "Assessment and Certification Process", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "9": {
    title: "Basic Course on Continuous Quality Improvement for Health Facilities",
    materials: [
      { name: "CQI Handbook", type: "pdf", link: "/materials/cqi_handbook.pdf" },
    ],
    sections: [
      { title: "Overview of Quality Improvement", minTime: 10 },
      { title: "QI Tools and Techniques", minTime: 10 },
      { title: "Problem Identification and Root Cause Analysis", minTime: 10 },
      { title: "Developing and Testing Solutions", minTime: 10 },
      { title: "Monitoring and Sustaining Improvements", minTime: 10 },
      { title: "Institutionalizing QI Culture", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "10": {
    title: "Data to Policy Competency 1 - Problem Statement",
    materials: [
      { name: "Policy Development Guide", type: "pdf", link: "/materials/policy_guide.pdf" },
    ],
    sections: [
      { title: "Introduction to Evidence-Based Policy Making", minTime: 10 },
      { title: "Identifying Health Problems", minTime: 10 },
      { title: "Developing a Clear Problem Statement", minTime: 10 },
      { title: "Data Sources and Analysis", minTime: 10 },
      { title: "Stakeholder Engagement", minTime: 10 },
      { title: "Communicating Policy-Relevant Data", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "11": {
    title: "Orientation on Navigating the Continuing Professional Accreditation System (CPDAS)",
    materials: [
      { name: "CPDAS Manual", type: "pdf", link: "/materials/cpdas_manual.pdf" },
    ],
    sections: [
      { title: "Overview of CPDAS", minTime: 10 },
      { title: "Account Creation and User Interface", minTime: 10 },
      { title: "Accessing and Managing Courses", minTime: 10 },
      { title: "Tracking CPD Units and Certificates", minTime: 10 },
      { title: "Submission of Evidence and Documentation", minTime: 10 },
      { title: "Troubleshooting and Support", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "12": {
    title: "Laboratory Quality Management System Online Training",
    materials: [
      { name: "LQMS Handbook", type: "pdf", link: "/materials/lqms_handbook.pdf" },
    ],
    sections: [
      { title: "Introduction to LQMS", minTime: 10 },
      { title: "Quality System Essentials", minTime: 10 },
      { title: "Document and Record Control", minTime: 10 },
      { title: "Internal Audits and Assessments", minTime: 10 },
      { title: "Quality Improvement and Accreditation", minTime: 10 },
      { title: "Implementation and Case Applications", minTime: 10 },
    ],
    assessments: { pretest: [], quiz: [], final: [] },
  },
};

export default courseContent;
