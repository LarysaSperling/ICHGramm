import Stories from "./Stories";
import PostList from "../post/PostList";

const Feed = () => {
  return (
    <section className="feed">
      <Stories />
      <PostList />
    </section>
  );
};

export default Feed;