# 🤝 NEU MOA Monitoring System

![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

The **NEU MOA Monitoring System** is a secure, full-stack web application designed exclusively for New Era University to manage, track, and monitor the approval lifecycle of Memorandums of Agreement (MOAs) with Partner Institutions (HTEs).

By centralizing the records into a single digital hub, this system ensures strict data visibility rules, real-time status tracking, and automated audit logging, significantly improving the administrative workflow of the university's partnerships.

> **🚀 Live Demo:** [View the deployed application here](https://neu-moa-monitoring-system.web.app/)

---

## ✨ Key Features
* **🔐 Institutional Authentication:** Strictly limits system access to users logging in with an official **@neu.edu.ph** Google Workspace account.
* **🛡️ Strict Role-Based Access Control:** 
  * **Admin Dashboard:** Full system control. Can view all records, access the Archive Vault, view the Audit Trail, generate PDF reports, and manage user roles/blocks.
  * **Faculty Dashboard:** Can create, edit, and soft-delete active MOA entries to maintain the department's records.
  * **Student Dashboard:** Highly restricted read-only view. Only displays active **APPROVED** agreements and limits visible data to Company Name, Address, Contact Person, and Email.
* **📈 Smart Status Lifecycle:** Categorizes agreements accurately through various phases: `PROCESSING` (legal review/signatures), `APPROVED` (active), `EXPIRING` (within 2 months), and `EXPIRED`.
* **📊 Statistics & Analytics Dashboard:** Visualizes real-time metrics of active, processing, and expired MOAs. Includes dynamic breakdowns and filtering by specific Colleges and Date Ranges.
* **🔍 Advanced Search & Filtering:** A highly optimized, memoized search bar that instantly queries across company names, contacts, addresses, industries, and assigned colleges.
* **📝 Audit Trail & Archive Vault:** Implements soft-deletes to prevent accidental data loss. Every Insert, Edit, Archive, and Restore action is permanently logged with the user's name, action, and timestamp.
* **📄 Professional PDF Reporting:** Instantly exports the MOA directory into highly formatted, print-ready official PDF reports utilizing `jsPDF` and `autoTable`.

---

## 🛠️ Tech Stack

**Frontend Architecture:**
* **Bundler:** Vite
* **Library:** React 19
* **Styling:** Tailwind CSS v4
* **Icons:** Google Material Symbols

**Backend & Deployment:**
* **Platform:** Firebase (Authentication, Firestore Database, Hosting)
* **CI/CD:** Automated GitHub Continuous Integration (Push-to-Deploy)
* **Security:** Role-based document access and Google OAuth constraints

**Data & Utilities:**
* **PDF Generation:** `jspdf` and `jspdf-autotable`
* **Notifications:** `react-hot-toast` for fluid UI alerts

---

## 🚀 Getting Started (Local Development)

To run this project locally on your machine, follow these steps:

**1. Clone the repository:**
```bash
git clone https://github.com/ramdcrz/NEUMOAMonitoringSystem.git
```

**2. Navigate to the project directory:**
```bash
cd NEUMOAMonitoringSystem
```

**3. Install dependencies:**
```bash
npm install
```

**4. Run the development server:**
```bash
npm run dev
```

**5. View the application:**
```bash
Open http://localhost:5173 in your browser to see the live local build. 
```

## 👨‍💻 Author

**Ramil Deocariza Jr.**
* **Institution**: College of Informatics and Computing Studies, New Era University
* **Email**: ramildeocariza009@gmail.com