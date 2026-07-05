import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Smile, X } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";

import "../styles/createPost.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const EMOJIS = ["😀", "😍", "😂", "❤️", "🔥", "👏", "🥰", "😎", "🌸", "✨"];

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const validateFile = (file) => {
    if (!file) return "Image is required";

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only JPG, JPEG, PNG and WEBP images are allowed";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Image must be smaller than 2 MB";
    }

    return "";
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setImage(null);
      setPreview("");
      setError(validationError);
      return;
    }

    setError("");
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

  const handleEmojiClick = (emoji) => {
    setCaption((prev) => `${prev}${emoji}`);
    setIsEmojiOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caption.trim()) {
      setError("Caption is required");
      return;
    }

    const validationError = validateFile(image);

    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption.trim());
    formData.append("image", image);

    try {
      setIsLoading(true);
      setError("");

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-overlay" onClick={() => navigate(-1)}>
      <button
        className="create-post-close"
        type="button"
        onClick={() => navigate(-1)}
      >
        <X size={28} />
      </button>

      <form
        className="create-post-modal"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
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
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              </>
            ) : (
              <label className="create-upload-placeholder">
                <CloudUpload size={64} strokeWidth={1.5} color="#8e8e8e" />
                <span>Click to upload image</span>

                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
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
              <button
                type="button"
                className="emoji-button"
                onClick={() => setIsEmojiOpen((prev) => !prev)}
              >
                <Smile size={20} />
              </button>

              {isEmojiOpen && (
                <div className="emoji-picker">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <span className="caption-counter">{caption.length}/2 200</span>
            </div>

            <div className="create-bottom-space">
              {error && <p className="create-post-error">{error}</p>}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;