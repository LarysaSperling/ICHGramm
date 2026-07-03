import { useState } from "react";
import { Heart, MessageCircle, Pencil, Trash2, X } from "lucide-react";

const ProfileGridItem = ({ post, onDeletePost, onUpdatePost }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || "");

  const handleDeleteClick = (event) => {
    event.stopPropagation();
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
      <div
        className="profile-grid-item"
        onClick={() => setIsPreviewOpen(true)}
      >
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
          <div
            className="post-preview-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="post-preview-close"
              type="button"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X size={24} />
            </button>

            <div className="post-preview-image">
              <img src={post.image} alt={post.caption || "Post"} />
            </div>

            <div className="post-preview-info">
              <div className="post-preview-header">
                <strong>{post.author?.username || "You"}</strong>
              </div>

              <p className="post-preview-caption">
                <strong>{post.author?.username || "You"}</strong>{" "}
                {post.caption}
              </p>

              <div className="post-preview-actions">
                <button type="button" onClick={handleEditClick}>
                  Edit
                </button>

                <button type="button" onClick={handleDeleteClick}>
                  Delete
                </button>
              </div>
            </div>
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