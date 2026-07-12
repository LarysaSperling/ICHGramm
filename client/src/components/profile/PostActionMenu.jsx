import "../../styles/postActionMenu.css";

const PostActionMenu = ({
  isOpen,
  onClose,
  isOwnPost = false,
  isFollowing = false,
  onEdit,
  onDelete,
  onOpenPost,
  onGoToProfile,
  onToggleFollow,
  authorId,
}) => {
  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const postUrl = authorId
      ? `${window.location.origin}/users/${authorId}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(postUrl);
    } catch (error) {
      console.error("Copy link failed:", error);
    }

    onClose();
  };

  const handleEdit = () => {
    onClose();
    onEdit?.();
  };

  const handleDelete = () => {
    onClose();
    onDelete?.();
  };

  const handleOpenPost = () => {
    onClose();
    onOpenPost?.();
  };

  const handleGoToProfile = () => {
    onClose();
    onGoToProfile?.();
  };

  const handleToggleFollow = () => {
    onClose();
    onToggleFollow?.();
  };

  return (
    <div className="post-action-menu-overlay" onClick={onClose}>
      <div
        className="post-action-menu-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {isOwnPost ? (
          <>
            <button
              type="button"
              className="post-action-menu-item danger"
              onClick={handleDelete}
            >
              Delete
            </button>

            <button
              type="button"
              className="post-action-menu-item strong"
              onClick={handleEdit}
            >
              Edit caption
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="post-action-menu-item strong"
              onClick={handleGoToProfile}
            >
              Go to profile
            </button>

            <button
              type="button"
              className={
                isFollowing
                  ? "post-action-menu-item danger"
                  : "post-action-menu-item strong"
              }
              onClick={handleToggleFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </>
        )}

        <button
          type="button"
          className="post-action-menu-item"
          onClick={handleOpenPost}
        >
          Go to post
        </button>

        <button
          type="button"
          className="post-action-menu-item"
          onClick={handleCopyLink}
        >
          Copy link
        </button>

        <button
          type="button"
          className="post-action-menu-item"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PostActionMenu;
