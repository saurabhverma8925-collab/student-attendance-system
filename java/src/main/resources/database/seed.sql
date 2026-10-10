-- =============================================================================
-- Student Attendance System (SAS) - Seed Data
-- Default credentials:
--   Admin    -> username: admin     password: admin123
--   Students -> username: CSE21001..CSE21008, ECE21001..ECE21002
--               password: student123
-- Hashes were generated with BCrypt (cost = 12).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Admin
-- -----------------------------------------------------------------------------
INSERT INTO admins (username, password_hash, name, role)
VALUES ('admin',
        '$2b$12$Uij5QAo8tKFt303clrsQU..2ArrxX1mTQGmC.9TJfNm43jfKjMR3i',
        'System Administrator',
        'admin');

-- -----------------------------------------------------------------------------
-- Students (CSE: 1-8 in two sections, ECE: 1-2)
-- -----------------------------------------------------------------------------
INSERT INTO students (student_id, name, branch, section, semester, password_hash, email, phone, has_seen_onboarding)
VALUES
('CSE21001','Aarav Sharma','CSE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','aarav.sharma@sas.edu','+91-9810000001',FALSE),
('CSE21002','Diya Patel','CSE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','diya.patel@sas.edu','+91-9810000002',FALSE),
('CSE21003','Kabir Singh','CSE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','kabir.singh@sas.edu','+91-9810000003',FALSE),
('CSE21004','Ananya Gupta','CSE','B',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','ananya.gupta@sas.edu','+91-9810000004',FALSE),
('CSE21005','Vivaan Reddy','CSE','B',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','vivaan.reddy@sas.edu','+91-9810000005',FALSE),
('CSE21006','Ishaan Verma','CSE','B',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','ishaan.verma@sas.edu','+91-9810000006',FALSE),
('CSE21007','Saanvi Iyer','CSE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','saanvi.iyer@sas.edu','+91-9810000007',FALSE),
('CSE21008','Arjun Nair','CSE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','arjun.nair@sas.edu','+91-9810000008',FALSE),
('ECE21001','Meera Joshi','ECE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','meera.joshi@sas.edu','+91-9810000009',FALSE),
('ECE21002','Rohan Mehta','ECE','A',3,'$2b$12$SUhuBCtqgCiMJB672K59cus6fcc953BTpAcEN0rjKEcNFDlYfiDRy','rohan.mehta@sas.edu','+91-9810000010',FALSE);

-- -----------------------------------------------------------------------------
-- Subjects (CSE: CS301-304 + MA301, ECE: EC301)
-- -----------------------------------------------------------------------------
INSERT INTO subjects (code, name, branch, semester, total_classes)
VALUES
('CS301','Data Structures & Algorithms','CSE',3,40),
('CS302','Operating Systems','CSE',3,40),
('CS303','Database Management Systems','CSE',3,40),
('CS304','Computer Networks','CSE',3,40),
('MA301','Engineering Mathematics III','CSE',3,40),
('EC301','Digital Signal Processing','ECE',3,40);

-- -----------------------------------------------------------------------------
-- Sample study resources
-- -----------------------------------------------------------------------------
INSERT INTO resources (subject_id, title, type, url, description, is_free) VALUES
((SELECT id FROM subjects WHERE code='CS301'),'DSA Notes - Week 1','notes','https://example.com/dsa-w1','Introductory notes on arrays and linked lists.',TRUE),
((SELECT id FROM subjects WHERE code='CS303'),'DBMS Lab Manual','pdf','https://example.com/dbms-lab','Full SQL lab exercises with solutions.',TRUE),
((SELECT id FROM subjects WHERE code='CS302'),'OS Video Series','video','https://example.com/os-videos','Free YouTube playlist covering scheduling & memory.',TRUE),
((SELECT id FROM subjects WHERE code='CS304'),'CN Premium Slides','slides','https://example.com/cn-slides','Premium slide deck (login required).',FALSE);
