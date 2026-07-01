import { useEffect, useState } from "react";

import api from "../../api/axios";
import Loader from "../ui/Loader";
import PostList from "../post/PostList";
import Stories from "./Stories";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getPosts = async () => {
      try {
        const { data } = await api.get("/posts");
        setPosts(data.posts || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    getPosts();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="feed">
      <Stories />

      {error && <p className="feed-error">{error}</p>}

      <PostList posts={posts} />
    </section>
  );
};

export default Feed;