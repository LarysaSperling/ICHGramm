import { useEffect, useState } from "react";

import api from "../../api/axios";
import Loader from "../ui/Loader";
import PostList from "../post/PostList";
import PostForm from "../post/PostForm";
import StoryList from "../story/StoryList";

import "../../styles/feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadSavedPosts = async () => {
    const savedResponse = await api.get("/users/saved");

    const savedIds = Array.isArray(savedResponse.data)
      ? savedResponse.data.map((post) => post._id)
      : [];

    setSavedPostIds(savedIds);
  };

  const loadPosts = async (pageNumber) => {
    try {
      setError("");

      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const postsResponse = await api.get(`/posts?page=${pageNumber}&limit=5`);
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
  };

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
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostChange = (updatedPost, options = {}) => {
    if (updatedPost?._id) {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === updatedPost._id ? { ...post, ...updatedPost } : post
        )
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

      <PostForm onPostCreated={handlePostCreated} />

      {error && <p className="feed-error">{error}</p>}

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        onPostChange={handlePostChange}
      />

      {hasMore && (
        <div className="feed-load-more">
          <button
            type="button"
            onClick={() => loadPosts(page + 1)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="feed-end">No more posts</p>
      )}
    </section>
  );
};

export default Feed;