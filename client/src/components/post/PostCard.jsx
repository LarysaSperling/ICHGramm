import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";

import "../../styles/post.css";

const PostCard = ({ post }) => {
  const { image, caption, author, createdAt } = post;

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-author">
          <img
            src={author?.avatar || "/default-avatar.png"}
            alt={author?.username || "User avatar"}
          />

          <div>
            <strong>{author?.username || "unknown"}</strong>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <button className="post-more" type="button">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <img className="post-image" src={image} alt={caption || "Post"} />

      <div className="post-actions">
        <div>
          <button type="button">
            <Heart size={24} />
          </button>

          <button type="button">
            <MessageCircle size={24} />
          </button>

          <button type="button">
            <Send size={24} />
          </button>
        </div>

        <button type="button">
          <Bookmark size={24} />
        </button>
      </div>

      <p className="post-caption">
        <strong>{author?.username || "unknown"}</strong> {caption}
      </p>

      <form className="comment-form">
        <input type="text" placeholder="Add a comment..." />
        <button type="submit">Post</button>
      </form>
    </article>
  );
};

export default PostCard;