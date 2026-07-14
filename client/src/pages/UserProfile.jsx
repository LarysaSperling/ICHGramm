import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";
import Loader from "../components/ui/Loader";
import PostList from "../components/post/PostList";
import PostModal from "../components/post/PostModal";
import ProfileBio from "../components/profile/ProfileBio";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const getFollowerUserId = (followItem) => {
  const follower = followItem?.follower;

  if (typeof follower === "string") {
    return follower;
  }

  return follower?._id || null;
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileUser, setProfileUser] =
    useState(null);

  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] =
    useState([]);

  const [followers, setFollowers] =
    useState([]);

  const [following, setFollowing] =
    useState([]);

  const [selectedPost, setSelectedPost] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isFollowing, setIsFollowing] =
    useState(false);

  const [
    isFollowLoading,
    setIsFollowLoading,
  ] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (user?._id && id === user._id) {
      navigate("/profile", {
        replace: true,
      });
    }
  }, [id, user?._id, navigate]);

  const loadFollowData =
    useCallback(async () => {
      if (!id) return;

      const [
        followersResponse,
        followingResponse,
      ] = await Promise.all([
        api.get(
          `/follows/${id}/followers`,
        ),
        api.get(
          `/follows/${id}/following`,
        ),
      ]);

      const loadedFollowers =
        Array.isArray(
          followersResponse.data,
        )
          ? followersResponse.data
          : [];

      const loadedFollowing =
        Array.isArray(
          followingResponse.data,
        )
          ? followingResponse.data
          : [];

      setFollowers(loadedFollowers);
      setFollowing(loadedFollowing);

      setIsFollowing(
        loadedFollowers.some(
          (followItem) =>
            getFollowerUserId(
              followItem,
            ) === user?._id,
        ),
      );
    }, [id, user?._id]);

  const loadUserProfile =
    useCallback(async () => {
      if (!id || id === user?._id) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [
          userResponse,
          savedResponse,
          followersResponse,
          followingResponse,
        ] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/users/saved"),
          api.get(
            `/follows/${id}/followers`,
          ),
          api.get(
            `/follows/${id}/following`,
          ),
        ]);

        const loadedUser =
          userResponse.data?.user || null;

        const loadedPosts =
          Array.isArray(
            userResponse.data?.posts,
          )
            ? userResponse.data.posts
            : [];

        const loadedFollowers =
          Array.isArray(
            followersResponse.data,
          )
            ? followersResponse.data
            : [];

        const loadedFollowing =
          Array.isArray(
            followingResponse.data,
          )
            ? followingResponse.data
            : [];

        setProfileUser(loadedUser);
        setPosts(loadedPosts);
        setFollowers(loadedFollowers);
        setFollowing(loadedFollowing);

        setSavedPostIds(
          Array.isArray(savedResponse.data)
            ? savedResponse.data.map(
                (post) => post._id,
              )
            : [],
        );

        setIsFollowing(
          loadedFollowers.some(
            (followItem) =>
              getFollowerUserId(
                followItem,
              ) === user?._id,
          ),
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile",
        );
      } finally {
        setIsLoading(false);
      }
    }, [id, user?._id]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleFollow = async () => {
    if (
      !profileUser?._id ||
      profileUser._id === user?._id ||
      isFollowLoading
    ) {
      return;
    }

    const nextFollowingStatus =
      !isFollowing;

    try {
      setIsFollowLoading(true);
      setError("");

      if (nextFollowingStatus) {
        await api.post(
          `/follows/${profileUser._id}`,
        );
      } else {
        await api.delete(
          `/follows/${profileUser._id}`,
        );
      }

      setIsFollowing(
        nextFollowingStatus,
      );

      await loadFollowData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (nextFollowingStatus
            ? "Failed to follow user"
            : "Failed to unfollow user"),
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleAuthorFollowChange =
    async (
      nextFollowingStatus,
      authorId,
    ) => {
      if (
        authorId !== profileUser?._id
      ) {
        return;
      }

      setIsFollowing(
        nextFollowingStatus,
      );

      try {
        await loadFollowData();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to update follow statistics",
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

    navigate(
      `/messages?user=${profileUser._id}`,
    );
  };

  const handlePostChange = (
    updatedPost,
    options = {},
  ) => {
    const deletedPostId =
      options.deletedPostId;

    if (deletedPostId) {
      setPosts((previousPosts) =>
        previousPosts.filter(
          (post) =>
            post._id !== deletedPostId,
        ),
      );

      setSavedPostIds(
        (previousIds) =>
          previousIds.filter(
            (postId) =>
              postId !== deletedPostId,
          ),
      );

      setSelectedPost(
        (previousPost) =>
          previousPost?._id ===
          deletedPostId
            ? null
            : previousPost,
      );

      return;
    }

    if (!updatedPost?._id) {
      return;
    }

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

    setSelectedPost(
      (previousPost) =>
        previousPost?._id ===
        updatedPost._id
          ? {
              ...previousPost,
              ...updatedPost,
            }
          : previousPost,
    );

    if (
      typeof options.saved ===
      "boolean"
    ) {
      setSavedPostIds(
        (previousIds) =>
          options.saved
            ? [
                ...new Set([
                  ...previousIds,
                  updatedPost._id,
                ]),
              ]
            : previousIds.filter(
                (postId) =>
                  postId !==
                  updatedPost._id,
              ),
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <p
        className="profile-error"
        role="alert"
      >
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
            <h2>
              {profileUser.username}
            </h2>

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
                  disabled={
                    isFollowLoading
                  }
                >
                  {isFollowLoading
                    ? "Loading..."
                    : isFollowing
                      ? "Following"
                      : "Follow"}
                </button>

                <button
                  type="button"
                  className="message-btn"
                  onClick={
                    handleOpenMessages
                  }
                >
                  Message
                </button>
              </>
            )}
          </div>

          <div className="profile-stats">
            <span>
              <strong>
                {posts.length}
              </strong>{" "}
              posts
            </span>

            <span>
              <strong>
                {followers.length}
              </strong>{" "}
              followers
            </span>

            <span>
              <strong>
                {following.length}
              </strong>{" "}
              following
            </span>
          </div>

          <ProfileBio
            fullName={
              profileUser.fullName
            }
            bio={profileUser.bio}
            website={
              profileUser.website
            }
          />
        </div>
      </section>

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        onPostChange={handlePostChange}
        onOpenPost={setSelectedPost}
        isAuthorFollowing={
          isFollowing
        }
        onAuthorFollowChange={
          handleAuthorFollowChange
        }
      />

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() =>
            setSelectedPost(null)
          }
          onPostChange={
            handlePostChange
          }
        />
      )}
    </main>
  );
};

export default UserProfile;