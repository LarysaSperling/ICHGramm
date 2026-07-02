import Avatar from "../ui/Avatar";

const StoryItem = ({ story }) => {
  return (
    <button className="story-item" type="button">
      <div className="story-ring">
        <Avatar
          src={story.avatar}
          name={story.username}
          size={64}
        />
      </div>

      <span>{story.username}</span>
    </button>
  );
};

export default StoryItem;