import { useEffect, useState } from "react";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";

import "../styles/profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data } = await api.get("/users/profile");
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };

    getProfile();
  }, []);

  if (error) {
    return <p className="profile-error">{error}</p>;
  }

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <section className="profile-page">
      <header className="profile-header">
        <Avatar
          src={profile.avatar}
          name={profile.username || profile.fullName}
          size={150}
        />

        <div className="profile-info">
          <div className="profile-top">
            <h2>{profile.username}</h2>
            <button type="button">Edit profile</button>
          </div>

          <div className="profile-stats">
            <span>
              <strong>0</strong> posts
            </span>
            <span>
              <strong>0</strong> followers
            </span>
            <span>
              <strong>0</strong> following
            </span>
          </div>

          <div className="profile-bio">
            <strong>{profile.fullName}</strong>
            <p>{profile.bio || "No bio yet."}</p>
          </div>
        </div>
      </header>

      <div className="profile-tabs">
        <button type="button">POSTS</button>
        <button type="button">SAVED</button>
        <button type="button">TAGGED</button>
      </div>

      <div className="profile-empty">
        <p>No posts yet.</p>
      </div>
    </section>
  );
};

export default Profile;