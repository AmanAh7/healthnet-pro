"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);

        const { data: appData, error } = await supabase
          .from("job_applications")
          .select(
            `
            *,
            applicant:applicant_id (
              id,
              full_name,
              email,
              profile_photo,
              headline,
              bio,
              phone_number,
              location,
              education,
              experience,
              skills
            ),
            job:job_id (
              id,
              title,
              company,
              location,
              employer_id
            )
          `
          )
          .eq("id", applicationId)
          .single();

        if (error) throw error;

        // Check if current user is the employer
        if (appData.job.employer_id !== user.id) {
          alert("You don't have permission to view this application");
          router.push("/my-jobs");
          return;
        }

        setApplication(appData);
      } catch (error) {
        console.error("Error loading application:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, router]);

  const handleViewResume = async () => {
    if (!application?.resume_url) return;

    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(application.resume_url, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error viewing resume:", error);
      alert("Failed to load resume");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplication({ ...application, status: newStatus });
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

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Not Found
          </h1>
          <Link
            href="/jobs/applications"
            className="hidden md:block text-gray-600 hover:text-blue-600 transition"
          >
            Back to Applications
          </Link>
        </div>
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
            <Link
              href="/jobs/applications"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Applications
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
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

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Job Application
              </h1>
              <p className="text-gray-600 mt-1">
                for {application.job.title} at {application.job.company}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  application.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : application.status === "reviewed"
                    ? "bg-blue-100 text-blue-800"
                    : application.status === "shortlisted"
                    ? "bg-purple-100 text-purple-800"
                    : application.status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {application.status.charAt(0).toUpperCase() +
                  application.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Applicant Info */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Applicant Information
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                {application.applicant.profile_photo ? (
                  <Image
                    src={application.applicant.profile_photo}
                    alt={application.applicant.full_name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {application.applicant.full_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {application.applicant.full_name}
                </h3>
                <p className="text-gray-600">
                  {application.applicant.headline || "Healthcare Professional"}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <span>📧 {application.applicant.email}</span>
                  {application.phone_number && (
                    <span>📞 {application.phone_number}</span>
                  )}
                  {application.applicant.location && (
                    <span>📍 {application.applicant.location}</span>
                  )}
                </div>
                <Link
                  href={`/profile/${application.applicant.id}`}
                  className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View Full Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Healthcare Professional Details */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Professional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License/Registration Number
                </label>
                <p className="text-gray-900 font-semibold">
                  {application.license_number}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <p className="text-gray-900 font-semibold">
                  {application.specialization}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <p className="text-gray-900 font-semibold">
                  {application.years_of_experience} years
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highest Qualification
                </label>
                <p className="text-gray-900 font-semibold">
                  {application.highest_qualification}
                </p>
              </div>
              {application.current_workplace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Workplace
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {application.current_workplace}
                  </p>
                </div>
              )}
              {application.expected_salary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Salary
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {application.expected_salary}
                  </p>
                </div>
              )}
              {application.available_from && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available From
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(application.available_from).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {application.certifications &&
              application.certifications.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {application.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Resume */}
          {application.resume_url && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resume/CV
              </h2>
              <button
                onClick={handleViewResume}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                📄 Download Resume
              </button>
            </div>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Cover Letter
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {application.cover_letter}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Update Application Status
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("reviewed")}
                disabled={application.status === "reviewed"}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                Mark as Reviewed
              </button>
              <button
                onClick={() => handleStatusUpdate("shortlisted")}
                disabled={application.status === "shortlisted"}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleStatusUpdate("accepted")}
                disabled={application.status === "accepted"}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={application.status === "rejected"}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
