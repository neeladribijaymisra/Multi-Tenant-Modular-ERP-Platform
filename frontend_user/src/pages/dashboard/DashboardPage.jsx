import { Alert, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CalendarSection from "../../components/dashboard/CalendarSection";
import DashboardHero from "../../components/dashboard/DashboardHero";
import PaymentNotice from "../../components/dashboard/PaymentNotice";
import ResourceSection from "../../components/dashboard/ResourceSection";
import StatCard from "../../components/dashboard/StatCard";
import UserProfileCard from "../../components/dashboard/UserProfileCard";
import { useAuth } from "../../context/AuthContext";
import { roleContent, roleOptions } from "../../data/erpData";
import { roleResourceConfig } from "../../data/portalConfig";
import AppShell from "../../layouts/AppShell";
import {
  createCollectionItem,
  deleteCollectionItem,
  getCollection,
  updateCollectionItem,
} from "../../services/api";

const moduleSectionMap = {
  student: {
    Dashboard: [],
    Academics: ["profile", "subjects", "classes", "progress"],
    Communication: ["advisories"],
    Calendar: ["calendar"],
    Support: ["leaveRequests"],
  },
  teacher: {
    Dashboard: [],
    Academics: ["students", "subjects", "classes", "progress"],
    Communication: ["advisories"],
    Calendar: ["calendar"],
    Alert: ["alerts"],
    Support: ["leaveRequests"],
  },
  academic: {
    Dashboard: [],
    Academics: ["teachers", "studentRegistry", "curriculum", "timetables", "approvals", "records"],
    Communication: [],
    Calendar: ["calendar"],
    Alert: ["alerts"],
    Support: ["academicLeaveRequests"],
  },
  communication: {
    Dashboard: [],
    Academics: [],
    Communication: ["announcements", "campaigns", "events", "responses"],
    Calendar: ["events"],
    Support: [],
  },
};

const sectionModuleLookup = {
  profile: "Academics",
  subjects: "Academics",
  classes: "Academics",
  progress: "Academics",
  students: "Academics",
  teachers: "Academics",
  studentRegistry: "Academics",
  curriculum: "Academics",
  timetables: "Academics",
  approvals: "Academics",
  records: "Academics",
  advisories: "Communication",
  announcements: "Communication",
  campaigns: "Communication",
  responses: "Communication",
  calendar: "Calendar",
  events: "Calendar",
  alerts: "Alert",
  leaveRequests: "Support",
  academicLeaveRequests: "Support",
};

function getSearchableText(item) {
  return Object.values(item)
    .filter((value) => typeof value !== "object")
    .join(" ")
    .toLowerCase();
}

function getModuleSections(role, activeModule) {
  return moduleSectionMap[role]?.[activeModule] || [];
}

function filterItemsForSession(section, items, session, allResources) {
  if (session.role !== "student") {
    return items;
  }

  if (section.key === "profile") {
    return items.filter((item) => item.username === session.username);
  }

  if (section.key === "progress") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    return profile ? items.filter((item) => item.studentId === profile.studentId) : [];
  }

  if (section.key === "leaveRequests") {
    const profile = (allResources.profile || []).find((item) => item.username === session.username);
    return profile ? items.filter((item) => item.studentId === profile.studentId) : [];
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

  const activeRole = roleOptions.find((item) => item.value === role) || roleOptions[0];
  const content = roleContent[activeRole.value];
  const sections = roleResourceConfig[activeRole.value] || [];
  const studentProfile = useMemo(
    () => (resources.profile || []).find((item) => item.username === session.username),
    [resources.profile, session.username],
  );

  const highlightStats = useMemo(() => {
    return content.highlights.map((item, index) => {
      const sectionItemCount = sections[index] ? (resources[sections[index].key] || []).length : null;

      return {
        ...item,
        value: sectionItemCount !== null ? sectionItemCount.toString().padStart(2, "0") : item.value,
      };
    });
  }, [content.highlights, resources, sections]);

  useEffect(() => {
    const moduleSections = getModuleSections(activeRole.value, activeModule);

    if (!moduleSections.length) {
      setActiveSectionKey("");
      setSelectedSectionKey("");
      return;
    }

    setActiveSectionKey((current) => (moduleSections.includes(current) ? current : moduleSections[0]));
    setSelectedSectionKey((current) => (moduleSections.includes(current) ? current : moduleSections[0]));
  }, [activeModule, activeRole.value, role, sections]);

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

  async function fetchSection(section) {
    setLoadingMap((current) => ({ ...current, [section.key]: true }));
    setResourceErrors((current) => ({ ...current, [section.key]: "" }));

    try {
      const data = await getCollection(tenant, section.endpoint);
      setResources((current) => ({ ...current, [section.key]: data }));
    } catch (error) {
      setResourceErrors((current) => ({ ...current, [section.key]: error.message }));
      setGlobalError(error.message);
    } finally {
      setLoadingMap((current) => ({ ...current, [section.key]: false }));
    }
  }

  async function handleCreate(section, payload) {
    if (activeRole.value === "student" && section.key === "leaveRequests" && studentProfile) {
      payload = {
        ...payload,
        studentName: studentProfile.fullName,
        studentId: studentProfile.studentId,
      };
    }

    const result = await createCollectionItem(tenant, section.endpoint, payload);
    await fetchSection(section);
    return result;
  }

  async function handleUpdate(section, id, payload) {
    const result = await updateCollectionItem(tenant, section.endpoint, id, payload);
    await fetchSection(section);
    return result;
  }

  async function handleDelete(section, id) {
    await deleteCollectionItem(tenant, section.endpoint, id);
    await fetchSection(section);
  }

  async function handleStudentPhotoUpdate(nextPhoto) {
    if (!studentProfile?._id) {
      return;
    }

    setPhotoUpdating(true);
    setGlobalError("");

    try {
      await updateCollectionItem(tenant, "/students", studentProfile._id, {
        photoDataUrl: nextPhoto,
      });
      const profileSection = sections.find((section) => section.key === "profile");

      if (profileSection) {
        await fetchSection(profileSection);
      }

      const teacherStudentSection = sections.find((section) => section.key === "students");
      if (teacherStudentSection) {
        await fetchSection(teacherStudentSection);
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
      await handleStudentPhotoUpdate(photoDataUrl);
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  async function handlePhotoRemove() {
    await handleStudentPhotoUpdate("");
  }

  function handleLogout() {
    logout();
    navigate(`/${tenant || "cgu"}/login`, { replace: true });
  }

  function focusSection(sectionKey) {
    const matchedSection =
      sections.find((section) => section.key === sectionKey) ||
      (sectionKey === "calendar" ? sections.find((section) => section.key === "calendar" || section.key === "events") : null);

    if (!matchedSection) {
      return;
    }

    setActiveModule(sectionModuleLookup[matchedSection.key] || "Dashboard");
    setActiveSectionKey(matchedSection.key);

    window.requestAnimationFrame(() => {
      document.getElementById(matchedSection.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleAction(actionLabel) {
    const normalizedAction = actionLabel.toLowerCase();
    const actionTargets = [
      { keywords: ["calendar", "event"], sectionKey: "calendar" },
      { keywords: ["leave"], sectionKey: "leaveRequests" },
      { keywords: ["teacher", "password"], sectionKey: "teachers" },
      { keywords: ["student"], sectionKey: "students" },
      { keywords: ["class"], sectionKey: "classes" },
      { keywords: ["alert", "exam", "information"], sectionKey: "alerts" },
      { keywords: ["advisory", "announcement", "notice"], sectionKey: "advisories" },
      { keywords: ["subject", "elective"], sectionKey: "subjects" },
      { keywords: ["approve", "approval"], sectionKey: "approvals" },
      { keywords: ["campaign"], sectionKey: "campaigns" },
    ];

    const matchedTarget = actionTargets.find((target) =>
      target.keywords.some((keyword) => normalizedAction.includes(keyword)),
    );

    if (matchedTarget) {
      focusSection(matchedTarget.sectionKey);
    }
  }

  const filteredSections = useMemo(() => {
    const moduleSections = getModuleSections(activeRole.value, activeModule);

    if (!moduleSections.length) {
      return [];
    }

    if (!searchValue.trim()) {
      return sections.filter((section) => moduleSections.includes(section.key));
    }

    const needle = searchValue.trim().toLowerCase();

    return sections.filter((section) => {
      if (!moduleSections.includes(section.key)) {
        return false;
      }

      const items = filterItemsForSession(section, resources[section.key] || [], session, resources);
      return (
        section.title.toLowerCase().includes(needle) ||
        section.description.toLowerCase().includes(needle) ||
        items.some((item) => getSearchableText(item).includes(needle))
      );
    });
  }, [activeModule, activeRole.value, resources, searchValue, sections, session]);

  useEffect(() => {
    if (!filteredSections.length) {
      setSelectedSectionKey("");
      return;
    }

    setSelectedSectionKey((current) =>
      filteredSections.some((section) => section.key === current)
        ? current
        : filteredSections[0].key,
    );
  }, [filteredSections]);

  const selectedSection = filteredSections.find((section) => section.key === selectedSectionKey) || filteredSections[0] || null;

  function renderSectionCard(section) {
    const visibleItems = filterItemsForSession(section, resources[section.key] || [], session, resources);
    const hydratedSection =
      activeRole.value === "student" && section.key === "leaveRequests" && studentProfile
        ? {
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
          }
        : (activeRole.value === "teacher" || activeRole.value === "academic") && section.key === "alerts"
        ? {
            ...section,
            defaultValues: {
              ...section.defaultValues,
              teacherName: session.displayName || session.username,
            },
          }
        : section;

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

    return (
      <ResourceSection
        key={section.key}
        section={hydratedSection}
        items={visibleItems}
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
      tenant={(tenant || session.tenantSlug || "cgu").toUpperCase()}
      username={session.displayName || session.username}
      avatarSeed={session.avatarSeed}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onLogout={handleLogout}
    >
      {activeModule === "Dashboard" ? (
        <UserProfileCard
          session={session}
          studentProfile={studentProfile}
          onPhotoSelect={handlePhotoSelect}
          onRemovePhoto={handlePhotoRemove}
          photoUpdating={photoUpdating}
        />
      ) : null}

      {activeModule === "Dashboard" ? (
        <DashboardHero
          roleLabel={activeRole.label}
          welcome={content.welcome}
          modules={content.modules}
          actions={content.actions}
          onAction={handleAction}
        />
      ) : null}

      {activeModule === "Dashboard" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlightStats.map((item, index) => (
            <StatCard key={item.label} item={item} index={index} />
          ))}
        </section>
      ) : null}

      {globalError ? <Alert severity="warning">{globalError}</Alert> : null}

      {activeModule === "Alert" && ["teacher", "academic"].includes(activeRole.value) ? (
        <section className="relative overflow-hidden rounded-[32px] border border-cyan-100 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_55%,#d97706_100%)] p-6 text-white shadow-2xl shadow-cyan-950/15">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_60%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/80">Teacher Alert Desk</p>
              <h3 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight">
                Send polished email alerts for exams, events, and important notices in one step.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/90">
                Every alert is stored in the dashboard after delivery, so teachers can track what was sent and to how many students.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Sent Alerts</p>
                <p className="mt-2 text-3xl font-extrabold">{resources.alerts?.filter((item) => item.deliveryStatus === "sent").length || 0}</p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Recipients Reached</p>
                <p className="mt-2 text-3xl font-extrabold">
                  {(resources.alerts || []).reduce((total, item) => total + (item.recipientCount || 0), 0)}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Sender</p>
                <p className="mt-2 text-lg font-bold">{session.displayName || session.username}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeModule !== "Dashboard" && filteredSections.length ? (
        <section className="sticky top-0 z-20 rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-lg shadow-slate-200/70 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
              {filteredSections.map((section) => (
                <Button
                  key={section.key}
                  variant={section.key === selectedSectionKey ? "contained" : "outlined"}
                  color={section.key === selectedSectionKey ? "primary" : "inherit"}
                  onClick={() => {
                    setSelectedSectionKey(section.key);
                    setActiveSectionKey(section.key);
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                >
                  {section.title}
                </Button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div key={activeModule} className="space-y-4 animate-dashboard-in">
        {activeModule === "Dashboard" && (
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-200/60">
            <h3 className="text-2xl font-extrabold text-slate-950">Choose a workspace section</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The left menu now stays fixed. Select Academics, Communication, Calendar, or Support to open only that part in the main content area.
            </p>
          </section>
        )}

        {activeModule === "Dashboard"
          ? filteredSections.map((section) => {
              const visibleItems = filterItemsForSession(section, resources[section.key] || [], session, resources);
              const hydratedSection =
                activeRole.value === "student" && section.key === "leaveRequests" && studentProfile
                  ? {
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
                    }
                  : (activeRole.value === "teacher" || activeRole.value === "academic") && section.key === "alerts"
                  ? {
                      ...section,
                      defaultValues: {
                        ...section.defaultValues,
                        teacherName: session.displayName || session.username,
                      },
                    }
                  : section;

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

              return (
                <ResourceSection
                  key={section.key}
                  section={hydratedSection}
                  items={visibleItems}
                  loading={Boolean(loadingMap[section.key])}
                  error={resourceErrors[section.key]}
                  onRefresh={fetchSection}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  active={activeSectionKey === section.key}
                />
              );
            })
          : selectedSection
          ? renderSectionCard(selectedSection)
          : null}
      </div>

      {activeRole.value === "student" ? <PaymentNotice /> : null}
    </AppShell>
  );
}
