import ProfileGridItem from "./ProfileGridItem";

const ProfileGrid = ({ posts, onDeletePost, onUpdatePost }) => {
  if (!posts.length) {
    return (
      <div className="profile-empty">
        <div className="profile-empty-icon">📷</div>
        <h3>Share Photos</h3>
        <p>When you share photos, they will appear on your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-grid">
      {posts.map((post) => (
        <ProfileGridItem
          key={post._id}
          post={post}
          onDeletePost={onDeletePost}
          onUpdatePost={onUpdatePost}
        />
      ))}
    </div>
  );
};

export default ProfileGrid;
