# NEU Library Logger

> A web-based Library Visitor Management System for New Era University — built with React, Firebase, and Tailwind CSS.

**Live App:** [neu-library-umber.vercel.app](https://neu-library-umber.vercel.app)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [Firestore Security Rules](#firestore-security-rules)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

**NEU Library Logger** is a digital visitor management system designed for the New Era University Library. It replaces manual logbooks by allowing students, teachers, and staff to log their library visits using their institutional Google accounts. Admins can monitor real-time visitor data, view statistics, manage users, and block accounts.

> Restricted to `@neu.edu.ph` email accounts only.

---

## Features

### 🎓 Student / Visitor Kiosk
- Sign in using NEU Google account (`@neu.edu.ph`)
- Fill in visitor details on first visit:
  - **Visitor Type** — Student, Teacher / Faculty, Staff / Employee
  - **Student ID** *(Students only)*
  - **Department / College** *(Students and Teachers)*
  - **Program / Course** *(Students only)*
- Details are **locked after first submission** — only Admin can edit them
- Select **Purpose of Visit** every visit
- **Time In** to log entry into the library
- **Time Out** to log exit
- App **automatically signs out** after Time Out with a countdown
- Google sign-in always shows the account picker — never auto signs in

### 🛡️ Admin Dashboard
- Personalized greeting with date
- Live stat cards — Inside Now, Today, This Week, Completed Today
- **Visit Statistics panel** with:
  - Today / This Week / Custom date range filter
  - 7-day bar chart
  - Breakdown by Purpose
  - Breakdown by Department
  - Breakdown by Visitor Type (Student / Teacher / Staff)
- **Currently Inside** — real-time list of active visitors
- **Today's Visit Log** — full table with all visit details

### 📋 Visit Logs (Admin)
- Full visit history with search and filters
- Search by name, ID, department, program, purpose, or visitor type
- Filter by Today / Active / All / Custom date range
- Admin can manually Time Out active visitors

### 👥 User Management (Admin)
- View all registered users
- **Promote / Demote** roles (Student ↔ Admin)
- **Edit Profile** — update locked student details (ID, Department, Program, Visitor Type)
- **Block / Unblock** users with confirmation modal
- Blocked users cannot sign in — they see a "blocked" error message

### 🔒 Profile Locking System
- Student profile fields lock after first successful Time In
- Lock condition per visitor type:
  - **Student** — requires Visitor Type + Student ID + Department + Program
  - **Teacher / Faculty** — requires Visitor Type + Department
  - **Staff / Employee** — requires Visitor Type only
- Locked fields show with a 🔒 icon
- Only Admin can edit locked profiles

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** (Vite) | Frontend framework |
| **Tailwind CSS** | Styling and UI |
| **Firebase Auth** | Google authentication |
| **Firestore** | Real-time database |
| **React Router v6** | Client-side routing |
| **date-fns** | Date formatting and calculations |
| **lucide-react** | Icons |
| **Vercel** | Hosting and deployment |

---

## User Roles

| Role | Access |
|---|---|
| **Student / Visitor** | Kiosk only — Time In/Out, view own visit form |
| **Admin** | Full dashboard, visit logs, user management, statistics |

> Role is stored in Firestore under each user's document (`role` field). Set to `"student"` by default. Manually change to `"admin"` in Firestore Console to promote a user.

---

## Project Structure

```
neu-library/
├── public/
│   ├── neu-logo.png              # NEU University seal
│   ├── neu-library-building.png  # Login page background
│   └── neu-library-inside.png   # Kiosk/Admin background
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx     # Google login with live clock
│   │   └── shared/
│   │       └── AdminLayout.jsx   # Admin sidebar layout
│   ├── hooks/
│   │   └── useFirestore.js       # Firestore hooks and operations
│   ├── lib/
│   │   ├── AuthContext.jsx       # Auth state, Google login, blocked check
│   │   └── firebase.js           # Firebase configuration
│   ├── pages/
│   │   ├── KioskPage.jsx         # Student visitor kiosk
│   │   └── admin/
│   │       ├── AdminDashboard.jsx  # Stats, charts, live feed
│   │       ├── AdminVisits.jsx     # Visit logs with filters
│   │       └── AdminUsers.jsx      # User management + block
│   ├── styles/
│   │   └── index.css             # Global styles (dark theme)
│   ├── App.jsx                   # Routes and role-based redirects
│   └── main.jsx                  # React entry point
├── firestore.rules               # Firestore security rules
├── index.html                    # App title and favicon
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Getting Started

### Prerequisites
- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com)
- A **Firebase** project with Authentication and Firestore enabled

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/wayneandyvillamor/neu-library.git
cd neu-library
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Firebase**

Open `src/lib/firebase.js` and replace the placeholder values with your Firebase project credentials:
```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

**4. Start the development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Firebase Setup

### 1. Enable Authentication
- Go to Firebase Console → **Authentication** → **Sign-in method**
- Enable **Google** provider
- Set your project support email

### 2. Enable Firestore
- Go to Firebase Console → **Firestore Database** → **Create database**
- Start in **test mode** (then apply security rules below)
- Select region: `asia-southeast1` (recommended for Philippines)

### 3. Set Authorized Domains
- Go to **Authentication** → **Settings** → **Authorized domains**
- Add your Vercel domain (e.g. `neu-library-umber.vercel.app`)

### 4. Create First Admin
After registering with your NEU Google account:
1. Go to **Firestore → users collection**
2. Find your user document
3. Change the `role` field from `"student"` to `"admin"`
4. Sign out and sign back in

---

## Firestore Security Rules

Copy the contents of `firestore.rules` into your Firebase Console under **Firestore → Rules**:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth()  { return request.auth != null; }
    function isNEU()   { return request.auth.token.email.matches('.*@neu\\.edu\\.ph$'); }
    function getRole() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role; }
    function isAdmin() { return isAuth() && getRole() == 'admin'; }

    match /users/{userId} {
      allow read:   if isAuth() && isNEU();
      allow create: if isAuth() && isNEU() && request.auth.uid == userId;
      allow update: if (isAuth() && request.auth.uid == userId
                    && request.resource.data.role == resource.data.role) || isAdmin();
      allow delete: if isAdmin();
    }

    match /visits/{visitId} {
      allow read:   if isAuth() && isNEU();
      allow create: if isAuth() && isNEU();
      allow update: if isAdmin() || (isAuth() && resource.data.studentId == request.auth.uid);
      allow delete: if isAdmin();
    }
  }
}
```

---

## Deployment

This project is deployed on **Vercel** with automatic deployments from GitHub.

### Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your `neu-library` repository
4. Leave all settings as default
5. Click **Deploy**

### Update Deployment
Every time you push to the `main` branch, Vercel automatically redeploys:
```bash
git add .
git commit -m "your update message"
git push
```

---

## Developed By

**Wayne Andy Y. Villamor**
New Era University — College of Information and Computing Sciences
BS Information Technology

---

© 2026 New Era University · All rights reserved
