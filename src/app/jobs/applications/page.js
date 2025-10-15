"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "@/lib/utils";

export default function MyApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sentApplications, setSentApplications] = useState([]);
  const [receivedApplications, setReceivedApplications] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("sent");
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

        const { data: sentData } = await supabase
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
              employer_id
            )
          `
          )
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false });

        setSentApplications(sentData || []);

        const { data: myJobs } = await supabase
          .from("jobs")
          .select("id")
          .eq("employer_id", user.id);

        if (myJobs && myJobs.length > 0) {
          const jobIds = myJobs.map((j) => j.id);

          const { data: receivedData } = await supabase
            .from("job_applications")
            .select(
              `
              *,
              applicant:applicant_id (
                id,
                full_name,
                profile_photo,
                headline
              ),
              job:job_id (
                id,
                title,
                company
              )
            `
            )
            .in("job_id", jobIds)
            .order("created_at", { ascending: false });

          setReceivedApplications(receivedData || []);

          const accepted =
            receivedData?.filter((app) => app.status === "accepted") || [];
          setAcceptedApplications(accepted);
        }
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [router]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      const updatedReceived = receivedApplications.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      setReceivedApplications(updatedReceived);

      const accepted = updatedReceived.filter(
        (app) => app.status === "accepted"
      );
      setAcceptedApplications(accepted);

      alert(`Application ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600"
              >
                Home
              </Link>
              <Link
                href="/care-team"
                className="text-gray-700 hover:text-blue-600"
              >
                Care Team
              </Link>
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                Jobs
              </Link>
              <Link
                href="/messages"
                className="text-gray-700 hover:text-blue-600"
              >
                Messages
              </Link>
            </nav>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <Link
            href="/jobs"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center"
          >
            Browse Jobs
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("sent")}
                className={`flex-1 px-4 md:px-6 py-4 font-semibold whitespace-nowrap ${
                  activeTab === "sent"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Applications Sent ({sentApplications.length})
              </button>
              <button
                onClick={() => setActiveTab("received")}
                className={`flex-1 px-4 md:px-6 py-4 font-semibold whitespace-nowrap ${
                  activeTab === "received"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Applications Received (
                {
                  receivedApplications.filter(
                    (app) => app.status !== "accepted"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setActiveTab("accepted")}
                className={`flex-1 px-4 md:px-6 py-4 font-semibold whitespace-nowrap ${
                  activeTab === "accepted"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Accepted ({acceptedApplications.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "sent" ? (
              sentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No applications sent yet</p>
                  <Link
                    href="/jobs"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Browse Jobs →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {app.job.title}
                          </h3>
                          <p className="text-gray-600">{app.job.company}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDistanceToNow(app.created_at)}
                          </p>
                          <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              app.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : app.status === "reviewed"
                                ? "bg-blue-100 text-blue-800"
                                : app.status === "shortlisted"
                                ? "bg-purple-100 text-purple-800"
                                : app.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {app.status.charAt(0).toUpperCase() +
                              app.status.slice(1)}
                          </span>
                        </div>
                        <Link
                          href={`/jobs/${app.job_id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === "received" ? (
              receivedApplications.filter((app) => app.status !== "accepted")
                .length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pending applications</p>
                  <Link
                    href="/jobs/post"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Post a Job →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedApplications
                    .filter((app) => app.status !== "accepted")
                    .map((app) => (
                      <div
                        key={app.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
                            {app.applicant.profile_photo ? (
                              <Image
                                src={app.applicant.profile_photo}
                                alt={app.applicant.full_name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-blue-600">
                                {app.applicant.full_name?.charAt(0) || "U"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {app.applicant.full_name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {app.applicant.headline ||
                                "Healthcare Professional"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied for:{" "}
                              <span className="font-semibold">
                                {app.job.title}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(app.created_at)}
                            </p>
                            <span
                              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                app.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : app.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800"
                                  : app.status === "shortlisted"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {app.status.charAt(0).toUpperCase() +
                                app.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/applications/${app.id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm text-center whitespace-nowrap"
                            >
                              View Application
                            </Link>
                            {app.status === "pending" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(app.id, "reviewed")
                                  }
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200"
                                >
                                  Mark Reviewed
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(app.id, "accepted")
                                  }
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(app.id, "rejected")
                                  }
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )
            ) : acceptedApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No accepted applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-green-200 bg-green-50 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex-shrink-0 overflow-hidden">
                        {app.applicant.profile_photo ? (
                          <Image
                            src={app.applicant.profile_photo}
                            alt={app.applicant.full_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-green-600">
                            {app.applicant.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {app.applicant.full_name}
                        </h3>
                        <p className="text-gray-700 text-sm font-semibold">
                          {app.applicant.headline || "Healthcare Professional"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Position:{" "}
                          <span className="font-semibold">{app.job.title}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Accepted {formatDistanceToNow(app.updated_at)}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✓ Accepted
                        </span>
                      </div>
                      <Link
                        href={`/applications/${app.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
