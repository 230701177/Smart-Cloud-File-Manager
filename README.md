# Smart Cloud File Manager ☁️

A centralized system for secure file storage, management, and optimization featuring a modern cinematic user interface.

---

## About The Project

Smart Cloud File Manager is a scalable cloud-based file storage and management system designed to optimize storage usage, detect duplicate files, and provide real-time monitoring. The project focuses heavily on providing an immersive, premium user experience utilizing Claymorphism and Glassmorphism design principles.

This repository contains both the **Frontend** (React + Vite) and the **Backend** (Node.js + Express + MongoDB) components used across the platform.

---

## 🌟 Key Features

- **Cinematic Document Viewer**: Fully integrated in-browser preview functionality.
  - Native High-DPI PDF preview engine (via `pdf.js`) with responsive controls.
  - Rich DOCX document viewer retaining structure.
  - Interactive CSV data tables and Code syntax highlighting.
- **Deduplication Engine**: Backend chunk-level file deduplication mechanism. Prevents identical files and chunks from wasting server storage space.
- **Version Control**: Manage multiple file iterations and historical state restoration seamlessly.
- **File Upload & Management**: Interactive drag-and-drop animated upload modal with batching capabilities.
- **Modern Adaptive Theme**: "Claymorphism" Neo-Brutalism aesthetics that dynamically adapt to Light and Dark modes.
- **Storage Monitoring**: Real-time tracking of used storage, available spaces, and chunks saved from duplication.

---

## 🔒 Security & Authentication

- **Dual-Mode Secure Auth**: JWT-based session security supporting standard API streams and secure query-string payload streams (for direct file downloads).
- **Role-Based Management**: Enforced owner controls across all files and directories.
- **Storage Quota Enforcement**: Active calculation on user limits.

---

## 🧱 Architecture Overview

- **Frontend**: `React.js` (v19) via `Vite`. Managed via robust `Context API` states and interactive components like `lucide-react` for iconography.
- **Backend**: `Node.js` and `Express`. Handles chunk-hashing (SHA-256), token security, versioning, and streams downloads natively without forcing arbitrary `.octet-stream` blobs.
- **Database Model**: MongoDB using Reference-counting models for deduplicated multi-user files.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/230701177/Smart-Cloud-File-Manager.git
   cd Smart-Cloud-File-Manager
   ```

2. **Frontend Installation**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Installation**
   ```bash
   cd backend
   npm install
   cp .env.example .env # And configure your options
   npm install pdfjs-dist mammoth papaparse react-syntax-highlighter
   npm run dev
   ```

---

## Goal

The goal of Smart Cloud File Manager is to provide an efficient, scalable, and secure cloud storage solution providing an enterprise-grade experience without abandoning visual beauty and intuitive workflows.

---

## Contribution

Contributions are welcome. Please open an issue or submit a pull request following standard development practices.

---

## License

This project is currently under development. License details will be added soon.

---

**© 2026 Smart Cloud File Manager. All Rights Reserved.**
