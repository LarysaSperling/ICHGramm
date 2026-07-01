import { useEffect, useState } from "react";

import api from "../../api/axios";
import Stories from "./Stories";
import PostList from "../post/PostList";
import Loader from "../ui/Loader";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const getPosts = async () => {
    try {
      const { data } = await api.get("/posts");
      setPosts(data.posts || data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <section className="feed">
      <Stories />

      {error && <p className="feed-error">{error}</p>}

      <PostList posts={posts} />
    </section>
  );
};

export default Feed;