import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import Loader from "../components/ui/Loader";
import PostList from "../components/post/PostList";
import PostModal from "../components/post/PostModal";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const normalizeWebsiteUrl = (website) => {
  if (!website) return "";

  const trimmedWebsite = website.trim();

  if (!trimmedWebsite) return "";

  if (
    trimmedWebsite.startsWith("http://") ||
    trimmedWebsite.startsWith("https://")
  ) {
    return trimmedWebsite;
  }

  return `https://${trimmedWebsite}`;
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?._id && id === user._id) {
      navigate("/profile", {
        replace: true,
      });
    }
  }, [id, user?._id, navigate]);

  useEffect(() => {
    const getUserProfile = async () => {
      if (!id || id === user?._id) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [userResponse, savedResponse] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/users/saved"),
        ]);

        const loadedUser = userResponse.data?.user || null;
        const loadedPosts = Array.isArray(userResponse.data?.posts)
          ? userResponse.data.posts
          : [];

        setProfileUser(loadedUser);
        setPosts(loadedPosts);

        setSavedPostIds(
          Array.isArray(savedResponse.data)
            ? savedResponse.data.map((post) => post._id)
            : [],
        );

        setIsFollowing(
          loadedUser?.followers?.some((follower) => {
            const followerId =
              typeof follower === "string" ? follower : follower?._id;

            return followerId === user?._id;
          }) || false,
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile",
        );
      } finally {
        setIsLoading(false);
      }
    };

    getUserProfile();
  }, [id, user?._id]);

  const handleFollow = async () => {
    if (
      !profileUser?._id ||
      profileUser._id === user?._id
    ) {
      return;
    }

    try {
      const { data } = await api.post(
        `/users/${id}/follow`,
      );

      setIsFollowing(Boolean(data.isFollowing));

      setProfileUser((previousProfile) => {
        if (!previousProfile) return previousProfile;

        const currentFollowers = Array.isArray(
          previousProfile.followers,
        )
          ? previousProfile.followers
          : [];

        return {
          ...previousProfile,
          followers: data.isFollowing
            ? [...currentFollowers, user._id]
            : currentFollowers.filter((follower) => {
                const followerId =
                  typeof follower === "string"
                    ? follower
                    : follower?._id;

                return followerId !== user._id;
              }),
        };
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to follow user",
      );
    }
  };

  const handleOpenMessages = () => {
    if (
      !profileUser?._id ||
      profileUser._id === user?._id
    ) {
      return;
    }

    navigate(`/messages?user=${profileUser._id}`);
  };

  const handlePostChange = (
    updatedPost,
    options = {},
  ) => {
    const deletedPostId = options.deletedPostId;

    if (deletedPostId) {
      setPosts((previousPosts) =>
        previousPosts.filter(
          (post) => post._id !== deletedPostId,
        ),
      );

      setSavedPostIds((previousIds) =>
        previousIds.filter(
          (postId) => postId !== deletedPostId,
        ),
      );

      setSelectedPost((previousPost) =>
        previousPost?._id === deletedPostId
          ? null
          : previousPost,
      );

      return;
    }

    if (!updatedPost?._id) return;

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post._id === updatedPost._id
          ? {
              ...post,
              ...updatedPost,
            }
          : post,
      ),
    );

    setSelectedPost((previousPost) =>
      previousPost?._id === updatedPost._id
        ? {
            ...previousPost,
            ...updatedPost,
          }
        : previousPost,
    );

    if (options.saved !== undefined) {
      setSavedPostIds((previousIds) =>
        options.saved
          ? [
              ...new Set([
                ...previousIds,
                updatedPost._id,
              ]),
            ]
          : previousIds.filter(
              (postId) =>
                postId !== updatedPost._id,
            ),
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <p className="profile-error" role="alert">
        {error}
      </p>
    );
  }

  if (!profileUser) {
    return (
      <p className="profile-error">
        Profile not found.
      </p>
    );
  }

  const isOwnProfile =
    profileUser._id === user?._id;

  const websiteUrl = normalizeWebsiteUrl(
    profileUser.website,
  );

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="profile-avatar">
          <img
            src={
              profileUser.avatar ||
              "https://placehold.co/150x150"
            }
            alt={
              profileUser.username ||
              profileUser.fullName ||
              "Profile"
            }
          />
        </div>

        <div className="profile-info">
          <div className="profile-top">
            <h2>{profileUser.username}</h2>

            {isOwnProfile ? (
              <Link
                to="/profile/edit"
                className="profile-edit-btn"
              >
                Edit profile
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={
                    isFollowing
                      ? "following-btn"
                      : "follow-btn"
                  }
                  onClick={handleFollow}
                >
                  {isFollowing
                    ? "Following"
                    : "Follow"}
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
              <strong>{posts.length}</strong>{" "}
              posts
            </span>

            <span>
              <strong>
                {profileUser.followers?.length || 0}
              </strong>{" "}
              followers
            </span>

            <span>
              <strong>
                {profileUser.following?.length || 0}
              </strong>{" "}
              following
            </span>
          </div>

          <div className="profile-bio">
            {profileUser.fullName && (
              <strong>
                {profileUser.fullName}
              </strong>
            )}

            {profileUser.bio && (
              <p>{profileUser.bio}</p>
            )}

            {websiteUrl && (
              <a
                className="profile-website"
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={profileUser.website}
              >
                {profileUser.website}
              </a>
            )}
          </div>
        </div>
      </section>

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        onPostChange={handlePostChange}
        onOpenPost={setSelectedPost}
      />

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostChange={handlePostChange}
        />
      )}
    </main>
  );
};

export default UserProfile;