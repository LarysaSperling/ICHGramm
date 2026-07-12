import { Plus } from "lucide-react";

import Avatar from "../ui/Avatar";

const AddStory = ({
  user,
  hasStory = false,
  onCreateStory,
  onViewStory,
}) => {
  const handleClick = () => {
    if (hasStory) {
      onViewStory?.();
      return;
    }

    onCreateStory?.();
  };

  return (
    <button
      className="story-item"
      type="button"
      onClick={handleClick}
      aria-label={
        hasStory ? "View your story" : "Create your story"
      }
    >
      <div
        className={
          hasStory
            ? "story-ring own-story has-story"
            : "story-ring own-story"
        }
      >
        <Avatar
          src={user?.avatar}
          name={user?.username || user?.fullName}
          size={64}
        />

        {!hasStory && (
          <div className="story-plus">
            <Plus size={14} />
          </div>
        )}
      </div>

      <span>Your story</span>
    </button>
  );
};

export default AddStory;