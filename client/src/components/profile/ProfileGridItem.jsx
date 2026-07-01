import { Heart, MessageCircle } from "lucide-react";

const ProfileGridItem = ({ post }) => {
  return (
    <button className="profile-grid-item" type="button">
      <img src={post.image} alt={post.caption || "Post"} />

      <div className="profile-grid-overlay">
        <span>
          <Heart size={20} fill="white" /> 0
        </span>

        <span>
          <MessageCircle size={20} /> 0
        </span>
      </div>
    </button>
  );
};

export default ProfileGridItem;