import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import PostPreviewModal from "./PostPreviewModal";

const ProfileGridItem = ({
  post,
  onDeletePost,
  onUpdatePost,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const likesCount = Array.isArray(post.likes)
    ? post.likes.length
    : post.likes || 0;

  const commentsCount = Array.isArray(post.comments)
    ? post.comments.length
    : 0;

  const handleDelete = () => {
    setIsPreviewOpen(false);
    onDeletePost(post._id);
  };

  const handleEdit = async () => {
    const newCaption = window.prompt(
      "Edit caption",
      post.caption || ""
    );

    if (newCaption === null) return;

    if (!newCaption.trim()) return;

    await onUpdatePost(post._id, newCaption.trim());
  };

  return (
    <>
      <div
        className="profile-grid-item"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img
          src={post.image}
          alt={post.caption || "Post"}
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

        <button
          type="button"
          className="profile-post-edit"
          onClick={(event) => {
            event.stopPropagation();
            handleEdit();
          }}
        >
          <Pencil size={18} />
        </button>

        <button
          type="button"
          className="profile-post-delete"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete();
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <PostPreviewModal
        post={post}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEditPost={handleEdit}
        onDeletePost={handleDelete}
      />
    </>
  );
};

export default ProfileGridItem;