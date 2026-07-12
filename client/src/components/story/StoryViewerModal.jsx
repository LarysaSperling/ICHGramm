import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import timeAgo from "../../utils/timeAgo";

const StoryViewerModal = ({
  stories = [],
  initialIndex = 0,
  isOwnStory = false,
  onClose,
  onStoryDeleted,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const activeStory = stories[activeIndex];

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, stories]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((prev) =>
          Math.min(prev + 1, stories.length - 1)
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, stories.length]);

  useEffect(() => {
    if (!activeStory || stories.length <= 1) return;

    const timeoutId = setTimeout(() => {
      if (activeIndex < stories.length - 1) {
        setActiveIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    activeIndex,
    activeStory,
    stories.length,
    onClose,
  ]);

  if (!activeStory) return null;

  const author = activeStory.author || {};

  const handlePrevious = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (activeIndex >= stories.length - 1) {
      onClose();
      return;
    }

    setActiveIndex((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!isOwnStory || isDeleting) return;

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this story?"
    );

    if (!shouldDelete) return;

    try {
      setIsDeleting(true);
      setError("");

      await api.delete(`/stories/${activeStory._id}`);

      onStoryDeleted?.(activeStory._id);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete story."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="story-viewer-backdrop"
      onClick={onClose}
    >
      <section
        className="story-viewer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="story-progress">
          {stories.map((story, index) => (
            <span
              key={story._id}
              className={
                index <= activeIndex
                  ? "story-progress-item active"
                  : "story-progress-item"
              }
            />
          ))}
        </div>

        <header className="story-viewer-header">
          <div className="story-viewer-user">
            <Avatar
              src={author.avatar}
              name={author.username || author.fullName}
              size={36}
            />

            <div>
              <strong>{author.username || "user"}</strong>
              <span>{timeAgo(activeStory.createdAt)}</span>
            </div>
          </div>

          <div className="story-viewer-header-actions">
            {isOwnStory && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete story"
              >
                <Trash2 size={21} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close story"
            >
              <X size={25} />
            </button>
          </div>
        </header>

        <div className="story-viewer-media">
          <img
            src={activeStory.image}
            alt={`Story by ${author.username || "user"}`}
          />
        </div>

        {activeIndex > 0 && (
          <button
            type="button"
            className="story-viewer-navigation previous"
            onClick={handlePrevious}
            aria-label="Previous story"
          >
            <ChevronLeft size={30} />
          </button>
        )}

        <button
          type="button"
          className="story-viewer-navigation next"
          onClick={handleNext}
          aria-label="Next story"
        >
          <ChevronRight size={30} />
        </button>

        {error && (
          <p className="story-viewer-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
};

export default StoryViewerModal;