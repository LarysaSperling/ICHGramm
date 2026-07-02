import { X } from "lucide-react";

import Avatar from "../ui/Avatar";

import "../../styles/postModal.css";

const PostModal = ({ post, onClose }) => {
  if (!post) return null;

  const { image, caption, author, createdAt } = post;

  return (
    <div className="post-modal-backdrop" onClick={onClose}>
      <button className="post-modal-close" type="button" onClick={onClose}>
        <X size={28} />
      </button>

      <div className="post-modal" onClick={(event) => event.stopPropagation()}>
        <div className="post-modal-image">
          <img src={image} alt={caption || "Post"} />
        </div>

        <div className="post-modal-content">
          <header className="post-modal-header">
            <Avatar
              src={author?.avatar}
              name={author?.username || author?.fullName}
              size={36}
            />

            <div>
              <strong>{author?.username || "unknown"}</strong>
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </header>

          <div className="post-modal-caption">
            <strong>{author?.username || "unknown"}</strong> {caption}
          </div>

          <div className="post-modal-comments">
            <p>No comments yet.</p>
          </div>

          <form className="post-modal-form">
            <input
              type="text"
              name="modal-comment"
              placeholder="Add a comment..."
              autoComplete="off"
            />
            <button type="submit">Post</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostModal;