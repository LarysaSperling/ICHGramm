import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import Loader from "../components/ui/Loader";
import PostList from "../components/post/PostList";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user?._id && id === user._id) {
      navigate("/profile", { replace: true });
    }
  }, [id, user, navigate]);

  useEffect(() => {
    const getUserProfile = async () => {
      if (!id || id === user?._id) return;

      try {
        setIsLoading(true);

        const { data } = await api.get(`/users/${id}`);

        setProfileUser(data.user);
        setPosts(data.posts || []);

        setIsFollowing(
          data.user.followers?.some(
            (followerId) => followerId === user?._id
          ) || false
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    getUserProfile();
  }, [id, user]);

  const handleFollow = async () => {
    if (!profileUser?._id || profileUser._id === user?._id) return;

    try {
      const { data } = await api.post(`/users/${id}/follow`);

      setIsFollowing(data.isFollowing);

      setProfileUser((prev) => ({
        ...prev,
        followers: data.isFollowing
          ? [...(prev.followers || []), user._id]
          : (prev.followers || []).filter(
              (followerId) => followerId !== user._id
            ),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to follow user");
    }
  };

  const handleOpenMessages = () => {
    if (!profileUser?._id || profileUser._id === user?._id) return;

    navigate(`/messages?user=${profileUser._id}`);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <p className="profile-error">{error}</p>;
  }

  const isOwnProfile = profileUser?._id === user?._id;

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="profile-avatar">
          <img
            src={profileUser?.avatar || "https://placehold.co/150x150"}
            alt={profileUser?.username || "Profile"}
          />
        </div>

        <div className="profile-info">
          <div className="profile-top">
            <h2>{profileUser?.username}</h2>

            {isOwnProfile ? (
              <Link to="/profile/edit" className="profile-edit-btn">
                Edit profile
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={isFollowing ? "following-btn" : "follow-btn"}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>

                <button
                  type="button"
                  className="message-btn"
                  onClick={handleOpenMessages}
                >
                  Message
                </button>
              </>
            )}
          </div>

          <div className="profile-stats">
            <span>
              <strong>{posts.length}</strong> posts
            </span>

            <span>
              <strong>{profileUser?.followers?.length || 0}</strong> followers
            </span>

            <span>
              <strong>{profileUser?.following?.length || 0}</strong> following
            </span>
          </div>

          <div className="profile-bio">
            <strong>{profileUser?.fullName}</strong>

            <p>{profileUser?.bio}</p>

            <p>{profileUser?.website}</p>
          </div>
        </div>
      </section>

      <PostList posts={posts} />
    </main>
  );
};

export default UserProfile;