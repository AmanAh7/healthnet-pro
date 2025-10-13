"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>
            <Link
              href="/jobs"
              className="text-gray-600 hover:text-blue-600 transition"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </header>

      {/* Job Details */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-xl text-gray-700 mt-2 font-semibold">
                {job.company}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-gray-600">
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
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
              <p className="text-sm text-gray-500 mt-4">
                Posted {formatDistanceToNow(job.created_at)}
              </p>
            </div>

            {!isOwnJob && (
              <div>
                {hasApplied ? (
                  <button
                    disabled
                    className="px-8 py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Apply Form */}
          {showApplyForm && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Job Description */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Job Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Requirements
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.benefits}
              </p>
            </div>
          )}

          {/* Posted By */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Posted By</h2>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {job.profiles?.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {job.profiles?.full_name || "User"}
                </p>
                <p className="text-sm text-gray-600">
                  {job.profiles?.headline || "Healthcare Professional"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
