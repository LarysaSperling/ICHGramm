import { Heart, MessageCircle, Trash2 } from "lucide-react";

const ProfileGridItem = ({ post, onDeletePost }) => {
  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDeletePost(post._id);
  };

  return (
    <div className="profile-grid-item">
      <img src={post.image} alt={post.caption || "Post"} />

      <div className="profile-grid-overlay">
        <span>
          <Heart size={20} fill="white" /> 0
        </span>

        <span>
          <MessageCircle size={20} /> 0
        </span>
      </div>

      <button
        className="profile-post-delete"
        type="button"
        onClick={handleDeleteClick}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ProfileGridItem;