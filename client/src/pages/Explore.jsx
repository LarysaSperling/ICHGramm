import { useEffect, useState } from "react";

import api from "../api/axios";
import Loader from "../components/ui/Loader";
import PostModal from "../components/post/PostModal";

import "../styles/explore.css";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getPosts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await api.get("/posts/explore");

        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load posts",
        );
      } finally {
        setIsLoading(false);
      }
    };

    getPosts();
  }, []);

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
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="explore-page">
      {error && (
        <p className="explore-error" role="alert">
          {error}
        </p>
      )}

      <div className="explore-grid">
        {posts.map((post) => (
          <button
            key={post._id}
            className="explore-item"
            type="button"
            onClick={() => setSelectedPost(post)}
          >
            <img
              src={post.image}
              alt={post.caption || "Post"}
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

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

export default Explore;