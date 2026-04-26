# K. K. Wagh Institute of Engineering Education and Research, Nashik
## (Autonomous from Academic Year 2022-23)
### S. Y. B. Tech. | Pattern 2023 | Semester: II
### 2308215: Database Management System Lab
### Assignment No. 12

---

# Civora — Civic Complaint Management System
## Backend Database Design | Project Proposal & High-Level SRS

---

## A. Project Goal

The goal of this project is to design a robust backend database system for **Civora**, a Civic Complaint Management System that enables citizens to report infrastructure and public service issues to the relevant government authorities. In modern urban and rural governance, citizens frequently encounter problems such as damaged roads, water supply failures, broken streetlights, sanitation issues, and other public amenities-related concerns. Managing these complaints manually through phone calls or physical visits is inefficient, lacks transparency, and results in delayed resolutions. Civora aims to digitize this process through a structured, normalized relational database that stores all complaint-related data — from submission to resolution — in an organized and traceable manner.

The backend database will handle the complete lifecycle of a civic complaint, including citizen registration, complaint submission with geographic location data, photo evidence, category classification, multi-level status tracking, and a full audit history. The system supports multiple user roles — Citizens, Government Officers, Admins, and Super Admins — each with defined access and responsibilities. By maintaining normalized tables for users, complaints, categories, statuses, locations, images, status updates, and history, the system ensures data integrity, eliminates redundancy, and provides a transparent grievance redressal mechanism for both citizens and authorities.

---

## B. Types of Users

| # | User Type | Description |
|---|-----------|-------------|
| 1 | **Citizen** | Registers on the platform and submits complaints about civic issues. Can view status updates on their own complaints. |
| 2 | **Government Officer** | Assigned to review and resolve complaints within their jurisdiction. Can update complaint status and add notes. |
| 3 | **Admin** | Manages categories, statuses, user roles, and oversees all complaints in the system. Can assign complaints to officers. |
| 4 | **Super Admin** | Full system access. Manages admin accounts, system configuration, and generates reports across all regions. |

---

## C. Functionalities

### 1. User Registration and Authentication
Citizens and government officers can register on the platform by providing their name, username, email, phone number, and password. Passwords are stored as secure hashes (bcrypt). Each user is assigned a role that determines their access level. Login is handled via email/phone and password verification. The database stores all user credentials and role information in the `USER` table with unique constraints on email and phone fields.

### 2. Complaint Submission
Registered citizens can submit complaints about civic issues by providing a title, detailed description, and selecting a category (e.g., Road Damage, Water Supply, Sanitation, Electrical). Each complaint is linked to a geographic location (address, latitude, longitude) stored in the `LOCATION` table. The complaint record captures timestamps for creation and last update. A priority level (Low, Medium, High) is auto-assigned based on the category. The complaint is assigned an initial status of "Pending" upon submission.

### 3. Complaint Category Management
Admins can manage predefined complaint categories stored in the `COMPLAINT_CATEGORY` table. Each category has a name, description, and associated government department (e.g., Public Works, Water Board, Energy Department). This enables automatic routing of complaints to the relevant department for faster resolution. Categories can be added, updated, or deactivated by the Admin.

### 4. Photo Evidence Upload
Citizens can attach one or more photographic evidence files to their complaints. Each image record in the `IMAGE` table stores the complaint reference, the image URL (stored on a file server or cloud), and the upload timestamp. Multiple images per complaint are supported through a one-to-many relationship. This helps officers visually assess the severity of the issue before taking action.

### 5. Status Tracking and Updates
Government officers can update the status of a complaint as it progresses through the resolution process. Each status change is recorded in the `STATUS_UPDATE` table, which stores the new status, the officer who made the update, the timestamp, and an optional note explaining the action taken. The `STATUS` table holds the master list of possible statuses: Pending, In Progress, Resolved, and Rejected.

### 6. Complaint History and Audit Trail
Every action performed on a complaint — submission, assignment, status changes, escalation — is automatically logged in the `HISTORY` table via database triggers. Each history record captures the action type, the user who performed it, the timestamp, and detailed notes. This provides complete transparency and accountability for the entire complaint lifecycle. Citizens can view the full audit trail of their complaint.

### 7. Reporting and Analytics
The system supports reporting queries to generate insights such as: number of complaints per category, average resolution time, officer workload distribution, pending complaints by location, and monthly complaint trends. Views are defined in the database to simplify these queries for the application layer. Admins and Super Admins use these reports for performance monitoring and policy decisions.

---

## D. Hardware & Software Requirements

### Backend Requirements

