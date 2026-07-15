import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";

import "../styles/createPost.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const MAX_CAPTION_LENGTH = 2200;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caption, setCaption] = useState("");

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  const [position, setPosition] = useState({
    x: 50,
    y: 50,
  });

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const emojiRef = useRef(null);
  const captionRef = useRef(null);

  const handleClose = () => {
    if (isLoading) {
      return;
    }

    navigate(-1);
  };

  useEffect(() => {
    const handleClickOutsideEmoji = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideEmoji);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEmoji);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !isLoading) {
        navigate(-1);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLoading, navigate]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const validateFile = (file) => {
    if (!file) {
      return "Image is required";
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only JPG, JPEG, PNG and WEBP images are allowed";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Image must be smaller than 2 MB";
    }

    return "";
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    const validationError = validateFile(file);

    if (validationError) {
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setImage(null);
      setPreview("");
      setError(validationError);

      event.target.value = "";

      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));

    setPosition({
      x: 50,
      y: 50,
    });
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

  const handleEmojiClick = (emojiData) => {
    setCaption((previousCaption) => {
      const nextCaption = `${previousCaption}${emojiData.emoji}`;

      return nextCaption.slice(0, MAX_CAPTION_LENGTH);
    });

    setIsEmojiOpen(false);

    setTimeout(() => {
      captionRef.current?.focus();
    }, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCaption = caption.trim();

    if (!normalizedCaption) {
      setError("Caption is required");

      return;
    }

    const validationError = validateFile(image);

    if (validationError) {
      setError(validationError);

      return;
    }

    const formData = new FormData();

    formData.append("caption", normalizedCaption);

    formData.append("image", image);

    try {
      setIsLoading(true);
      setError("");
      setIsEmojiOpen(false);

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/home", {
        replace: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-overlay" onClick={handleClose}>
      <form
        className="create-post-modal"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
      >
        <button
          className="create-post-close"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Close create post"
        >
          <X size={28} />
        </button>

        <header className="create-post-header">
          <h2 id="create-post-title">Create new post</h2>

          <button
            className="create-post-share"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Sharing..." : "Share"}
          </button>
        </header>

        <div className="create-post-body">
          <div className="create-upload-area">
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Selected post preview"
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
                    disabled={isLoading}
                  />
                </label>
              </>
            ) : (
              <label className="create-upload-placeholder">
                <CloudUpload size={64} strokeWidth={1.5} aria-hidden="true" />

                <span>Click to upload image</span>

                <input
                  id="create-post-image"
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isLoading}
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
              ref={captionRef}
              id="create-post-caption"
              name="caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={MAX_CAPTION_LENGTH}
              disabled={isLoading}
            />

            <div className="create-caption-footer">
              <div className="create-post-emoji" ref={emojiRef}>
                <button
                  type="button"
                  className="create-post-emoji-button"
                  onClick={() =>
                    setIsEmojiOpen((previousValue) => !previousValue)
                  }
                  disabled={isLoading}
                  aria-label="Choose emoji"
                >
                  <Smile size={20} aria-hidden="true" />
                </button>

                {isEmojiOpen && (
                  <div className="create-post-emoji-picker">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width="100%"
                      height={360}
                      emojiStyle="native"
                      previewConfig={{
                        showPreview: false,
                      }}
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                )}
              </div>

              <span className="caption-counter">
                {caption.length}/{MAX_CAPTION_LENGTH}
              </span>
            </div>

            <div className="create-bottom-space">
              {error && (
                <p className="create-post-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
