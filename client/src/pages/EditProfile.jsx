import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";

import "../styles/editProfile.css";

const EditProfile = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await api.get("/users/profile");

      setForm({
        fullName: data.fullName,
        bio: data.bio,
      });

      setPreview(data.avatar);
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleAvatar = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();

    formData.append("fullName", form.fullName);
    formData.append("bio", form.bio);

    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      setLoading(true);

      await api.put("/users/profile", formData);

      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="edit-profile-page">
      <h1>Edit profile</h1>

      <form
        className="edit-profile-form"
        onSubmit={handleSubmit}
      >
        <div className="edit-avatar">
          <Avatar
            src={preview}
            name={form.fullName}
            size={70}
          />

          <label>
            Change photo

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
            />
          </label>
        </div>

        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Full name"
        />

        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Bio"
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
};

export default EditProfile;