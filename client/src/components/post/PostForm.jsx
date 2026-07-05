import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

import api from "../../api/axios";

import "../../styles/postForm.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const PostForm = ({ onPostCreated }) => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview("");
    setError("");
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

    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append("image", image);

      const response = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (onPostCreated) {
        onPostCreated(response.data);
      }

      setCaption("");
      setImage(null);
      setPreview("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <textarea
        className="post-form-textarea"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Write a caption..."
        rows="3"
      />

      <label className="post-form-upload">
        <ImagePlus size={20} />
        <span>{image ? image.name : "Choose image"}</span>

        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleImageChange}
        />
      </label>

      {preview && (
        <div className="post-form-preview">
          <img src={preview} alt="Post preview" />

          <button
            type="button"
            className="post-form-remove"
            onClick={handleRemoveImage}
            aria-label="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && <p className="post-form-error">{error}</p>}

      <button
        type="submit"
        className="post-form-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Posting..." : "Create post"}
      </button>
    </form>
  );
};

export default PostForm;