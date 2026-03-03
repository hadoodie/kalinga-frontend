const courseContent = {
  "1": {
    title: "Barangay First 1000 Days Facilitator's Guide eTraining",
    materials: [
      { name: "Facilitator’s Guide PDF", type: "pdf", link: "/materials/first1000days_guide.pdf" },
      { name: "Training Video", type: "video", link: "https://youtu.be/example1" },
    ],
    activityDescription:
      "Submit a short video demonstrating proper maternal counseling techniques based on the First 1000 Days guide.",
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
        {
          q: "What does the 'First 1000 Days' mainly refer to?",
          options: [
            "From birth to 3 years old",
            "From conception until 2 years old",
            "From 1 year to 4 years old",
            "From 6 months to 3 years old",
          ],
          answer: 1,
        },
        {
          q: "Which is a key objective of the First 1000 Days program?",
          options: [
            "Prevent stunting and malnutrition",
            "Focus on elderly nutrition",
            "Promote weight loss programs",
            "Improve hospital revenue",
          ],
          answer: 0,
        },
        {
          q: "Which group is MOST critical to target in the First 1000 Days?",
          options: [
            "Pregnant women and children under 2 years",
            "Adults with chronic diseases",
            "Adolescents only",
            "Elderly population",
          ],
          answer: 0,
        },
        {
          q: "Why is maternal nutrition important during pregnancy?",
          options: [
            "It only affects the mother, not the baby",
            "It helps ensure proper fetal growth and development",
            "It is only important in the last trimester",
            "It prevents colds and flu",
          ],
          answer: 1,
        },
        {
          q: "What is the recommended duration for exclusive breastfeeding?",
          options: [
            "2 months",
            "4 months",
            "6 months",
            "12 months",
          ],
          answer: 2,
        },
      ],
      quiz: [
        {
          q: "Which of the following best describes stunting?",
          options: [
            "Low weight for age caused by acute undernutrition",
            "Short height for age due to chronic undernutrition",
            "Excess body fat for height",
            "Low birth weight due to premature birth",
          ],
          answer: 1,
        },
        {
          q: "Complementary feeding should ideally begin at what age?",
          options: ["2 months", "4 months", "6 months", "1 year"],
          answer: 2,
        },
        {
          q: "Which community worker is commonly involved in First 1000 Days implementation at the barangay level?",
          options: [
            "Barangay Nutrition Scholar (BNS)",
            "Traffic enforcer",
            "School principal",
            "Barangay treasurer",
          ],
          answer: 0,
        },
        {
          q: "Vitamin A supplementation primarily helps prevent:",
          options: ["Night blindness", "Fractures", "Diabetes", "Hypertension"],
          answer: 0,
        },
        {
          q: "One key role of barangay health workers in the First 1000 Days is to:",
          options: [
            "Conduct major surgery",
            "Provide basic nutrition counseling and growth monitoring",
            "Prescribe all medicines",
            "Approve hospital budgets",
          ],
          answer: 1,
        },
      ],
      final: [
        {
          q: "Which statement BEST explains why the First 1000 Days are critical?",
          options: [
            "This period is when children can be most easily entertained.",
            "Foundational brain development and linear growth occur rapidly in this window.",
            "Vaccines are only given during this period.",
            "Children learn to walk only during this time.",
          ],
          answer: 1,
        },
        {
          q: "Which is an example of an appropriate complementary food at 6 months?",
          options: [
            "Soft, mashed vegetables and rice porridge",
            "Carbonated soft drinks",
            "Whole nuts and hard candies",
            "Only plain water",
          ],
          answer: 0,
        },
        {
          q: "A key indicator to monitor in First 1000 Days programs is:",
          options: [
            "Child’s eye color",
            "Weight-for-age and height-for-age",
            "Parent’s income",
            "Number of toys owned",
          ],
          answer: 1,
        },
        {
          q: "Which community strategy supports better First 1000 Days outcomes?",
          options: [
            "Discouraging prenatal check-ups",
            "Organizing regular mother’s classes and growth monitoring days",
            "Stopping micronutrient supplementation",
            "Limiting breastfeeding counseling",
          ],
          answer: 1,
        },
        {
          q: "When monitoring program implementation, which activity is MOST appropriate?",
          options: [
            "Ignoring missed check-up schedules",
            "Reviewing growth charts and nutrition reports regularly",
            "Avoiding data collection to save time",
            "Relying on verbal updates only",
          ],
          answer: 1,
        },
      ],
    },
  },

  "2": {
    title: "DOH Integrated People-Centered Health Services",
    materials: [
      { name: "IPCHS Framework PDF", type: "pdf", link: "/materials/ipchs_framework.pdf" },
      { name: "Introductory Video", type: "video", link: "https://youtu.be/example2" },
    ],
    activityDescription:
      "Provide a community example where IPCHS principles are applied and explain the framework components.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "3": {
    title: "Integrated Course on Primary Care",
    materials: [
      { name: "Primary Care Guidebook", type: "pdf", link: "/materials/primarycare_guide.pdf" },
    ],
    activityDescription:
      "Create a brief case scenario demonstrating proper primary care referral using the system flowchart.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "4": {
    title: "Introduction to Seven Major Recommendations to Prevent Tuberculosis Transmission",
    materials: [
      { name: "TB Prevention Manual", type: "pdf", link: "/materials/tb_prevention.pdf" },
    ],
    activityDescription:
      "Submit a demonstration or written plan on implementing TB prevention protocols in your facility.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "5": {
    title: "Healthy Hearts Technical Package",
    materials: [
      { name: "HEARTS Framework Overview", type: "pdf", link: "/materials/hearts_framework.pdf" },
    ],
    activityDescription:
      "Prepare an action plan applying the HEARTS framework to reduce cardiovascular disease risk in your community.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "6": {
    title: "Basic Course in Family Planning Final Exam and Certificate of Training",
    materials: [
      { name: "Family Planning Handbook", type: "pdf", link: "/materials/familyplanning_handbook.pdf" },
    ],
    activityDescription:
      "Conduct a mock FP counseling session and upload the summarized observation notes.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "7": {
    title: "Nutrition Care Process for Clinical Nutritionist Dietitians",
    materials: [
      { name: "NCP Manual", type: "pdf", link: "/materials/ncp_manual.pdf" },
    ],
    activityDescription:
      "Complete an NCP case study and submit your full ADIME documentation.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "8": {
    title: "Basic Life Support Online Training - Didactic [NCMH - 2025 BATCH 10]",
    materials: [
      { name: "BLS Manual", type: "pdf", link: "/materials/bls_manual.pdf" },
      { name: "Training Video", type: "video", link: "https://youtu.be/example3" },
    ],
    activityDescription:
      "Upload a CPR practice video demonstrating proper compression technique.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "9": {
    title: "Basic Course on Continuous Quality Improvement for Health Facilities",
    materials: [
      { name: "CQI Handbook", type: "pdf", link: "/materials/cqi_handbook.pdf" },
    ],
    activityDescription:
      "Submit a written RCA table (Root Cause Analysis) for a common clinical problem.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "10": {
    title: "Data to Policy Competency 1 - Problem Statement",
    materials: [
      { name: "Policy Development Guide", type: "pdf", link: "/materials/policy_guide.pdf" },
    ],
    activityDescription:
      "Write a sample policy problem statement using the course template.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "11": {
    title: "Orientation on Navigating the Continuing Professional Accreditation System (CPDAS)",
    materials: [
      { name: "CPDAS Manual", type: "pdf", link: "/materials/cpdas_manual.pdf" },
    ],
    activityDescription:
      "Perform an actual CPDAS submission and upload a screenshot of your final status.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },

  "12": {
    title: "Laboratory Quality Management System Online Training",
    materials: [
      { name: "LQMS Handbook", type: "pdf", link: "/materials/lqms_handbook.pdf" },
    ],
    activityDescription:
      "Submit a sample quality workflow diagram based on LQMS principles.",
    sections: [ /* unchanged */ ],
    assessments: { pretest: [], quiz: [], final: [] },
  },
};

export default courseContent;
