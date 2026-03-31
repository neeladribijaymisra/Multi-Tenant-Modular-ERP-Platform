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
  - teacher alerts with email delivery
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

Mail alerts:

- Set `MAIL_ALERT_EMAIL` to the Gmail address that will send alerts
- Set `MAIL_ALERT_APP_PASSWORD` to the Gmail app password
- Optional: set `MAIL_ALERT_FROM_NAME` for the sender display name

Deployment note:

- `mongodb://127.0.0.1:27017/AYRAERP` works only on your own computer
- If you deploy the backend to Render, Railway, or another host, `localhost` will crash because that server cannot access your PC MongoDB
- For deployment, replace `MONGODB_URI` with a cloud MongoDB connection string such as MongoDB Atlas

## Example API paths

- `POST /api/cgu/auth/login`
- `GET /api/cgu/teacher/students`
- `POST /api/cgu/teacher/subjects`
- `GET /api/cgu/academic/curriculum-plans`
- `GET /api/cgu/communication/announcements`
