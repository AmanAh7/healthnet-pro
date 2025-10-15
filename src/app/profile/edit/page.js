"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ImageCropModal from "@/components/ImageCropModal";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCoverCrop, setShowCoverCrop] = useState(false);
  const [showProfileCrop, setShowProfileCrop] = useState(false);
  const [tempCoverImage, setTempCoverImage] = useState(null);
  const [tempProfileImage, setTempProfileImage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    phone: "",
    linkedin_url: "",
    profile_photo: "",
    cover_photo: "",
    skills: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        console.error("Supabase error details:", error);
        setMessage({
          type: "error",
          text: "Failed to load profile: " + error.message,
        });
      }

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || "User",
              user_type: user.user_metadata?.user_type || "doctor",
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          setMessage({ type: "error", text: "Failed to create profile" });
        } else {
          setFormData({
            full_name: newProfile.full_name || "",
            headline: "",
            bio: "",
            location: "",
            phone: "",
            linkedin_url: "",
            profile_photo: "",
            cover_photo: "",
            skills: [],
          });
        }
      } else {
        setFormData({
          full_name: profile.full_name || "",
          headline: profile.headline || "",
          bio: profile.bio || "",
          location: profile.location || "",
          phone: profile.phone || "",
          linkedin_url: profile.linkedin_url || "",
          profile_photo: profile.profile_photo || "",
          cover_photo: profile.cover_photo || "",
          skills: profile.skills || [],
        });
        setExperience(profile.experience || []);
        setEducation(profile.education || []);
      }
    } catch (error) {
      console.error("Unexpected error loading profile:", error);
      setMessage({ type: "error", text: "Unexpected error: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempProfileImage(reader.result);
      setShowProfileCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileCropComplete = async (croppedBlob) => {
    setUploadingProfile(true);
    setShowProfileCrop(false);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", croppedBlob, "profile.jpg");
      formDataUpload.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        profile_photo: data.secure_url,
      }));

      setMessage({
        type: "success",
        text: "Profile photo uploaded successfully!",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload profile photo" });
    } finally {
      setUploadingProfile(false);
      setTempProfileImage(null);
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempCoverImage(reader.result);
      setShowCoverCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverCropComplete = async (croppedBlob) => {
    setUploadingCover(true);
    setShowCoverCrop(false);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", croppedBlob, "cover.jpg");
      formDataUpload.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        cover_photo: data.secure_url,
      }));

      setMessage({
        type: "success",
        text: "Cover photo uploaded successfully!",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload cover photo" });
    } finally {
      setUploadingCover(false);
      setTempCoverImage(null);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const addExperience = () => {
    setExperience([
      ...experience,
      {
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
    ]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducation([
      ...education,
      {
        school: "",
        degree: "",
        field: "",
        startYear: "",
        endYear: "",
      },
    ]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          linkedin_url: formData.linkedin_url,
          profile_photo: formData.profile_photo,
          cover_photo: formData.cover_photo,
          skills: formData.skills,
          experience: experience,
          education: education,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              href="/profile"
              className="text-gray-600 hover:text-blue-600 transition"
            >
              ← Cancel
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Photo Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600">
              {formData.cover_photo && (
                <Image
                  src={formData.cover_photo}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              )}
              <label className="absolute bottom-4 right-4 cursor-pointer">
                <div className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              {uploadingCover && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <p className="text-white">Uploading cover...</p>
                </div>
              )}
            </div>

            {/* Profile Photo */}
            <div className="px-6 pb-6 -mt-16">
              <div className="relative inline-block">
                {formData.profile_photo ? (
                  <Image
                    src={formData.profile_photo}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl font-bold text-blue-600">
                    {formData.full_name?.charAt(0) || "U"}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition">
                    <svg
                      className="w-4 h-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={uploadingProfile}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingProfile && (
                <p className="text-sm text-gray-500 mt-2">
                  Uploading profile photo...
                </p>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Headline
                </label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g., Cardiologist at Apollo Hospital"
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Mumbai, India"
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* About/Bio */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={5}
              placeholder="Write a summary about yourself, your expertise, and what you're passionate about..."
              className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSkill())
                }
                placeholder="Add a skill (e.g., Patient Care)"
                className="flex-1 px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Experience</h2>
              <button
                type="button"
                onClick={addExperience}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Experience {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(index, "title", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(index, "company", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Start Date (e.g., Jan 2020)"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExperience(index, "startDate", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      value={exp.endDate}
                      onChange={(e) =>
                        updateExperience(index, "endDate", e.target.value)
                      }
                      disabled={exp.current}
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                  </div>

                  <label className="flex items-center mt-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) =>
                        updateExperience(index, "current", e.target.checked)
                      }
                      className="mr-2"
                    />
                    I currently work here
                  </label>

                  <textarea
                    placeholder="Description (optional)"
                    value={exp.description}
                    onChange={(e) =>
                      updateExperience(index, "description", e.target.value)
                    }
                    rows={3}
                    className="w-full mt-3 px-4 py-2 text-black border border-gray-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Education</h2>
              <button
                type="button"
                onClick={addEducation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Education
              </button>
            </div>

            <div className="space-y-6">
              {education.map((edu, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Education {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="School/University"
                      value={edu.school}
                      onChange={(e) =>
                        updateEducation(index, "school", e.target.value)
                      }
                      className="col-span-2 px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g., MBBS)"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Field of Study"
                      value={edu.field}
                      onChange={(e) =>
                        updateEducation(index, "field", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Start Year (e.g., 2015)"
                      value={edu.startYear}
                      onChange={(e) =>
                        updateEducation(index, "startYear", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="End Year (e.g., 2020)"
                      value={edu.endYear}
                      onChange={(e) =>
                        updateEducation(index, "endYear", e.target.value)
                      }
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <Link
              href="/profile"
              className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
      {/* Crop Modals */}
      {showCoverCrop && tempCoverImage && (
        <ImageCropModal
          image={tempCoverImage}
          onComplete={handleCoverCropComplete}
          onCancel={() => {
            setShowCoverCrop(false);
            setTempCoverImage(null);
          }}
          aspectRatio={16 / 5}
        />
      )}

      {showProfileCrop && tempProfileImage && (
        <ImageCropModal
          image={tempProfileImage}
          onComplete={handleProfileCropComplete}
          onCancel={() => {
            setShowProfileCrop(false);
            setTempProfileImage(null);
          }}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
