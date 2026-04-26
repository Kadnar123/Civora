-- =============================================================================
-- CIVORA: CIVIC COMPLAINT MANAGEMENT SYSTEM
-- MySQL DBMS Mini Project | Assignment No. 12
-- K. K. Wagh Institute of Engineering Education and Research, Nashik
-- S.Y. B.Tech | 2308215: Database Management System Lab
-- =============================================================================


-- =============================================================================
-- SECTION 1: DATABASE SETUP
-- =============================================================================

DROP DATABASE IF EXISTS civora_db;
CREATE DATABASE civora_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE civora_db;


-- =============================================================================
-- SECTION 2: TABLE CREATION
-- =============================================================================

-- Table 1: USER
-- Stores all users: citizens, officers, admins
CREATE TABLE USER (
    user_id      INT            NOT NULL AUTO_INCREMENT,
    username     VARCHAR(100)   NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role         ENUM('Citizen', 'Officer', 'Admin', 'Super Admin') NOT NULL DEFAULT 'Citizen',
    email        VARCHAR(255)   NULL,
    phone        VARCHAR(20)    NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_username (username),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 2: COMPLAINT_CATEGORY
-- Master list of complaint types with their responsible government department
CREATE TABLE COMPLAINT_CATEGORY (
    category_id  INT           NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)  NOT NULL,
    description  TEXT          NULL,
    department   VARCHAR(100)  NOT NULL,

    PRIMARY KEY (category_id),
    UNIQUE KEY uq_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 3: STATUS
-- Master list of complaint statuses (Pending, In Progress, Resolved, Rejected)
CREATE TABLE STATUS (
    status_id    INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(50)  NOT NULL,
    description  TEXT         NULL,

    PRIMARY KEY (status_id),
    UNIQUE KEY uq_status_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 4: LOCATION
-- Geographic location attached to each complaint
CREATE TABLE LOCATION (
    location_id  INT            NOT NULL AUTO_INCREMENT,
    address      VARCHAR(500)   NOT NULL,
    latitude     DECIMAL(10,8)  NULL,
    longitude    DECIMAL(11,8)  NULL,

    PRIMARY KEY (location_id),
    CONSTRAINT chk_latitude  CHECK (latitude  BETWEEN -90.0  AND  90.0),
    CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180.0 AND 180.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 5: COMPLAINT
-- Core table — links user, category, location, and current status
CREATE TABLE COMPLAINT (
    complaint_id  INT          NOT NULL AUTO_INCREMENT,
    user_id       INT          NOT NULL,
    category_id   INT          NOT NULL,
    location_id   INT          NOT NULL,
    status_id     INT          NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT         NULL,
    priority      ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (complaint_id),
    CONSTRAINT fk_complaint_user     FOREIGN KEY (user_id)     REFERENCES USER(user_id)                       ON DELETE RESTRICT,
    CONSTRAINT fk_complaint_category FOREIGN KEY (category_id) REFERENCES COMPLAINT_CATEGORY(category_id)    ON DELETE RESTRICT,
    CONSTRAINT fk_complaint_location FOREIGN KEY (location_id) REFERENCES LOCATION(location_id)              ON DELETE RESTRICT,
    CONSTRAINT fk_complaint_status   FOREIGN KEY (status_id)   REFERENCES STATUS(status_id)                  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 6: IMAGE
-- Photo evidence attached to complaints (multiple images allowed per complaint)
CREATE TABLE IMAGE (
    image_id     INT          NOT NULL AUTO_INCREMENT,
    complaint_id INT          NOT NULL,
    image_url    VARCHAR(500) NOT NULL,
    uploaded_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (image_id),
    CONSTRAINT fk_image_complaint FOREIGN KEY (complaint_id) REFERENCES COMPLAINT(complaint_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 7: STATUS_UPDATE
-- Records every status change made by an officer, with notes
CREATE TABLE STATUS_UPDATE (
    status_update_id INT       NOT NULL AUTO_INCREMENT,
    complaint_id     INT       NOT NULL,
    status_id        INT       NOT NULL,
    updated_by       INT       NOT NULL,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note             TEXT      NULL,

    PRIMARY KEY (status_update_id),
    CONSTRAINT fk_su_complaint   FOREIGN KEY (complaint_id) REFERENCES COMPLAINT(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_su_status      FOREIGN KEY (status_id)    REFERENCES STATUS(status_id)       ON DELETE RESTRICT,
    CONSTRAINT fk_su_updated_by  FOREIGN KEY (updated_by)   REFERENCES USER(user_id)           ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table 8: HISTORY
-- Full audit trail of all actions on every complaint (auto-populated by triggers)
CREATE TABLE HISTORY (
    history_id   INT          NOT NULL AUTO_INCREMENT,
    complaint_id INT          NOT NULL,
    action_by    INT          NOT NULL,
    action_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action       VARCHAR(255) NOT NULL,
    details      TEXT         NULL,

    PRIMARY KEY (history_id),
    CONSTRAINT fk_history_complaint  FOREIGN KEY (complaint_id) REFERENCES COMPLAINT(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_history_action_by  FOREIGN KEY (action_by)    REFERENCES USER(user_id)           ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- SECTION 3: SAMPLE DATA (INSERT STATEMENTS)
-- =============================================================================

-- ---- 3.1: Users ----
INSERT INTO USER (username, password_hash, role, email, phone) VALUES
('superadmin',   '$2b$10$hashedpassword001', 'Super Admin', 'superadmin@civora.gov.in',  '9000000001'),
('admin_nashik',  '$2b$10$hashedpassword002', 'Admin',       'admin.nashik@civora.gov.in','9000000002'),
('officer_raj',   '$2b$10$hashedpassword003', 'Officer',     'raj.patil@nashik.gov.in',  '9000000003'),
('officer_priya', '$2b$10$hashedpassword004', 'Officer',     'priya.more@nashik.gov.in', '9000000004'),
('citizen_arjun', '$2b$10$hashedpassword005', 'Citizen',     'arjun.sharma@gmail.com',   '9000000005'),
('citizen_neha',  '$2b$10$hashedpassword006', 'Citizen',     'neha.kulkarni@gmail.com',  '9000000006'),
('citizen_ravi',  '$2b$10$hashedpassword007', 'Citizen',     'ravi.desai@gmail.com',     '9000000007');


-- ---- 3.2: Complaint Categories ----
INSERT INTO COMPLAINT_CATEGORY (name, description, department) VALUES
('Road Damage',     'Potholes, broken pavements, road cave-ins',            'Public Works Department'),
('Water Supply',    'No water supply, pipe leakage, contaminated water',     'Water Supply Board'),
('Sanitation',      'Garbage not collected, blocked drains, open defecation','Waste Management Department'),
('Electrical',      'Broken streetlights, power outages, fallen wires',      'Energy & Utilities Department'),
('Tree Hazard',     'Fallen trees, overgrown branches blocking roads',       'Horticulture Department');


-- ---- 3.3: Statuses ----
INSERT INTO STATUS (name, description) VALUES
('Pending',     'Complaint received; awaiting officer assignment'),
('In Progress', 'Complaint assigned to officer; work in progress'),
('Resolved',    'Issue has been fixed and complaint is closed'),
('Rejected',    'Complaint rejected due to invalid or duplicate report');


-- ---- 3.4: Locations ----
INSERT INTO LOCATION (address, latitude, longitude) VALUES
('College Road, Near KK Wagh, Nashik, Maharashtra',        20.00473, 73.76948),
('Gangapur Road, Sector 21, Nashik, Maharashtra',           19.99872, 73.77215),
('Nashik Road, Near Railway Station, Nashik, Maharashtra',  19.98703, 73.79845),
('Panchavati, Near Godavari Ghat, Nashik, Maharashtra',     20.00101, 73.78542),
('Indira Nagar, Nashik, Maharashtra',                       20.01234, 73.76123);


-- ---- 3.5: Complaints ----
INSERT INTO COMPLAINT (user_id, category_id, location_id, status_id, title, description, priority) VALUES
(5, 1, 1, 2, 'Large pothole near KK Wagh main gate',
    'There is a dangerous pothole of about 2 feet diameter near the college main gate causing accidents daily.', 'High'),

(6, 2, 2, 1, 'No water supply for 3 days in Sector 21',
    'Our entire sector has not received water supply for the past 3 days. Multiple residents are affected.', 'High'),

(7, 3, 3, 3, 'Garbage pile outside Nashik Road market',
    'Garbage has not been collected for a week near the weekly market. Causing foul smell and health hazard.', 'Medium'),

(5, 4, 4, 1, 'Streetlight broken near Godavari Ghat',
    'The streetlight at the Godavari Ghat steps has been broken for 2 weeks. Dangerous at night for devotees.', 'Medium'),

(6, 5, 5, 2, 'Fallen tree blocking Indira Nagar road',
    'A large tree fell due to last night storm and is blocking the main road. Vehicles cannot pass.', 'High'),

(7, 1, 2, 4, 'Duplicate complaint for road near sector 21',
    'Road crack near water pipeline — already reported by another resident.', 'Low'),

(5, 3, 1, 3, 'Drain blocked near college road',
    'The storm drain on college road is completely blocked causing water logging after every rain.', 'Medium'),

(6, 4, 3, 2, 'Electrical wire hanging low on Nashik Road',
    'A low-hanging electrical wire near the railway station overbridge poses a serious safety risk.', 'High');


-- ---- 3.6: Images ----
INSERT INTO IMAGE (complaint_id, image_url) VALUES
(1, 'https://storage.civora.in/images/complaint_001_a.jpg'),
(1, 'https://storage.civora.in/images/complaint_001_b.jpg'),
(2, 'https://storage.civora.in/images/complaint_002_a.jpg'),
(5, 'https://storage.civora.in/images/complaint_005_a.jpg'),
(8, 'https://storage.civora.in/images/complaint_008_a.jpg');


-- ---- 3.7: Status Updates ----
INSERT INTO STATUS_UPDATE (complaint_id, status_id, updated_by, note) VALUES
(1, 2, 3, 'Assigned to road repair crew. Work scheduled for tomorrow.'),
(2, 1, 4, 'Issue logged. Water supply team is investigating pipeline fault.'),
(3, 3, 3, 'Garbage collected. Area cleaned and disinfected.'),
(5, 2, 4, 'Tree removal crew dispatched. Road partially cleared.'),
(6, 4, 2, 'Complaint rejected: duplicate of complaint #4 filed by another citizen.'),
(7, 3, 3, 'Drain desilted. Water logging issue resolved.'),
(8, 2, 4, 'Electrical team notified. Repair work to be done by Friday.'),
(1, 3, 3, 'Pothole patching completed. Road surface restored to normal.');


-- ---- 3.8: History (manual records for complaints without triggers in seed data) ----
INSERT INTO HISTORY (complaint_id, action_by, action, details) VALUES
(1, 5, 'Complaint Submitted',    'Citizen submitted complaint about pothole near KK Wagh.'),
(1, 3, 'Status Changed',         'Status changed from Pending to In Progress by Officer Raj.'),
(1, 3, 'Status Changed',         'Status changed from In Progress to Resolved. Pothole repaired.'),
(2, 6, 'Complaint Submitted',    'Citizen submitted complaint about water supply outage in Sector 21.'),
(3, 7, 'Complaint Submitted',    'Citizen submitted complaint about garbage pile on Nashik Road.'),
(3, 3, 'Status Changed',         'Status changed to Resolved. Garbage cleared by sanitation team.'),
(5, 6, 'Complaint Submitted',    'Citizen submitted complaint about fallen tree in Indira Nagar.'),
(5, 4, 'Status Changed',         'Status changed to In Progress. Tree removal crew dispatched.'),
(6, 7, 'Complaint Submitted',    'Citizen submitted complaint about road crack near Sector 21.'),
(6, 2, 'Complaint Rejected',     'Complaint rejected — duplicate of existing complaint #4.');


-- =============================================================================
-- SECTION 4: VIEWS
-- =============================================================================

-- View 1: Full complaint summary with all related details
CREATE VIEW v_complaint_summary AS
SELECT
    c.complaint_id,
    c.title,
    c.description,
    c.priority,
    c.created_at,
    c.updated_at,
    u.username        AS submitted_by,
    u.email           AS citizen_email,
    cc.name           AS category,
    cc.department     AS responsible_dept,
    s.name            AS current_status,
    l.address         AS location_address,
    l.latitude,
    l.longitude
FROM COMPLAINT c
JOIN USER u                ON c.user_id     = u.user_id
JOIN COMPLAINT_CATEGORY cc ON c.category_id = cc.category_id
JOIN STATUS s              ON c.status_id   = s.status_id
JOIN LOCATION l            ON c.location_id = l.location_id;


-- View 2: Only unresolved (pending or in-progress) complaints
CREATE VIEW v_pending_complaints AS
SELECT
    cs.complaint_id,
    cs.title,
    cs.priority,
    cs.current_status,
    cs.submitted_by,
    cs.category,
    cs.responsible_dept,
    cs.location_address,
    cs.created_at,
    DATEDIFF(NOW(), cs.created_at) AS days_open
FROM v_complaint_summary cs
WHERE cs.current_status IN ('Pending', 'In Progress');


-- View 3: Complaint count statistics per category and status
CREATE VIEW v_complaint_statistics AS
SELECT
    cc.name                         AS category,
    cc.department,
    s.name                          AS status,
    COUNT(c.complaint_id)           AS total_complaints,
    SUM(c.priority = 'High')        AS high_priority,
    SUM(c.priority = 'Medium')      AS medium_priority,
    SUM(c.priority = 'Low')         AS low_priority
FROM COMPLAINT c
JOIN COMPLAINT_CATEGORY cc ON c.category_id = cc.category_id
JOIN STATUS s              ON c.status_id   = s.status_id
GROUP BY cc.name, cc.department, s.name;


-- View 4: Officer workload — how many updates each officer has processed
CREATE VIEW v_officer_workload AS
SELECT
    u.user_id,
    u.username               AS officer_name,
    u.email                  AS officer_email,
    COUNT(su.status_update_id) AS total_updates_made,
    SUM(s.name = 'Resolved')   AS complaints_resolved,
    SUM(s.name = 'Rejected')   AS complaints_rejected
FROM USER u
LEFT JOIN STATUS_UPDATE su ON su.updated_by = u.user_id
LEFT JOIN STATUS s         ON su.status_id  = s.status_id
WHERE u.role IN ('Officer', 'Admin')
GROUP BY u.user_id, u.username, u.email;


-- =============================================================================
-- SECTION 5: STORED PROCEDURES
-- =============================================================================

DELIMITER $$

-- Procedure 1: Submit a new complaint (creates location + complaint in one call)
CREATE PROCEDURE sp_submit_complaint (
    IN  p_user_id     INT,
    IN  p_category_id INT,
    IN  p_title       VARCHAR(255),
    IN  p_description TEXT,
    IN  p_priority    ENUM('Low', 'Medium', 'High'),
    IN  p_address     VARCHAR(500),
    IN  p_latitude    DECIMAL(10,8),
    IN  p_longitude   DECIMAL(11,8),
    OUT p_complaint_id INT
)
BEGIN
    DECLARE v_location_id INT;
    DECLARE v_pending_status_id INT;

    -- Get the Pending status ID
    SELECT status_id INTO v_pending_status_id FROM STATUS WHERE name = 'Pending' LIMIT 1;

    -- Insert location
    INSERT INTO LOCATION (address, latitude, longitude)
    VALUES (p_address, p_latitude, p_longitude);

    SET v_location_id = LAST_INSERT_ID();

    -- Insert complaint
    INSERT INTO COMPLAINT (user_id, category_id, location_id, status_id, title, description, priority)
    VALUES (p_user_id, p_category_id, v_location_id, v_pending_status_id, p_title, p_description, p_priority);

    SET p_complaint_id = LAST_INSERT_ID();
END$$


-- Procedure 2: Update complaint status (officer action)
CREATE PROCEDURE sp_update_complaint_status (
    IN p_complaint_id INT,
    IN p_new_status_id INT,
    IN p_updated_by INT,
    IN p_note TEXT
)
BEGIN
    -- Update complaint's current status and updated_at
    UPDATE COMPLAINT
    SET status_id = p_new_status_id
    WHERE complaint_id = p_complaint_id;

    -- Record status update
    INSERT INTO STATUS_UPDATE (complaint_id, status_id, updated_by, note)
    VALUES (p_complaint_id, p_new_status_id, p_updated_by, p_note);

    -- Record in history
    INSERT INTO HISTORY (complaint_id, action_by, action, details)
    VALUES (
        p_complaint_id,
        p_updated_by,
        'Status Changed',
        CONCAT('Status changed to: ', (SELECT name FROM STATUS WHERE status_id = p_new_status_id), '. Note: ', IFNULL(p_note, 'No notes provided.'))
    );
END$$


-- Procedure 3: Get all complaints submitted by a specific citizen
CREATE PROCEDURE sp_get_complaints_by_user (
    IN p_user_id INT
)
BEGIN
    SELECT
        c.complaint_id,
        c.title,
        c.priority,
        c.created_at,
        cc.name     AS category,
        s.name      AS status,
        l.address   AS location
    FROM COMPLAINT c
    JOIN COMPLAINT_CATEGORY cc ON c.category_id = cc.category_id
    JOIN STATUS s              ON c.status_id   = s.status_id
    JOIN LOCATION l            ON c.location_id = l.location_id
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at DESC;
END$$

DELIMITER ;


-- =============================================================================
-- SECTION 6: TRIGGERS
-- =============================================================================

DELIMITER $$

-- Trigger 1: Auto-log "Complaint Submitted" into HISTORY after a new complaint is inserted
CREATE TRIGGER trg_after_complaint_insert
AFTER INSERT ON COMPLAINT
FOR EACH ROW
BEGIN
    INSERT INTO HISTORY (complaint_id, action_by, action, details)
    VALUES (
        NEW.complaint_id,
        NEW.user_id,
        'Complaint Submitted',
        CONCAT('New complaint submitted: "', NEW.title, '" with priority: ', NEW.priority)
    );
END$$


-- Trigger 2: Auto-update COMPLAINT.updated_at whenever a STATUS_UPDATE is inserted
CREATE TRIGGER trg_after_status_update_insert
AFTER INSERT ON STATUS_UPDATE
FOR EACH ROW
BEGIN
    UPDATE COMPLAINT
    SET updated_at = CURRENT_TIMESTAMP
    WHERE complaint_id = NEW.complaint_id;
END$$

DELIMITER ;


-- =============================================================================
-- SECTION 7: SAMPLE SELECT QUERIES
-- =============================================================================

-- Query 1: All complaints with citizen name, category, and current status (INNER JOIN)
SELECT
    c.complaint_id,
    c.title,
    c.priority,
    u.username         AS submitted_by,
    cc.name            AS category,
    s.name             AS current_status,
    c.created_at
FROM COMPLAINT c
INNER JOIN USER u               ON c.user_id     = u.user_id
INNER JOIN COMPLAINT_CATEGORY cc ON c.category_id = cc.category_id
INNER JOIN STATUS s             ON c.status_id   = s.status_id
ORDER BY c.created_at DESC;


-- Query 2: All complaints submitted by a specific citizen (user_id = 5)
SELECT
    c.complaint_id,
    c.title,
    c.priority,
    s.name  AS status,
    l.address,
    c.created_at
FROM COMPLAINT c
JOIN STATUS   s ON c.status_id   = s.status_id
JOIN LOCATION l ON c.location_id = l.location_id
WHERE c.user_id = 5;


-- Query 3: Number of complaints per category
SELECT
    cc.name                   AS category,
    cc.department,
    COUNT(c.complaint_id)     AS total_complaints
FROM COMPLAINT_CATEGORY cc
LEFT JOIN COMPLAINT c ON c.category_id = cc.category_id
GROUP BY cc.category_id, cc.name, cc.department
ORDER BY total_complaints DESC;


-- Query 4: Pending complaints that are more than 2 days old (overdue)
SELECT
    c.complaint_id,
    c.title,
    c.priority,
    u.username     AS citizen,
    l.address,
    c.created_at,
    DATEDIFF(NOW(), c.created_at) AS days_open
FROM COMPLAINT c
JOIN USER u     ON c.user_id     = u.user_id
JOIN LOCATION l ON c.location_id = l.location_id
JOIN STATUS s   ON c.status_id   = s.status_id
WHERE s.name = 'Pending'
  AND DATEDIFF(NOW(), c.created_at) > 2
ORDER BY days_open DESC;


-- Query 5: Most active complaint submitters (citizens with most complaints)
SELECT
    u.user_id,
    u.username,
    u.email,
    COUNT(c.complaint_id)  AS complaints_submitted
FROM USER u
JOIN COMPLAINT c ON c.user_id = u.user_id
WHERE u.role = 'Citizen'
GROUP BY u.user_id, u.username, u.email
ORDER BY complaints_submitted DESC
LIMIT 10;


-- Query 6: Complaints with full location details (lat/long included)
SELECT
    c.complaint_id,
    c.title,
    c.priority,
    s.name       AS status,
    l.address,
    l.latitude,
    l.longitude
FROM COMPLAINT c
JOIN STATUS   s ON c.status_id   = s.status_id
JOIN LOCATION l ON c.location_id = l.location_id;


-- Query 7: Complete audit trail (HISTORY) for complaint_id = 1
SELECT
    h.history_id,
    h.action,
    h.details,
    h.action_time,
    u.username   AS performed_by,
    u.role
FROM HISTORY h
JOIN USER u ON h.action_by = u.user_id
WHERE h.complaint_id = 1
ORDER BY h.action_time ASC;


-- Query 8: Status updates made by officers with their notes
SELECT
    su.status_update_id,
    c.title             AS complaint_title,
    u.username          AS officer,
    s.name              AS new_status,
    su.note,
    su.updated_at
FROM STATUS_UPDATE su
JOIN COMPLAINT c ON su.complaint_id = c.complaint_id
JOIN USER u      ON su.updated_by   = u.user_id
JOIN STATUS s    ON su.status_id    = s.status_id
ORDER BY su.updated_at DESC;


-- Query 9: Categories that have more than 1 complaint filed (GROUP BY + HAVING)
SELECT
    cc.name             AS category,
    cc.department,
    COUNT(c.complaint_id) AS total_complaints
FROM COMPLAINT_CATEGORY cc
JOIN COMPLAINT c ON c.category_id = cc.category_id
GROUP BY cc.category_id, cc.name, cc.department
HAVING COUNT(c.complaint_id) > 1
ORDER BY total_complaints DESC;


-- Query 10: Complaints that have at least one image attached (subquery)
SELECT
    c.complaint_id,
    c.title,
    c.priority,
    s.name     AS status,
    u.username AS submitted_by
FROM COMPLAINT c
JOIN STATUS s ON c.status_id = s.status_id
JOIN USER u   ON c.user_id   = u.user_id
WHERE c.complaint_id IN (
    SELECT DISTINCT complaint_id FROM IMAGE
)
ORDER BY c.complaint_id;


-- =============================================================================
-- SECTION 8: QUICK VERIFICATION QUERIES
-- =============================================================================

-- Show all 8 tables
SHOW TABLES;

-- Preview the complaint summary view
SELECT * FROM v_complaint_summary;

-- Preview pending complaints
SELECT * FROM v_pending_complaints;

-- Preview category statistics
SELECT * FROM v_complaint_statistics;

-- Preview officer workload
SELECT * FROM v_officer_workload;

-- Test stored procedure: Get complaints for citizen_arjun (user_id = 5)
CALL sp_get_complaints_by_user(5);

-- Test stored procedure: Update status of complaint 2 to In Progress
CALL sp_update_complaint_status(2, 2, 3, 'Pipeline fault located. Repair team dispatched.');

-- Verify trigger fired — check history for complaint 2
SELECT * FROM HISTORY WHERE complaint_id = 2 ORDER BY action_time;

-- =============================================================================
-- END OF CIVORA DBMS ASSIGNMENT
-- =============================================================================
