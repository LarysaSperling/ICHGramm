import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import PostActionMenu from "./PostActionMenu";
import timeAgo from "../../utils/timeAgo";
import SharePostModal from "../post/SharePostModal";

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
  const commentInputRef = useRef(null);
  const emojiRef = useRef(null);

  const [localPost, setLocalPost] = useState(post);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    const handleClickOutsideEmoji = (event) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target)
      ) {
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideEmoji);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutsideEmoji,
      );
    };
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      if (!isOpen || !localPost?._id) return;

      try {
        const { data } = await api.get(
          `/comments/${localPost._id}`,
        );

        setComments(Array.isArray(data) ? data : []);
        setShowAllComments(false);
        setCommentText("");
      } catch (error) {
        console.error("Fetch comments failed:", error);
      }
    };

    fetchComments();
  }, [isOpen, localPost?._id]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!isOpen || !localPost?._id) return;

      try {
        const { data } = await api.get("/users/saved");

        const saved = Array.isArray(data)
          ? data.some(
              (savedPost) => savedPost._id === localPost._id,
            )
          : false;

        setIsSaved(saved);
      } catch (error) {
        console.error("Fetch saved posts failed:", error);
      }
    };

    fetchSavedPosts();
  }, [isOpen, localPost?._id]);

  if (!isOpen || !localPost) return null;

  const username =
    localPost.author?.username || "user";

  const fullName =
    localPost.author?.fullName || username;

  const avatar = localPost.author?.avatar;

  const postLikes = Array.isArray(localPost.likes)
    ? localPost.likes
    : [];

  const isLiked = postLikes.some((like) => {
    const likeId =
      typeof like === "string" ? like : like?._id;

    return likeId === currentUserId;
  });

  const likesCount = postLikes.length;

  const visibleComments = showAllComments
    ? comments
    : comments.slice(0, 2);

  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(
        `/posts/${localPost._id}/like`,
      );

      const updatedPost = data.post || data;

      if (updatedPost?._id) {
        setLocalPost(updatedPost);
        onPostChange?.(updatedPost);
      }
    } catch (error) {
      console.error("Like post failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const { data } = await api.post(
        `/users/saved/${localPost._id}`,
      );

      const nextSavedState = Boolean(data.saved);

      setIsSaved(nextSavedState);

      onPostChange?.(localPost, {
        saved: nextSavedState,
      });
    } catch (error) {
      console.error("Save post failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setCommentText(
      (previousText) =>
        `${previousText}${emojiData.emoji}`,
    );

    setIsEmojiOpen(false);

    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    const normalizedComment = commentText.trim();

    if (!normalizedComment || isCommenting) return;

    try {
      setIsCommenting(true);

      const { data } = await api.post(
        `/comments/${localPost._id}`,
        {
          text: normalizedComment,
        },
      );

      setComments((previousComments) => [
        data,
        ...previousComments,
      ]);

      setCommentText("");
      setIsEmojiOpen(false);

      const updatedPost = {
        ...localPost,
        commentsCount: comments.length + 1,
      };

      setLocalPost(updatedPost);
      onPostChange?.(updatedPost);
    } catch (error) {
      console.error("Add comment failed:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentIconClick = () => {
    commentInputRef.current?.focus();
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEditPost?.();
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDeletePost?.();
  };

  return (
    <div
      className="post-preview-modal"
      onClick={onClose}
    >
      <button
        className="post-preview-close"
        type="button"
        onClick={onClose}
        aria-label="Close post preview"
      >
        <X size={30} />
      </button>

      <div
        className="post-preview-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="post-preview-media">
          <img
            src={localPost.image}
            alt={localPost.caption || "Post"}
          />
        </div>

        <aside className="post-preview-panel">
          <header className="post-preview-header">
            <div className="post-preview-author">
              <Avatar
                src={avatar}
                name={username}
                size={34}
              />

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
            {localPost.caption && (
              <article className="post-preview-comment post-preview-caption">
                <Avatar
                  src={avatar}
                  name={username}
                  size={34}
                />

                <div className="post-preview-comment-main">
                  <p>
                    <strong>{username}</strong>{" "}
                    {localPost.caption}
                  </p>

                  <div className="post-preview-comment-meta">
                    <span>
                      {timeAgo(localPost.createdAt)}
                    </span>

                    <button type="button">
                      Reply
                    </button>
                  </div>
                </div>
              </article>
            )}

            {comments.length > 2 && (
              <button
                className="post-preview-view-comments"
                type="button"
                onClick={() =>
                  setShowAllComments(
                    (previousValue) => !previousValue,
                  )
                }
              >
                {showAllComments
                  ? "Hide comments"
                  : `View all ${comments.length} comments`}
              </button>
            )}

            {comments.length === 0 && (
              <p className="post-preview-empty-comments">
                No comments yet. Start the conversation.
              </p>
            )}

            {visibleComments.map((comment) => {
              const commentUsername =
                comment.user?.username ||
                comment.author?.username ||
                "user";

              const commentAvatar =
                comment.user?.avatar ||
                comment.author?.avatar;

              return (
                <article
                  className="post-preview-comment"
                  key={comment._id}
                >
                  <Avatar
                    src={commentAvatar}
                    name={commentUsername}
                    size={34}
                  />

                  <div className="post-preview-comment-main">
                    <p>
                      <strong>
                        {commentUsername}
                      </strong>{" "}
                      {comment.text}
                    </p>

                    <div className="post-preview-comment-meta">
                      <span>
                        {timeAgo(comment.createdAt)}
                      </span>

                      <button type="button">
                        Reply
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <footer className="post-preview-footer">
            <div className="post-preview-actions">
              <div className="post-preview-left-actions">
                <button
                  type="button"
                  className={
                    isLiked ? "active-like" : ""
                  }
                  onClick={handleToggleLike}
                  disabled={isLiking}
                  aria-label="Like post"
                >
                  <Heart
                    size={25}
                    fill={
                      isLiked
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>

                <button
                  type="button"
                  aria-label="Comment"
                  onClick={handleCommentIconClick}
                >
                  <MessageCircle size={25} />
                </button>

                <button
                  type="button"
                  aria-label="Send post"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Send size={25} />
                </button>
              </div>

              <button
                type="button"
                className={
                  isSaved ? "active-save" : ""
                }
                onClick={handleToggleSave}
                disabled={isSaving}
                aria-label={
                  isSaved
                    ? "Remove from saved posts"
                    : "Save post"
                }
              >
                <Bookmark
                  size={25}
                  fill={
                    isSaved
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>

            <p className="post-preview-likes">
              {likesCount === 1
                ? "1 like"
                : `${likesCount} likes`}
            </p>

            <p className="post-preview-date">
              {timeAgo(localPost.createdAt)}
            </p>

            <form
              className="post-preview-add-comment"
              onSubmit={handleAddComment}
            >
              <div
                className="post-preview-emoji"
                ref={emojiRef}
              >
                <button
                  type="button"
                  className="post-preview-emoji-button"
                  onClick={() =>
                    setIsEmojiOpen(
                      (previousValue) =>
                        !previousValue,
                    )
                  }
                  aria-label="Choose emoji"
                >
                  <Smile size={22} />
                </button>

                {isEmojiOpen && (
                  <div className="post-preview-emoji-picker">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width="100%"
                      height={360}
                      emojiStyle="native"
                      previewConfig={{
                        showPreview: false,
                      }}
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                )}
              </div>

              <input
                id={`preview-comment-${localPost._id}`}
                name="preview-comment"
                type="text"
                ref={commentInputRef}
                value={commentText}
                onChange={(event) =>
                  setCommentText(event.target.value)
                }
                placeholder="Add a comment..."
                autoComplete="off"
                maxLength={300}
              />

              <button
                type="submit"
                disabled={
                  !commentText.trim() ||
                  isCommenting
                }
              >
                Send
              </button>
            </form>
          </footer>
        </aside>
      </div>

      <SharePostModal
        post={localPost}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <PostActionMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isOwnPost
        postId={localPost._id}
        authorId={localPost.author?._id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default PostPreviewModal;
