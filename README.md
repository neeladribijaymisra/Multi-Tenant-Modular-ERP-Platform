# ayra-erp

This workspace currently contains:

- `frontend_user`: AYRA ERP admin frontend built with React + Vite + MUI
- `backend_user`: AYRA ERP admin backend built with Express

## Local start

Backend:

```bash
cd backend_user
npm install
npm run dev
```

Frontend:

```bash
cd frontend_user
npm install
npm run dev
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api/health`

## Deployment

- Deploy `frontend_user` to Vercel
- Deploy `backend_user` to Render or Railway
- Set `VITE_API_BASE_URL` in the frontend deployment to your backend URL plus `/api`
