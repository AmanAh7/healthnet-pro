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
  const [profile, setProfile] = useState(null);
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    licenseNumber: "",
    specialization: "",
    yearsOfExperience: "",
    currentWorkplace: "",
    highestQualification: "",
    resumePath: "", // Changed from resumeUrl to resumePath
    coverLetter: "",
    availableFrom: "",
    expectedSalary: "",
    certifications: "",
  });

  const [uploadingResume, setUploadingResume] = useState(false);

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

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        setFormData({
          fullName: profileData?.full_name || "",
          email: profileData?.email || user.email || "",
          phoneNumber: profileData?.phone_number || "",
          licenseNumber: "",
          specialization: profileData?.specialization || "",
          yearsOfExperience: "",
          currentWorkplace: "",
          highestQualification: profileData?.highest_qualification || "",
          resumePath: "",
          coverLetter: "",
          availableFrom: "",
          expectedSalary: "",
          certifications: "",
        });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or Word document");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setUploadingResume(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the path, not the URL
      setFormData((prev) => ({
        ...prev,
        resumePath: filePath,
      }));
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleViewResume = async () => {
    if (!formData.resumePath) return;

    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(formData.resumePath, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error viewing resume:", error);
      alert("Failed to load resume");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!formData.phoneNumber) {
      alert("Phone number is required");
      return;
    }
    if (!formData.licenseNumber) {
      alert("Medical license/registration number is required");
      return;
    }
    if (!formData.specialization) {
      alert("Specialization/Department is required");
      return;
    }
    if (!formData.yearsOfExperience) {
      alert("Years of experience is required");
      return;
    }
    if (!formData.highestQualification) {
      alert("Highest qualification is required");
      return;
    }
    if (!formData.resumePath) {
      alert("Please upload your resume/CV");
      return;
    }

    setApplying(true);

    try {
      const certificationsArray = formData.certifications
        ? formData.certifications.split(",").map((cert) => cert.trim())
        : [];

      const { error } = await supabase.from("job_applications").insert([
        {
          job_id: jobId,
          applicant_id: user.id,
          phone_number: formData.phoneNumber,
          license_number: formData.licenseNumber,
          specialization: formData.specialization,
          years_of_experience: parseInt(formData.yearsOfExperience),
          current_workplace: formData.currentWorkplace,
          highest_qualification: formData.highestQualification,
          resume_url: formData.resumePath, // Store path in resume_url field
          cover_letter: formData.coverLetter,
          available_from: formData.availableFrom || null,
          expected_salary: formData.expectedSalary,
          certifications: certificationsArray,
        },
      ]);

      if (error) throw error;

      setHasApplied(true);
      setShowApplyForm(false);
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to submit application. Please try again.");
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
              href="/jobs"
              className="hidden md:block text-gray-600 hover:text-blue-600 transition"
            >
              Back to Jobs
            </Link>
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

          {showApplyForm && (
            <div className="border-t pt-4 md:pt-6 mb-6 bg-gray-50 p-4 md:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                  Submit Application
                </h3>
                <button
                  onClick={() => setShowApplyForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License/Registration No.{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., MCI-12345"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization/Department{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    >
                      <option value="">Select specialization</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Emergency Medicine">
                        Emergency Medicine
                      </option>
                      <option value="ICU/Critical Care">
                        ICU/Critical Care
                      </option>
                      <option value="Surgery">Surgery</option>
                      <option value="Nursing">Nursing</option>
                      <option value="Lab Technician">Lab Technician</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Physiotherapy">Physiotherapy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="0"
                      max="50"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Hospital/Clinic (Optional)
                    </label>
                    <input
                      type="text"
                      name="currentWorkplace"
                      value={formData.currentWorkplace}
                      onChange={handleInputChange}
                      placeholder="e.g., Apollo Hospital"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Highest Qualification{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="highestQualification"
                      value={formData.highestQualification}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    >
                      <option value="">Select qualification</option>
                      <option value="MBBS">MBBS</option>
                      <option value="MD">MD</option>
                      <option value="MS">MS</option>
                      <option value="DNB">DNB</option>
                      <option value="DM">DM</option>
                      <option value="MCh">MCh</option>
                      <option value="BSc Nursing">BSc Nursing</option>
                      <option value="MSc Nursing">MSc Nursing</option>
                      <option value="GNM">GNM</option>
                      <option value="BPT">BPT</option>
                      <option value="MPT">MPT</option>
                      <option value="B.Pharm">B.Pharm</option>
                      <option value="M.Pharm">M.Pharm</option>
                      <option value="DMLT">DMLT</option>
                      <option value="BMLT">BMLT</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume/CV <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition bg-white">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {uploadingResume
                            ? "Uploading..."
                            : formData.resumePath
                            ? "✓ Resume Uploaded"
                            : "Upload Resume (PDF/DOC - Max 5MB)"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={uploadingResume}
                        className="hidden"
                      />
                    </label>
                    {formData.resumePath && (
                      <button
                        type="button"
                        onClick={handleViewResume}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold border border-blue-600 rounded-lg"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications (Optional)
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    placeholder="e.g., BLS, ACLS, ICU Certified"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple certifications with commas
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available to Join (Optional)
                    </label>
                    <input
                      type="date"
                      name="availableFrom"
                      value={formData.availableFrom}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Salary (Optional)
                    </label>
                    <input
                      type="text"
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleInputChange}
                      placeholder="e.g., ₹50,000 - ₹70,000/month"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Why are you interested in this position?"
                    maxLength={2000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.coverLetter.length}/2000 characters
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={applying || uploadingResume}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border-t pt-4 md:pt-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
              Job Description
            </h2>
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.requirements && (
            <div className="border-t pt-4 md:pt-6 mt-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                Requirements
              </h2>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}

          {job.benefits && (
            <div className="border-t pt-4 md:pt-6 mt-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                Benefits
              </h2>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.benefits}
              </p>
            </div>
          )}

          <div className="border-t pt-4 md:pt-6 mt-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
              Posted By
            </h2>
            <Link
              href={`/profile/${job.employer_id}`}
              className="flex items-center space-x-3 hover:bg-gray-50 p-3 rounded-lg transition"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {job.profiles?.profile_photo ? (
                  <Image
                    src={job.profiles.profile_photo}
                    alt={job.profiles.full_name || "User"}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-lg font-bold text-blue-600">
                    {job.profiles?.full_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 hover:text-blue-600">
                  {job.profiles?.full_name || "User"}
                </p>
                <p className="text-sm text-gray-600">
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
