import { Plus } from "lucide-react";

import Avatar from "../ui/Avatar";

const AddStory = ({ user }) => {
  return (
    <button className="story-item" type="button">
      <div className="story-ring own-story">
        <Avatar
          src={user?.avatar}
          name={user?.username}
          size={64}
        />

        <div className="story-plus">
          <Plus size={14} />
        </div>
      </div>

      <span>Your story</span>
    </button>
  );
};

export default AddStory;