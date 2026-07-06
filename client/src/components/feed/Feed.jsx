import { useCallback, useEffect, useRef, useState } from "react";

import api from "../../api/axios";
import Loader from "../ui/Loader";
import PostList from "../post/PostList";
import StoryList from "../story/StoryList";
import PostModal from "../post/PostModal";

import seenUpdatesIcon from "../../assets/icons/seen-updates.svg";

import "../../styles/feed.css";

const POSTS_LIMIT = 5;

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const loadSavedPosts = useCallback(async () => {
    const savedResponse = await api.get("/users/saved");

    const savedIds = Array.isArray(savedResponse.data)
      ? savedResponse.data.map((post) => post._id)
      : [];

    setSavedPostIds(savedIds);
  }, []);

  const loadPosts = useCallback(async (pageNumber) => {
    try {
      setError("");

      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const postsResponse = await api.get(
        `/posts?page=${pageNumber}&limit=${POSTS_LIMIT}`
      );

      const nextPosts = postsResponse.data.posts || [];

      setPosts((prev) =>
        pageNumber === 1 ? nextPosts : [...prev, ...nextPosts]
      );

      setHasMore(Boolean(postsResponse.data.hasMore));
      setPage(pageNumber);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadPosts(1), loadSavedPosts()]);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load feed");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeed();
  }, [loadPosts, loadSavedPosts]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading || isLoadingMore) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && hasMore && !isLoadingMore) {
          loadPosts(page + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadPosts, page]);

  const handlePostChange = (updatedPost, options = {}) => {
    if (updatedPost?._id) {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === updatedPost._id ? { ...post, ...updatedPost } : post
        )
      );

      setSelectedPost((prev) =>
        prev?._id === updatedPost._id ? { ...prev, ...updatedPost } : prev
      );
    }

    if (options.saved !== undefined && updatedPost?._id) {
      setSavedPostIds((prev) =>
        options.saved
          ? [...new Set([...prev, updatedPost._id])]
          : prev.filter((id) => id !== updatedPost._id)
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="feed">
      <StoryList />

      {error && <p className="feed-error">{error}</p>}

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        onPostChange={handlePostChange}
        onOpenPost={setSelectedPost}
      />

      {hasMore && (
        <div ref={loadMoreRef} className="feed-infinite-loader">
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

          <h3>You have seen all the updates</h3>
          <p>You have viewed all new publications</p>
        </div>
      )}

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostChange={handlePostChange}
        />
      )}
    </section>
  );
};

export default Feed;