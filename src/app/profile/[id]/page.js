"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CareTeamButton from "@/components/CareTeamButton";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

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
              href="/dashboard"
              className="text-gray-600 hover:text-blue-600 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex justify-between items-start -mt-16">
              <div className="flex items-end space-x-4">
                {/* Profile Photo */}
                <div className="relative">
                  {profile?.profile_photo ? (
                    <Image
                      src={profile.profile_photo}
                      alt={profile.full_name}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-4xl font-bold text-blue-600">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>

                {/* Name and headline */}
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile?.full_name || "User Name"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {profile?.headline || "Healthcare Professional"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1 capitalize">
                    {profile?.user_type} •{" "}
                    {profile?.location || "Location not set"}
                  </p>
                </div>
              </div>

              {/* Buttons - Edit Profile or Care Team & Message */}
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Profile
                </Link>
              ) : (
                <div className="flex gap-3 mt-4">
                  <CareTeamButton
                    currentUserId={currentUser.id}
                    profileUserId={userId}
                  />
                  <Link
                    href={`/messages?userId=${userId}`}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Send Message
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
          {profile?.bio ? (
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-gray-400 italic">No bio added yet.</p>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Experience</h2>
          {profile?.experience && profile.experience.length > 0 ? (
            <div className="space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
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
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.title}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-700 mt-2">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No experience added yet.</p>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Education</h2>
          {profile?.education && profile.education.length > 0 ? (
            <div className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                  <div>
                    <h3 className="font-bold text-gray-900">{edu.school}</h3>
                    <p className="text-gray-600">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.startYear} - {edu.endYear}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No education added yet.</p>
          )}
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No skills added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
