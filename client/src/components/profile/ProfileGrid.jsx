import ProfileGridItem from "./ProfileGridItem";

const ProfileGrid = ({
  posts = [],
  emptyTitle = "Share Photos",
  emptyText = "When you share photos, they will appear on your profile.",
  onDeletePost,
  onUpdatePost,
  onRemoveSavedPost,
  onSavedChange,
  isSavedView = false,
}) => {
  if (!posts.length) {
    return (
      <div className="profile-empty">
        <div className="profile-empty-icon">
          {isSavedView ? "🔖" : "📷"}
        </div>

        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="profile-grid">
      {posts.map((post) => (
        <ProfileGridItem
          key={post._id}
          post={post}
          isSavedView={isSavedView}
          onDeletePost={onDeletePost}
          onUpdatePost={onUpdatePost}
          onRemoveSavedPost={onRemoveSavedPost}
          onSavedChange={onSavedChange}
        />
      ))}
    </div>
  );
};

export default ProfileGrid;
