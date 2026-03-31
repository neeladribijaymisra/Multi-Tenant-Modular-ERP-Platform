import cors from "cors";
import express from "express";

import academicRoutes from "./routes/academic.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import authRoutes from "./routes/auth.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AYRA ERP API" });
});

app.use("/api/:tenant/auth", authRoutes);
app.use("/api/:tenant/students", studentRoutes);
app.use("/api/:tenant/teacher", teacherRoutes);
app.use("/api/:tenant/academic", academicRoutes);
app.use("/api/:tenant/communication", communicationRoutes);
app.use("/api/:tenant/calendar", calendarRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
