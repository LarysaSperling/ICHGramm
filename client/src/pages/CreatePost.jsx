import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Smile, X } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";

import "../styles/createPost.css";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPosition({ x: 50, y: 50 });
  };

  const handleImagePosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caption.trim() || !image) {
      setError("Caption and image are required");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption.trim());
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
    <div className="create-post-overlay">
      <button
        className="create-post-close"
        type="button"
        onClick={() => navigate(-1)}
      >
        <X size={28} />
      </button>

      <form className="create-post-modal" onSubmit={handleSubmit}>
        <header className="create-post-header">
          <h2>Create new post</h2>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sharing..." : "Share"}
          </button>
        </header>

        <div className="create-post-body">
          <div className="create-upload-area">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Preview"
                  onClick={handleImagePosition}
                  style={{
                    objectPosition: `${position.x}% ${position.y}%`,
                  }}
                />

                <label className="change-photo-button">
                  Change photo
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </>
            ) : (
              <label className="create-upload-placeholder">
                <CloudUpload 
                size={64}
                strokeWidth={1.5}
                color="#8e8e8e"
                />
                <span>Click to upload image</span>

                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <aside className="create-caption-area">
  <div className="create-user">
    <Avatar
      src={user?.avatar}
      name={user?.username || user?.fullName}
      size={32}
    />
    <strong>{user?.username || "user"}</strong>
  </div>

  <textarea
    id="caption"
    name="caption"
    placeholder="Write a caption..."
    value={caption}
    onChange={(event) => setCaption(event.target.value)}
    maxLength={2200}
  />

  <div className="create-caption-footer">
    <Smile size={20} />
    <span className="caption-counter">
  {caption.length}/2 200
</span>
  </div>

<div className="create-bottom-space"></div>

  {error && <p className="create-post-error">{error}</p>}
</aside>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;