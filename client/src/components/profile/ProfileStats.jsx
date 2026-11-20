import { pluralWord } from "../../utils/pluralize";

const ProfileStats = ({
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
}) => {
  return (
    <div className="profile-stats">
      <button type="button">
        <strong>{postsCount}</strong>
        <span>{pluralWord(postsCount, "post")}</span>
      </button>

      <button type="button">
        <strong>{followersCount}</strong>
        <span>{pluralWord(followersCount, "follower")}</span>
      </button>

      <button type="button">
        <strong>{followingCount}</strong>
        <span>{pluralWord(followingCount, "following")}</span>
      </button>
    </div>
  );
};

export default ProfileStats;