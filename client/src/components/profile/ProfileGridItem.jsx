import { useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";

import Avatar from "../ui/Avatar";

const ProfileGridItem = ({ post, onDeletePost, onUpdatePost }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || "");

  const username = post.author?.username || "You";
  const avatar = post.author?.avatar;
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString()
    : "";

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setIsPreviewOpen(false);
    onDeletePost(post._id);
  };

  const handleEditClick = (event) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setCaption(post.caption || "");
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!caption.trim()) return;

    await onUpdatePost(post._id, caption.trim());
    setIsEditing(false);
  };

  return (
    <>
      <div className="profile-grid-item" onClick={() => setIsPreviewOpen(true)}>
        <img src={post.image} alt={post.caption || "Post"} />

        <div className="profile-grid-overlay">
          <span>
            <Heart size={20} fill="white" /> 0
          </span>

          <span>
            <MessageCircle size={20} /> 0
          </span>
        </div>

        <button
          className="profile-post-edit"
          type="button"
          onClick={handleEditClick}
        >
          <Pencil size={18} />
        </button>

        <button
          className="profile-post-delete"
          type="button"
          onClick={handleDeleteClick}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {isPreviewOpen && (
        <div
          className="post-preview-modal"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            className="post-preview-close"
            type="button"
            onClick={() => setIsPreviewOpen(false)}
          >
            <X size={26} />
          </button>

          <div
            className="post-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="post-preview-image">
              <img src={post.image} alt={post.caption || "Post"} />
            </div>

            <aside className="post-preview-info">
              <header className="post-preview-header">
                <div className="post-preview-user">
                  <Avatar src={avatar} name={username} size={36} />
                  <strong>{username}</strong>
                </div>

                <MoreHorizontal size={22} />
              </header>

              <div className="post-preview-body">
                <div className="post-preview-caption">
                  <Avatar src={avatar} name={username} size={32} />

                  <p>
                    <strong>{username}</strong> {post.caption}
                  </p>
                </div>

                {date && <span className="post-preview-date">{date}</span>}
              </div>

              <div className="post-preview-footer">
                <div className="post-preview-icons">
                  <Heart size={24} />
                  <MessageCircle size={24} />
                  <Send size={24} />
                </div>

                <p className="post-preview-likes">0 likes</p>

                <div className="post-preview-actions">
                  <button type="button" onClick={handleEditClick}>
                    Edit
                  </button>

                  <button type="button" onClick={handleDeleteClick}>
                    Delete
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="profile-edit-modal">
          <form className="profile-edit-modal-content" onSubmit={handleSubmit}>
            <h3>Edit post</h3>

            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Edit caption..."
            />

            <div className="profile-edit-modal-actions">
              <button type="button" onClick={handleCancel}>
                Cancel
              </button>

              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ProfileGridItem;