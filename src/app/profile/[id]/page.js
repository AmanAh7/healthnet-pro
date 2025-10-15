"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CareTeamButton from "@/components/CareTeamButton";
import MessageButton from "@/components/MessageButton";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);
        setIsOwnProfile(user.id === userId);

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          return;
        }

        setProfile(profileData);

        // Track profile view (only if viewing someone else's profile)
        if (user.id !== userId) {
          await supabase.from("profile_views").upsert(
            {
              profile_id: userId,
              viewer_id: user.id,
            },
            {
              onConflict: "profile_id,viewer_id",
              ignoreDuplicates: false,
            }
          );
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, router]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Not Found
          </h1>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
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
              href="/dashboard"
              className="hidden md:block text-gray-600 hover:text-blue-600 transition"
            >
              Back to Dashboard
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
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="h-24 md:h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
            {profile?.cover_photo && (
              <Image
                src={profile.cover_photo}
                alt="Cover"
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          <div className="px-4 md:px-8 pb-6 pt-2 md:pt-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end -mt-12 md:-mt-16">
              <div className="flex flex-col items-center md:flex-row md:items-end md:space-x-6">
                <div className="relative z-10">
                  {profile?.profile_photo ? (
                    <Image
                      src={profile.profile_photo}
                      alt={profile.full_name}
                      width={128}
                      height={128}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl md:text-4xl font-bold text-blue-600">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div className="md:pb-2 mt-3 md:mt-0 text-center md:text-left">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                    {profile?.full_name || "User Name"}
                  </h1>
                  <div className="flex flex-col md:flex-row md:items-end md:gap-3">
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                      {profile?.headline || "Healthcare Professional"}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 capitalize">
                      {profile?.user_type}
                      {profile?.location && <> • {profile.location}</>}
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-2 mt-2">
                    {profile?.license_number && (
                      <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded font-semibold">
                        License: {profile.license_number}
                      </span>
                    )}
                    {profile?.specialization && (
                      <span className="px-3 py-1 text-xs bg-green-50 text-green-800 rounded font-semibold">
                        Specialty: {profile.specialization}
                      </span>
                    )}
                    {profile?.highest_qualification && (
                      <span className="px-3 py-1 text-xs bg-purple-50 text-purple-800 rounded font-semibold">
                        {profile.highest_qualification}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-2 mt-4 md:mt-0">
                {isOwnProfile ? (
                  <Link
                    href="/profile/edit"
                    className="block w-full md:w-auto px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm md:text-base font-semibold"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <div className="flex-1 sm:flex-none">
                      <CareTeamButton
                        currentUserId={currentUser.id}
                        profileUserId={userId}
                      />
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <MessageButton
                        currentUserId={currentUser.id}
                        otherUserId={userId}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 mb-2 justify-center md:justify-start">
              {profile?.years_of_experience && (
                <span className="text-sm bg-gray-100 rounded px-3 py-1 font-medium text-gray-700">
                  {profile.years_of_experience} yrs experience
                </span>
              )}
              {profile?.current_workplace && (
                <span className="text-sm bg-gray-100 rounded px-3 py-1 font-medium text-gray-700">
                  {profile.current_workplace}
                </span>
              )}
              {profile?.phone_number && (
                <span className="text-sm text-gray-600">
                  📞 {profile.phone_number}
                </span>
              )}
              {profile?.email && (
                <span className="text-sm text-gray-600 break-all">
                  ✉️ {profile.email}
                </span>
              )}
            </div>
            {profile?.certifications && profile.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.certifications.map((cert, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            About
          </h2>
          {profile?.bio ? (
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm md:text-base text-gray-400 italic">
              No bio added yet.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-6">
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
                    <h3 className="text-base md:text-lg font-bold text-gray-900">
                      {edu.school}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {edu.startYear} - {edu.endYear}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm md:text-base text-gray-400 italic">
              No education added yet.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-6">
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
                    <h3 className="text-base md:text-lg font-bold text-gray-900">
                      {exp.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600">
                      {exp.company}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-sm md:text-base text-gray-700 mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm md:text-base text-gray-400 italic">
              No experience added yet.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            Skills
          </h2>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 md:px-4 md:py-2 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm md:text-base text-gray-400 italic">
              No skills added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
