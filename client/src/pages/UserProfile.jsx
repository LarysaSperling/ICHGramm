import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/axios";
import Loader from "../components/ui/Loader";
import PostList from "../components/post/PostList";

import "../styles/profile.css";

const UserProfile = () => {
  const { id } = useParams();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        setIsLoading(true);

        const { data } = await api.get(`/users/${id}`);

        setProfileUser(data.user);
        setPosts(data.posts || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    getUserProfile();
  }, [id]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <p className="profile-error">{error}</p>;
  }

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

            <button className="follow-btn">Follow</button>
            <button className="message-btn">Message</button>
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