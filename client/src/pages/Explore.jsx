import { useEffect, useState } from "react";

import api from "../api/axios";
import Loader from "../components/ui/Loader";

import "../styles/explore.css";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  const getPosts = async () => {
    try {
      const { data } = await api.get("/posts/explore");

      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  getPosts();
}, []);

  if (isLoading) return <Loader />;

  return (
    <main className="explore-page">
      {error && <p className="explore-error">{error}</p>}

      <div className="explore-grid">
        {posts.map((post) => (
          <button key={post._id} className="explore-item" type="button">
            <img src={post.image} alt={post.caption || "Post"} />
          </button>
        ))}
      </div>
    </main>
  );
};

export default Explore;