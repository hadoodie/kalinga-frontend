-- ============================================================
-- Kalinga Cloud Development — Mock Seed Data
-- Run against: aws-1-ap-southeast-1.pooler.supabase.com
-- Safe to re-run (uses ON CONFLICT DO NOTHING / IF NOT EXISTS)
-- ============================================================

-- ─── 0. DISABLE FK checks temporarily for seeding ─────────────
SET session_replication_role = 'replica';

-- ─── 1. ADDITIONAL HOSPITALS (DOH Metro Manila) ───────────────
INSERT INTO hospitals (name, code, short_name, address, contact_number, email, type, level,
  latitude, longitude, capacity, bed_capacity, icu_capacity, current_occupancy,
  current_safety_index, safety_category, ownership, is_active, region, province,
  city_municipality, capabilities, created_at, updated_at)
VALUES
  ('Philippine General Hospital',    'PGH-001',   'PGH',   'Taft Avenue, Ermita, Manila',                   '(02) 8554-8400', 'info@pgh.gov.ph',     'government', 'DOH Hospital', 14.5794, 120.9822, 1500, 1500, 120, 1410, 72.5, 'B', 'government', true, 'NCR', 'Metro Manila', 'Manila',         '{"emergency":true,"icu":true,"pediatrics":true,"cardiology":true}', NOW(), NOW()),
  ('East Avenue Medical Center',     'EAMC-001',  'EAMC',  'East Avenue, Diliman, Quezon City',             '(02) 8928-0611', 'info@eamc.gov.ph',    'government', 'DOH Hospital', 14.6362, 121.0437,  800,  800,  60,  736, 68.0, 'B', 'government', true, 'NCR', 'Metro Manila', 'Quezon City',    '{"emergency":true,"neurology":true,"icu":true}',                    NOW(), NOW()),
  ('Rizal Medical Center',           'RMC-001',   'RMC',   '1881 Pio Valenzuela, Pasig City',              '(02) 8671-9761', 'info@rmc.gov.ph',     'government', 'DOH Hospital', 14.5641, 121.0713,  600,  600,  40,  468, 74.0, 'A', 'government', true, 'NCR', 'Metro Manila', 'Pasig City',     '{"surgery":true,"obstetrics":true,"icu":true}',                     NOW(), NOW()),
  ('Jose R. Reyes Memorial Medical Center', 'JRRMMC-001', 'JRRMMC', 'San Lazaro Compound, Rizal Avenue, Manila', '(02) 8711-9491', 'info@jrrmmc.gov.ph', 'government', 'DOH Hospital', 14.6155, 120.9843,  700,  700,  50,  686, 65.4, 'C', 'government', true, 'NCR', 'Metro Manila', 'Manila',         '{"emergency":true,"neurosurgery":true,"pediatrics":true}',          NOW(), NOW()),
  ('National Children''s Hospital',  'NCH-001',   'NCH',   'Quezon Avenue, Quezon City',                   '(02) 8525-0347', 'info@nch.gov.ph',     'government', 'DOH Hospital', 14.6380, 121.0200,  400,  400,  35,  352, 71.2, 'B', 'government', true, 'NCR', 'Metro Manila', 'Quezon City',    '{"pediatrics":true,"nicu":true,"emergency":true}',                  NOW(), NOW()),
  ('Ospital ng Maynila Medical Center', 'OMMC-001', 'OMMC', 'Roxas Boulevard, Malate, Manila',             '(02) 8524-6061', 'info@ommc.gov.ph',    'government', 'DOH Hospital', 14.5695, 120.9827,  500,  500,  35,  410, 69.8, 'B', 'government', true, 'NCR', 'Metro Manila', 'Manila',         '{"emergency":true,"trauma":true,"icu":true}',                       NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ─── 2. ADDITIONAL USERS (Dispatcher / DOH Officer role) ──────
INSERT INTO users (name, email, password, role, phone, is_active, verification_status, created_at, updated_at)
VALUES
  ('Dr. Ana Reyes',         'ana.reyes@doh.gov.ph',       '$2y$12$placeholder_hash_1', 'dispatcher', '+63-917-100-0001', true, 'verified', NOW(), NOW()),
  ('Dr. Marco Santos',      'marco.santos@doh.gov.ph',    '$2y$12$placeholder_hash_2', 'dispatcher', '+63-917-100-0002', true, 'verified', NOW(), NOW()),
  ('Dr. Lisa Fernandez',     'lisa.fernandez@doh.gov.ph', '$2y$12$placeholder_hash_3', 'dispatcher', '+63-917-100-0003', true, 'verified', NOW(), NOW()),
  ('Nurse Carla Diaz',      'carla.diaz@kalinga.com',     '$2y$12$placeholder_hash_4', 'responder',  '+63-917-100-0004', true, 'verified', NOW(), NOW()),
  ('Nurse Roel Macaraeg',   'roel.macaraeg@kalinga.com',  '$2y$12$placeholder_hash_5', 'responder',  '+63-917-100-0005', true, 'verified', NOW(), NOW()),
  ('EMT Dante Villanueva',  'dante.villanueva@kalinga.com','$2y$12$placeholder_hash_6', 'responder', '+63-917-100-0006', true, 'verified', NOW(), NOW()),
  ('EMT Sofia Mendoza',     'sofia.mendoza@kalinga.com',  '$2y$12$placeholder_hash_7', 'responder',  '+63-917-100-0007', true, 'verified', NOW(), NOW()),
  ('EMT Bernard Ocampo',    'bernard.ocampo@kalinga.com', '$2y$12$placeholder_hash_8', 'responder',  '+63-917-100-0008', true, 'verified', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ─── 3. ADDITIONAL RESPONDERS (using newly inserted user IDs) ─
-- Get user IDs for the new responder users
DO $$
DECLARE
  v_carla   bigint; v_roel  bigint; v_dante bigint;
  v_sofia   bigint; v_bernard bigint; v_admin bigint;
BEGIN
  SELECT id INTO v_carla   FROM users WHERE email = 'carla.diaz@kalinga.com';
  SELECT id INTO v_roel    FROM users WHERE email = 'roel.macaraeg@kalinga.com';
  SELECT id INTO v_dante   FROM users WHERE email = 'dante.villanueva@kalinga.com';
  SELECT id INTO v_sofia   FROM users WHERE email = 'sofia.mendoza@kalinga.com';
  SELECT id INTO v_bernard FROM users WHERE email = 'bernard.ocampo@kalinga.com';
  SELECT id INTO v_admin   FROM users WHERE email = 'admin@kalinga.com';

  INSERT INTO responders (responder_code, user_id, full_name, contact_number, handling_capabilities, status, created_by, created_at, updated_at)
  VALUES
    ('RSP-007', v_carla,   'Carla Diaz',        '+63-917-100-0004', '["BLS","ACLS","Triage"]',         'On Duty',  v_admin, NOW(), NOW()),
    ('RSP-008', v_roel,    'Roel Macaraeg',     '+63-917-100-0005', '["BLS","First Aid"]',             'Available',v_admin, NOW(), NOW()),
    ('RSP-009', v_dante,   'Dante Villanueva',  '+63-917-100-0006', '["EMT","BLS","Mass Casualty"]',   'On Duty',  v_admin, NOW(), NOW()),
    ('RSP-010', v_sofia,   'Sofia Mendoza',     '+63-917-100-0007', '["BLS","Pediatric Care"]',        'On Duty',  v_admin, NOW(), NOW()),
    ('RSP-011', v_bernard, 'Bernard Ocampo',    '+63-917-100-0008', '["EMT","ACLS","Hazmat"]',         'Available',v_admin, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Update 2 existing responders to On Duty
  UPDATE responders SET status = 'On Duty'  WHERE responder_code IN ('RSP-001','RSP-003');
  UPDATE responders SET status = 'On Leave' WHERE responder_code = 'RSP-006';
END $$;

-- ─── 4. ADDITIONAL INCIDENTS ──────────────────────────────────
DO $$
DECLARE v_user5 bigint; v_user6 bigint; v_user7 bigint; v_user8 bigint;
BEGIN
  SELECT id INTO v_user5 FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_user6 FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_user7 FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_user8 FROM users WHERE email = 'maria.clara@kalinga.com';

  INSERT INTO incidents (type, location, latlng, description, user_id, status, assigned_responder_id, responders_required, created_at, updated_at)
  VALUES
    ('Cardiac Arrest',           'Barangay 188, Caloocan City',               '14.6507,120.9807', 'Patient collapsed, unresponsive. CPR in progress.',                                    v_user5, 'on_scene',     v_user6, 2, NOW() - INTERVAL '2 hours',   NOW()),
    ('Vehicular Accident',       'EDSA-Quezon Ave Intersection',              '14.6410,121.0183', 'Multi-vehicle collision. 3 injured, 1 critical.',                                      v_user5, 'en_route',     v_user7, 3, NOW() - INTERVAL '45 minutes', NOW()),
    ('Drowning',                 'Manila Bay Baywalk, Roxas Boulevard',       '14.5653,120.9799', 'Victim found unconscious near shoreline. Vitals unstable.',                            v_user6, 'acknowledged', v_user5, 2, NOW() - INTERVAL '1 hour',    NOW()),
    ('Stroke Emergency',         'Sampaloc, Manila',                          '14.6085,120.9914', 'Elderly patient, 72 yrs, sudden onset facial drooping and slurred speech.',            v_user7, 'transporting', v_user8, 1, NOW() - INTERVAL '3 hours',   NOW()),
    ('Fire Rescue',              'Tondo, Manila near North Harbor',           '14.6190,120.9669', 'Structure fire. 2 persons trapped on 2nd floor. Smoke inhalation.',                   v_user8, 'reported',     NULL,    4, NOW() - INTERVAL '15 minutes', NOW()),
    ('Mass Food Poisoning',      'Marikina Public Market',                    '14.6540,121.1000', '12 persons affected after consuming contaminated food. Vomiting, diarrhea.',           v_user5, 'on_scene',     v_user6, 3, NOW() - INTERVAL '5 hours',   NOW()),
    ('Industrial Accident',      'PEZA Zone, Calamba, Laguna',                '14.2160,121.1650', 'Chemical spill. 5 workers exposed to toxic fumes. Evacuation underway.',              v_user6, 'en_route',     v_user7, 4, NOW() - INTERVAL '30 minutes', NOW()),
    ('Pediatric Emergency',      'Barangay Holy Spirit, Quezon City',         '14.6720,121.0660', 'Child, 4 yrs, high fever with seizures.',                                             v_user7, 'transporting', v_user8, 1, NOW() - INTERVAL '2 hours',   NOW()),
    ('Obstetric Emergency',      'Pasay City Medical Center vicinity',        '14.5378,121.0006', 'Premature labor, 32 weeks. Patient in severe distress.',                              v_user8, 'hospital_transfer', v_user5, 2, NOW() - INTERVAL '4 hours', NOW()),
    ('Diabetic Emergency',       'BGC, Taguig City',                         '14.5472,121.0457', 'Patient unconscious, blood glucose critically low. Bystander administered sugar.',    v_user5, 'resolved',     v_user6, 1, NOW() - INTERVAL '6 hours',   NOW());
END $$;

-- ─── 5. NOTIFICATIONS (for top-bar) ───────────────────────────
DO $$
DECLARE
  v_admin  bigint; v_resp5 bigint; v_resp6 bigint;
  v_resp7  bigint; v_resp8 bigint;
BEGIN
  SELECT id INTO v_admin FROM users WHERE email = 'admin@kalinga.com';
  SELECT id INTO v_resp5 FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_resp6 FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_resp7 FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_resp8 FROM users WHERE email = 'maria.clara@kalinga.com';

  INSERT INTO notifications (user_id, title, description, read_at, created_at, updated_at)
  VALUES
    (v_admin,  'New Incident Reported',          'A mass food poisoning incident has been reported in Marikina Public Market.',                   NULL,  NOW() - INTERVAL '10 minutes', NOW()),
    (v_admin,  'Hospital Capacity Alert',        'Philippine General Hospital ED is at 94% capacity. Patient redirection recommended.',          NULL,  NOW() - INTERVAL '25 minutes', NOW()),
    (v_admin,  'Responder Status Update',        'Responder RSP-007 (Carla Diaz) has gone On Duty.',                                             NOW(), NOW() - INTERVAL '1 hour',    NOW()),
    (v_admin,  'Critical Resource Low',          'Morphine stock at Central General Hospital is at critical level (5 units remaining).',         NULL,  NOW() - INTERVAL '2 hours',    NOW()),
    (v_admin,  'Incident Resolved',              'Incident #ID-003 (Drowning, Roxas Blvd) has been marked resolved.',                            NOW(), NOW() - INTERVAL '3 hours',    NOW()),

    (v_resp5,  'Incident Assigned to You',       'You have been assigned to a Cardiac Arrest case in Barangay 188, Caloocan City.',              NULL,  NOW() - INTERVAL '2 hours',    NOW()),
    (v_resp5,  'Nearby Emergency Alert',         'A fire rescue emergency reported in Tondo, Manila — 1.2 km from your location.',              NULL,  NOW() - INTERVAL '15 minutes', NOW()),
    (v_resp5,  'Training Module Completed',      'You have completed "BLS for Healthcare Providers" training. Certificate available.',           NOW(), NOW() - INTERVAL '1 day',      NOW()),

    (v_resp6,  'Dispatch Notification',          'You have been dispatched to Vehicular Accident on EDSA-Quezon Ave Intersection.',              NULL,  NOW() - INTERVAL '45 minutes', NOW()),
    (v_resp6,  'System Maintenance Notice',      'Scheduled system maintenance on Sunday, 03:00–05:00 AM. Plan accordingly.',                   NOW(), NOW() - INTERVAL '1 day',      NOW()),

    (v_resp7,  'Incident Update: Stroke Case',   'Stroke patient has been transported to EAMC. Handover completed.',                            NOW(), NOW() - INTERVAL '3 hours',    NOW()),
    (v_resp7,  'New Incident: Industrial Spill', 'Chemical spill reported in PEZA Zone, Calamba. You are assigned as lead responder.',          NULL,  NOW() - INTERVAL '30 minutes', NOW()),

    (v_resp8,  'Patient Transferred',            'Obstetric emergency patient transferred to Rizal Medical Center Maternity Unit.',             NOW(), NOW() - INTERVAL '4 hours',    NOW()),
    (v_resp8,  'Triage Update',                  'Philippine General Hospital triage queue is now at critical level. Expect redirections.',      NULL,  NOW() - INTERVAL '20 minutes', NOW());
END $$;

-- ─── 6. NEW TABLE: hospital_reports ───────────────────────────
CREATE TABLE IF NOT EXISTS hospital_reports (
  id            BIGSERIAL   PRIMARY KEY,
  title         TEXT        NOT NULL,
  hospital_name TEXT        NOT NULL,
  message       TEXT,
  action        TEXT,
  severity      VARCHAR(20) NOT NULL DEFAULT 'medium',
  occupancy     INTEGER     CHECK (occupancy BETWEEN 0 AND 100),
  type          VARCHAR(20) DEFAULT 'capacity',
  status        VARCHAR(20) DEFAULT 'active',
  reporter_id   BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW()
);

INSERT INTO hospital_reports (title, hospital_name, message, action, severity, occupancy, type, status, reporter_id, created_at, updated_at)
SELECT
  title, hospital_name, message, action, severity, occupancy, type, 'active', u.id, created_at, created_at
FROM (VALUES
  ('Capacity Alert: ED Near Full',            'Philippine General Hospital',        'Emergency Department nearing full capacity (94% occupied)',          'Prepare for patient redirection to JRRMMC or OMMC',           'high',     94, 'capacity', NOW() - INTERVAL '10 minutes'),
  ('ICU Critical Occupancy',                  'East Avenue Medical Center',         'ICU occupancy reached critical threshold (92%)',                     'Coordinate overflow arrangements with nearby Level 3 hospitals', 'critical', 92, 'capacity', NOW() - INTERVAL '25 minutes'),
  ('Limited Oxygen Supply',                   'Rizal Medical Center',               'Oxygen tank inventory below minimum threshold (3 tanks remaining)', 'Request urgent replenishment from DOH Central Warehousing',    'high',     78, 'supply',   NOW() - INTERVAL '1 hour'),
  ('NICU Capacity Near Full',                 'National Children''s Hospital',      'NICU ward at 88% occupancy; limited space for critical neonates',    'Redirect NICU overflow to PGH Pediatrics',                     'medium',   88, 'capacity', NOW() - INTERVAL '2 hours'),
  ('ED Overcrowding',                         'Ospital ng Maynila Medical Center',  'Emergency department log shows 45+ patients in 4-hour wait queue',  'Activate surge protocol; open overflow treatment area',         'high',     82, 'capacity', NOW() - INTERVAL '3 hours'),
  ('Cardiology Team Unavailable',             'Philippine General Hospital',        'Cardiology on-call team unavailable due to internal emergency',      'Redirect cardiology cases to St. Luke''s Global City',         'critical', NULL, 'specialist', NOW() - INTERVAL '40 minutes'),
  ('Neurology Team on Rotation Leave',        'Jose R. Reyes Memorial Medical Center','Neurology and neurosurgery staff on scheduled rotation leave',    'Direct neuro-trauma cases to East Avenue Medical Center',      'high',     NULL, 'specialist', NOW() - INTERVAL '1 hour'),
  ('Pediatricians Limited Availability',      'Ospital ng Maynila Medical Center',  'Only 2 of 6 pediatricians on duty this shift',                      'Route pediatric emergencies to National Children''s Hospital',  'medium',   NULL, 'specialist', NOW() - INTERVAL '2 hours'),
  ('Blood Bank Low: O-Negative',              'East Avenue Medical Center',         'O-negative blood stock critically low (2 units remaining)',          'Issue emergency request to Philippine Blood Center',            'critical', NULL, 'supply',   NOW() - INTERVAL '5 hours'),
  ('Generator Maintenance Alert',             'Rizal Medical Center',               'Backup generator scheduled for maintenance this weekend',           'Reduce non-critical procedures during maintenance window',       'low',      NULL, 'general',  NOW() - INTERVAL '6 hours')
) AS src(title, hospital_name, message, action, severity, occupancy, type, created_at),
users u WHERE u.email = 'admin@kalinga.com'
ON CONFLICT DO NOTHING;

-- ─── 7. NEW TABLE: regions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT      NOT NULL,
  code        TEXT,
  province    TEXT,
  coordinates JSONB
);

INSERT INTO regions (name, code, province, coordinates) VALUES
  ('Manila',       'MNL', 'Metro Manila', '{"lat":14.5995,"lng":120.9842}'),
  ('Quezon City',  'QC',  'Metro Manila', '{"lat":14.6760,"lng":121.0437}'),
  ('Caloocan',     'CAL', 'Metro Manila', '{"lat":14.6499,"lng":120.9667}'),
  ('Marikina',     'MKN', 'Metro Manila', '{"lat":14.6507,"lng":121.1029}'),
  ('Pasig City',   'PSG', 'Metro Manila', '{"lat":14.5764,"lng":121.0851}'),
  ('Taguig City',  'TGG', 'Metro Manila', '{"lat":14.5243,"lng":121.0797}'),
  ('Parañaque',    'PNQ', 'Metro Manila', '{"lat":14.4793,"lng":121.0198}'),
  ('Las Piñas',    'LPA', 'Metro Manila', '{"lat":14.4445,"lng":120.9936}'),
  ('Muntinlupa',   'MUN', 'Metro Manila', '{"lat":14.4081,"lng":121.0415}'),
  ('Mandaluyong',  'MDL', 'Metro Manila', '{"lat":14.5794,"lng":121.0359}')
ON CONFLICT DO NOTHING;

-- ─── 8. NEW TABLE: locations (responder positions) ────────────
CREATE TABLE IF NOT EXISTS locations (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  latitude   NUMERIC(10,7),
  longitude  NUMERIC(10,7),
  address    TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
DECLARE
  v_user5 bigint; v_user6 bigint; v_user7 bigint; v_user8 bigint; v_admin bigint;
BEGIN
  SELECT id INTO v_admin FROM users WHERE email = 'admin@kalinga.com';
  SELECT id INTO v_user5 FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_user6 FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_user7 FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_user8 FROM users WHERE email = 'maria.clara@kalinga.com';

  INSERT INTO locations (user_id, latitude, longitude, address, updated_at)
  VALUES
    (v_admin,  14.5995000, 120.9842000, 'Manila City Hall, Padre Burgos Ave, Manila',       NOW()),
    (v_user5,  14.6507000, 120.9807000, 'Barangay 188, Caloocan City',                       NOW()),
    (v_user6,  14.6410000, 121.0183000, 'EDSA-Quezon Ave Intersection, Quezon City',         NOW()),
    (v_user7,  14.6085000, 120.9914000, 'Sampaloc, Manila',                                  NOW()),
    (v_user8,  14.5653000, 120.9799000, 'Manila Bay Baywalk, Roxas Boulevard, Pasay',        NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    latitude   = EXCLUDED.latitude,
    longitude  = EXCLUDED.longitude,
    address    = EXCLUDED.address,
    updated_at = NOW();
END $$;

-- ─── 9. NEW TABLE: patients (for triage dashboard) ────────────
CREATE TABLE IF NOT EXISTS patients (
  id              BIGSERIAL   PRIMARY KEY,
  full_name       TEXT        NOT NULL,
  age             INTEGER,
  gender          VARCHAR(10),
  contact_number  TEXT,
  hospital_id     BIGINT      REFERENCES hospitals(id) ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'admitted',
  triage_level    VARCHAR(20),
  assigned_bed    TEXT,
  admitted_at     TIMESTAMP   DEFAULT NOW(),
  discharged_at   TIMESTAMP,
  notes           TEXT,
  created_at      TIMESTAMP   DEFAULT NOW(),
  updated_at      TIMESTAMP   DEFAULT NOW()
);

DO $$
DECLARE
  v_pgh bigint; v_eamc bigint; v_rmc bigint; v_jrrmmc bigint; v_nch bigint; v_ommc bigint;
BEGIN
  SELECT id INTO v_pgh     FROM hospitals WHERE code = 'PGH-001';
  SELECT id INTO v_eamc    FROM hospitals WHERE code = 'EAMC-001';
  SELECT id INTO v_rmc     FROM hospitals WHERE code = 'RMC-001';
  SELECT id INTO v_jrrmmc  FROM hospitals WHERE code = 'JRRMMC-001';
  SELECT id INTO v_nch     FROM hospitals WHERE code = 'NCH-001';
  SELECT id INTO v_ommc    FROM hospitals WHERE code = 'OMMC-001';

  INSERT INTO patients (full_name, age, gender, contact_number, hospital_id, status, triage_level, assigned_bed, admitted_at, notes, created_at, updated_at)
  VALUES
    -- PGH patients
    ('Ricardo Santos',    45, 'male',   '+63-912-001-0001', v_pgh,    'admitted',   'critical',  'ICU-04',  NOW() - INTERVAL '6 hours',  'Severe head trauma from vehicular accident', NOW(), NOW()),
    ('Marites Cruz',      32, 'female', '+63-912-001-0002', v_pgh,    'admitted',   'high',      'ED-12',   NOW() - INTERVAL '3 hours',  'Chest pain, possible MI', NOW(), NOW()),
    ('Fernando Reyes',    60, 'male',   '+63-912-001-0003', v_pgh,    'admitted',   'medium',    'Ward-3A', NOW() - INTERVAL '8 hours',  'Pneumonia, stable on oxygen', NOW(), NOW()),
    ('Lourdes Garcia',    28, 'female', '+63-912-001-0004', v_pgh,    'critical',   'critical',  'ICU-02',  NOW() - INTERVAL '2 hours',  'Severe dengue hemorrhagic fever', NOW(), NOW()),
    ('Miguel Torres',     55, 'male',   '+63-912-001-0005', v_pgh,    'discharged', 'low',       NULL,      NOW() - INTERVAL '12 hours', 'Minor laceration, sutured and discharged', NOW(), NOW()),
    -- EAMC patients
    ('Elena Villanueva',  70, 'female', '+63-912-002-0001', v_eamc,   'admitted',   'critical',  'ICU-01',  NOW() - INTERVAL '4 hours',  'Ischemic stroke, undergoing thrombolysis', NOW(), NOW()),
    ('Roberto Mendoza',   42, 'male',   '+63-912-002-0002', v_eamc,   'admitted',   'high',      'Neuro-5', NOW() - INTERVAL '5 hours',  'Subdural hematoma, monitoring', NOW(), NOW()),
    ('Patricia Lim',      35, 'female', '+63-912-002-0003', v_eamc,   'admitted',   'medium',    'Ward-2B', NOW() - INTERVAL '7 hours',  'Seizure disorder, post-ictal state', NOW(), NOW()),
    ('Carlos Ramos',      50, 'male',   '+63-912-002-0004', v_eamc,   'referred',   'high',      NULL,      NOW() - INTERVAL '1 hour',   'Referred to PGH for advanced neurosurgery', NOW(), NOW()),
    -- RMC patients
    ('Josephine Dela Cruz', 26, 'female', '+63-912-003-0001', v_rmc,  'admitted',   'medium',    'Obs-3',   NOW() - INTERVAL '9 hours',  'Active labor, 38 weeks pregnancy', NOW(), NOW()),
    ('Antonio Flores',    38, 'male',   '+63-912-003-0002', v_rmc,    'admitted',   'high',      'Sx-6',    NOW() - INTERVAL '3 hours',  'Appendicitis, scheduled for surgery', NOW(), NOW()),
    -- JRRMMC patients
    ('Natividad Soriano', 65, 'female', '+63-912-004-0001', v_jrrmmc, 'admitted',   'high',      'ED-8',    NOW() - INTERVAL '2 hours',  'Hypertensive crisis, BP 220/140', NOW(), NOW()),
    ('Armando Castillo',  48, 'male',   '+63-912-004-0002', v_jrrmmc, 'admitted',   'medium',    'Ward-4',  NOW() - INTERVAL '6 hours',  'Diabetic ketoacidosis, on insulin drip', NOW(), NOW()),
    -- NCH patients
    ('Baby Gonzales',      2, 'female', '+63-912-005-0001', v_nch,    'admitted',   'critical',  'PICU-2',  NOW() - INTERVAL '8 hours',  'Febrile seizures, transferred from Marikina', NOW(), NOW()),
    ('Nathan Aquino',      7, 'male',   '+63-912-005-0002', v_nch,    'admitted',   'medium',    'Ped-10',  NOW() - INTERVAL '5 hours',  'Severe asthma attack', NOW(), NOW()),
    -- OMMC patients
    ('Gemma Padilla',     44, 'female', '+63-912-006-0001', v_ommc,   'admitted',   'high',      'ED-3',    NOW() - INTERVAL '1 hour',   'Blunt chest trauma from motorcycle accident', NOW(), NOW()),
    ('Dennis Ocampo',     29, 'male',   '+63-912-006-0002', v_ommc,   'admitted',   'medium',    'Ward-5',  NOW() - INTERVAL '4 hours',  'Lacerations and fractures, stabilized', NOW(), NOW()),
    ('Rosario Bautista',  58, 'female', '+63-912-006-0003', v_ommc,   'discharged', 'low',       NULL,      NOW() - INTERVAL '10 hours', 'Mild dehydration, IV fluids and discharged', NOW(), NOW());
END $$;

-- ─── 10. NEW TABLE: triage_cases (per-hospital triage board) ──
CREATE TABLE IF NOT EXISTS triage_cases (
  id                    BIGSERIAL   PRIMARY KEY,
  hospital_id           BIGINT      NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id            BIGINT      REFERENCES patients(id) ON DELETE SET NULL,
  triage_level          VARCHAR(20) NOT NULL DEFAULT 'low',
  status                VARCHAR(20) NOT NULL DEFAULT 'active',
  presenting_complaint  TEXT,
  vitals                JSONB,
  notes                 TEXT,
  assigned_to           BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP   DEFAULT NOW(),
  updated_at            TIMESTAMP   DEFAULT NOW()
);

DO $$
DECLARE
  v_pgh bigint; v_eamc bigint; v_rmc bigint; v_jrrmmc bigint; v_nch bigint; v_ommc bigint;
  v_resp5 bigint; v_resp6 bigint; v_resp7 bigint; v_resp8 bigint;
  v_p RECORD;
BEGIN
  SELECT id INTO v_pgh     FROM hospitals WHERE code = 'PGH-001';
  SELECT id INTO v_eamc    FROM hospitals WHERE code = 'EAMC-001';
  SELECT id INTO v_rmc     FROM hospitals WHERE code = 'RMC-001';
  SELECT id INTO v_jrrmmc  FROM hospitals WHERE code = 'JRRMMC-001';
  SELECT id INTO v_nch     FROM hospitals WHERE code = 'NCH-001';
  SELECT id INTO v_ommc    FROM hospitals WHERE code = 'OMMC-001';
  SELECT id INTO v_resp5   FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_resp6   FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_resp7   FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_resp8   FROM users WHERE email = 'maria.clara@kalinga.com';

  -- Insert triage cases tied to patients
  FOR v_p IN SELECT id, hospital_id, triage_level, notes FROM patients WHERE status != 'discharged' LOOP
    INSERT INTO triage_cases (hospital_id, patient_id, triage_level, status, presenting_complaint,
      vitals, assigned_to, created_at, updated_at)
    VALUES (
      v_p.hospital_id,
      v_p.id,
      v_p.triage_level,
      'active',
      v_p.notes,
      jsonb_build_object(
        'bp',   (110 + floor(random()*50))::text || '/' || (70 + floor(random()*30))::text,
        'hr',   (60 + floor(random()*60))::int,
        'temp', (36.0 + random()*2.5)::numeric(4,1),
        'spo2', (88 + floor(random()*12))::int,
        'rr',   (12 + floor(random()*20))::int
      ),
      v_resp5,
      NOW() - (random() * INTERVAL '8 hours'),
      NOW()
    );
  END LOOP;
END $$;

-- ─── 11. NEW TABLE: user_settings ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                    BIGSERIAL   PRIMARY KEY,
  user_id               BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme                 VARCHAR(10) NOT NULL DEFAULT 'light',
  language              VARCHAR(10) NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications   BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_notifications     BOOLEAN     NOT NULL DEFAULT FALSE,
  two_factor_enabled    BOOLEAN     NOT NULL DEFAULT FALSE,
  timezone              VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
  updated_at            TIMESTAMP   DEFAULT NOW()
);

DO $$
DECLARE v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM users WHERE role IN ('admin','responder','dispatcher') LOOP
    INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, two_factor_enabled, timezone)
    VALUES (v_user.id, 'light', 'en', TRUE, TRUE, FALSE, 'Asia/Manila')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- ─── 12. NEW TABLE: accounts ──────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id                  BIGSERIAL   PRIMARY KEY,
  user_id             BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  verified_at         TIMESTAMP,
  deactivated_at      TIMESTAMP,
  deactivation_reason TEXT,
  created_at          TIMESTAMP   DEFAULT NOW(),
  updated_at          TIMESTAMP   DEFAULT NOW()
);

DO $$
DECLARE v_user RECORD;
BEGIN
  FOR v_user IN SELECT id, verification_status FROM users LOOP
    INSERT INTO accounts (user_id, status, verified_at, created_at, updated_at)
    VALUES (
      v_user.id,
      CASE v_user.verification_status WHEN 'verified' THEN 'verified' ELSE 'pending' END,
      CASE v_user.verification_status WHEN 'verified' THEN NOW() ELSE NULL END,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- ─── 13. NEW TABLE: responder_activity ────────────────────────
CREATE TABLE IF NOT EXISTS responder_activity (
  id            BIGSERIAL PRIMARY KEY,
  responder_id  BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT      NOT NULL,
  description   TEXT,
  incident_id   BIGINT    REFERENCES incidents(id) ON DELETE SET NULL,
  points        INTEGER   DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

DO $$
DECLARE
  v_user5 bigint; v_user6 bigint; v_user7 bigint; v_user8 bigint;
  v_inc1  bigint; v_inc2  bigint; v_inc3  bigint;
BEGIN
  SELECT id INTO v_user5 FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_user6 FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_user7 FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_user8 FROM users WHERE email = 'maria.clara@kalinga.com';
  SELECT id INTO v_inc1  FROM incidents WHERE type = 'Cardiac Arrest' LIMIT 1;
  SELECT id INTO v_inc2  FROM incidents WHERE type = 'Vehicular Accident' LIMIT 1;
  SELECT id INTO v_inc3  FROM incidents WHERE type = 'Stroke Emergency' LIMIT 1;

  INSERT INTO responder_activity (responder_id, action, description, incident_id, points, created_at)
  VALUES
    (v_user5, 'Incident Dispatched',   'Dispatched to cardiac arrest case, Caloocan City',            v_inc1, 10, NOW() - INTERVAL '2 hours'),
    (v_user5, 'BLS Administered',      'Performed 5-cycle CPR; ROSC achieved after 8 minutes',        v_inc1, 25, NOW() - INTERVAL '1.5 hours'),
    (v_user5, 'Patient Transported',   'Patient transported to PGH ICU under critical care',          v_inc1, 15, NOW() - INTERVAL '1 hour'),
    (v_user6, 'Incident Dispatched',   'Dispatched to multi-vehicle collision, EDSA-Quezon Ave',      v_inc2, 10, NOW() - INTERVAL '45 minutes'),
    (v_user6, 'Triage Performed',      'Performed scene triage on 3 injuries. 1 critical, 2 minor',   v_inc2, 20, NOW() - INTERVAL '30 minutes'),
    (v_user7, 'Incident Closed',       'Stroke patient successfully handed over to EAMC neurology',   v_inc3, 15, NOW() - INTERVAL '3 hours'),
    (v_user7, 'Training Completed',    'Completed Advanced Cardiac Life Support (ACLS) recertification', NULL, 30, NOW() - INTERVAL '1 day'),
    (v_user8, 'Incident Dispatched',   'Dispatched to pediatric emergency, Quezon City',              NULL,  10, NOW() - INTERVAL '2 hours'),
    (v_user8, 'Scene Assessment',      'Assessed 4-year-old with febrile seizure. GCS 12, stable',    NULL,  15, NOW() - INTERVAL '1.5 hours'),
    (v_user5, 'Training Completed',    'Completed Triage Systems and Mass Casualty Management',        NULL,  30, NOW() - INTERVAL '2 days');
END $$;

-- ─── 14. NEW TABLES: training_courses + training_records ──────
CREATE TABLE IF NOT EXISTS training_courses (
  id                BIGSERIAL PRIMARY KEY,
  title             TEXT      NOT NULL,
  category          TEXT,
  description       TEXT,
  total_lessons     INTEGER   DEFAULT 0,
  duration_minutes  INTEGER   DEFAULT 0,
  thumbnail_url     TEXT,
  is_active         BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_records (
  id                BIGSERIAL   PRIMARY KEY,
  user_id           BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         BIGINT      NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  status            VARCHAR(20) NOT NULL DEFAULT 'not_started',
  score             NUMERIC(5,2),
  progress_percent  INTEGER     NOT NULL DEFAULT 0,
  completed_at      TIMESTAMP,
  updated_at        TIMESTAMP   DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       BIGINT    NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  issued_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMP,
  certificate_url TEXT
);

INSERT INTO training_courses (title, category, description, total_lessons, duration_minutes, is_active, created_at)
VALUES
  ('Basic Life Support (BLS)',                'Emergency Response', 'CPR, AED, and basic airway management for healthcare providers.',                    6, 180, true, NOW()),
  ('Advanced Cardiac Life Support (ACLS)',    'Emergency Response', 'Advanced resuscitation techniques, team dynamics, and medication protocols.',         8, 300, true, NOW()),
  ('Triage Systems & Mass Casualty Management','Disaster Response', 'START/SALT triage methods, incident command, and mass casualty operations.',         5, 240, true, NOW()),
  ('Pediatric Advanced Life Support (PALS)',  'Pediatrics',        'Systematic assessment and management of pediatric emergencies.',                      7, 270, true, NOW()),
  ('Hazmat First Response',                   'Specialized',       'Recognition and initial response to hazardous material incidents.',                    5, 210, true, NOW())
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_user5 bigint; v_user6 bigint; v_user7 bigint; v_user8 bigint;
  v_c1 bigint; v_c2 bigint; v_c3 bigint; v_c4 bigint; v_c5 bigint;
BEGIN
  SELECT id INTO v_user5 FROM users WHERE email = 'responder_verified@kalinga.com';
  SELECT id INTO v_user6 FROM users WHERE email = 'jane.doe@kalinga.com';
  SELECT id INTO v_user7 FROM users WHERE email = 'john.smith@kalinga.com';
  SELECT id INTO v_user8 FROM users WHERE email = 'maria.clara@kalinga.com';
  SELECT id INTO v_c1 FROM training_courses WHERE title LIKE '%Basic Life Support%';
  SELECT id INTO v_c2 FROM training_courses WHERE title LIKE '%Advanced Cardiac%';
  SELECT id INTO v_c3 FROM training_courses WHERE title LIKE '%Triage%';
  SELECT id INTO v_c4 FROM training_courses WHERE title LIKE '%Pediatric%';
  SELECT id INTO v_c5 FROM training_courses WHERE title LIKE '%Hazmat%';

  -- Training records
  INSERT INTO training_records (user_id, course_id, status, score, progress_percent, completed_at, updated_at)
  VALUES
    (v_user5, v_c1, 'completed', 94.5, 100, NOW() - INTERVAL '30 days', NOW()),
    (v_user5, v_c3, 'completed', 88.0, 100, NOW() - INTERVAL '2 days',  NOW()),
    (v_user5, v_c2, 'in_progress', NULL, 60, NULL,                       NOW()),
    (v_user6, v_c1, 'completed', 91.0, 100, NOW() - INTERVAL '45 days', NOW()),
    (v_user6, v_c2, 'completed', 85.5, 100, NOW() - INTERVAL '10 days', NOW()),
    (v_user6, v_c4, 'in_progress', NULL, 35, NULL,                       NOW()),
    (v_user7, v_c1, 'completed', 97.0, 100, NOW() - INTERVAL '60 days', NOW()),
    (v_user7, v_c2, 'completed', 92.0, 100, NOW() - INTERVAL '1 day',   NOW()),
    (v_user7, v_c5, 'not_started', NULL, 0, NULL,                        NOW()),
    (v_user8, v_c1, 'completed', 89.5, 100, NOW() - INTERVAL '20 days', NOW()),
    (v_user8, v_c4, 'in_progress', NULL, 70, NULL,                       NOW())
  ON CONFLICT (user_id, course_id) DO NOTHING;

  -- Certifications for completed courses
  INSERT INTO certifications (user_id, course_id, issued_at, expires_at, certificate_url)
  VALUES
    (v_user5, v_c1, NOW() - INTERVAL '30 days', NOW() + INTERVAL '2 years', '/certs/user5_bls.pdf'),
    (v_user5, v_c3, NOW() - INTERVAL '2 days',  NOW() + INTERVAL '2 years', '/certs/user5_triage.pdf'),
    (v_user6, v_c1, NOW() - INTERVAL '45 days', NOW() + INTERVAL '2 years', '/certs/user6_bls.pdf'),
    (v_user6, v_c2, NOW() - INTERVAL '10 days', NOW() + INTERVAL '2 years', '/certs/user6_acls.pdf'),
    (v_user7, v_c1, NOW() - INTERVAL '60 days', NOW() + INTERVAL '2 years', '/certs/user7_bls.pdf'),
    (v_user7, v_c2, NOW() - INTERVAL '1 day',   NOW() + INTERVAL '2 years', '/certs/user7_acls.pdf'),
    (v_user8, v_c1, NOW() - INTERVAL '20 days', NOW() + INTERVAL '2 years', '/certs/user8_bls.pdf')
  ON CONFLICT DO NOTHING;
END $$;

-- ─── 15. RE-ENABLE FK CHECKS ──────────────────────────────────
SET session_replication_role = 'origin';

-- ─── VERIFY ──────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM hospitals)         AS hospitals,
  (SELECT COUNT(*) FROM responders)        AS responders,
  (SELECT COUNT(*) FROM incidents)         AS incidents,
  (SELECT COUNT(*) FROM notifications)     AS notifications,
  (SELECT COUNT(*) FROM hospital_reports)  AS hospital_reports,
  (SELECT COUNT(*) FROM patients)          AS patients,
  (SELECT COUNT(*) FROM triage_cases)      AS triage_cases,
  (SELECT COUNT(*) FROM training_courses)  AS training_courses,
  (SELECT COUNT(*) FROM training_records)  AS training_records,
  (SELECT COUNT(*) FROM certifications)    AS certifications,
  (SELECT COUNT(*) FROM regions)           AS regions,
  (SELECT COUNT(*) FROM responder_activity)AS responder_activity;
