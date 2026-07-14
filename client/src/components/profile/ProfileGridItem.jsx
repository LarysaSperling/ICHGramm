import { useEffect, useState } from "react";
import {
  BookmarkX,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import PostPreviewModal from "./PostPreviewModal";

const ProfileGridItem = ({
  post,
  isSavedView = false,
  onDeletePost,
  onUpdatePost,
  onRemoveSavedPost,
  onSavedChange,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  if (!localPost) return null;

  const likesCount = Array.isArray(localPost.likes)
    ? localPost.likes.length
    : Number(localPost.likes) || 0;

  const commentsCount =
    localPost.commentsCount ??
    (Array.isArray(localPost.comments)
      ? localPost.comments.length
      : 0);

  const handleDelete = async () => {
    if (isProcessing || !onDeletePost) return;

    try {
      setIsProcessing(true);

      const wasDeleted = await onDeletePost(localPost._id);

      if (wasDeleted) {
        setIsPreviewOpen(false);
        setLocalPost(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSaved = async () => {
    if (isProcessing || !onRemoveSavedPost) return;

    try {
      setIsProcessing(true);

      const wasRemoved = await onRemoveSavedPost(
        localPost._id,
      );

      if (wasRemoved) {
        setIsPreviewOpen(false);
        setLocalPost(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (
      isSavedView ||
      isProcessing ||
      !onUpdatePost
    ) {
      return;
    }

    const newCaption = window.prompt(
      "Edit caption",
      localPost.caption || "",
    );

    if (newCaption === null) return;

    const normalizedCaption = newCaption.trim();

    if (!normalizedCaption) return;

    try {
      setIsProcessing(true);

      const updatedPost = await onUpdatePost(
        localPost._id,
        normalizedCaption,
      );

      if (updatedPost) {
        setLocalPost((previousPost) => ({
          ...previousPost,
          ...updatedPost,
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostChange = (
    updatedPost,
    options = {},
  ) => {
    if (
      typeof options.saved === "boolean" &&
      updatedPost?._id
    ) {
      onSavedChange?.(
        updatedPost,
        options.saved,
      );

      if (
        isSavedView &&
        options.saved === false
      ) {
        setIsPreviewOpen(false);
        setLocalPost(null);
        return;
      }
    }

    if (!updatedPost?._id) return;

    setLocalPost((previousPost) => ({
      ...previousPost,
      ...updatedPost,
    }));
  };

  return (
    <>
      <div
        className="profile-grid-item"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img
          src={localPost.image}
          alt={localPost.caption || "Post"}
          loading="lazy"
          decoding="async"
        />

        <div className="profile-grid-overlay">
          <span>
            <Heart size={20} fill="white" />
            {likesCount}
          </span>

          <span>
            <MessageCircle size={20} />
            {commentsCount}
          </span>
        </div>

        {!isSavedView && (
          <button
            type="button"
            className="profile-post-edit"
            onClick={(event) => {
              event.stopPropagation();
              handleEdit();
            }}
            disabled={isProcessing}
            aria-label="Edit post"
          >
            <Pencil size={18} />
          </button>
        )}

        <button
          type="button"
          className="profile-post-delete"
          onClick={(event) => {
            event.stopPropagation();

            if (isSavedView) {
              handleRemoveSaved();
            } else {
              handleDelete();
            }
          }}
          disabled={isProcessing}
          aria-label={
            isSavedView
              ? "Remove from saved posts"
              : "Delete post"
          }
        >
          {isSavedView ? (
            <BookmarkX size={18} />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>

      {isPreviewOpen && localPost && (
        <PostPreviewModal
          post={localPost}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onEditPost={
            isSavedView ? undefined : handleEdit
          }
          onDeletePost={
            isSavedView
              ? handleRemoveSaved
              : handleDelete
          }
          onPostChange={handlePostChange}
        />
      )}
    </>
  );
};

export default ProfileGridItem;
