import { useAuth } from "../../context/AuthContext";

import AddStory from "./AddStory";
import StoryItem from "./StoryItem";

import "../../styles/story.css";

const StoryList = ({ stories = [] }) => {
  const { user } = useAuth();

  return (
    <section className="stories">
      <AddStory user={user} />

      {stories.map((story) => (
        <StoryItem
          key={story._id}
          story={story}
        />
      ))}
    </section>
  );
};

export default StoryList;