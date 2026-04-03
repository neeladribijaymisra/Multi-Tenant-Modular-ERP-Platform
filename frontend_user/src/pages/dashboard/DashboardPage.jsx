import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Slider, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AssignmentForm from "../../components/dashboard/AssignmentForm";
import AttendanceSection from "../../components/dashboard/AttendanceSection";
import CalendarSection from "../../components/dashboard/CalendarSection";
import ChatBot from "../../components/dashboard/ChatBot";
import DashboardCalendarWidget from "../../components/dashboard/DashboardCalendarWidget";
import DashboardHero from "../../components/dashboard/DashboardHero";
import PaymentNotice from "../../components/dashboard/PaymentNotice";
import ProgressOverviewSection from "../../components/dashboard/ProgressOverviewSection";
import ResourceSection from "../../components/dashboard/ResourceSection";
import StatCard from "../../components/dashboard/StatCard";
import UserProfileCard from "../../components/dashboard/UserProfileCard";
import { useAuth } from "../../context/AuthContext";
import { roleContent, roleOptions } from "../../data/erpData";
import { roleResourceConfig } from "../../data/portalConfig";
import AppShell from "../../layouts/AppShell";
import { createCollectionItem, deleteCollectionItem, getCollection, updateCollectionItem } from "../../services/api";

function getSearchableText(item) {
  return Object.values(item)
    .filter((value) => typeof value !== "object")
    .join(" ")
    .toLowerCase();
}

function matchesModule(section, activeModule) {
  if (section.hidden) {
    return false;
  }

  if (activeModule === "Dashboard") {
    return true;
  }

  if (activeModule === "Attendance") {
    return ["attendance"].includes(section.key);
  }

  if (activeModule === "Academics") {
    return [
      "profile",
      "teacherAssignments",
      "subjects",
      "classes",
      "progress",
      "students",
      "teachers",
      "studentRegistry",
      "curriculum",
      "timetables",
      "approvals",
      "records",
    ].includes(section.key);
  }

  if (activeModule === "Communication") {
    return ["advisories", "announcements", "campaigns", "events", "alerts", "responses"].includes(section.key);
  }

  if (activeModule === "Hostel") {
    return ["hostelRooms", "hostelAllocations"].includes(section.key);
  }

  if (activeModule === "Transport") {
    return ["transportRoutes", "transportAllocations"].includes(section.key);
  }

  if (activeModule === "Calendar") {
    return ["calendar", "events"].includes(section.key);
  }

  if (activeModule === "Alert") {
    return ["alerts"].includes(section.key);
  }

  if (activeModule === "Support") {
    return ["leaveRequests", "academicLeaveRequests", "supportContacts"].includes(section.key);
  }

  return true;
}

const dashboardSemesterOptions = ["2", "4", "6", "8"];
const dashboardSectionOptions = ["A", "B", "C"];

function getAvailableModules(sections, roleValue) {
  const orderedModules =
    roleValue === "teacher"
      ? ["Dashboard", "Academics", "Attendance", "Calendar", "Alert", "Support"]
      : roleValue === "communication"
        ? ["Dashboard", "Communication", "Calendar", "Alert", "Hostel", "Transport", "Support"]
      : ["Dashboard", "Academics", "Communication", "Calendar", "Alert", "Support"];
  return orderedModules.filter((moduleName) => {
    if (moduleName === "Dashboard") {
      return true;
    }

    return sections.some((section) => matchesModule(section, moduleName));
  });
}

function getTeacherAssignmentsForUser(session, allResources) {
  return (allResources.teacherAssignments || []).filter((item) => item.teacherUsername === session.username);
}

function filterItemsForSession(section, items, session, allResources) {
  if (session.role === "teacher") {
    const assignments = getTeacherAssignmentsForUser(session, allResources);
    const assignedSubjects = new Set(assignments.map((item) => item.subjectCode));
    const assignedCohorts = new Set(assignments.map((item) => `${item.department}-${item.semester}-${item.section}`));
    const assignedStudents = new Set(
      (allResources.students || [])
        .filter((student) => assignedCohorts.has(`${student.department}-${student.semester}-${student.section}`))
        .map((student) => student.studentId),
    );

    if (section.key === "teacherAssignments") {
      return assignments;
    }

    if (section.key === "students") {
      return items.filter((student) => assignedStudents.has(student.studentId));
    }

    if (section.key === "subjects" || section.key === "classes") {
      return items.filter((item) => assignedSubjects.has(item.subjectCode));
    }

    if (section.key === "progress") {
      return items.filter((item) => assignedStudents.has(item.studentId) && assignedSubjects.has(item.subjectCode));
    }

    if (section.key === "attendance") {
      return items.filter((item) => assignedStudents.has(item.studentId));
    }

    return items;
  }

  if (session.role !== "student") {
    return items;
  }

  if (section.key === "profile") {
    return items.filter((item) => item.username === session.username);
  }

  if (section.key === "subjects") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    return profile
      ? items.filter(
          (item) =>
            item.department === profile.department &&
            Number(item.semester) === Number(profile.semester),
        )
      : [];
  }

  if (section.key === "classes") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    if (!profile) {
      return [];
    }

    const visibleSubjectCodes = new Set(
      (allResources.subjects || [])
        .filter(
          (item) =>
            item.department === profile.department &&
            Number(item.semester) === Number(profile.semester),
        )
        .map((item) => item.subjectCode),
    );

    return items.filter(
      (item) =>
        item.department === profile.department &&
        Number(item.semester) === Number(profile.semester) &&
        String(item.section || "").toUpperCase() === String(profile.section || "").toUpperCase() &&
        visibleSubjectCodes.has(item.subjectCode),
    );
  }

  if (section.key === "progress" || section.key === "leaveRequests" || section.key === "attendance") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    return profile ? items.filter((item) => item.studentId === profile.studentId) : [];
  }

  if (section.key === "supportContacts") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    return profile
      ? items.filter(
          (item) =>
            Number(item.semester) === Number(profile.semester) &&
            String(item.section || "").toUpperCase() === String(profile.section || "").toUpperCase(),
        )
      : [];
  }

  return items;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImageMeta(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = dataUrl;
  });
}

