import PostCard from "./PostCard";

const PostList = ({ posts }) => {
  if (!posts.length) {
    return <p>No posts yet.</p>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostList;