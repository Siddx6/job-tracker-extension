# 💼 Job Application Tracker
A full-stack Chrome extension built to streamline the job search process by scraping job details and syncing them to a cloud database.

## 🚀 Features
- **One-Click Save**: Injects a floating "Save to Tracker" button on LinkedIn, Indeed, and more.
- **Live Sync**: Real-time synchronization with a Node.js/PostgreSQL backend.
- **Analytics**: Track application statuses and response rates via the popup dashboard.

## 🛠️ Tech Stack
- **Extension**: TypeScript, React, Chrome Extension API (Manifest v3).
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL (Hosted on Render).
- **Validation**: Zod for type-safe API requests.

## 📦 How to Test
1. Download the `dist.zip` from the latest Release.
2. Unzip the folder.
3. Open `chrome://extensions`, enable **Developer Mode**, and click **Load unpacked**.
