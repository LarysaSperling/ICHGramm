import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Send, Smile, X } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import timeAgo from "../../utils/timeAgo";

import "../../styles/postModal.css";

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

const PostModal = ({ post, onClose, onPostChange }) => {
  const [localPost, setLocalPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const currentUserId = getCurrentUserId();

  const { _id, image, caption, author, createdAt } = localPost;

  const authorId = author?._id;
  const authorLink = authorId ? `/users/${authorId}` : "#";
  const isOwnPost = authorId === currentUserId;

  const likes = Array.isArray(localPost.likes) ? localPost.likes : [];

  const isLiked = likes.some((like) => {
    const likeId = typeof like === "string" ? like : like?._id;
    return likeId === currentUserId;
  });

  const likesCount = likes.length;

  useEffect(() => {
    const loadModalData = async () => {
      try {
        const [commentsResponse, profileResponse, savedResponse] =
          await Promise.all([
            api.get(`/comments/${_id}`),
            api.get("/users/profile"),
            api.get("/users/saved"),
          ]);

        setComments(
          Array.isArray(commentsResponse.data) ? commentsResponse.data : []
        );

        const followingIds = Array.isArray(profileResponse.data.following)
          ? profileResponse.data.following.map((id) => id.toString())
          : [];

        setIsFollowing(followingIds.includes(authorId));

        const savedIds = Array.isArray(savedResponse.data)
          ? savedResponse.data.map((savedPost) => savedPost._id)
          : [];

        setIsSaved(savedIds.includes(_id));
      } catch (err) {
        console.error(err.response?.data?.message || "Failed to load post");
      }
    };

    loadModalData();
  }, [_id, authorId]);

  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(`/posts/${_id}/like`);

      if (data.post) {
        setLocalPost(data.post);
        onPostChange?.(data.post);
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

      setIsSaved(Boolean(data.saved));
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

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
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <div className="post-modal-backdrop" onClick={onClose}>
      <button className="post-modal-close" type="button" onClick={onClose}>
        <X size={28} />
      </button>

      <div className="post-modal" onClick={(event) => event.stopPropagation()}>
        <div className="post-modal-image">
          <img src={image} alt={caption || "Post"} />
        </div>

        <aside className="post-modal-content">
          <header className="post-modal-header">
            <Link to={authorLink} className="post-modal-user">
              <Avatar
                src={author?.avatar}
                name={author?.username || author?.fullName || "Unknown"}
                size={36}
              />

              <strong>{author?.username || "unknown"}</strong>
            </Link>

            {!isOwnPost && (
              <button
                type="button"
                className={
                  isFollowing
                    ? "post-modal-follow following"
                    : "post-modal-follow"
                }
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </header>

          <div className="post-modal-scroll">
            {caption && (
              <div className="post-modal-caption">
                <Avatar
                  src={author?.avatar}
                  name={author?.username || author?.fullName || "Unknown"}
                  size={32}
                />

                <p>
                  <strong>{author?.username || "unknown"}</strong> {caption}
                </p>
              </div>
            )}

            {comments.length > 0 ? (
              <div className="post-modal-comments">
                {comments.map((comment) => (
                  <div key={comment._id} className="post-modal-comment">
                    <Avatar
                      src={comment.user?.avatar}
                      name={comment.user?.username || "Unknown"}
                      size={32}
                    />

                    <p>
                      <strong>{comment.user?.username || "unknown"}</strong>{" "}
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="post-modal-empty">No comments yet.</p>
            )}
          </div>

          <div className="post-modal-actions">
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

          <div className="post-modal-meta">
            <strong>{likesCount === 1 ? "1 like" : `${likesCount} likes`}</strong>
            <span>{timeAgo(createdAt)}</span>
          </div>

          <form className="post-modal-form" onSubmit={handleAddComment}>
            <Smile size={20} />

            <input
              type="text"
              name="modal-comment"
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
        </aside>
      </div>
    </div>
  );
};

export default PostModal;