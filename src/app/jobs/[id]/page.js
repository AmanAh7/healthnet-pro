"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "@/lib/utils";

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: jobData, error } = await supabase
          .from("jobs")
          .select(
            `
            *,
            profiles:employer_id (full_name, headline, profile_photo)
          `
          )
          .eq("id", jobId)
          .single();

        if (error) throw error;
        setJob(jobData);

        const { data: application } = await supabase
          .from("job_applications")
          .select("id")
          .eq("job_id", jobId)
          .eq("applicant_id", user.id)
          .maybeSingle();

        setHasApplied(!!application);
      } catch (error) {
        console.error("Error loading job:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, router]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      const { error } = await supabase.from("job_applications").insert([
        {
          job_id: jobId,
          applicant_id: user.id,
          cover_letter: coverLetter,
        },
      ]);

      if (error) throw error;

      setHasApplied(true);
      setShowApplyForm(false);
      setCoverLetter("");
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h1>
          <Link
            href="/jobs"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const isOwnJob = job.employer_id === user.id;

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
            <Link
              href="/jobs"
              className="hidden md:block text-gray-600 hover:text-blue-600 transition"
            >
              Back to Jobs
            </Link>

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
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Back to Jobs
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Job Details */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {job.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mt-2 font-semibold">
                {job.company}
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-4 text-sm md:text-base text-gray-600">
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 mr-2"
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {job.location}
                </span>
                <span className="capitalize">
                  {job.job_type.replace("-", " ")}
                </span>
                <span className="capitalize">{job.experience_level} Level</span>
                {job.salary_range && <span>{job.salary_range}</span>}
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-4">
                Posted {formatDistanceToNow(job.created_at)}
              </p>
            </div>

            {!isOwnJob && (
              <div className="flex-shrink-0">
                {hasApplied ? (
                  <button
                    disabled
                    className="w-full md:w-auto px-6 md:px-8 py-2 md:py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed text-sm md:text-base"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full md:w-auto px-6 md:px-8 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm md:text-base"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Apply Form */}
          {showApplyForm && (
            <div className="border-t pt-4 md:pt-6 mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                Submit Application
              </h3>
              <form onSubmit={handleApply}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    placeholder="Tell the employer why you're a great fit for this role..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm md:text-base text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm md:text-base"
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Job Description */}
          <div className="border-t pt-4 md:pt-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
              Job Description
            </h2>
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="border-t pt-4 md:pt-6 mt-4 md:mt-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                Requirements
              </h2>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="border-t pt-4 md:pt-6 mt-4 md:mt-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                Benefits
              </h2>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.benefits}
              </p>
            </div>
          )}

          {/* Posted By - WITH PROFILE PHOTO */}
          <div className="border-t pt-4 md:pt-6 mt-4 md:mt-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
              Posted By
            </h2>
            <Link
              href={`/profile/${job.employer_id}`}
              className="flex items-center space-x-3 md:space-x-4 hover:bg-gray-50 p-3 rounded-lg transition"
            >
              {/* Profile Photo with Image Support */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                {job.profiles?.profile_photo ? (
                  <Image
                    src={job.profiles.profile_photo}
                    alt={job.profiles.full_name || "User"}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-bold text-blue-600">
                    {job.profiles?.full_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-gray-900 hover:text-blue-600">
                  {job.profiles?.full_name || "User"}
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  {job.profiles?.headline || "Healthcare Professional"}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
