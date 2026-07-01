import Avatar from "../ui/Avatar";
import ProfileStats from "./ProfileStats";

const ProfileHeader = ({ profile, postsCount }) => {
  return (
    <header className="profile-header">
      <Avatar
        src={profile.avatar}
        name={profile.username || profile.fullName}
        size={150}
      />

      <div className="profile-info">
        <div className="profile-top">
          <h2>{profile.username}</h2>
          <button type="button">Edit profile</button>
        </div>

        <ProfileStats postsCount={postsCount} />

        <div className="profile-bio">
          <strong>{profile.fullName}</strong>
          <p>{profile.bio || "No bio yet."}</p>
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;