import { useCallback, useEffect, useState } from "react";

import api from "../api/axios";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileGrid from "../components/profile/ProfileGrid";

import "../styles/profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const profileResponse = await api.get("/users/profile");
      const loadedProfile = profileResponse.data;

      if (!loadedProfile?._id) {
        throw new Error("Profile ID is missing");
      }

      const [
        postsResponse,
        savedResponse,
        followersResponse,
        followingResponse,
      ] = await Promise.all([
        api.get("/users/profile/posts"),
        api.get("/users/saved"),
        api.get(`/follows/${loadedProfile._id}/followers`),
        api.get(`/follows/${loadedProfile._id}/following`),
      ]);

      setProfile(loadedProfile);

      setPosts(
        Array.isArray(postsResponse.data)
          ? postsResponse.data
          : [],
      );

      setSavedPosts(
        Array.isArray(savedResponse.data)
          ? savedResponse.data
          : [],
      );

      setFollowersCount(
        Array.isArray(followersResponse.data)
          ? followersResponse.data.length
          : 0,
      );

      setFollowingCount(
        Array.isArray(followingResponse.data)
          ? followingResponse.data.length
          : 0,
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load profile",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleWindowFocus = () => {
      loadProfile();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadProfile]);

  const handleDeletePost = async (postId) => {
    const isConfirmed = window.confirm(
      "Delete this post?",
    );

    if (!isConfirmed) return;

    try {
      setError("");

      await api.delete(`/posts/${postId}`);

      setPosts((previousPosts) =>
        previousPosts.filter(
          (post) => post._id !== postId,
        ),
      );

      setSavedPosts((previousPosts) =>
        previousPosts.filter(
          (post) => post._id !== postId,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete post",
      );
    }
  };

  const handleUpdatePost = async (
    postId,
    newCaption,
  ) => {
    try {
      setError("");

      const { data } = await api.put(
        `/posts/${postId}`,
        {
          caption: newCaption,
        },
      );

      const updatedPost = data.post || data;

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                ...updatedPost,
              }
            : post,
        ),
      );

      setSavedPosts((previousPosts) =>
        previousPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                ...updatedPost,
              }
            : post,
        ),
      );

      return updatedPost;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update post",
      );

      return null;
    }
  };

  const visiblePosts =
    activeTab === "saved" ? savedPosts : posts;

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <p className="profile-error" role="alert">
        {error}
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="profile-error">
        Profile not found.
      </p>
    );
  }

  return (
    <section className="profile-page">
      <ProfileHeader
        profile={profile}
        postsCount={posts.length}
        followersCount={followersCount}
        followingCount={followingCount}
      />

      <div className="profile-tabs">
        <button
          type="button"
          className={
            activeTab === "posts" ? "active" : ""
          }
          onClick={() => setActiveTab("posts")}
        >
          POSTS
        </button>

        <button
          type="button"
          className={
            activeTab === "saved" ? "active" : ""
          }
          onClick={() => setActiveTab("saved")}
        >
          SAVED
        </button>

        <button
          type="button"
          className={
            activeTab === "tagged" ? "active" : ""
          }
          onClick={() => setActiveTab("tagged")}
        >
          TAGGED
        </button>
      </div>

      {activeTab === "tagged" ? (
        <div className="profile-empty">
          <div className="profile-empty-icon">
            🏷️
          </div>

          <h3>No Tagged Posts</h3>

          <p>
            Photos you are tagged in will appear
            here.
          </p>
        </div>
      ) : (
        <ProfileGrid
          posts={visiblePosts}
          emptyTitle={
            activeTab === "saved"
              ? "No Saved Posts"
              : "Share Photos"
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