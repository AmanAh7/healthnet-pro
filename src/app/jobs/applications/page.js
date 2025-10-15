"use client";

import { useEffect, useState } from "react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "@/lib/utils";

export default function JobApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("sent"); // 'sent' or 'received'
  const [sentApplications, setSentApplications] = useState([]);
  const [receivedApplications, setReceivedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        await Promise.all([
          loadSentApplications(user.id),
          loadReceivedApplications(user.id),
        ]);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [router]);

  const loadSentApplications = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(
          `
          *,
          job:job_id (
            id,
            title,
            company,
            location,
            job_type,
            profiles:employer_id (full_name, profile_photo)
          )
        `
        )
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSentApplications(data || []);
    } catch (error) {
      console.error("Error loading sent applications:", error);
    }
  };

  const loadReceivedApplications = async (userId) => {
    try {
      // First get all jobs posted by this user
      const { data: userJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("employer_id", userId);

      if (jobsError) throw jobsError;

      if (!userJobs || userJobs.length === 0) {
        setReceivedApplications([]);
        return;
      }

      const jobIds = userJobs.map((job) => job.id);

      // Get all applications for these jobs
      const { data, error } = await supabase
        .from("job_applications")
        .select(
          `
          *,
          job:job_id (id, title, company, location, job_type),
          applicant:applicant_id (id, full_name, headline, profile_photo, email)
        `
        )
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReceivedApplications(data || []);
    } catch (error) {
      console.error("Error loading received applications:", error);
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;

      setSentApplications(
        sentApplications.filter((app) => app.id !== applicationId)
      );
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert("Failed to withdraw application");
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      // Update the local state
      setReceivedApplications(
        receivedApplications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Home
              </Link>
              <Link
                href="/care-team"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Care Team
              </Link>
              <Link
                href="/jobs"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Jobs
              </Link>
              <Link
                href="/messages"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Messages
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Home
              </Link>
              <Link
                href="/care-team"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Care Team
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Jobs
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Messages
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Job Applications
            </h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
              Manage your job applications and review candidates
            </p>
          </div>
          <Link
            href="/jobs"
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-center text-sm md:text-base"
          >
            Browse Jobs
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8 px-4 md:px-6 min-w-max">
              <button
                onClick={() => setActiveTab("sent")}
                className={`py-4 px-2 border-b-2 font-semibold transition whitespace-nowrap text-sm md:text-base ${
                  activeTab === "sent"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                Applications Sent ({sentApplications.length})
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={`py-4 px-2 border-b-2 font-semibold transition whitespace-nowrap text-sm md:text-base ${
                  activeTab === "received"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                Applications Received ({receivedApplications.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {/* Sent Applications Tab */}
            {activeTab === "sent" && (
              <div>
                {sentApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 mb-4">
                      You havent applied to any jobs yet
                    </p>
                    <Link
                      href="/jobs"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentApplications.map((application) => (
                      <div
                        key={application.id}
                        className="border rounded-lg p-4 md:p-6 hover:shadow-lg transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                {application.job?.profiles?.profile_photo ? (
                                  <Image
                                    src={application.job.profiles.profile_photo}
                                    alt={application.job.company}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full rounded-lg"
                                  />
                                ) : (
                                  <svg
                                    className="w-6 h-6 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/jobs/${application.job?.id}`}>
                                  <h3 className="font-bold text-lg text-gray-900 hover:text-blue-600 cursor-pointer">
                                    {application.job?.title}
                                  </h3>
                                </Link>
                                <p className="text-gray-700 font-semibold">
                                  {application.job?.company}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                    </svg>
                                    {application.job?.location}
                                  </span>
                                  <span className="capitalize">
                                    {application.job?.job_type?.replace(
                                      "-",
                                      " "
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              {getStatusBadge(application.status)}
                              <span className="text-sm text-gray-500">
                                Applied{" "}
                                {formatDistanceToNow(application.created_at)}
                              </span>
                            </div>

                            {application.cover_letter && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  Cover Letter:
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-3">
                                  {application.cover_letter}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex md:flex-col gap-2">
                            <Link
                              href={`/jobs/${application.job?.id}`}
                              className="flex-1 md:flex-none px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-center"
                            >
                              View Job
                            </Link>
                            {application.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleWithdrawApplication(application.id)
                                }
                                className="flex-1 md:flex-none px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Received Applications Tab */}
            {activeTab === "received" && (
              <div>
                {receivedApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-gray-500 mb-4">
                      No applications received yet
                    </p>
                    <Link
                      href="/jobs/post"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                    >
                      Post a Job
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedApplications.map((application) => (
                      <div
                        key={application.id}
                        className="border rounded-lg p-4 md:p-6 hover:shadow-lg transition"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Applicant Info */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                              {application.applicant?.profile_photo ? (
                                <Image
                                  src={application.applicant.profile_photo}
                                  alt={application.applicant.full_name}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span className="text-xl md:text-2xl font-bold text-blue-600">
                                  {application.applicant?.full_name?.charAt(
                                    0
                                  ) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/profile/${application.applicant?.id}`}
                              >
                                <h3 className="font-bold text-lg text-gray-900 hover:text-blue-600 cursor-pointer">
                                  {application.applicant?.full_name}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-600">
                                {application.applicant?.headline ||
                                  "Healthcare Professional"}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Applied for: {application.job?.title}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                {getStatusBadge(application.status)}
                                <span className="text-sm text-gray-500">
                                  {formatDistanceToNow(application.created_at)}
                                </span>
                              </div>

                              {application.cover_letter && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Cover Letter:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {application.cover_letter}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex md:flex-col gap-2">
                            <Link
                              href={`/profile/${application.applicant?.id}`}
                              className="flex-1 md:flex-none px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-center"
                            >
                              View Profile
                            </Link>

                            {application.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      application.id,
                                      "reviewed"
                                    )
                                  }
                                  className="flex-1 md:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Mark Reviewed
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      application.id,
                                      "accepted"
                                    )
                                  }
                                  className="flex-1 md:flex-none px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      application.id,
                                      "rejected"
                                    )
                                  }
                                  className="flex-1 md:flex-none px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {application.status === "reviewed" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      application.id,
                                      "accepted"
                                    )
                                  }
                                  className="flex-1 md:flex-none px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      application.id,
                                      "rejected"
                                    )
                                  }
                                  className="flex-1 md:flex-none px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
