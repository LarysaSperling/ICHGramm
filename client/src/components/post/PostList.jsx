import PostCard from "./PostCard";

const PostList = ({
  posts = [],
  savedPostIds = [],
  onPostChange,
  onOpenPost,
  isAuthorFollowing,
  onAuthorFollowChange,
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
          onOpenPost={onOpenPost}
          isAuthorFollowing={isAuthorFollowing}
          onAuthorFollowChange={onAuthorFollowChange}
        />
      ))}
    </div>
  );
};

export default PostList;