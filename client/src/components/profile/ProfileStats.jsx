const ProfileStats = ({ postsCount }) => {
  return (
    <div className="profile-stats">
      <span>
        <strong>{postsCount}</strong> posts
      </span>

      <span>
        <strong>0</strong> followers
      </span>

      <span>
        <strong>0</strong> following
      </span>
    </div>
  );
};

export default ProfileStats;