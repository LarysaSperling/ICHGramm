import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import api from "../../api/axios";

const MAX_STORY_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const CreateStoryModal = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (isOpen) return;

    setImage(null);
    setPreview("");
    setError("");
    setIsSubmitting(false);
  }, [isOpen]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_STORY_SIZE) {
      setError("Story image must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!image || isSubmitting) return;

    const formData = new FormData();
    formData.append("image", image);

    try {
      setIsSubmitting(true);
      setError("");

      const { data } = await api.post("/stories", formData);

      onStoryCreated?.(data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create story."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="story-modal-backdrop"
      onClick={onClose}
    >
      <section
        className="create-story-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="story-modal-header">
          <h2>Create story</h2>

          <button
            type="button"
            className="story-modal-close"
            onClick={onClose}
            aria-label="Close create story window"
          >
            <X size={24} />
          </button>
        </header>

        <div className="create-story-content">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            hidden
          />

          {preview ? (
            <div className="create-story-preview">
              <img src={preview} alt="Story preview" />

              <button
                type="button"
                className="create-story-change"
                onClick={handleChooseImage}
                disabled={isSubmitting}
              >
                Change photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="create-story-upload"
              onClick={handleChooseImage}
            >
              <ImagePlus size={52} strokeWidth={1.5} />

              <strong>Select a photo</strong>

              <span>JPG, PNG or WEBP, maximum 2 MB</span>
            </button>
          )}

          {error && (
            <p className="story-modal-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="create-story-footer">
          <button
            type="button"
            className="create-story-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="create-story-share"
            onClick={handleSubmit}
            disabled={!image || isSubmitting}
          >
            {isSubmitting ? "Sharing..." : "Share story"}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default CreateStoryModal;