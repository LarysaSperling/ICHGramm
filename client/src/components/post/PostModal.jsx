import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  Smile,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import timeAgo from "../../utils/timeAgo";
import SharePostModal from "./SharePostModal";

import "../../styles/postModal.css";

const MAX_COMMENT_LENGTH = 500;

const getCurrentUserId = () => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1]),
    );

    return (
      payload.id ||
      payload._id ||
      payload.userId ||
      null
    );
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

const PostModal = ({
  post,
  onClose,
  onPostChange,
}) => {
  const [localPost, setLocalPost] =
    useState(post);

  const [comments, setComments] =
    useState([]);

  const [commentText, setCommentText] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isLiking, setIsLiking] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isSaved, setIsSaved] =
    useState(false);

  const [isFollowing, setIsFollowing] =
    useState(false);

  const [
    isFollowLoading,
    setIsFollowLoading,
  ] = useState(false);

  const [isEmojiOpen, setIsEmojiOpen] =
    useState(false);

  const [isShareOpen, setIsShareOpen] =
    useState(false);

  const emojiRef = useRef(null);
  const inputRef = useRef(null);

  const currentUserId =
    getCurrentUserId();

  const {
    _id,
    image,
    caption,
    author,
    createdAt,
  } = localPost || {};

  const authorId = author?._id;

  const authorLink = authorId
    ? `/users/${authorId}`
    : "#";

  const isOwnPost =
    Boolean(authorId) &&
    Boolean(currentUserId) &&
    authorId === currentUserId;

  const likes = Array.isArray(
    localPost?.likes,
  )
    ? localPost.likes
    : [];

  const isLiked = likes.some((like) => {
    const likeId =
      typeof like === "string"
        ? like
        : like?._id;

    return likeId === currentUserId;
  });

  const likesCount = likes.length;

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    const handleClickOutsideEmoji = (
      event,
    ) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(
          event.target,
        )
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
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [onClose]);

  useEffect(() => {
    const loadModalData = async () => {
      if (!_id) return;

      try {
        const requests = [
          api.get(`/comments/${_id}`),
          api.get("/users/saved"),
        ];

        if (
          currentUserId &&
          authorId &&
          !isOwnPost
        ) {
          requests.push(
            api.get(
              `/follows/${currentUserId}/following`,
            ),
          );
        }

        const responses =
          await Promise.all(requests);

        const commentsResponse =
          responses[0];

        const savedResponse =
          responses[1];

        const followingResponse =
          responses[2];

        setComments(
          Array.isArray(
            commentsResponse.data,
          )
            ? commentsResponse.data
            : [],
        );

        const savedIds = Array.isArray(
          savedResponse.data,
        )
          ? savedResponse.data
              .map(
                (savedPost) =>
                  savedPost?._id,
              )
              .filter(Boolean)
          : [];

        setIsSaved(
          savedIds.includes(_id),
        );

        if (followingResponse) {
          const followingList =
            Array.isArray(
              followingResponse.data,
            )
              ? followingResponse.data
              : [];

          const followsAuthor =
            followingList.some(
              (followItem) =>
                getFollowingUserId(
                  followItem,
                ) === authorId,
            );

          setIsFollowing(
            followsAuthor,
          );
        } else {
          setIsFollowing(false);
        }
      } catch (err) {
        console.error(
          err.response?.data?.message ||
            "Failed to load post",
        );
      }
    };

    loadModalData();
  }, [
    _id,
    authorId,
    currentUserId,
    isOwnPost,
  ]);

  const handleEmojiClick = (
    emojiData,
  ) => {
    setCommentText(
      (previousText) =>
        `${previousText}${emojiData.emoji}`,
    );

    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleToggleLike = async () => {
    if (isLiking || !_id) return;

    try {
      setIsLiking(true);

      const { data } = await api.post(
        `/posts/${_id}/like`,
      );

      const updatedPost =
        data.post || data;

      if (updatedPost?._id) {
        setLocalPost(updatedPost);
        onPostChange?.(updatedPost);
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
    if (isSaving || !_id) return;

    try {
      setIsSaving(true);

      const { data } = await api.post(
        `/users/saved/${_id}`,
      );

      const nextSavedState =
        Boolean(data.saved);

      setIsSaved(nextSavedState);

      onPostChange?.(localPost, {
        saved: nextSavedState,
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

  const handleToggleFollow = async () => {
    if (
      !authorId ||
      isOwnPost ||
      isFollowLoading
    ) {
      return;
    }

    const nextFollowingStatus =
      !isFollowing;

    try {
      setIsFollowLoading(true);

      if (nextFollowingStatus) {
        await api.post(
          `/follows/${authorId}`,
        );
      } else {
        await api.delete(
          `/follows/${authorId}`,
        );
      }

      setIsFollowing(
        nextFollowingStatus,
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

  const handleCommentIconClick = () => {
    inputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const handleAddComment = async (
    event,
  ) => {
    event.preventDefault();

    const normalizedComment =
      commentText.trim();

    if (
      !normalizedComment ||
      isSubmitting ||
      !_id
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const { data } = await api.post(
        `/comments/${_id}`,
        {
          text: normalizedComment,
        },
      );

      const nextComments = [
        data,
        ...comments,
      ];

      setComments(nextComments);
      setCommentText("");
      setIsEmojiOpen(false);

      const updatedPost = {
        ...localPost,
        commentsCount:
          nextComments.length,
      };

      setLocalPost(updatedPost);
      onPostChange?.(updatedPost);
    } catch (err) {
      console.error(
        err.response?.data?.message ||
          "Failed to add comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post || !localPost) {
    return null;
  }

  return (
    <div
      className="post-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="post-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Post preview"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="post-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close post"
        >
          <X size={26} />
        </button>

        <div className="post-modal-image">
          <img
            src={image}
            alt={caption || "Post"}
          />
        </div>

        <aside className="post-modal-content">
          <header className="post-modal-header">
            <Link
              to={authorLink}
              className="post-modal-user"
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

              <strong>
                {author?.username ||
                  "unknown"}
              </strong>
            </Link>

            {!isOwnPost && authorId && (
              <button
                type="button"
                className={
                  isFollowing
                    ? "post-modal-follow following"
                    : "post-modal-follow"
                }
                onClick={
                  handleToggleFollow
                }
                disabled={
                  isFollowLoading
                }
              >
                {isFollowLoading
                  ? "Loading..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
            )}
          </header>

          <div className="post-modal-scroll">
            {caption && (
              <div className="post-modal-caption">
                <Avatar
                  src={author?.avatar}
                  name={
                    author?.username ||
                    author?.fullName ||
                    "Unknown"
                  }
                  size={32}
                />

                <p>
                  <strong>
                    {author?.username ||
                      "unknown"}
                  </strong>{" "}
                  {caption}
                </p>
              </div>
            )}

            {comments.length > 0 ? (
              <div className="post-modal-comments">
                {comments.map(
                  (comment) => (
                    <div
                      key={comment._id}
                      className="post-modal-comment"
                    >
                      <Avatar
                        src={
                          comment.user
                            ?.avatar
                        }
                        name={
                          comment.user
                            ?.username ||
                          "Unknown"
                        }
                        size={32}
                      />

                      <p>
                        <strong>
                          {comment.user
                            ?.username ||
                            "unknown"}
                        </strong>{" "}
                        {comment.text}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="post-modal-empty">
                No comments yet.
              </p>
            )}
          </div>

          <div className="post-modal-actions">
            <div>
              <button
                type="button"
                onClick={
                  handleToggleLike
                }
                disabled={isLiking}
                aria-label="Like post"
              >
                <Heart
                  size={24}
                  fill={
                    isLiked
                      ? "red"
                      : "none"
                  }
                  color={
                    isLiked
                      ? "red"
                      : "currentColor"
                  }
                />
              </button>

              <button
                type="button"
                onClick={
                  handleCommentIconClick
                }
                aria-label="Write a comment"
              >
                <MessageCircle
                  size={24}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsShareOpen(true)
                }
                aria-label="Share post"
              >
                <Send size={24} />
              </button>
            </div>

            <button
              type="button"
              onClick={
                handleToggleSave
              }
              disabled={isSaving}
              aria-label={
                isSaved
                  ? "Remove from saved posts"
                  : "Save post"
              }
            >
              <Bookmark
                size={24}
                fill={
                  isSaved
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>

          <div className="post-modal-meta">
            <strong>
              {likesCount === 1
                ? "1 like"
                : `${likesCount} likes`}
            </strong>

            <span>
              {timeAgo(createdAt)}
            </span>
          </div>

          <form
            className="post-modal-form"
            onSubmit={handleAddComment}
          >
            <div
              className="post-modal-emoji"
              ref={emojiRef}
            >
              <button
                type="button"
                className="post-modal-emoji-button"
                onClick={() =>
                  setIsEmojiOpen(
                    (previousValue) =>
                      !previousValue,
                  )
                }
                aria-label="Choose emoji"
              >
                <Smile size={20} />
              </button>

              {isEmojiOpen && (
                <div className="post-modal-emoji-picker">
                  <EmojiPicker
                    onEmojiClick={
                      handleEmojiClick
                    }
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
              id={`modal-comment-${_id}`}
              name="modal-comment"
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(event) =>
                setCommentText(
                  event.target.value,
                )
              }
              autoComplete="off"
              maxLength={
                MAX_COMMENT_LENGTH
              }
            />

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !commentText.trim()
              }
            >
              Send
            </button>
          </form>
        </aside>

        <SharePostModal
          post={localPost}
          isOpen={isShareOpen}
          onClose={() =>
            setIsShareOpen(false)
          }
        />
      </div>
    </div>
  );
};

export default PostModal;