**Hardware:**
- RAM: 8 GB or above
- Storage: 500 GB SSD
- Processor: Intel Core i5 / AMD Ryzen 5 or above
- Network: 100 Mbps internet connectivity

**Software:**
- DBMS: MySQL 8.0 / MariaDB 10.6 / PostgreSQL 14
- Server: Node.js 18+ with Express.js / Apache with PHP
- OS: Ubuntu 22.04 LTS / Windows Server 2019
- Tools: MySQL Workbench, phpMyAdmin

### Frontend Requirements

**Hardware:**
- Any device with a modern web browser (PC, tablet, smartphone)

**Software:**
- HTML5, CSS3, JavaScript (ES6+)
- Framework: React.js / Vue.js
- Maps: Leaflet.js (for geolocation display)
- Any modern web browser (Chrome, Firefox, Edge)

---

## E. System Estimation

### Number of Users (per city/district deployment)

| User Type | Estimated Count |
|-----------|----------------|
| Super Admin | 1–2 |
| Admin | 5–10 |
| Government Officers | 50–100 |
| Citizens | 10,000+ |

### Expected Load
- Complaint submissions: ~200–500 per day
- Status updates: ~300–700 per day
- Login/auth transactions: ~1,000–2,000 per day
- **Total: ~2,000–5,000 transactions/day**

### Expected Database Size
- Initial (Year 1): 2–5 GB
- After 3 years: 15–25 GB
- Scalable with archiving and partitioning strategies

---

## F. Database Design

### Main Entities (Tables)

#### 1. USER
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| username | VARCHAR(100) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| role | ENUM | 'Citizen', 'Officer', 'Admin', 'Super Admin' |
| email | VARCHAR(255) | UNIQUE |
| phone | VARCHAR(20) | UNIQUE |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### 2. COMPLAINT_CATEGORY
| Column | Type | Constraints |
|--------|------|-------------|
| category_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | |
| department | VARCHAR(100) | NOT NULL |

#### 3. STATUS
| Column | Type | Constraints |
|--------|------|-------------|
| status_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(50) | NOT NULL, UNIQUE |
| description | TEXT | |

#### 4. LOCATION
| Column | Type | Constraints |
|--------|------|-------------|
| location_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| address | VARCHAR(500) | NOT NULL |
| latitude | DECIMAL(10,8) | CHECK (-90 to 90) |
| longitude | DECIMAL(11,8) | CHECK (-180 to 180) |

#### 5. COMPLAINT
| Column | Type | Constraints |
|--------|------|-------------|
| complaint_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| user_id | INT | FK → USER(user_id) |
| category_id | INT | FK → COMPLAINT_CATEGORY(category_id) |
| location_id | INT | FK → LOCATION(location_id) |
| status_id | INT | FK → STATUS(status_id) |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| priority | ENUM | 'Low', 'Medium', 'High' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

#### 6. IMAGE
| Column | Type | Constraints |
|--------|------|-------------|
| image_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| complaint_id | INT | FK → COMPLAINT(complaint_id) ON DELETE CASCADE |
| image_url | VARCHAR(500) | NOT NULL |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### 7. STATUS_UPDATE
| Column | Type | Constraints |
|--------|------|-------------|
| status_update_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| complaint_id | INT | FK → COMPLAINT(complaint_id) ON DELETE CASCADE |
| status_id | INT | FK → STATUS(status_id) |
| updated_by | INT | FK → USER(user_id) |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| note | TEXT | |

#### 8. HISTORY
| Column | Type | Constraints |
|--------|------|-------------|
| history_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| complaint_id | INT | FK → COMPLAINT(complaint_id) ON DELETE CASCADE |
| action_by | INT | FK → USER(user_id) |
| action_time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| action | VARCHAR(255) | NOT NULL |
| details | TEXT | |

### Relationships Summary
- USER **submits** COMPLAINT (1 : N)
- COMPLAINT **belongs to** COMPLAINT_CATEGORY (N : 1)
- COMPLAINT **has** LOCATION (1 : 1)
- COMPLAINT **has** IMAGE (1 : N)
- COMPLAINT **has** STATUS_UPDATE (1 : N)
- COMPLAINT **has** HISTORY (1 : N)
- HISTORY **refers to** STATUS (N : 1)
- STATUS_UPDATE **refers to** STATUS (N : 1)
- STATUS_UPDATE **updated by** USER (N : 1)
- HISTORY **action by** USER (N : 1)

> See `civora_assignment.sql` for complete SQL implementation including schema, sample data, views, stored procedures, triggers, and sample queries.
