import { Link } from "react-router-dom";

import Avatar from "../ui/Avatar";
import ProfileStats from "./ProfileStats";

const ProfileHeader = ({
  profile,
  postsCount,
  followersCount,
  followingCount,
}) => {
  return (
    <header className="profile-header">
      <div className="profile-avatar">
        <Avatar
          src={profile.avatar}
          name={
            profile.username || profile.fullName
          }
          size={150}
        />
      </div>

      <div className="profile-info">
        <div className="profile-top">
          <h2>{profile.username}</h2>

          <Link
            className="profile-edit-btn"
            to="/profile/edit"
          >
            Edit profile
          </Link>
        </div>

        <ProfileStats
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={followingCount}
        />

        <div className="profile-bio">
          {profile.fullName && (
            <strong>{profile.fullName}</strong>
          )}

          {profile.bio && <p>{profile.bio}</p>}
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;