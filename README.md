# Smart Cloud File Manager ☁️

A centralized system for secure file storage, management, and optimization featuring a modern cinematic user interface.

---

## About The Project

Smart Cloud File Manager is a scalable cloud-based file storage and management system designed to optimize storage usage, detect duplicate files, and provide real-time monitoring. The project focuses heavily on providing an immersive, premium user experience utilizing Claymorphism and Glassmorphism design principles.

This repository contains both the **Frontend** (React + Vite) and the **Backend** (Node.js + Express + MongoDB) components used across the platform.

---

## 🌟 Key Features

1. **Advanced AI Awareness**: Integrated **OpenRouter (Gemini 2.0 Flash)** for instantaneous document intelligence.
   - Context-aware summaries with structured JSON output.
   - Sectional insights: Overview, Key Points, Important Details, and Takeaways.
   - Dynamic UI rendering based on AI confidence levels.
2. **Cinematic Document Viewer**: Fully integrated in-browser preview functionality.
   - Native High-DPI PDF preview engine (via `pdf.js`) with responsive controls.
   - Rich DOCX document viewer retaining structure.
   - Interactive CSV data tables and Code syntax highlighting.
3. **Fully Responsive Mobile Interface**: Optimized for all viewports from Desktop to Mobile.
   - Native-like bottom-sheet menus for profile and notifications.
   - Adaptive file explorer columns (Dynamic column hiding based on viewport width).
   - Touch-optimized interaction zones and high-performing mobile layouts.
4. **Deduplication Engine**: Backend chunk-level file deduplication mechanism.
   - Prevents identical files/chunks from wasting server storage capacity.
   - Visualizes "Space Saved" metric on the premium dashboard.
5. **Version Control**: Manage multiple file iterations and historical state restoration seamlessly.
6. **Modern Adaptive Theme**: "Claymorphism" Neo-Brutalism aesthetics that dynamically adapt to Light and Dark modes.
7. **Safe Console Filtering**: Suppressed third-party extension error noise for a focused developer experience.

---

## 🔒 Security & Authentication

- **Dual-Mode Secure Auth**: JWT-based session security supporting standard API streams and secure query-string payload streams (for direct file downloads).
- **Role-Based Management**: Enforced owner controls across all files and directories.
- **Storage Quota Enforcement**: Active calculation on user limits.

---

## 🧱 Architecture Overview

- **Frontend**: `React.js` (v19) via `Vite`. Managed via high-performance `Context API` and `lucide-react` iconography.
- **Backend**: `Node.js` and `Express`. Powered by OpenRouter for AI, and native chunk-hashing (SHA-256) for deduplication.
- **Database Model**: MongoDB with Reference-counting architectures.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- OpenRouter API Key (Set as `GEMINI_API_KEY` in `.env`)

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
   cp .env.example .env # Configure your OpenRouter key & Mongo URI
   npm run dev
   ```

---

## Goal

The goal of Smart Cloud File Manager is to provide an efficient, scalable, and secure cloud storage solution providing an enterprise-grade experience without abandoning visual beauty and intuitive workflows.

---

## License

© 2026 Smart Cloud File Manager. All Rights Reserved. Designed for the Future of File Management.

