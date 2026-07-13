const ProfileStats = ({
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
}) => {
  return (
    <div className="profile-stats">
      <button type="button">
        <strong>{postsCount}</strong>
        <span>posts</span>
      </button>

      <button type="button">
        <strong>{followersCount}</strong>
        <span>followers</span>
      </button>

      <button type="button">
        <strong>{followingCount}</strong>
        <span>following</span>
      </button>
    </div>
  );
};

export default ProfileStats;