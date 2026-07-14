import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import Loader from "../ui/Loader";
import PostList from "../post/PostList";
import StoryList from "../story/StoryList";
import PostModal from "../post/PostModal";

import seenUpdatesIcon from "../../assets/icons/seen-updates.svg";

import "../../styles/feed.css";

const POSTS_LIMIT = 5;

const getFollowingUserId = (followItem) => {
  const following = followItem?.following;

  if (typeof following === "string") {
    return following;
  }

  return following?._id || null;
};

const mergeUniquePosts = (
  previousPosts,
  nextPosts,
) => {
  const postsMap = new Map();

  [...previousPosts, ...nextPosts].forEach(
    (post) => {
      if (post?._id) {
        postsMap.set(post._id, post);
      }
    },
  );

  return [...postsMap.values()];
};

const Feed = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || null;

  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] =
    useState([]);

  const [
    followingUserIds,
    setFollowingUserIds,
  ] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] = useState(false);

  const [error, setError] = useState("");

  const [selectedPost, setSelectedPost] =
    useState(null);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const isLoadingMoreRef = useRef(false);
  const loadedPagesRef = useRef(new Set());

  const loadSavedPosts =
    useCallback(async () => {
      try {
        const { data } = await api.get(
          "/users/saved",
        );

        const savedIds = Array.isArray(data)
          ? data
              .map((post) => post?._id)
              .filter(Boolean)
          : [];

        setSavedPostIds(savedIds);
      } catch (err) {
        console.error(
          err.response?.data?.message ||
            "Failed to load saved posts",
        );

        setSavedPostIds([]);
      }
    }, []);

  const loadFollowingUsers =
    useCallback(async () => {
      if (!currentUserId) {
        setFollowingUserIds([]);
        return;
      }

      try {
        const { data } = await api.get(
          `/follows/${currentUserId}/following`,
        );

        const followingIds = Array.isArray(data)
          ? data
              .map(getFollowingUserId)
              .filter(Boolean)
          : [];

        setFollowingUserIds(followingIds);
      } catch (err) {
        console.error(
          err.response?.data?.message ||
            "Failed to load following users",
        );

        setFollowingUserIds([]);
      }
    }, [currentUserId]);

  const loadPosts = useCallback(
    async (pageNumber) => {
      if (
        pageNumber > 1 &&
        (isLoadingMoreRef.current ||
          loadedPagesRef.current.has(pageNumber))
      ) {
        return;
      }

      if (pageNumber > 1) {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      try {
        setError("");

        const { data } = await api.get(
          `/posts?page=${pageNumber}&limit=${POSTS_LIMIT}`,
        );

        const nextPosts = Array.isArray(
          data?.posts,
        )
          ? data.posts
          : [];

        setPosts((previousPosts) =>
          pageNumber === 1
            ? mergeUniquePosts([], nextPosts)
            : mergeUniquePosts(
                previousPosts,
                nextPosts,
              ),
        );

        loadedPagesRef.current.add(pageNumber);

        setHasMore(Boolean(data?.hasMore));
        setPage(pageNumber);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load posts",
        );
      } finally {
        if (pageNumber > 1) {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoading(true);
        setError("");

        loadedPagesRef.current = new Set();
        isLoadingMoreRef.current = false;

        await Promise.allSettled([
          loadPosts(1),
          loadSavedPosts(),
          loadFollowingUsers(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeed();
  }, [
    loadPosts,
    loadSavedPosts,
    loadFollowingUsers,
  ]);

  useEffect(() => {
    if (
      !loadMoreRef.current ||
      !hasMore ||
      isLoading ||
      isLoadingMore
    ) {
      return undefined;
    }

    observerRef.current?.disconnect();

    observerRef.current =
      new IntersectionObserver(
        (entries) => {
          const firstEntry = entries[0];

          if (
            firstEntry.isIntersecting &&
            hasMore &&
            !isLoadingMoreRef.current
          ) {
            loadPosts(page + 1);
          }
        },
        {
          root: null,
          rootMargin: "200px",
          threshold: 0,
        },
      );

    observerRef.current.observe(
      loadMoreRef.current,
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [
    hasMore,
    isLoading,
    isLoadingMore,
    loadPosts,
    page,
  ]);

  const handleAuthorFollowChange =
    useCallback(
      (
        nextFollowingStatus,
        authorId,
      ) => {
        if (!authorId) return;

        setFollowingUserIds(
          (previousIds) =>
            nextFollowingStatus
              ? [
                  ...new Set([
                    ...previousIds,
                    authorId,
                  ]),
                ]
              : previousIds.filter(
                  (userId) =>
                    userId !== authorId,
                ),
        );
      },
      [],
    );

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

      setSavedPostIds((previousIds) =>
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

    if (updatedPost?._id) {
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
    }

    if (
      typeof options.saved ===
        "boolean" &&
      updatedPost?._id
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

  return (
    <section className="feed">
      <StoryList />

      {error && (
        <p
          className="feed-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        followingUserIds={
          followingUserIds
        }
        onPostChange={handlePostChange}
        onOpenPost={setSelectedPost}
        onAuthorFollowChange={
          handleAuthorFollowChange
        }
      />

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="feed-infinite-loader"
        >
          {isLoadingMore && <Loader />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="feed-end">
          <img
            className="feed-end-icon-image"
            src={seenUpdatesIcon}
            alt="Seen all updates"
          />

          <h3>
            You have seen all the updates
          </h3>

          <p>
            You have viewed all new
            publications
          </p>
        </div>
      )}

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
    </section>
  );
};

export default Feed;