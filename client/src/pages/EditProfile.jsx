import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";

import "../styles/editProfile.css";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EditProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    website: "",
    bio: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data } = await api.get("/users/profile");

        setFormData({
          fullName: data.fullName || "",
          website: data.website || "",
          bio: data.bio || "",
        });

        setPreview(data.avatar || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };

    getProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setError("");

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Avatar must not exceed 2 MB");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed");
      return;
    }

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const dataToSend = new FormData();

    dataToSend.append("fullName", formData.fullName.trim());
    dataToSend.append("website", formData.website.trim());
    dataToSend.append("bio", formData.bio.trim());

    if (avatar) {
      dataToSend.append("avatar", avatar);
    }

    try {
      setIsLoading(true);

      const { data } = await api.put("/users/profile", dataToSend);

      navigate(`/profile/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="edit-profile-page">
      <div className="edit-profile-container">
        <h1>Edit profile</h1>

        <form className="edit-profile-form" onSubmit={handleSubmit}>
          <div className="edit-profile-avatar-box">
            <Avatar src={preview} name={formData.fullName} size={56} />

            <div>
              <strong>{formData.fullName || "User"}</strong>
              <p>Update your profile photo</p>
            </div>

            <label className="edit-profile-photo-btn">
              New photo
              <input
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <label className="edit-profile-field">
            <span>Full name</span>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              autoComplete="name"
            />
          </label>

          <label className="edit-profile-field">
            <span>Website</span>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Website"
              autoComplete="url"
            />
          </label>

          <label className="edit-profile-field">
            <span>Bio</span>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell something about yourself..."
              maxLength={150}
            />
            <small>{formData.bio.length}/150</small>
          </label>

          {error && <p className="edit-profile-error">{error}</p>}

          <button
            className="edit-profile-save"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditProfile;