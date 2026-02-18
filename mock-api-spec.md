# Smart Cloud File Manager – Mock API Specification

**Coordination Document: Frontend (Manoharan) ↔ Backend (Mokesh)**

This document defines the expected request/response shapes for the Smart Cloud File Manager. All frontend components are currently built against this mock structure.

---

## 🔐 1. Authentication

### **POST** `/api/auth/login`
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Success Response (200 OK):**
```json
{
  "user": {
    "id": "user-123",
    "name": "Manoharan",
    "email": "mano@smartcloud.io",
    "role": "admin",
    "storageQuota": 10737418240,
    "storageUsed": 3221225472,
    "avatar": null
  },
  "token": "jwt-token-string"
}
```

---

## 📂 2. Files & Folders

### **GET** `/api/files?folderId=...`
Returns list of files and folders in a specific location.
**Success Response (200 OK):**
```json
{
  "folders": [
    { "id": "f1", "name": "Documents", "parentId": null, "ownerId": "u1", "createdAt": "...", "color": "#4285f4" }
  ],
  "files": [
    {
      "id": "file-1",
      "name": "Project.pdf",
      "type": "pdf",
      "size": 2457600,
      "parentId": "f1",
      "ownerId": "u1",
      "createdAt": "...",
      "modifiedAt": "...",
      "shared": false,
      "starred": true,
      "hash": "sha256-abc123",
      "chunkCount": 5
    }
  ]
}
```

### **POST** `/api/files/upload`
**Form Data:** `file: Blob`, `parentId: string`
**Success Response (201 Created):**
```json
{
  "message": "Upload complete",
  "deduplicated": true,
  "file": { ...fileObject }
}
```

### **DELETE** `/api/files/:id` (Move to Trash)
**Success Response (200 OK):**
```json
{ "message": "Moved to trash" }
```

---

## 📊 3. Analytics & Stats

### **GET** `/api/stats`
**Success Response (200 OK):**
```json
{
  "totalFiles": 120,
  "totalStorageUsed": 3221225472,
  "storageSaved": 1610612736,
  "duplicatesAvoided": 45,
  "storageBreakdown": {
    "documents": 500000000,
    "images": 1200000000,
    "videos": 1500000000,
    "other": 21225472
  }
}
```

---

## 🕓 4. Versioning

### **GET** `/api/files/:id/versions`
**Success Response (200 OK):**
```json
{
  "versions": [
    { "versionId": "v1", "date": "...", "size": 1024, "note": "Initial upload" },
    { "versionId": "v2", "date": "...", "size": 1050, "note": "Updated notes" }
  ]
}
```

### **POST** `/api/files/:id/restore/:versionId`
**Success Response (200 OK):**
```json
{ "message": "Version restored", "currentFile": { ... } }
```

---

## 🗑 5. Garbage Collection Coordination

### **DELETE** `/api/trash/empty`
Backend should trigger the `refCount` logic:
1. Decrement `refCount` for all chunks associated with files in trash.
2. If `refCount == 0`, delete the physical chunk from storage (MinIO/S3).
3. Clear metadata from MongoDB.
