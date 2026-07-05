import { useEffect, useState } from "react";

import api from "../../api/axios";
import Loader from "../ui/Loader";
import PostList from "../post/PostList";
import StoryList from "../story/StoryList";

import "../../styles/feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getFeedData = async () => {
      try {
        const [postsResponse, savedResponse] = await Promise.all([
          api.get("/posts"),
          api.get("/users/saved"),
        ]);

        setPosts(postsResponse.data.posts || []);

        const ids = Array.isArray(savedResponse.data)
          ? savedResponse.data.map((post) => post._id)
          : [];

        setSavedPostIds(ids);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    getFeedData();
  }, []);

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

      {error && <p className="feed-error">{error}</p>}

      <PostList
        posts={posts}
        savedPostIds={savedPostIds}
        onPostChange={handlePostChange}
      />
    </section>
  );
};

export default Feed;