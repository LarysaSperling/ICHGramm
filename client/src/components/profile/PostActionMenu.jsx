import "../../styles/postActionMenu.css";

const PostActionMenu = ({ isOpen, onClose, onEdit, onDelete }) => {
  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      console.error("Copy link failed:", error);
    }

    onClose();
  };

  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleDelete = () => {
    onClose();
    onDelete();
  };

  return (
    <div className="post-action-menu-overlay" onClick={onClose}>
      <div
        className="post-action-menu-dialog"
        onClick={(event) => event.stopPropagation()}
      >
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

        <button type="button" className="post-action-menu-item" onClick={onClose}>
          Go to post
        </button>

        <button
          type="button"
          className="post-action-menu-item"
          onClick={handleCopyLink}
        >
          Copy link
        </button>

        <button type="button" className="post-action-menu-item" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PostActionMenu;