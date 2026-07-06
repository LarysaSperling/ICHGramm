import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import timeAgo from "../../utils/timeAgo";

import "../../styles/post.css";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const currentUserId = getCurrentUserId();

  const { _id, image, caption, author, createdAt } = localPost;

  const authorId = author?._id;
  const authorLink = authorId ? `/users/${authorId}` : "#";
  const isOwnPost = authorId === currentUserId;

  const postLikes = Array.isArray(localPost.likes) ? localPost.likes : [];

  const isLiked = postLikes.some((like) => {
    const likeId = typeof like === "string" ? like : like?._id;
    return likeId === currentUserId;
  });

  const likesCount = postLikes.length;
  const isSaved = savedPostIds.includes(_id);

  const visibleComments = showAllComments ? comments : comments.slice(0, 2);

  useEffect(() => {
    const getComments = async () => {
      try {
        const { data } = await api.get(`/comments/${_id}`);
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err.response?.data?.message || "Failed to load comments");
      }
    };

    getComments();
  }, [_id]);

  useEffect(() => {
    const getProfile = async () => {
      if (!authorId || isOwnPost) return;

      try {
        const { data } = await api.get("/users/profile");

        const followingIds = Array.isArray(data.following)
          ? data.following.map((id) => id.toString())
          : [];

        setIsFollowing(followingIds.includes(authorId));
      } catch (err) {
        console.error(err.response?.data?.message || "Failed to load profile");
      }
    };

    getProfile();
  }, [authorId, isOwnPost]);

  const handleToggleFollow = async () => {
    if (!authorId || isOwnPost || isFollowLoading) return;

    try {
      setIsFollowLoading(true);

      const { data } = await api.post(`/users/${authorId}/follow`);

      setIsFollowing(Boolean(data.isFollowing));
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to follow user");
    } finally {
      setIsFollowLoading(false);
    }
  };

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
        <div className="post-header-left">
          <Link to={authorLink} className="post-author">
            <Avatar
              src={author?.avatar}
              name={author?.username || author?.fullName || "Unknown"}
              size={36}
            />

            <div>
              <strong>{author?.username || "unknown"}</strong>
              <span>{timeAgo(createdAt)}</span>
            </div>
          </Link>

          {!isOwnPost && (
            <button
              type="button"
              className={isFollowing ? "post-follow following" : "post-follow"}
              onClick={handleToggleFollow}
              disabled={isFollowLoading}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

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

      {comments.length > 2 && (
        <button
          type="button"
          className="post-view-comments"
          onClick={() => setShowAllComments((prev) => !prev)}
        >
          {showAllComments
            ? "Show less"
            : `View all comments (${comments.length})`}
        </button>
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