import PostCard from "./PostCard";

const PostList = ({
  posts = [],
  savedPostIds = [],
  onPostChange,
}) => {
  if (!posts.length) {
    return <p>No posts yet.</p>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          savedPostIds={savedPostIds}
          onPostChange={onPostChange}
        />
      ))}
    </div>
  );
};

export default PostList;