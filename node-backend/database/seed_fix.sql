-- ============================================================
-- Kalinga Seed FIX — hospitals, hospital_reports, triage_cases
-- ============================================================

-- ─── FIX 1: Advance hospitals sequence past existing max ─────
SELECT setval('hospitals_id_seq', (SELECT MAX(id) FROM hospitals));

-- ─── FIX 2: Insert DOH Metro Manila hospitals ─────────────────
INSERT INTO hospitals (name, code, short_name, address, contact_number, email, type, level,
  latitude, longitude, capacity, bed_capacity, icu_capacity, current_occupancy,
  current_safety_index, safety_category, ownership, is_active, region, province,
  city_municipality, capabilities, created_at, updated_at)
VALUES
  ('Philippine General Hospital',
   'PGH-001', 'PGH', 'Taft Avenue, Ermita, Manila',
   '(02) 8554-8400', 'info@pgh.gov.ph', 'government', 'DOH Hospital',
   14.5794, 120.9822, 1500, 1500, 120, 1410,
   72.5, 'B', 'government', true, 'NCR', 'Metro Manila', 'Manila',
   '{"emergency":true,"icu":true,"pediatrics":true,"cardiology":true}',
   NOW(), NOW()),

  ('East Avenue Medical Center',
   'EAMC-001', 'EAMC', 'East Avenue, Diliman, Quezon City',
   '(02) 8928-0611', 'info@eamc.gov.ph', 'government', 'DOH Hospital',
   14.6362, 121.0437, 800, 800, 60, 736,
   68.0, 'B', 'government', true, 'NCR', 'Metro Manila', 'Quezon City',
   '{"emergency":true,"neurology":true,"icu":true}',
   NOW(), NOW()),

  ('Rizal Medical Center',
   'RMC-001', 'RMC', '1881 Pio Valenzuela, Pasig City',
   '(02) 8671-9761', 'info@rmc.gov.ph', 'government', 'DOH Hospital',
   14.5641, 121.0713, 600, 600, 40, 468,
   74.0, 'A', 'government', true, 'NCR', 'Metro Manila', 'Pasig City',
   '{"surgery":true,"obstetrics":true,"icu":true}',
   NOW(), NOW()),

  ('Jose R. Reyes Memorial Medical Center',
   'JRRMMC-001', 'JRRMMC', 'San Lazaro Compound, Rizal Avenue, Manila',
   '(02) 8711-9491', 'info@jrrmmc.gov.ph', 'government', 'DOH Hospital',
   14.6155, 120.9843, 700, 700, 50, 686,
   65.4, 'C', 'government', true, 'NCR', 'Metro Manila', 'Manila',
   '{"emergency":true,"neurosurgery":true,"pediatrics":true}',
   NOW(), NOW()),

  ('National Children''s Hospital',
   'NCH-001', 'NCH', 'Quezon Avenue, Quezon City',
   '(02) 8525-0347', 'info@nch.gov.ph', 'government', 'DOH Hospital',
   14.6380, 121.0200, 400, 400, 35, 352,
   71.2, 'B', 'government', true, 'NCR', 'Metro Manila', 'Quezon City',
   '{"pediatrics":true,"nicu":true,"emergency":true}',
   NOW(), NOW()),

  ('Ospital ng Maynila Medical Center',
   'OMMC-001', 'OMMC', 'Roxas Boulevard, Malate, Manila',
   '(02) 8524-6061', 'info@ommc.gov.ph', 'government', 'DOH Hospital',
   14.5695, 120.9827, 500, 500, 35, 410,
   69.8, 'B', 'government', true, 'NCR', 'Metro Manila', 'Manila',
   '{"emergency":true,"trauma":true,"icu":true}',
   NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ─── FIX 3: hospital_reports (fixed ambiguous created_at) ────
DO $$
DECLARE v_admin bigint;
BEGIN
  SELECT id INTO v_admin FROM users WHERE email = 'admin@kalinga.com';

  INSERT INTO hospital_reports (title, hospital_name, message, action, severity, occupancy, type, status, reporter_id, created_at, updated_at)
  VALUES
    ('Capacity Alert: ED Near Full',
     'Philippine General Hospital',
     'Emergency Department nearing full capacity (94% occupied)',
     'Prepare for patient redirection to JRRMMC or OMMC',
     'high', 94, 'capacity', 'active', v_admin,
     NOW() - INTERVAL '10 minutes', NOW()),

    ('ICU Critical Occupancy',
     'East Avenue Medical Center',
     'ICU occupancy reached critical threshold (92%)',
     'Coordinate overflow arrangements with nearby Level 3 hospitals',
     'critical', 92, 'capacity', 'active', v_admin,
     NOW() - INTERVAL '25 minutes', NOW()),

    ('Limited Oxygen Supply',
     'Rizal Medical Center',
     'Oxygen tank inventory below minimum threshold (3 tanks remaining)',
     'Request urgent replenishment from DOH Central Warehousing',
     'high', 78, 'supply', 'active', v_admin,
     NOW() - INTERVAL '1 hour', NOW()),

    ('NICU Capacity Near Full',
     'National Children''s Hospital',
     'NICU ward at 88% occupancy; limited space for critical neonates',
     'Redirect NICU overflow to PGH Pediatrics',
     'medium', 88, 'capacity', 'active', v_admin,
     NOW() - INTERVAL '2 hours', NOW()),

    ('ED Overcrowding',
     'Ospital ng Maynila Medical Center',
     'Emergency department log shows 45+ patients in 4-hour wait queue',
     'Activate surge protocol; open overflow treatment area',
     'high', 82, 'capacity', 'active', v_admin,
     NOW() - INTERVAL '3 hours', NOW()),

    ('Cardiology Team Unavailable',
     'Philippine General Hospital',
     'Cardiology on-call team unavailable due to internal emergency',
     'Redirect cardiology cases to St. Luke''s Global City',
     'critical', NULL, 'specialist', 'active', v_admin,
     NOW() - INTERVAL '40 minutes', NOW()),

    ('Neurology Team on Rotation Leave',
     'Jose R. Reyes Memorial Medical Center',
     'Neurology and neurosurgery staff on scheduled rotation leave',
     'Direct neuro-trauma cases to East Avenue Medical Center',
     'high', NULL, 'specialist', 'active', v_admin,
     NOW() - INTERVAL '1 hour', NOW()),

    ('Pediatricians Limited Availability',
     'Ospital ng Maynila Medical Center',
     'Only 2 of 6 pediatricians on duty this shift',
     'Route pediatric emergencies to National Children''s Hospital',
     'medium', NULL, 'specialist', 'active', v_admin,
     NOW() - INTERVAL '2 hours', NOW()),

    ('Blood Bank Low: O-Negative',
     'East Avenue Medical Center',
     'O-negative blood stock critically low (2 units remaining)',
     'Issue emergency request to Philippine Blood Center',
     'critical', NULL, 'supply', 'active', v_admin,
     NOW() - INTERVAL '5 hours', NOW()),

    ('Generator Maintenance Alert',
     'Rizal Medical Center',
     'Backup generator scheduled for maintenance this weekend',
     'Reduce non-critical procedures during maintenance window',
     'low', NULL, 'general', 'active', v_admin,
     NOW() - INTERVAL '6 hours', NOW());
END $$;

-- ─── FIX 4: Update patients with correct hospital_ids ─────────
DO $$
DECLARE
  v_pgh bigint; v_eamc bigint; v_rmc bigint;
  v_jrrmmc bigint; v_nch bigint; v_ommc bigint;
BEGIN
  SELECT id INTO v_pgh     FROM hospitals WHERE code = 'PGH-001';
  SELECT id INTO v_eamc    FROM hospitals WHERE code = 'EAMC-001';
  SELECT id INTO v_rmc     FROM hospitals WHERE code = 'RMC-001';
  SELECT id INTO v_jrrmmc  FROM hospitals WHERE code = 'JRRMMC-001';
  SELECT id INTO v_nch     FROM hospitals WHERE code = 'NCH-001';
  SELECT id INTO v_ommc    FROM hospitals WHERE code = 'OMMC-001';

  -- Assign hospitals to patients by their distinctive notes
  UPDATE patients SET hospital_id = v_pgh    WHERE full_name IN ('Ricardo Santos','Marites Cruz','Fernando Reyes','Lourdes Garcia','Miguel Torres');
  UPDATE patients SET hospital_id = v_eamc   WHERE full_name IN ('Elena Villanueva','Roberto Mendoza','Patricia Lim','Carlos Ramos');
  UPDATE patients SET hospital_id = v_rmc    WHERE full_name IN ('Josephine Dela Cruz','Antonio Flores');
  UPDATE patients SET hospital_id = v_jrrmmc WHERE full_name IN ('Natividad Soriano','Armando Castillo');
  UPDATE patients SET hospital_id = v_nch    WHERE full_name IN ('Baby Gonzales','Nathan Aquino');
  UPDATE patients SET hospital_id = v_ommc   WHERE full_name IN ('Gemma Padilla','Dennis Ocampo','Rosario Bautista');
END $$;

-- ─── FIX 5: Insert triage_cases (after patients have hospital_ids) ─
DO $$
DECLARE
  v_resp5 bigint;
  v_p RECORD;
BEGIN
  SELECT id INTO v_resp5 FROM users WHERE email = 'responder_verified@kalinga.com';

  FOR v_p IN
    SELECT id, hospital_id, triage_level, notes
    FROM patients
    WHERE status != 'discharged' AND hospital_id IS NOT NULL
  LOOP
    INSERT INTO triage_cases (
      hospital_id, patient_id, triage_level, status,
      presenting_complaint, vitals, assigned_to, created_at, updated_at
    )
    VALUES (
      v_p.hospital_id,
      v_p.id,
      COALESCE(v_p.triage_level, 'low'),
      'active',
      v_p.notes,
      jsonb_build_object(
        'bp',   (110 + floor(random()*50))::text || '/' || (70 + floor(random()*30))::text,
        'hr',   (60  + floor(random()*60))::int,
        'temp', round((36.0 + random()*2.5)::numeric, 1),
        'spo2', (88 + floor(random()*12))::int,
        'rr',   (12  + floor(random()*20))::int
      ),
      v_resp5,
      NOW() - (random() * INTERVAL '8 hours'),
      NOW()
    );
  END LOOP;
END $$;

-- ─── FINAL VERIFY ─────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM hospitals)          AS hospitals,
  (SELECT COUNT(*) FROM responders)         AS responders,
  (SELECT COUNT(*) FROM incidents)          AS incidents,
  (SELECT COUNT(*) FROM notifications)      AS notifications,
  (SELECT COUNT(*) FROM hospital_reports)   AS hospital_reports,
  (SELECT COUNT(*) FROM patients)           AS patients,
  (SELECT COUNT(*) FROM triage_cases)       AS triage_cases,
  (SELECT COUNT(*) FROM training_courses)   AS training_courses,
  (SELECT COUNT(*) FROM training_records)   AS training_records,
  (SELECT COUNT(*) FROM certifications)     AS certifications,
  (SELECT COUNT(*) FROM regions)            AS regions,
  (SELECT COUNT(*) FROM responder_activity) AS responder_activity,
  (SELECT COUNT(*) FROM user_settings)      AS user_settings,
  (SELECT COUNT(*) FROM accounts)           AS accounts;
