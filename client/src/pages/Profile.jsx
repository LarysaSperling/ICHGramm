import { useEffect, useState } from "react";

import api from "../api/axios";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileGrid from "../components/profile/ProfileGrid";

import "../styles/profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResponse, postsResponse, savedResponse] =
          await Promise.all([
            api.get("/users/profile"),
            api.get("/users/profile/posts"),
            api.get("/users/saved"),
          ]);

        setProfile(profileResponse.data);
        setPosts(postsResponse.data);
        setSavedPosts(savedResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  const handleDeletePost = async (postId) => {
    const isConfirmed = window.confirm("Delete this post?");

    if (!isConfirmed) return;

    try {
      await api.delete(`/posts/${postId}`);

      setPosts((prev) => prev.filter((post) => post._id !== postId));
      setSavedPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handleUpdatePost = async (postId, newCaption) => {
    try {
      const { data } = await api.put(`/posts/${postId}`, {
        caption: newCaption,
      });

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, caption: data.caption } : post
        )
      );

      setSavedPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, caption: data.caption } : post
        )
      );

      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update post");
      return null;
    }
  };

  const visiblePosts = activeTab === "saved" ? savedPosts : posts;

  if (error) {
    return <p className="profile-error">{error}</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <section className="profile-page">
      <ProfileHeader profile={profile} postsCount={posts.length} />

      <div className="profile-tabs">
        <button
          type="button"
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          POSTS
        </button>

        <button
          type="button"
          className={activeTab === "saved" ? "active" : ""}
          onClick={() => setActiveTab("saved")}
        >
          SAVED
        </button>

        <button
          type="button"
          className={activeTab === "tagged" ? "active" : ""}
          onClick={() => setActiveTab("tagged")}
        >
          TAGGED
        </button>
      </div>

      {activeTab === "tagged" ? (
        <div className="profile-empty">
          <div className="profile-empty-icon">🏷️</div>
          <h3>No Tagged Posts</h3>
          <p>Photos you are tagged in will appear here.</p>
        </div>
      ) : (
        <ProfileGrid
          posts={visiblePosts}
          emptyTitle={
            activeTab === "saved" ? "No Saved Posts" : "Share Photos"
          }
          emptyText={
            activeTab === "saved"
              ? "Posts you save will appear here."
              : "When you share photos, they will appear on your profile."
          }
          onDeletePost={handleDeletePost}
          onUpdatePost={handleUpdatePost}
        />
      )}
    </section>
  );
};

export default Profile;