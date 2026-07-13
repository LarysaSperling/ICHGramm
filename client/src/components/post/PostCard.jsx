import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
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
import timeAgo from "../../utils/timeAgo";
import SharePostModal from "./SharePostModal";
import PostActionMenu from "../profile/PostActionMenu";

import "../../styles/post.css";

const CAPTION_LIMIT = 20;
const COMMENT_LIMIT = 35;

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

const getFollowingUserId = (followItem) => {
  const following = followItem?.following;

  if (typeof following === "string") {
    return following;
  }

  return following?._id || null;
};

const PostComment = ({ comment }) => {
  const [showFullText, setShowFullText] = useState(false);

  const commentText = comment.text || "";
  const isLongComment = commentText.length > COMMENT_LIMIT;

  const displayedComment =
    showFullText || !isLongComment
      ? commentText
      : `${commentText.slice(0, COMMENT_LIMIT)}...`;

  return (
    <p className="post-comment">
      <strong>{comment.user?.username || "unknown"}</strong>{" "}
      <span>{displayedComment}</span>

      {isLongComment && !showFullText && (
        <button
          type="button"
          className="post-comment-more"
          onClick={() => setShowFullText(true)}
        >
          more
        </button>
      )}
    </p>
  );
};

const PostCard = ({
  post,
  savedPostIds = [],
  onPostChange,
  onOpenPost,
  isAuthorFollowing,
  onAuthorFollowChange,
}) => {
  const navigate = useNavigate();

  const [localPost, setLocalPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isFollowing, setIsFollowing] = useState(
    typeof isAuthorFollowing === "boolean"
      ? isAuthorFollowing
      : false,
  );
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [showAllComments, setShowAllComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const emojiRef = useRef(null);
  const inputRef = useRef(null);

  const currentUserId = getCurrentUserId();

  const {
    _id,
    image,
    caption,
    author,
    createdAt,
  } = localPost;

  const authorId = author?._id;
  const authorLink = authorId ? `/users/${authorId}` : "#";
  const isOwnPost = authorId === currentUserId;

  const postLikes = Array.isArray(localPost.likes)
    ? localPost.likes
    : [];

  const isLiked = postLikes.some((like) => {
    const likeId =
      typeof like === "string" ? like : like?._id;

    return likeId === currentUserId;
  });

  const likesCount = postLikes.length;
  const isSaved = savedPostIds.includes(_id);

  const visibleComments = showAllComments
    ? comments
    : comments.slice(0, 2);

  const safeCaption = caption || "";
  const isLongCaption = safeCaption.length > CAPTION_LIMIT;

  const displayedCaption =
    showFullCaption || !isLongCaption
      ? safeCaption
      : `${safeCaption.slice(0, CAPTION_LIMIT)}...`;

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (typeof isAuthorFollowing === "boolean") {
      setIsFollowing(isAuthorFollowing);
    }
  }, [isAuthorFollowing]);

  useEffect(() => {
    const handleClickOutsideEmoji = (event) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target)
      ) {
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutsideEmoji,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutsideEmoji,
      );
    };
  }, []);

  useEffect(() => {
    const getComments = async () => {
      try {
        const { data } = await api.get(`/comments/${_id}`);

        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(
          err.response?.data?.message ||
            "Failed to load comments",
        );
      }
    };

    getComments();
  }, [_id]);

  useEffect(() => {
    const getFollowingStatus = async () => {
      if (
        !authorId ||
        !currentUserId ||
        isOwnPost ||
        typeof isAuthorFollowing === "boolean"
      ) {
        return;
      }

      try {
        const { data } = await api.get(
          `/follows/${currentUserId}/following`,
        );

        const followingList = Array.isArray(data) ? data : [];

        const followsAuthor = followingList.some(
          (followItem) =>
            getFollowingUserId(followItem) === authorId,
        );

        setIsFollowing(followsAuthor);
      } catch (err) {
        console.error(
          err.response?.data?.message ||
            "Failed to load follow status",
        );
      }
    };

    getFollowingStatus();
  }, [
    authorId,
    currentUserId,
    isOwnPost,
    isAuthorFollowing,
  ]);

  const handleEmojiClick = (emojiData) => {
    setCommentText(
      (previousText) => `${previousText}${emojiData.emoji}`,
    );

    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleToggleFollow = async () => {
    if (!authorId || isOwnPost || isFollowLoading) {
      return;
    }

    const nextFollowingStatus = !isFollowing;

    try {
      setIsFollowLoading(true);

      if (nextFollowingStatus) {
        await api.post(`/follows/${authorId}`);
      } else {
        await api.delete(`/follows/${authorId}`);
      }

      setIsFollowing(nextFollowingStatus);

      onAuthorFollowChange?.(
        nextFollowingStatus,
        authorId,
      );
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          (nextFollowingStatus
            ? "Failed to follow user"
            : "Failed to unfollow user"),
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(
        `/posts/${_id}/like`,
      );

      if (data.post) {
        setLocalPost(data.post);
        onPostChange?.(data.post);
      }
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to like post",
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const { data } = await api.post(
        `/users/saved/${_id}`,
      );

      onPostChange?.(localPost, {
        saved: data.saved,
      });
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to save post",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentIconClick = () => {
    inputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);

      const { data } = await api.post(
        `/comments/${_id}`,
        {
          text: commentText.trim(),
        },
      );

      setComments((previousComments) => [
        data,
        ...previousComments,
      ]);

      setCommentText("");
      setIsEmojiOpen(false);

      onPostChange?.({
        ...localPost,
        commentsCount: comments.length + 1,
      });
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to add comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCaption = async () => {
    const newCaption = window.prompt(
      "Edit caption",
      safeCaption,
    );

    if (newCaption === null) return;

    const normalizedCaption = newCaption.trim();

    if (!normalizedCaption) {
      window.alert("Caption cannot be empty");
      return;
    }

    try {
      const { data } = await api.put(
        `/posts/${_id}`,
        {
          caption: normalizedCaption,
        },
      );

      const updatedPost = data.post || data;

      setLocalPost(updatedPost);
      setShowFullCaption(false);
      onPostChange?.(updatedPost);
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to edit post",
      );
    }
  };

  const handleDeletePost = async () => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!shouldDelete) return;

    try {
      await api.delete(`/posts/${_id}`);

      onPostChange?.(null, {
        deletedPostId: _id,
      });
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to delete post",
      );
    }
  };

  const handleGoToProfile = () => {
    if (!authorId) return;

    navigate(`/users/${authorId}`);
  };

  const handleOpenPost = () => {
    onOpenPost?.(localPost);
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-header-left">
          <Link
            to={authorLink}
            className="post-author"
          >
            <Avatar
              src={author?.avatar}
              name={
                author?.username ||
                author?.fullName ||
                "Unknown"
              }
              size={36}
            />

            <div>
              <strong>
                {author?.username || "unknown"}
              </strong>

              <span>{timeAgo(createdAt)}</span>
            </div>
          </Link>

          {!isOwnPost && (
            <button
              type="button"
              className={
                isFollowing
                  ? "post-follow following"
                  : "post-follow"
              }
              onClick={handleToggleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading
                ? "Loading..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
          )}
        </div>

        <button
          className="post-more"
          type="button"
          onClick={() => setIsActionMenuOpen(true)}
          aria-label="Open post menu"
        >
          <MoreHorizontal size={22} />
        </button>
      </header>

      <img
        className="post-image"
        src={image}
        alt={safeCaption || "Post"}
        loading="lazy"
        decoding="async"
        onClick={handleOpenPost}
      />

      <div className="post-actions">
        <div>
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            aria-label="Like post"
          >
            <Heart
              size={24}
              fill={isLiked ? "red" : "none"}
              color={isLiked ? "red" : "currentColor"}
            />
          </button>

          <button
            type="button"
            onClick={handleCommentIconClick}
            aria-label="Write a comment"
          >
            <MessageCircle size={24} />
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            aria-label="Share post"
          >
            <Send size={24} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleSave}
          disabled={isSaving}
          aria-label="Save post"
        >
          <Bookmark
            size={24}
            fill={isSaved ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className="post-likes">
        {likesCount === 1
          ? "1 like"
          : `${likesCount} likes`}
      </p>

      <p className="post-caption">
        <Link
          to={authorLink}
          className="post-author-link"
        >
          <strong>
            {author?.username || "unknown"}
          </strong>
        </Link>{" "}
        <span className="post-caption-text">
          {displayedCaption}
        </span>

        {isLongCaption && !showFullCaption && (
          <button
            type="button"
            className="post-caption-more"
            onClick={() => setShowFullCaption(true)}
          >
            more
          </button>
        )}
      </p>

      {comments.length > 0 && (
        <div className="post-comments">
          {visibleComments.map((comment) => (
            <PostComment
              key={comment._id}
              comment={comment}
            />
          ))}
        </div>
      )}

      {comments.length > 2 && (
        <button
          type="button"
          className="post-view-comments"
          onClick={() =>
            setShowAllComments(
              (previousValue) => !previousValue,
            )
          }
        >
          {showAllComments
            ? "Show less"
            : `View all comments (${comments.length})`}
        </button>
      )}

      <form
        className="comment-form"
        onSubmit={handleAddComment}
      >
        <div
          className="post-card-emoji"
          ref={emojiRef}
        >
          <button
            type="button"
            className="post-card-emoji-button"
            onClick={() =>
              setIsEmojiOpen(
                (previousValue) => !previousValue,
              )
            }
            aria-label="Choose emoji"
          >
            <Smile size={20} />
          </button>

          {isEmojiOpen && (
            <div className="post-card-emoji-picker">
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
          ref={inputRef}
          id={`comment-${_id}`}
          name="comment"
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(event) =>
            setCommentText(event.target.value)
          }
          autoComplete="off"
          maxLength={300}
        />

        <button
          type="submit"
          disabled={
            isSubmitting || !commentText.trim()
          }
        >
          Send
        </button>
      </form>

      <SharePostModal
        post={localPost}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <PostActionMenu
        isOpen={isActionMenuOpen}
        onClose={() => setIsActionMenuOpen(false)}
        isOwnPost={isOwnPost}
        isFollowing={isFollowing}
        postId={_id}
        authorId={authorId}
        onEdit={handleEditCaption}
        onDelete={handleDeletePost}
        onOpenPost={handleOpenPost}
        onGoToProfile={handleGoToProfile}
        onToggleFollow={handleToggleFollow}
      />
    </article>
  );
};

export default PostCard;
