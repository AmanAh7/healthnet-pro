"use client";

import { useEffect, useState } from "react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data, error } = await supabase
          .from("jobs")
          .select(`*, profiles:employer_id (full_name, profile_photo)`)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setJobs(data || []);
        setFilteredJobs(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [router]);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((job) => job.job_type === selectedType);
    }

    if (selectedLevel !== "all") {
      filtered = filtered.filter(
        (job) => job.experience_level === selectedLevel
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, selectedType, selectedLevel, jobs]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <Link href="/jobs" className="text-blue-600 font-semibold">
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
                className="block px-4 py-2 text-blue-600 font-semibold hover:bg-gray-50 rounded"
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
        {/* Header Section - Responsive with TWO BUTTONS */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Healthcare Jobs
            </h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
              Find your next opportunity in healthcare
            </p>
          </div>
          {/* Button Group */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/jobs/applications"
              className="px-4 md:px-6 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-center text-sm md:text-base"
            >
              My Applications
            </Link>
            <Link
              href="/jobs/post"
              className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-center text-sm md:text-base"
            >
              Post a Job
            </Link>
          </div>
        </div>

        {/* Filters - Mobile Friendly */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, company, location..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Filters - Stack on mobile, side by side on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="all">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm md:text-base">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        </div>

        {/* Job Listings - Mobile Optimized */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 md:p-12 text-center">
              <p className="text-gray-500">
                No jobs found matching your criteria
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 hover:text-blue-600 truncate">
                      {job.title}
                    </h2>
                    <p className="text-gray-700 mt-1 font-semibold text-sm md:text-base">
                      {job.company}
                    </p>

                    {/* Job Details - Wrap on mobile */}
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4 mr-1"
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
                      <span className="capitalize">
                        {job.experience_level} Level
                      </span>
                      {job.salary_range && <span>{job.salary_range}</span>}
                    </div>

                    {/* Description - Show less on mobile */}
                    <p className="text-gray-600 mt-2 md:mt-3 line-clamp-2 text-sm md:text-base">
                      {job.description}
                    </p>
                  </div>

                  {/* Time posted - Right side on desktop, bottom on mobile */}
                  <div className="text-left md:text-right flex-shrink-0">
                    <p className="text-xs md:text-sm text-gray-500">
                      {formatDistanceToNow(job.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
