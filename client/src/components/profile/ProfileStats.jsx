const ProfileStats = ({ postsCount }) => {
  return (
    <div className="profile-stats">
      <button type="button">
        <strong>{postsCount}</strong>
        <span>posts</span>
      </button>

      <button type="button">
        <strong>0</strong>
        <span>followers</span>
      </button>

      <button type="button">
        <strong>0</strong>
        <span>following</span>
      </button>
    </div>
  );
};

export default ProfileStats;