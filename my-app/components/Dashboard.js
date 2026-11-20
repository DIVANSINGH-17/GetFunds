"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getDashboardData,
  updateProfile,
} from "@/actions/useractions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TrendChart from "@/components/TrendChart";
import ShareButton from "@/components/ShareButton";
import {
  currency,
  formatFileSize,
  fundingProgress,
} from "@/lib/format";

const Dashboard = () => {
  const { update: updateSession } = useSession();
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState({
    email: "",
    name: "",
    username: "",
    profilepic: "",
    coverpic: "",
    bio: "",
    website: "",
    fundingGoal: "10000",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProject, setUploadingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    const result = await getDashboardData();

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setDashboard(result);
    setForm({
      ...result.profile,
      fundingGoal: String(result.profile.fundingGoal),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (formData) => {
    setSaving(true);

    try {
      const result = await updateProfile(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      await updateSession();
      await loadDashboard();
      toast.success(result.message);
    } catch {
      toast.error("The profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const handleProjectUpload = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setUploadingProject(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        toast.error(result.error || "Could not upload the project folder.");
        return;
      }

      formElement.reset();
      await loadDashboard();
      toast.success(result.message);
    } catch {
      toast.error("Could not upload the project folder.");
    } finally {
      setUploadingProject(false);
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete the project folder “${project.title}” and all its files?`)) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        toast.error(result.error || "Could not delete the project folder.");
        return;
      }

      await loadDashboard();
      toast.success(result.message);
    } catch {
      toast.error("Could not delete the project folder.");
    } finally {
      setDeletingProjectId("");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center text-slate-300">
        Loading creator analytics...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
          <h1 className="text-xl font-bold">Dashboard unavailable</h1>
          <p className="mt-2">{error || "Could not load your creator profile."}</p>
        </div>
      </div>
    );
  }

  const topSupporter = dashboard.topContributions[0];
  const progress = fundingProgress(
    dashboard.stats.totalAmount,
    dashboard.profile.fundingGoal,
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} theme="dark" />

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
              Interview demo · Razorpay Test Mode
            </span>
            <h1 className="mt-3 text-3xl font-bold">Creator analytics</h1>
            <p className="mt-1 text-slate-400">
              Manage your public page, project folders, target, and verified test funding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareButton
              path={`/${dashboard.profile.username}`}
              title={`Support ${dashboard.profile.name || dashboard.profile.username} on GetFunds`}
            />
            {/* Plain <a download>: this is a file download from an API route, not a page. */}
            <a
              href="/api/contributions/export"
              download
              className="rounded-lg border border-slate-600 px-4 py-2 text-center text-sm font-semibold hover:bg-slate-800"
            >
              Export CSV
            </a>
            <Link
              href={`/${dashboard.profile.username}`}
              className="rounded-lg border border-blue-400 px-4 py-2 text-center text-sm font-semibold text-blue-200 hover:bg-blue-500/10"
            >
              View public page
            </Link>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Verified test funding", currency.format(dashboard.stats.totalAmount)],
            ["Contributions", dashboard.stats.contributionCount],
            ["Unique supporters", dashboard.stats.supporterCount],
            ["Average amount", currency.format(dashboard.stats.averageAmount)],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
            <h2 className="text-lg font-bold">Contribution trend</h2>
            <div className="mt-4">
              <TrendChart data={dashboard.trend} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
            <h2 className="text-lg font-bold">Goal progress</h2>
            <p className="mt-4 text-4xl font-bold">{progress}%</p>
            <p className="mt-1 text-sm text-slate-400">
              {currency.format(dashboard.stats.totalAmount)} of{" "}
              {currency.format(dashboard.profile.fundingGoal)}
            </p>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-label="Funding goal progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {progress >= 100
                ? "Goal reached 🎉 Consider raising your target below."
                : `${currency.format(Math.max(0, dashboard.profile.fundingGoal - dashboard.stats.totalAmount))} to go.`}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-8">
            <h2 className="text-2xl font-bold">Profile settings</h2>
            <p className="mt-1 text-sm text-slate-400">
              Changes are validated and authorized on the server.
            </p>

            <form className="mt-6 space-y-4" action={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="name">
                    Display name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={80}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_]+"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 lowercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Lowercase letters, numbers, and underscores only.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Tell supporters what you build and what their contribution helps with."
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.bio.length}/300
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="website">
                  Website or portfolio URL
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  maxLength={300}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="https://github.com/your-name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="email">
                  GitHub email
                </label>
                <input
                  id="email"
                  value={form.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Identity comes from GitHub and cannot be changed in this form.
                </p>
              </div>

              <div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <label className="block text-sm font-semibold text-emerald-100" htmlFor="fundingGoal">
                      Public funding target
                    </label>
                    <span className="text-sm font-bold text-emerald-200">
                      {currency.format(Number(form.fundingGoal) || 0)}
                    </span>
                  </div>
                  <input
                    id="fundingGoal"
                    name="fundingGoal"
                    type="number"
                    value={form.fundingGoal}
                    onChange={handleChange}
                    min={100}
                    max={10000000}
                    step={100}
                    required
                    className="mt-2 w-full rounded-lg border border-emerald-500/30 bg-slate-900 p-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  />
                  <p className="mt-2 text-xs text-emerald-100/70">
                    This value controls the goal and progress bar shown on your public profile. It is not hardcoded.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="profilepic">
                  Profile image URL
                </label>
                <input
                  id="profilepic"
                  name="profilepic"
                  type="url"
                  value={form.profilepic}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="coverpic">
                  Cover image URL
                </label>
                <input
                  id="coverpic"
                  name="coverpic"
                  type="url"
                  value={form.coverpic}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 font-semibold hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">Top supporter</h2>
              {topSupporter ? (
                <div className="mt-4 rounded-xl bg-slate-800 p-4">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold">{topSupporter.name}</p>
                    <p className="font-bold text-emerald-300">
                      {currency.format(topSupporter.amount)}
                    </p>
                  </div>
                  {topSupporter.message && (
                    <p className="mt-2 text-sm text-slate-300">
                      “{topSupporter.message}”
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No verified test contributions yet.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">Recent activity</h2>
              {dashboard.recentContributions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  Verified Razorpay test contributions will appear here.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {dashboard.recentContributions.map((contribution) => (
                    <li
                      key={contribution.id}
                      className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{contribution.name}</p>
                        <p className="text-xs text-slate-500">
                          {contribution.createdAt
                            ? new Date(contribution.createdAt).toLocaleDateString("en-IN")
                            : "Demo record"}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-emerald-300">
                        {currency.format(contribution.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Project folders</h2>
              <p className="mt-1 text-sm text-slate-400">
                Upload portfolio files to MongoDB GridFS. Visitors can view or download them from your public profile.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              Maximum 5 files per folder, 5 MB per file, 15 MB total
            </span>
          </div>

          <form
            className="mt-6 grid gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5 lg:grid-cols-2"
            onSubmit={handleProjectUpload}
          >
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="project-title">
                Project title
              </label>
              <input
                id="project-title"
                name="title"
                minLength={3}
                maxLength={80}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                placeholder="Example: Expense Tracker"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="project-files">
                Project files
              </label>
              <input
                id="project-files"
                name="files"
                type="file"
                multiple
                required
                accept=".c,.cpp,.css,.csv,.doc,.docx,.gif,.html,.java,.jpeg,.jpg,.js,.json,.jsx,.md,.pdf,.png,.ppt,.pptx,.py,.sh,.sql,.ts,.tsx,.txt,.webp,.xls,.xlsx,.xml,.yaml,.yml,.zip"
                className="block w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium" htmlFor="project-description">
                Description
              </label>
              <textarea
                id="project-description"
                name="description"
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                placeholder="Explain what the project does, its technology, and your contribution."
              />
            </div>

            <button
              type="submit"
              disabled={uploadingProject}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
            >
              {uploadingProject ? "Uploading folder..." : "Publish project folder"}
            </button>
          </form>

          {dashboard.projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
              No project folders published yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {dashboard.projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">📁 {project.title}</h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-slate-300">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteProject(project)}
                      disabled={deletingProjectId === project.id}
                      className="shrink-0 rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {project.files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-blue-200 hover:bg-slate-950"
                        >
                          <span className="truncate">{file.filename}</span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Dashboard;
