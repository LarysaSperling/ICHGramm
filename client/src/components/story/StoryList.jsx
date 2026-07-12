import { useCallback, useEffect, useState } from "react";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import AddStory from "./AddStory";
import StoryItem from "./StoryItem";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";

import "../../styles/story.css";

const StoryList = () => {
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);
  const [selectedStoryOwnerId, setSelectedStoryOwnerId] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data } = await api.get("/stories");

      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const currentUserId = user?._id;

  const myStories = currentUserId
    ? stories
        .filter((story) => story.author?._id === currentUserId)
        .sort(
          (firstStory, secondStory) =>
            new Date(firstStory.createdAt) - new Date(secondStory.createdAt),
        )
    : [];

  const groupsMap = new Map();

  stories.forEach((story) => {
    const author = story.author;

    if (!author?._id || author._id === currentUserId) {
      return;
    }

    if (!groupsMap.has(author._id)) {
      groupsMap.set(author._id, {
        user: author,
        stories: [],
      });
    }

    groupsMap.get(author._id).stories.push(story);
  });

  const otherStoryGroups = [...groupsMap.values()].map((group) => ({
    ...group,
    stories: group.stories.sort(
      (firstStory, secondStory) =>
        new Date(firstStory.createdAt) - new Date(secondStory.createdAt),
    ),
  }));

  const handleStoryCreated = (newStory) => {
    setStories((prev) => [newStory, ...prev]);

    setSelectedStories([newStory]);
    setSelectedStoryOwnerId(user?._id || null);
    setIsViewerOpen(true);
  };

  const handleViewMyStory = () => {
    if (myStories.length === 0) {
      setIsCreateOpen(true);
      return;
    }

    setSelectedStories(myStories);
    setSelectedStoryOwnerId(user?._id || null);
    setIsViewerOpen(true);
  };

  const handleViewStoryGroup = (storyGroup) => {
    setSelectedStories(storyGroup.stories);
    setSelectedStoryOwnerId(storyGroup.user._id);
    setIsViewerOpen(true);
  };

  const handleStoryDeleted = (storyId) => {
    const remainingSelectedStories = selectedStories.filter(
      (story) => story._id !== storyId,
    );

    setStories((prev) => prev.filter((story) => story._id !== storyId));

    setSelectedStories(remainingSelectedStories);

    if (remainingSelectedStories.length === 0) {
      setIsViewerOpen(false);
      setSelectedStoryOwnerId(null);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedStories([]);
    setSelectedStoryOwnerId(null);
  };

  return (
    <>
      <section className="stories">
        <AddStory
          user={user}
          hasStory={myStories.length > 0}
          onCreateStory={() => setIsCreateOpen(true)}
          onViewStory={handleViewMyStory}
        />

        {!isLoading &&
          otherStoryGroups.map((storyGroup) => (
            <StoryItem
              key={storyGroup.user._id}
              storyGroup={storyGroup}
              onClick={() => handleViewStoryGroup(storyGroup)}
            />
          ))}

        {isLoading && <p className="stories-status">Loading...</p>}

        {error && (
          <p className="stories-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {isViewerOpen && selectedStories.length > 0 && (
        <StoryViewerModal
          stories={selectedStories}
          initialIndex={0}
          isOwnStory={selectedStoryOwnerId === user?._id}
          onClose={handleCloseViewer}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </>
  );
};

export default StoryList;
