"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User error:", userError);
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile:", error);
          setMessage({
            type: "error",
            text:
              "Failed to load profile: " + (error.message || "Unknown error"),
          });
        }

        if (!profile) {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name:
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User",
                user_type: user.user_metadata?.user_type || "doctor",
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            setMessage({
              type: "error",
              text: "Failed to create profile: " + createError.message,
            });
          } else {
            setProfile(newProfile);
          }
        } else {
          setProfile(profile);
        }
      } catch (error) {
        console.error("Unexpected error in loadProfile:", error);
        setMessage({
          type: "error",
          text: "Unexpected error: " + error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-red-600 mb-4">
            Profile Not Found
          </h1>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-sm md:text-base">User ID:</p>
              <p className="text-sm text-gray-600 break-all">{user?.id}</p>
            </div>
            <div>
              <p className="font-semibold text-sm md:text-base">Email:</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            {message.text && (
              <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
                {message.text}
              </div>
            )}
            <div className="pt-4 space-y-2">
              <Link
                href="/profile/edit"
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Creating Profile
              </Link>
              <Link
                href="/dashboard"
                className="block w-full text-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
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

            {/* Desktop Back Button */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center text-gray-600 hover:text-blue-600 transition"
            >
              ← Back to Dashboard
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
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/profile/edit"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Error Message */}
        {message.text && (
          <div
            className={`mb-4 md:mb-6 p-4 rounded-lg text-sm md:text-base ${
              message.type === "error"
                ? "bg-red-50 text-red-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 md:mb-6">
          {/* Cover Image - Shows custom or default gradient */}
          {profile?.cover_photo ? (
            <div className="h-24 md:h-32 bg-gray-200 relative">
              <Image
                src={profile.cover_photo}
                alt="Cover"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="h-24 md:h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          )}

          {/* Profile Info */}
          <div className="px-4 md:px-8 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start -mt-12 md:-mt-16">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
                {/* Profile Photo */}
                <div className="relative mb-4 md:mb-0">
                  {profile?.profile_photo ? (
                    <Image
                      src={profile.profile_photo}
                      alt={profile.full_name}
                      width={96}
                      height={96}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl md:text-4xl font-bold text-blue-600">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>

                {/* Name and headline */}
                <div className="pb-0 md:pb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {profile?.full_name || "User Name"}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm md:text-base">
                    {profile?.headline || "Add your professional headline"}
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm mt-1 capitalize">
                    {profile?.user_type} •{" "}
                    {profile?.location || "Location not set"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <Link
                href="/profile/edit"
                className="mt-4 md:mt-4 px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm md:text-base"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            About
          </h2>
          {profile?.bio ? (
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {profile.bio}
            </p>
          ) : (
            <p className="text-gray-400 italic text-sm md:text-base">
              No bio added yet. Click Edit Profile to add one.
            </p>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            Experience
          </h2>
          {profile?.experience && profile.experience.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={index} className="flex space-x-3 md:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      {exp.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      {exp.company}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-700 mt-2 text-sm md:text-base">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm md:text-base">
              No experience added yet.
            </p>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            Education
          </h2>
          {profile?.education && profile.education.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="flex space-x-3 md:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      {edu.school}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {edu.startYear} - {edu.endYear}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm md:text-base">
              No education added yet.
            </p>
          )}
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            Skills
          </h2>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm md:text-base">
              No skills added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
