import Avatar from "../ui/Avatar";

const StoryItem = ({ storyGroup, onClick }) => {
  const user = storyGroup?.user;
  const storiesCount = storyGroup?.stories?.length || 0;

  if (!user || storiesCount === 0) return null;

  return (
    <button
      className="story-item"
      type="button"
      onClick={onClick}
      aria-label={`View ${user.username}'s story`}
    >
      <div className="story-ring has-story">
        <Avatar
          src={user.avatar}
          name={user.username || user.fullName}
          size={64}
        />
      </div>

      <span>{user.username}</span>
    </button>
  );
};

export default StoryItem;