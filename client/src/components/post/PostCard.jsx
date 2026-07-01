import { useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";

import "../../styles/post.css";

const PostCard = ({ post }) => {
  const { _id, image, caption, author, createdAt } = post;

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const getComments = async () => {
      try {
        const { data } = await api.get(`/comments/${_id}`);
        setComments(data);
      } catch (err) {
        console.error(err.response?.data?.message || "Failed to load comments");
      }
    };

    getComments();
  }, [_id]);

  const handleToggleLike = async () => {
    try {
      const { data } = await api.post(`/likes/${_id}`);

      if (data.message === "Post liked") {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      if (data.message === "Like removed") {
        setIsLiked(false);
        setLikesCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to like post");
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);

      const { data } = await api.post(`/comments/${_id}`, {
        text: commentText,
      });

      setComments((prev) => [data, ...prev]);
      setCommentText("");
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-author">
          <Avatar
            src={author?.avatar}
            name={author?.username || author?.fullName}
            size={36}
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
          <button type="button" onClick={handleToggleLike}>
            <Heart
              size={24}
              fill={isLiked ? "red" : "none"}
              color={isLiked ? "red" : "currentColor"}
            />
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

      <p className="post-likes">{likesCount} likes</p>

      <p className="post-caption">
        <strong>{author?.username || "unknown"}</strong> {caption}
      </p>

      {comments.length > 0 && (
        <div className="post-comments">
          {comments.slice(0, 3).map((comment) => (
            <p key={comment._id} className="post-comment">
              <strong>{comment.user?.username || "unknown"}</strong>{" "}
              {comment.text}
            </p>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={handleAddComment}>
        <input
          id={`comment-${_id}`}
          name="comment"
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          autoComplete="off"
        />

        <button type="submit" disabled={isSubmitting || !commentText.trim()}>
          Post
        </button>
      </form>
    </article>
  );
};

export default PostCard;