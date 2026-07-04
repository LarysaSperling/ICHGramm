import { useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  X,
} from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import PostActionMenu from "./PostActionMenu";
import "../../styles/postPreviewModal.css";

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

const PostPreviewModal = ({
  post,
  isOpen,
  onClose,
  onEditPost,
  onDeletePost,
  onPostChange,
}) => {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!isOpen || !post?._id) return;

      try {
        const { data } = await api.get(`/comments/${post._id}`);
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch comments failed:", error);
      }
    };

    fetchComments();
  }, [isOpen, post?._id]);

  if (!isOpen || !post) return null;

  const currentUserId = getCurrentUserId();

  const username = post.author?.username || "user";
  const fullName = post.author?.fullName || username;
  const avatar = post.author?.avatar;

  const createdDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "";

  const postLikes = Array.isArray(post.likes) ? post.likes : [];

  const isLiked = postLikes.some((like) => {
    const likeId = typeof like === "string" ? like : like?._id;
    return likeId === currentUserId;
  });

  const likesCount = postLikes.length;

  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(`/posts/${post._id}/like`);

      if (data.post && onPostChange) {
        onPostChange(data.post);
      }
    } catch (error) {
      console.error("Like post failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim() || isCommenting) return;

    try {
      setIsCommenting(true);

      const { data } = await api.post(`/comments/${post._id}`, {
        text: commentText.trim(),
      });

      setComments((prevComments) => [data, ...prevComments]);
      setCommentText("");
    } catch (error) {
      console.error("Add comment failed:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEditPost();
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDeletePost();
  };

  return (
    <div className="post-preview-modal" onClick={onClose}>
      <button className="post-preview-close" type="button" onClick={onClose}>
        <X size={30} />
      </button>

      <div
        className="post-preview-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="post-preview-media">
          <img src={post.image} alt={post.caption || "Post"} />
        </div>

        <aside className="post-preview-panel">
          <header className="post-preview-header">
            <div className="post-preview-author">
              <Avatar src={avatar} name={username} size={34} />

              <div className="post-preview-author-text">
                <strong>{username}</strong>
                <span>{fullName}</span>
              </div>
            </div>

            <button
              className="post-preview-menu"
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open post menu"
            >
              <MoreHorizontal size={22} />
            </button>
          </header>

          <section className="post-preview-comments">
            {post.caption && (
              <article className="post-preview-comment post-preview-caption">
                <Avatar src={avatar} name={username} size={34} />

                <div className="post-preview-comment-main">
                  <p>
                    <strong>{username}</strong> {post.caption}
                  </p>

                  <div className="post-preview-comment-meta">
                    {createdDate && <span>{createdDate}</span>}
                    <button type="button">Reply</button>
                  </div>
                </div>
              </article>
            )}

            {comments.length > 2 && (
              <button className="post-preview-view-comments" type="button">
                View all {comments.length} comments
              </button>
            )}

            {comments.length === 0 && (
              <p className="post-preview-empty-comments">
                No comments yet. Start the conversation.
              </p>
            )}

            {comments.map((comment) => {
              const commentUsername =
                comment.user?.username || comment.author?.username || "user";

              const commentAvatar = comment.user?.avatar || comment.author?.avatar;

              return (
                <article className="post-preview-comment" key={comment._id}>
                  <Avatar src={commentAvatar} name={commentUsername} size={34} />

                  <div className="post-preview-comment-main">
                    <p>
                      <strong>{commentUsername}</strong> {comment.text}
                    </p>

                    <div className="post-preview-comment-meta">
                      <span>now</span>
                      <button type="button">Reply</button>
                    </div>
                  </div>

                  <button className="post-preview-comment-like" type="button">
                    <Heart size={13} />
                  </button>
                </article>
              );
            })}
          </section>

          <footer className="post-preview-footer">
            <div className="post-preview-actions">
              <div className="post-preview-left-actions">
                <button
                  type="button"
                  className={isLiked ? "active-like" : ""}
                  onClick={handleToggleLike}
                  disabled={isLiking}
                  aria-label="Like post"
                >
                  <Heart size={25} fill={isLiked ? "currentColor" : "none"} />
                </button>

                <button type="button" aria-label="Comment post">
                  <MessageCircle size={25} />
                </button>

                <button type="button" aria-label="Send post">
                  <Send size={25} />
                </button>
              </div>

              <button
                type="button"
                className={isSaved ? "active-save" : ""}
                onClick={() => setIsSaved((prev) => !prev)}
                aria-label="Save post"
              >
                <Bookmark size={25} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>

            <p className="post-preview-likes">
              {likesCount === 1 ? "1 like" : `${likesCount} likes`}
            </p>

            {createdDate && <p className="post-preview-date">{createdDate}</p>}

            <form
              className="post-preview-add-comment"
              onSubmit={handleAddComment}
            >
              <Smile size={22} />

              <input
                type="text"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Add comment"
              />

              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
              >
                Post
              </button>
            </form>
          </footer>
        </aside>
      </div>

      <PostActionMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default PostPreviewModal;