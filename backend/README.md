# AYRA ERP Backend

Backend scaffold for the AYRA ERP user portal.

## Main features

- MongoDB connection to `AYRAERP`
- Tenant-ready route shape using `cgu` for now
- Fixed academic office credentials: `academic` / `password`
- CRUD-ready collections for:
  - students
  - teacher subjects
  - class schedules
  - advisories
  - student progress
  - curriculum plans
  - timetables
  - approvals
  - academic records
  - announcements
  - campaigns
  - campus events
  - response tracking

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run `npm run seed`
4. Run `npm run dev`

## Example API paths

- `POST /api/cgu/auth/login`
- `GET /api/cgu/teacher/students`
- `POST /api/cgu/teacher/subjects`
- `GET /api/cgu/academic/curriculum-plans`
- `GET /api/cgu/communication/announcements`
