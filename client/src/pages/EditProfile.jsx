import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";
import { useAuth } from "../context/AuthContext";

import "../styles/editProfile.css";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    website: "",
    bio: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setError("");

        const { data } = await api.get(
          "/users/profile",
        );

        setFormData({
          username: data.username || "",
          website: data.website || "",
          bio: data.bio || "",
        });

        setPreview(data.avatar || "");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile",
        );
      } finally {
        setIsProfileLoading(false);
      }
    };

    getProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (
        preview &&
        preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (file.size > MAX_AVATAR_SIZE) {
      setError(
        "Avatar must not exceed 2 MB",
      );
      event.target.value = "";
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      setError(
        "Only JPG, PNG and WEBP images are allowed",
      );
      event.target.value = "";
      return;
    }

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedUsername =
      formData.username.trim();

    if (!normalizedUsername) {
      setError("Username is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const dataToSend = new FormData();

      dataToSend.append(
        "username",
        normalizedUsername,
      );

      dataToSend.append(
        "website",
        formData.website.trim(),
      );

      dataToSend.append(
        "bio",
        formData.bio.trim(),
      );

      if (avatar) {
        dataToSend.append("avatar", avatar);
      }

      await api.put(
        "/users/profile",
        dataToSend,
      );

      const { data: updatedProfile } =
        await api.get("/users/profile");

      updateUser(updatedProfile);

      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    return (
      <section className="edit-profile-page">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="edit-profile-page">
      <div className="edit-profile-container">
        <h1>Edit profile</h1>

        <form
          className="edit-profile-form"
          onSubmit={handleSubmit}
        >
          <div className="edit-profile-avatar-box">
            <Avatar
              src={preview}
              name={
                formData.username ||
                "User"
              }
              size={56}
            />

            <div className="edit-profile-avatar-info">
              <strong>
                {formData.username ||
                  "Username"}
              </strong>

              <p>
                {formData.bio ||
                  "Add information about yourself"}
              </p>
            </div>

            <label className="edit-profile-photo-btn">
              New photo

              <input
                id="avatar"
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
              />
            </label>
          </div>

          <label
            className="edit-profile-field"
            htmlFor="username"
          >
            <span>Username</span>

            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              autoComplete="username"
              maxLength={30}
              required
            />
          </label>

          <label
            className="edit-profile-field"
            htmlFor="website"
          >
            <span>Website</span>

            <input
              id="website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website"
              autoComplete="url"
            />
          </label>

          <label
            className="edit-profile-field"
            htmlFor="bio"
          >
            <span>About</span>

            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell something about yourself..."
              maxLength={150}
            />

            <small>
              {formData.bio.length} / 150
            </small>
          </label>

          {error && (
            <p
              className="edit-profile-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="edit-profile-save"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Saving..."
              : "Save"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditProfile;
