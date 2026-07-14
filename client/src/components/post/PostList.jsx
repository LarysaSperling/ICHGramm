import PostCard from "./PostCard";

const PostList = ({
  posts = [],
  savedPostIds = [],
  followingUserIds = [],
  onPostChange,
  onOpenPost,
  isAuthorFollowing,
  onAuthorFollowChange,
}) => {
  if (!posts.length) {
    return (
      <p className="post-list-empty">
        No posts yet.
      </p>
    );
  }

  return (
    <div className="post-list">
      {posts.map((post) => {
        const authorId =
          post.author?._id;

        const followsAuthor =
          typeof isAuthorFollowing ===
          "boolean"
            ? isAuthorFollowing
            : Boolean(
                authorId &&
                  followingUserIds.includes(
                    authorId,
                  ),
              );

        return (
          <PostCard
            key={post._id}
            post={post}
            savedPostIds={savedPostIds}
            onPostChange={onPostChange}
            onOpenPost={onOpenPost}
            isAuthorFollowing={
              followsAuthor
            }
            onAuthorFollowChange={
              onAuthorFollowChange
            }
          />
        );
      })}
    </div>
  );
};

export default PostList;