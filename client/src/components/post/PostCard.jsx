import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
} from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";

import "../../styles/post.css";

const EMOJIS = ["😀", "😍", "😂", "❤️", "🔥", "👏", "🥰", "😎", "🌸", "✨"];

const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload._id || payload.userId || null;
  } catch {
    return null;
  }
};

const PostCard = ({ post, savedPostIds = [], onPostChange }) => {
  const [localPost, setUpdatedPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const currentUserId = getCurrentUserId();

  const { _id, image, caption, author, createdAt } = localPost;

  const authorLink = author?._id ? `/users/${author._id}` : "#";

  const postLikes = Array.isArray(localPost.likes) ? localPost.likes : [];

  const isLiked = postLikes.some((like) => {
    const likeId = typeof like === "string" ? like : like?._id;
    return likeId === currentUserId;
  });

  const likesCount = postLikes.length;
  const isSaved = savedPostIds.includes(_id);

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

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
    if (isLiking) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(`/posts/${_id}/like`);

      if (data.post) {
        setUpdatedPost(data.post);

        if (onPostChange) {
          onPostChange(data.post);
        }
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const { data } = await api.post(`/users/saved/${_id}`);

      if (onPostChange) {
        onPostChange(localPost, {
          saved: data.saved,
        });
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setCommentText((prev) => `${prev}${emoji}`);
    setIsEmojiOpen(false);
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);

      const { data } = await api.post(`/comments/${_id}`, {
        text: commentText.trim(),
      });

      setComments((prev) => [data, ...prev]);
      setCommentText("");

      if (onPostChange) {
        onPostChange({
          ...localPost,
          commentsCount: comments.length + 1,
        });
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <Link to={authorLink} className="post-author">
          <Avatar
            src={author?.avatar}
            name={author?.username || author?.fullName || "Unknown"}
            size={36}
          />

          <div>
            <strong>{author?.username || "unknown"}</strong>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </Link>

        <button className="post-more" type="button">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <img
        className="post-image"
        src={image}
        alt={caption || "Post"}
        loading="lazy"
        decoding="async"
      />

      <div className="post-actions">
        <div>
          <button type="button" onClick={handleToggleLike} disabled={isLiking}>
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

        <button type="button" onClick={handleToggleSave} disabled={isSaving}>
          <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="post-likes">
        {likesCount === 1 ? "1 like" : `${likesCount} likes`}
      </p>

      <p className="post-caption">
        <Link to={authorLink} className="post-author-link">
          <strong>{author?.username || "unknown"}</strong>
        </Link>{" "}
        {caption}
      </p>

      {comments.length > 3 && !showAllComments && (
        <button
          type="button"
          className="post-view-comments"
          onClick={() => setShowAllComments(true)}
        >
          View all {comments.length} comments
        </button>
      )}

      {comments.length > 0 && (
        <div className="post-comments">
          {visibleComments.map((comment) => (
            <p key={comment._id} className="post-comment">
              <strong>{comment.user?.username || "unknown"}</strong>{" "}
              {comment.text}
            </p>
          ))}
        </div>
      )}

      {showAllComments && comments.length > 3 && (
        <button
          type="button"
          className="post-view-comments"
          onClick={() => setShowAllComments(false)}
        >
          Show less
        </button>
      )}

      <form className="comment-form" onSubmit={handleAddComment}>
        <div className="comment-emoji-wrapper">
          <button
            type="button"
            className="comment-emoji-button"
            onClick={() => setIsEmojiOpen((prev) => !prev)}
          >
            <Smile size={20} />
          </button>

          {isEmojiOpen && (
            <div className="comment-emoji-picker">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          id={`comment-${_id}`}
          name="comment"
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          autoComplete="off"
          maxLength={300}
        />

        <button type="submit" disabled={isSubmitting || !commentText.trim()}>
          Post
        </button>
      </form>
    </article>
  );
};

export default PostCard;