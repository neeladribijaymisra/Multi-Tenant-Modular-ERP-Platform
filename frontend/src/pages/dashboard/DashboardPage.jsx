import { Alert, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardHero from "../../components/dashboard/DashboardHero";
import PaymentNotice from "../../components/dashboard/PaymentNotice";
import ResourceSection from "../../components/dashboard/ResourceSection";
import StatCard from "../../components/dashboard/StatCard";
import { useAuth } from "../../context/AuthContext";
import { roleContent, roleOptions } from "../../data/erpData";
import { roleResourceConfig } from "../../data/portalConfig";
import AppShell from "../../layouts/AppShell";
import {
  API_BASE_URL,
  createCollectionItem,
  deleteCollectionItem,
  getCollection,
  updateCollectionItem,
} from "../../services/api";

function getSearchableText(item) {
  return Object.values(item)
    .filter((value) => typeof value !== "object")
    .join(" ")
    .toLowerCase();
}

function matchesModule(section, activeModule) {
  if (activeModule === "Dashboard") {
    return true;
  }

  if (activeModule === "Academics") {
    return [
      "profile",
      "subjects",
      "classes",
      "progress",
      "curriculum",
      "timetables",
      "records",
      "teachers",
      "studentRegistry",
      "academicLeaveRequests",
      "approvals",
    ].includes(section.key);
  }

  if (activeModule === "Communication") {
    return ["advisories", "announcements", "campaigns", "events", "responses"].includes(section.key);
  }

  if (activeModule === "Calendar") {
    return ["classes", "timetables", "events", "leaveRequests"].includes(section.key);
  }

  if (activeModule === "Support") {
    return ["leaveRequests", "approvals", "records", "advisories"].includes(section.key);
  }

  return true;
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

  const activeRole = roleOptions.find((item) => item.value === role) || roleOptions[0];
  const content = roleContent[activeRole.value];
  const sections = roleResourceConfig[activeRole.value] || [];

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
    if (!sections.length) {
      return;
    }

    setActiveSectionKey(sections[0].key);
  }, [role, sections]);

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

  function handleLogout() {
    logout();
    navigate(`/${tenant || "cgu"}/login`, { replace: true });
  }

  function handleAction(actionLabel) {
    const matchedSection = sections.find((section) =>
      actionLabel.toLowerCase().includes(section.title.split(" ")[0].toLowerCase()),
    );

    if (matchedSection) {
      setActiveSectionKey(matchedSection.key);
      document.getElementById(matchedSection.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (actionLabel.toLowerCase().includes("leave")) {
      const leaveSection = sections.find((section) => section.key === "leaveRequests");
      if (leaveSection) {
        setActiveSectionKey(leaveSection.key);
        document.getElementById(leaveSection.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (actionLabel.toLowerCase().includes("teacher") || actionLabel.toLowerCase().includes("password")) {
      const teacherSection = sections.find((section) => section.key === "teachers");
      if (teacherSection) {
        setActiveSectionKey(teacherSection.key);
        document.getElementById(teacherSection.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  const filteredSections = useMemo(() => {
    if (!searchValue.trim()) {
      return sections.filter((section) => matchesModule(section, activeModule));
    }

    const needle = searchValue.trim().toLowerCase();

    return sections.filter((section) => {
      if (!matchesModule(section, activeModule)) {
        return false;
      }

      const items = resources[section.key] || [];
      return (
        section.title.toLowerCase().includes(needle) ||
        section.description.toLowerCase().includes(needle) ||
        items.some((item) => getSearchableText(item).includes(needle))
      );
    });
  }, [activeModule, resources, searchValue, sections]);

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
      <DashboardHero
        roleLabel={activeRole.label}
        welcome={content.welcome}
        modules={content.modules}
        actions={content.actions}
        onAction={handleAction}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlightStats.map((item, index) => (
          <StatCard key={item.label} item={item} index={index} />
        ))}
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Connection</p>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-950">MongoDB and API status</h3>
            <p className="mt-2 text-sm text-slate-600">
              Database: <strong>AYRAERP</strong> on <strong>localhost:27017</strong> |
              API Base: <strong>{API_BASE_URL}</strong>
            </p>
          </div>
          <Button
            variant="outlined"
            onClick={() => Promise.all(sections.map((section) => fetchSection(section)))}
          >
            Refresh All Sections
          </Button>
        </div>
      </section>

      {globalError ? <Alert severity="warning">{globalError}</Alert> : null}

      {filteredSections.map((section) => (
        <ResourceSection
          key={section.key}
          section={section}
          items={resources[section.key] || []}
          loading={Boolean(loadingMap[section.key])}
          error={resourceErrors[section.key]}
          onRefresh={fetchSection}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          active={activeSectionKey === section.key}
        />
      ))}

      {activeRole.value === "student" ? <PaymentNotice /> : null}
    </AppShell>
  );
}
