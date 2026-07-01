import { useEffect, useState } from "react";

import api from "../api/axios";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileGrid from "../components/profile/ProfileGrid";

import "../styles/profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResponse, postsResponse] = await Promise.all([
          api.get("/users/profile"),
          api.get("/users/profile/posts"),
        ]);

        setProfile(profileResponse.data);
        setPosts(postsResponse.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load profile"
        );
      }
    };

    loadProfile();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <section className="profile-page">
      <ProfileHeader
        profile={profile}
        postsCount={posts.length}
      />

      <div className="profile-tabs">
        <button>POSTS</button>
        <button>SAVED</button>
        <button>TAGGED</button>
      </div>

      <ProfileGrid posts={posts} />
    </section>
  );
};

export default Profile;