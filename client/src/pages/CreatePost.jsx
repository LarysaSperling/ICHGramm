import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import "../styles/createPost.css";

const CreatePost = () => {
  const navigate = useNavigate();

  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caption.trim() || !image) {
      setError("Caption and image are required");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);

    try {
      setIsLoading(true);
      setError("");

      await api.post("/posts", formData);

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="create-post-page">
      <h1>Create new post</h1>

      <form className="create-post-form" onSubmit={handleSubmit}>
        <label className="image-upload-box">
          {preview ? (
            <img src={preview} alt="Preview" />
          ) : (
            <span>Click to upload image</span>
          )}

          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        <textarea
          name="caption"
          placeholder="Write a caption..."
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />

        {error && <p className="create-post-error">{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Publishing..." : "Publish"}
        </button>
      </form>
    </section>
  );
};

export default CreatePost;