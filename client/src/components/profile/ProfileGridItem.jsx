import { useState } from "react";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";

import PostPreviewModal from "./PostPreviewModal";

const ProfileGridItem = ({ post, onDeletePost, onUpdatePost }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  if (!localPost) return null;

  const likesCount = Array.isArray(localPost.likes)
    ? localPost.likes.length
    : localPost.likes || 0;

  const commentsCount =
    localPost.commentsCount ??
    (Array.isArray(localPost.comments) ? localPost.comments.length : 0);

  const handleDelete = () => {
    setIsPreviewOpen(false);
    onDeletePost(localPost._id);
  };

  const handleEdit = async () => {
    const newCaption = window.prompt("Edit caption", localPost.caption || "");

    if (newCaption === null) return;
    if (!newCaption.trim()) return;

    const updatedPost = await onUpdatePost(localPost._id, newCaption.trim());

    if (updatedPost) {
      setLocalPost(updatedPost);
    } else {
      setLocalPost((prevPost) => ({
        ...prevPost,
        caption: newCaption.trim(),
      }));
    }
  };

  return (
    <>
      <div className="profile-grid-item" onClick={() => setIsPreviewOpen(true)}>
        <img src={localPost.image} alt={localPost.caption || "Post"} />

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
        post={localPost}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEditPost={handleEdit}
        onDeletePost={handleDelete}
        onPostChange={setLocalPost}
      />
    </>
  );
};

export default ProfileGridItem;