function getBaseCropScale(imageMeta, frameSize = 320) {
  if (!imageMeta?.width || !imageMeta?.height) {
    return 1;
  }

  return Math.max(frameSize / imageMeta.width, frameSize / imageMeta.height);
}

function cropImageToDataUrl(dataUrl, imageMeta, cropSettings, frameSize = 320) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = frameSize;
      canvas.height = frameSize;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to prepare the cropped image."));
        return;
      }

      const baseScale = getBaseCropScale(imageMeta, frameSize);
      const drawWidth = image.naturalWidth * baseScale * cropSettings.zoom;
      const drawHeight = image.naturalHeight * baseScale * cropSettings.zoom;
      const offsetX = (frameSize - drawWidth) / 2 + cropSettings.offsetX;
      const offsetY = (frameSize - drawHeight) / 2 + cropSettings.offsetY;

      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, frameSize, frameSize);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };

    image.onerror = () => reject(new Error("Unable to crop the selected image."));
    image.src = dataUrl;
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tenant, role } = useParams();
  const { session, logout } = useAuth();
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [resources, setResources] = useState({});
  const [resourceErrors, setResourceErrors] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [activeSectionKey, setActiveSectionKey] = useState("");
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState("");
  const [pendingPhotoType, setPendingPhotoType] = useState("");
  const [pendingPhotoMeta, setPendingPhotoMeta] = useState(null);
  const [cropSettings, setCropSettings] = useState({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const safeSession = session || {
    username: "",
    displayName: "",
    role: role || "student",
    tenantSlug: tenant || "cgu",
    tenant: tenant || "cgu",
    avatarSeed: "",
    lastLogin: new Date().toISOString(),
  };

  const activeRole = roleOptions.find((item) => item.value === (role || safeSession.role)) || roleOptions[0];
  const content = roleContent[activeRole.value] || roleContent.student;
  const sections = roleResourceConfig[activeRole.value] || [];
  const availableModules = useMemo(() => getAvailableModules(sections, activeRole.value), [activeRole.value, sections]);

  const studentProfile = useMemo(
    () => (resources.profile || []).find((item) => item.username === safeSession.username),
    [resources.profile, safeSession.username],
  );

  const studentMetricLookup = useMemo(() => {
    const baseStudents = [...(resources.students || []), ...(resources.studentRegistry || []), ...(resources.profile || [])];
    const metrics = new Map();

    baseStudents.forEach((student) => {
      metrics.set(student.studentId, {
        cgpa: Number(student.cgpa || 0),
        sgpa: Number(student.sgpa || 0),
        attendancePercentage: 0,
        averageMarks: 0,
      });
    });

    const progressByStudent = (resources.progress || []).reduce((accumulator, item) => {
      if (!accumulator[item.studentId]) {
        accumulator[item.studentId] = [];
      }

      accumulator[item.studentId].push(Number(item.marks || 0));
      return accumulator;
    }, {});

    Object.entries(progressByStudent).forEach(([studentId, marks]) => {
      const current = metrics.get(studentId) || {};
      metrics.set(studentId, {
        ...current,
        averageMarks: marks.length ? marks.reduce((sum, value) => sum + value, 0) / marks.length : 0,
      });
    });

    const attendanceByStudent = (resources.attendance || []).reduce((accumulator, item) => {
      if (!accumulator[item.studentId]) {
        accumulator[item.studentId] = { present: 0, working: 0 };
      }

      if (item.status !== "holiday") {
        accumulator[item.studentId].working += 1;
      }

      if (item.status === "present") {
        accumulator[item.studentId].present += 1;
      }

      return accumulator;
    }, {});

    Object.entries(attendanceByStudent).forEach(([studentId, values]) => {
      const current = metrics.get(studentId) || {};
      metrics.set(studentId, {
        ...current,
        attendancePercentage: values.working ? (values.present / values.working) * 100 : 0,
      });
    });

    return metrics;
  }, [resources.attendance, resources.profile, resources.progress, resources.studentRegistry, resources.students]);

  const highlightStats = useMemo(() => {
    return content.highlights.map((item, index) => {
      const sectionItemCount = sections[index] ? (resources[sections[index].key] || []).length : null;

      return {
        ...item,
        value: sectionItemCount !== null ? sectionItemCount.toString().padStart(2, "0") : item.value,
      };
    });
  }, [content.highlights, resources, sections]);

  const semesterOptions = useMemo(() => {
    if (activeRole.value === "student" && studentProfile?.semester) {
      return [String(studentProfile.semester)];
    }

    const values = new Set(dashboardSemesterOptions);

    Object.values(resources).forEach((items) => {
      (items || []).forEach((item) => {
        if (item?.semester) {
          values.add(String(item.semester));
        }
      });
    });

    return [...values].sort((left, right) => Number(left) - Number(right));
  }, [activeRole.value, resources, studentProfile?.semester]);

  const sectionOptions = useMemo(() => {
    if (activeRole.value === "student" && studentProfile?.section) {
      return [String(studentProfile.section).toUpperCase()];
    }

    const values = new Set(dashboardSectionOptions);

    Object.values(resources).forEach((items) => {
      (items || []).forEach((item) => {
        if (item?.section) {
          values.add(String(item.section).toUpperCase());
        }
      });
    });

    return [...values].sort();
  }, [activeRole.value, resources, studentProfile?.section]);

  const assignmentClassOptions = useMemo(() => {
    const classItems = filterItemsForSession(
      { key: "classes" },
      resources.classes || [],
      safeSession,
      resources,
    );

    const map = new Map();
    classItems.forEach((item) => {
      if (item?._id && !map.has(item._id)) {
        map.set(item._id, item);
      }
    });

    return [...map.values()];
  }, [resources, safeSession]);

  const assignmentStudentOptions = useMemo(() => {
    const studentItems = filterItemsForSession(
      { key: "students" },
      resources.students || [],
      safeSession,
      resources,
    );

    const map = new Map();
    studentItems.forEach((item) => {
      if (item?._id && !map.has(item._id)) {
        map.set(item._id, item);
      }
    });

    return [...map.values()];
  }, [resources, safeSession]);

  const getSortOptions = (sectionKey, sectionItems = []) => {
    const defaultOptions = [{ key: "default", label: "Default" }];
    const hasSemesterData = sectionItems.some(
      (item) => item?.semester !== undefined && item?.semester !== null && item?.semester !== "",
    );

    switch (sectionKey) {
      case "students":
      case "studentRegistry":
      case "communicationStudents":
      case "profile":
        return [
          ...defaultOptions,
          { key: "name", label: "Name" },
          { key: "cgpa", label: "CGPA" },
          ...(hasSemesterData
            ? [
                { key: "semester-asc", label: "Semester Asc" },
                { key: "semester-desc", label: "Semester Desc" },
              ]
            : []),
        ];
      case "teachers":
        return [
          ...defaultOptions,
          { key: "name", label: "Name" },
          { key: "department", label: "Department" },
        ];
      case "classes":
        return [
          ...defaultOptions,
          { key: "day", label: "Day" },
          { key: "startTime", label: "Start Time" },
          { key: "subject", label: "Subject" },
          ...(hasSemesterData
            ? [
                { key: "semester-asc", label: "Semester Asc" },
                { key: "semester-desc", label: "Semester Desc" },
              ]
            : []),
        ];
      case "progress":
        return [
          ...defaultOptions,
          { key: "marks", label: "Marks" },
          { key: "grade", label: "Grade" },
          { key: "subject", label: "Subject" },
        ];
      case "attendance":
        return [
          ...defaultOptions,
          { key: "date", label: "Date" },
          { key: "status", label: "Status" },
        ];
      case "assignments":
        return [
          ...defaultOptions,
          { key: "dueDate", label: "Due Date" },
          { key: "title", label: "Title" },
        ];
      case "hostelRooms":
      case "hostelAllocations":
        return [
          ...defaultOptions,
          { key: "boys-hostel", label: "Boys Hostel" },
          { key: "girls-hostel", label: "Girls Hostel" },
        ];
      default:
        return defaultOptions;
    }
  };

  useEffect(() => {
    if (!availableModules.includes(activeModule)) {
      setActiveModule("Dashboard");
    }
  }, [activeModule, availableModules]);

  useEffect(() => {
    if (activeRole.value === "student" && studentProfile?.semester && studentProfile?.section) {
      setSemesterFilter(String(studentProfile.semester));
      setSectionFilter(String(studentProfile.section).toUpperCase());
      setSortBy("default");
    }
  }, [activeRole.value, studentProfile?.section, studentProfile?.semester]);

  useEffect(() => {
    async function loadAllSections() {
      setGlobalError("");

      await Promise.all(
        sections.map(async (section) => {
          await fetchSection(section);
        }),
      );
    }

    loadAllSections();
  }, [tenant, role]);

  useEffect(() => {
    const visible = sections.filter((section) => matchesModule(section, activeModule));

    if (!visible.length) {
      setActiveSectionKey("");
      setSelectedSectionKey("");
      return;
    }

    setActiveSectionKey((current) => (visible.some((section) => section.key === current) ? current : visible[0].key));
    setSelectedSectionKey((current) =>
      visible.some((section) => section.key === current) ? current : visible[0].key,
    );
  }, [activeModule, sections]);

  async function fetchSection(section) {
    setLoadingMap((current) => ({ ...current, [section.key]: true }));
    setResourceErrors((current) => ({ ...current, [section.key]: "" }));

    try {
      const endpoint =
        activeRole.value === "student" && section.key === "alerts"
          ? `${section.endpoint}?username=${encodeURIComponent(safeSession.username)}`
          : section.endpoint;
      const data = await getCollection(tenant || safeSession.tenantSlug || "cgu", endpoint);
      setResources((current) => ({ ...current, [section.key]: Array.isArray(data) ? data : [] }));
    } catch (error) {
      setResourceErrors((current) => ({ ...current, [section.key]: error.message }));
      setGlobalError(error.message);
    } finally {
      setLoadingMap((current) => ({ ...current, [section.key]: false }));
    }
  }

  async function handleCreate(section, payload) {
    let nextPayload = payload;

    if (section.key === "progress" && typeof payload.teamMembers === "string") {
      nextPayload = {
        ...nextPayload,
        teamMembers: payload.teamMembers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (section.key === "transportRoutes" && typeof payload.pickupPoints === "string") {
      nextPayload = {
        ...nextPayload,
        pickupPoints: payload.pickupPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (activeRole.value === "student" && section.key === "leaveRequests" && studentProfile) {
      nextPayload = {
        ...nextPayload,
        studentName: studentProfile.fullName,
        studentId: studentProfile.studentId,
      };
    }

    if (activeRole.value === "teacher" && section.key === "students") {
      nextPayload = {
        ...nextPayload,
        username: payload.studentId,
        password: payload.password || "password",
      };
    }

    const result = await createCollectionItem(
      tenant || safeSession.tenantSlug || "cgu",
      section.endpoint,
      nextPayload,
    );
    await fetchSection(section);
    return result;
  }

  async function handleCreateAssignment(formData) {
    try {
      await createCollectionItem(tenant || safeSession.tenantSlug || "cgu", "assignments", {
        ...formData,
        teacherId: safeSession.username,
        teacherName: safeSession.displayName,
      });
      setAssignmentDialogOpen(false);
      // Refresh assignments if needed
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  }

  async function handleUpdate(section, id, payload) {
    let nextPayload = payload;

    if (section.key === "progress" && typeof payload.teamMembers === "string") {
      nextPayload = {
        ...nextPayload,
        teamMembers: payload.teamMembers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (section.key === "transportRoutes" && typeof payload.pickupPoints === "string") {
      nextPayload = {
        ...nextPayload,
        pickupPoints: payload.pickupPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (activeRole.value === "teacher" && section.key === "students") {
      nextPayload = {
        ...nextPayload,
        username: nextPayload.studentId || nextPayload.username,
        password: nextPayload.password || "password",
      };
    }

    const result = await updateCollectionItem(
      tenant || safeSession.tenantSlug || "cgu",
      section.endpoint,
      id,
      nextPayload,
    );
    await fetchSection(section);
    return result;
  }

  async function handleDelete(section, id) {
    await deleteCollectionItem(tenant || safeSession.tenantSlug || "cgu", section.endpoint, id);
    await fetchSection(section);
  }

  async function handleStudentPhotoUpdate(nextPhoto, mimeType = "image/jpeg") {
    if (!studentProfile?._id) {
      return;
    }

    setPhotoUpdating(true);
    setGlobalError("");

    try {
      await updateCollectionItem(tenant || safeSession.tenantSlug || "cgu", "/students", studentProfile._id, {
        photoDataUrl: nextPhoto,
        photoMimeType: nextPhoto ? mimeType : "",
        photoUpdatedAt: nextPhoto ? new Date().toISOString() : null,
      });

      const profileSection = sections.find((section) => section.key === "profile");
      if (profileSection) {
        await fetchSection(profileSection);
      }
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setPhotoUpdating(false);
    }
  }

  async function handlePhotoSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024 * 1.5) {
      setGlobalError("Please upload an image smaller than 1.5 MB.");
      return;
    }

    try {
      const photoDataUrl = await fileToDataUrl(file);
      const imageMeta = await loadImageMeta(photoDataUrl);
      setPendingPhoto(photoDataUrl);
      setPendingPhotoType(file.type || "image/jpeg");
      setPendingPhotoMeta(imageMeta);
      setCropSettings({
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
      setCropDialogOpen(true);
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  async function handlePhotoRemove() {
    await handleStudentPhotoUpdate("");
  }

  function closeCropDialog() {
    setCropDialogOpen(false);
    setPendingPhoto("");
    setPendingPhotoType("");
    setPendingPhotoMeta(null);
    setCropSettings({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  async function handleCropSave() {
    if (!pendingPhoto || !pendingPhotoMeta) {
      return;
    }

    try {
      setPhotoUpdating(true);
      const croppedPhoto = await cropImageToDataUrl(pendingPhoto, pendingPhotoMeta, cropSettings);
      closeCropDialog();
      await handleStudentPhotoUpdate(croppedPhoto, pendingPhotoType || "image/jpeg");
    } catch (error) {
      setGlobalError(error.message);
      setPhotoUpdating(false);
    }
  }

  function handleLogout() {
    logout();
    navigate(`/${tenant || "cgu"}/login`, { replace: true });
  }

  function handleAction(actionLabel) {
    const normalized = actionLabel.toLowerCase();

    if (normalized.includes("assignment")) {
      setAssignmentDialogOpen(true);
      return;
    }

    const actionTargets = [
      { keywords: ["student"], sectionKey: "students" },
      { keywords: ["class"], sectionKey: "classes" },
      { keywords: ["subject"], sectionKey: "subjects" },
      { keywords: ["teacher"], sectionKey: "teachers" },
      { keywords: ["alert", "event", "exam"], sectionKey: "alerts" },
      { keywords: ["leave"], sectionKey: "leaveRequests" },
      { keywords: ["approval"], sectionKey: "approvals" },
    ];

    const matchedTarget = actionTargets.find((target) =>
      target.keywords.some((keyword) => normalized.includes(keyword)),
    );

    const matchedSection = matchedTarget
      ? sections.find((section) => section.key === matchedTarget.sectionKey)
      : sections.find((section) => normalized.includes(section.title.split(" ")[0].toLowerCase()));

    if (matchedSection) {
      if (matchedSection.key === "alerts") {
        setActiveModule("Alert");
      } else if (matchedSection.key === "calendar" || matchedSection.key === "events") {
        setActiveModule("Calendar");
      } else if (matchedSection.key === "attendance") {
        setActiveModule("Attendance");
      } else if (matchedSection.key === "leaveRequests" || matchedSection.key === "academicLeaveRequests") {
        setActiveModule("Support");
      } else {
        setActiveModule("Academics");
      }

      setActiveSectionKey(matchedSection.key);
      setSelectedSectionKey(matchedSection.key);
      return;
    }
  }

  function applySemesterSectionFilter(section, items) {
    if (activeRole.value === "student" && ["progress", "alerts"].includes(section.key)) {
      return items;
    }

    const studentLookup = new Map(
      (resources.students || resources.studentRegistry || resources.profile || []).map((item) => [item.studentId, item]),
    );

    return items.filter((item) => {
      if (section.key === "hostelRooms" && sortBy === "boys-hostel") {
        return String(item.hostelCategory || "").toLowerCase() === "boys";
      }

      if (section.key === "hostelRooms" && sortBy === "girls-hostel") {
        return String(item.hostelCategory || "").toLowerCase() === "girls";
      }

      const derivedSemester = item.semester ?? studentLookup.get(item.studentId)?.semester ?? null;
      const derivedSection = item.section ?? studentLookup.get(item.studentId)?.section ?? null;

      if (derivedSemester === null && !derivedSection) {
        return true;
      }

      if (derivedSemester !== null && semesterFilter !== "all" && String(derivedSemester) !== semesterFilter) {
        return false;
      }

      if (derivedSection && sectionFilter !== "all" && String(derivedSection || "").toUpperCase() !== sectionFilter) {
        return false;
      }

      return true;
    });
  }

  function sortItemsForSection(section, items) {
    return [...items].sort((left, right) => {
      if (activeRole.value === "academic" && ["ascending", "descending"].includes(sortBy)) {
        const leftValue = String(
          left.fullName || left.studentName || left.subjectName || left.title || left.eventName || left.referenceNo || "",
        );
        const rightValue = String(
          right.fullName || right.studentName || right.subjectName || right.title || right.eventName || right.referenceNo || "",
        );
        const comparison = leftValue.localeCompare(rightValue);

        if (comparison !== 0) {
          return sortBy === "ascending" ? comparison : -comparison;
        }
      }

      if (section.key === "classes") {
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const leftDayIndex = dayOrder.indexOf(left.day);
        const rightDayIndex = dayOrder.indexOf(right.day);
        if ((sortBy === "default" || sortBy === "day") && leftDayIndex !== rightDayIndex) {
          return leftDayIndex - rightDayIndex;
        }

        if (sortBy === "default" || sortBy === "startTime" || sortBy === "day") {
          const timeDelta = String(left.startTime || "").localeCompare(String(right.startTime || ""));
          if (timeDelta !== 0) {
            return timeDelta;
          }
        }
      }

      if (section.key === "subjects") {
        const leftKindRank = left.kind === "Theory" ? 0 : 1;
        const rightKindRank = right.kind === "Theory" ? 0 : 1;
        if (leftKindRank !== rightKindRank) {
          return leftKindRank - rightKindRank;
        }
      }

      if (sortBy !== "default" && !["boys-hostel", "girls-hostel"].includes(sortBy)) {
        if (sortBy === "name") {
          return String(left.fullName || left.studentName || left.title || "")
            .localeCompare(String(right.fullName || right.studentName || right.title || ""));
        }

        if (sortBy === "department") {
          const departmentDelta = String(left.department || "").localeCompare(String(right.department || ""));
          if (departmentDelta !== 0) {
            return departmentDelta;
          }
        }

        if (sortBy === "subject") {
          const subjectDelta = String(left.subjectName || left.className || left.subjectCode || "")
            .localeCompare(String(right.subjectName || right.className || right.subjectCode || ""));
          if (subjectDelta !== 0) {
            return subjectDelta;
          }
        }

        if (sortBy === "date" || sortBy === "dueDate") {
          const dateDelta = String(left.date || left.dueDate || "").localeCompare(String(right.date || right.dueDate || ""));
          if (dateDelta !== 0) {
            return dateDelta;
          }
        }

        if (sortBy === "title") {
          const titleDelta = String(left.title || left.eventName || "").localeCompare(String(right.title || right.eventName || ""));
          if (titleDelta !== 0) {
            return titleDelta;
          }
        }

        if (sortBy === "status") {
          const statusDelta = String(left.status || left.deliveryStatus || "").localeCompare(String(right.status || right.deliveryStatus || ""));
          if (statusDelta !== 0) {
            return statusDelta;
          }
        }

        if (sortBy === "semester-asc") {
          const semesterDelta = Number(left.semester || 0) - Number(right.semester || 0);
          if (semesterDelta !== 0) {
            return semesterDelta;
          }
        }

        if (sortBy === "semester-desc") {
          const semesterDelta = Number(right.semester || 0) - Number(left.semester || 0);
          if (semesterDelta !== 0) {
            return semesterDelta;
          }
        }

        const getMetric = (item, metric) => {
          const studentId = item.studentId;
          const metrics = studentMetricLookup.get(studentId) || {};

          if (metric === "marks") {
            return Number(item.marks ?? metrics.averageMarks ?? 0);
          }

          if (metric === "attendance") {
            return Number(item.attendance ?? metrics.attendancePercentage ?? 0);
          }

          if (metric === "cgpa") {
            return Number(item.cgpa ?? metrics.cgpa ?? 0);
          }

          return 0;
        };

        const metricDelta = getMetric(right, sortBy) - getMetric(left, sortBy);
        if (metricDelta !== 0) {
          return metricDelta;
        }
      }

      const semesterDelta = Number(left.semester || 0) - Number(right.semester || 0);
      if (semesterDelta !== 0) {
        return semesterDelta;
      }

      const sectionDelta = String(left.section || "").localeCompare(String(right.section || ""));
      if (sectionDelta !== 0) {
        return sectionDelta;
      }

      return String(left.fullName || left.studentName || left.subjectName || left.eventName || "")
        .localeCompare(String(right.fullName || right.studentName || right.subjectName || right.eventName || ""));
    });
  }

  const filteredSections = useMemo(() => {
    const moduleSections = sections.filter((section) => !section.hidden && matchesModule(section, activeModule));

    if (!searchValue.trim()) {
      return moduleSections;
    }

    const needle = searchValue.trim().toLowerCase();

    return moduleSections.filter((section) => {
      const items = applySemesterSectionFilter(
        section,
        filterItemsForSession(
        section,
        resources[section.key] || [],
        safeSession,
        resources,
        ),
      );

      return (
        section.title.toLowerCase().includes(needle) ||
        section.description.toLowerCase().includes(needle) ||
        items.some((item) => getSearchableText(item).includes(needle))
      );
    });
  }, [activeModule, resources, searchValue, sections, semesterFilter, sectionFilter, safeSession]);

  useEffect(() => {
    if (!filteredSections.length) {
      setSelectedSectionKey("");
      return;
    }

    setSelectedSectionKey((current) =>
      filteredSections.some((section) => section.key === current) ? current : filteredSections[0].key,
    );
  }, [filteredSections]);

  const selectedSection =
    filteredSections.find((section) => section.key === selectedSectionKey) || filteredSections[0] || null;

  const dashboardCalendarItems = useMemo(() => {
    if (resources.calendar?.length) {
      return resources.calendar;
    }

    if (resources.events?.length) {
      return resources.events;
    }

    return [];
  }, [resources.calendar, resources.events]);

  const cropPreviewStyle = useMemo(() => {
    if (!pendingPhotoMeta) {
      return {};
    }

    const frameSize = 320;
    const baseScale = getBaseCropScale(pendingPhotoMeta, frameSize);
    const scaledWidth = pendingPhotoMeta.width * baseScale * cropSettings.zoom;
    const scaledHeight = pendingPhotoMeta.height * baseScale * cropSettings.zoom;

    return {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      transform: `translate(${cropSettings.offsetX}px, ${cropSettings.offsetY}px)`,
    };
  }, [cropSettings, pendingPhotoMeta]);

  function getSectionWithDefaults(section) {
    if (activeRole.value === "teacher" && section.key === "students") {
      return {
        ...section,
        defaultValues: {
          ...section.defaultValues,
          password: "password",
        },
        fields: section.fields.map((field) =>
          field.name === "username"
            ? { ...field, disabled: true }
            : field,
        ),
      };
    }

    if (activeRole.value === "academic" && section.key === "teacherAssignments") {
      const teacherOptions = (resources.teachers || []).map((item) => item.username);
      const teacherNameOptions = (resources.teachers || []).map((item) => item.displayName);
      const subjectCodeOptions = [...new Set((resources.timetables || []).map((item) => item.subjectCode).filter(Boolean))];
      const subjectNameOptions = [...new Set((resources.timetables || []).map((item) => item.subjectName).filter(Boolean))];

      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.name === "teacherUsername") {
            return { ...field, options: teacherOptions };
          }

          if (field.name === "teacherName") {
            return { ...field, options: teacherNameOptions };
          }

          if (field.name === "subjectCode") {
            return { ...field, options: subjectCodeOptions };
          }

          if (field.name === "subjectName") {
            return { ...field, options: subjectNameOptions };
          }

          return field;
        }),
      };
    }

    if (activeRole.value === "student" && section.key === "leaveRequests" && studentProfile) {
      return {
        ...section,
        defaultValues: {
          ...section.defaultValues,
          studentName: studentProfile.fullName,
          studentId: studentProfile.studentId,
        },
        fields: section.fields.map((field) =>
          field.name === "studentName" || field.name === "studentId"
            ? { ...field, disabled: true }
            : field,
        ),
      };
    }

    if ((activeRole.value === "teacher" || activeRole.value === "academic" || activeRole.value === "communication") && section.key === "alerts") {
      const studentPool = resources.students || resources.studentRegistry || resources.communicationStudents || [];
      const emailOptions = [...new Set(studentPool.map((item) => item.email).filter(Boolean))].sort();
      const departmentOptions = [...new Set(studentPool.map((item) => item.department).filter(Boolean))].sort();

      return {
        ...section,
        defaultValues: {
          ...section.defaultValues,
          teacherName: safeSession.displayName || safeSession.username,
        },
        fields: section.fields.map((field) =>
          field.name === "audienceValue"
            ? {
                ...field,
                optionGroups: {
                  department: departmentOptions,
                  semester: semesterOptions,
                  section: sectionOptions,
                  "specific-emails": emailOptions,
                },
              }
            : field,
        ),
      };
    }

    if (activeRole.value === "communication" && section.key === "hostelAllocations") {
      const studentOptions = (resources.communicationStudents || [])
        .map((item) => `${item.studentId} | ${item.fullName} | Sem ${item.semester} | Sec ${item.section}`)
        .sort();
      const roomOptions = (resources.hostelRooms || [])
        .filter((item) => Number(item.availableBeds || 0) > 0)
        .map(
          (item) =>
            `${item.roomCode} | ${item.hostelName} | Floor ${item.floorNumber} | Room ${item.roomNumber} | ${item.roomType} | Beds ${item.availableBeds}`,
        )
        .sort();

      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.name === "studentId") {
            return { ...field, options: studentOptions };
          }

          if (field.name === "roomCode") {
            return { ...field, options: roomOptions };
          }

          return field;
        }),
      };
    }

    if (activeRole.value === "communication" && section.key === "transportAllocations") {
      const studentOptions = (resources.communicationStudents || [])
        .map((item) => `${item.studentId} | ${item.fullName} | Sem ${item.semester} | Sec ${item.section}`)
        .sort();
      const routeOptions = (resources.transportRoutes || [])
        .filter((item) => Number(item.availableSeats || 0) > 0)
        .map(
          (item) =>
            `${item.routeCode} | ${item.busNumber} | ${item.city} | ${item.routeName} | Seats ${item.availableSeats}`,
        )
        .sort();
      const pickupOptions = [...new Set((resources.transportRoutes || []).flatMap((item) => item.pickupPoints || []))].sort();

      return {
        ...section,
        fields: section.fields.map((field) => {
          if (field.name === "studentId") {
            return { ...field, options: studentOptions };
          }

          if (field.name === "routeCode") {
            return { ...field, options: routeOptions };
          }

          if (field.name === "pickupPoint") {
            return { ...field, options: pickupOptions };
          }

          return field;
        }),
      };
    }

    return section;
  }

  function renderSection(section) {
    const baseVisibleItems = sortItemsForSection(
      section,
      applySemesterSectionFilter(
        section,
        filterItemsForSession(section, resources[section.key] || [], safeSession, resources),
      ),
    );
    const progressLookup = new Map(
      (resources.progress || [])
        .filter((item) => item.studentId === studentProfile?.studentId)
        .map((item) => [`${item.semester}-${item.subjectCode}`, item]),
    );
    const visibleItems =
      activeRole.value === "student" && section.key === "subjects"
        ? baseVisibleItems.map((item) => {
            const progressItem = progressLookup.get(`${item.semester}-${item.subjectCode}`);
            return {
              ...item,
              attendancePercentage: progressItem ? `${progressItem.attendance}%` : "-",
            };
          })
        : activeRole.value === "student" && section.key === "classes"
          ? baseVisibleItems.map((item) => ({
              ...item,
              subjectName: item.subjectName || item.className?.replace(/\s+(Theory|Lab)$/i, "") || item.className,
            }))
          : baseVisibleItems;
    const hydratedSection = getSectionWithDefaults(section);

    const visibleStudents = sortItemsForSection(
      section,
      applySemesterSectionFilter(
        section,
        filterItemsForSession(
          { key: activeRole.value === "academic" ? "studentRegistry" : activeRole.value === "student" ? "profile" : "students" },
          resources[activeRole.value === "academic" ? "studentRegistry" : activeRole.value === "student" ? "profile" : "students"] || [],
          safeSession,
          resources,
        ),
      ),
    );

    if (section.key === "calendar" || section.key === "events") {
      return (
        <CalendarSection
          key={section.key}
          section={hydratedSection}
          items={visibleItems}
          loading={Boolean(loadingMap[section.key])}
          error={resourceErrors[section.key]}
          active={activeSectionKey === section.key}
          onRefresh={fetchSection}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      );
    }

    if (section.key === "attendance") {
      return (
        <AttendanceSection
          key={section.key}
          section={hydratedSection}
          items={visibleItems}
          students={visibleStudents}
          session={safeSession}
          loading={Boolean(loadingMap[section.key])}
          error={resourceErrors[section.key]}
          active={activeSectionKey === section.key}
          onRefresh={fetchSection}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canEdit={activeRole.value === "teacher"}
        />
      );
    }

    if (activeRole.value === "student" && section.key === "progress") {
      return (
        <ProgressOverviewSection
          key={section.key}
          section={hydratedSection}
          items={visibleItems}
          attendanceItems={resources.attendance || []}
          studentProfile={studentProfile}
          active={activeSectionKey === section.key}
        />
      );
    }

    return (
      <ResourceSection
        key={section.key}
        section={hydratedSection}
        items={visibleItems}
        session={safeSession}
        allResources={resources}
        progressSection={sections.find((item) => item.key === "progress") || null}
        loading={Boolean(loadingMap[section.key])}
        error={resourceErrors[section.key]}
        onRefresh={fetchSection}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        active={activeSectionKey === section.key}
      />
    );
  }

  return (
    <AppShell
      roleLabel={activeRole.label}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      modules={availableModules}
      tenant={(tenant || safeSession.tenantSlug || "cgu").toUpperCase()}
      username={safeSession.displayName || safeSession.username}
      avatarSeed={safeSession.avatarSeed}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onLogout={handleLogout}
    >
      {activeModule === "Dashboard" ? (
        <UserProfileCard
          session={safeSession}
          studentProfile={studentProfile}
          onPhotoSelect={handlePhotoSelect}
          onRemovePhoto={handlePhotoRemove}
          photoUpdating={photoUpdating}
        />
      ) : null}

      {activeModule === "Dashboard" ? (
        <div className="animate-dashboard-in">
          <DashboardHero
            roleLabel={activeRole.label}
            welcome={content.welcome}
            modules={content.modules}
            actions={content.actions}
            onAction={handleAction}
          />
        </div>
      ) : null}

      {activeModule === "Dashboard" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlightStats.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} />
          ))}
        </section>
      ) : null}

      {activeModule === "Dashboard" ? (
        <DashboardCalendarWidget
          items={dashboardCalendarItems}
          title={activeRole.value === "communication" ? "Published Event Calendar" : "Academic Event Calendar"}
        />
      ) : null}

      {globalError ? <Alert severity="warning">{globalError}</Alert> : null}

      {filteredSections.length && activeModule !== "Calendar" ? (
        <section className="animate-panel-float rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Choose workspace section
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Pick the current domain action and view the connected database resource.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:items-center">
              <TextField
                select
                value={selectedSectionKey}
                onChange={(event) => setSelectedSectionKey(event.target.value)}
                label="Choose section"
                size="small"
                sx={{ minWidth: { xs: 180, lg: 190 } }}
              >
                {filteredSections.map((section) => (
                  <MenuItem key={section.key} value={section.key}>
                    {section.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                label="Sort by"
                size="small"
                sx={{ minWidth: { xs: 150, lg: 155 } }}
              >
                {getSortOptions(selectedSectionKey, resources[selectedSectionKey] || []).map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              {activeRole.value === "student" ? (
                <Button variant="contained" onClick={() => setActiveModule("Attendance")}>
                  Open Attendance Sheet
                </Button>
              ) : null}
              <Button variant="outlined" onClick={() => Promise.all(sections.map((section) => fetchSection(section)))}>
                Refresh
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {selectedSection ? renderSection(selectedSection) : null}

      {activeRole.value === "student" ? <PaymentNotice /> : null}

      <Dialog open={cropDialogOpen} onClose={closeCropDialog} fullWidth maxWidth="md">
        <DialogTitle>Crop Profile Photo</DialogTitle>
        <DialogContent>
          <div className="pt-3">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex-1">
                <div className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-inner">
                  {pendingPhoto ? (
                    <img
                      src={pendingPhoto}
                      alt="Crop preview"
                      className="max-w-none select-none object-cover"
                      style={cropPreviewStyle}
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
                    <div className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
                    <div className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
                    <div className="absolute inset-3 rounded-[18px] border border-white/80" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Adjust the image inside the grid frame. The cropped version and its metadata will be saved to MongoDB.
                </p>
              </div>

              <div className="w-full max-w-[320px] space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Zoom</p>
                  <Slider
                    min={1}
                    max={2.8}
                    step={0.05}
                    value={cropSettings.zoom}
                    onChange={(_event, value) =>
                      setCropSettings((current) => ({ ...current, zoom: Number(value) }))
                    }
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Horizontal Position</p>
                  <Slider
                    min={-160}
                    max={160}
                    step={2}
                    value={cropSettings.offsetX}
                    onChange={(_event, value) =>
                      setCropSettings((current) => ({ ...current, offsetX: Number(value) }))
                    }
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Vertical Position</p>
                  <Slider
                    min={-160}
                    max={160}
                    step={2}
                    value={cropSettings.offsetY}
                    onChange={(_event, value) =>
                      setCropSettings((current) => ({ ...current, offsetY: Number(value) }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeCropDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCropSave} disabled={photoUpdating}>
            {photoUpdating ? "Saving..." : "Crop and Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <AssignmentForm
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        onSubmit={handleCreateAssignment}
        classes={assignmentClassOptions}
        students={assignmentStudentOptions}
      />
      <ChatBot tenantSlug={tenant} />
    </AppShell>
  );
}
