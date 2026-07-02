import "../styles/profile.css";

const UserProfile = () => {
  return (
    <main className="profile-page">
      <section className="profile-header">

        <div className="profile-avatar">
          <img
            src="https://placehold.co/150x150"
            alt="Profile"
          />
        </div>

        <div className="profile-info">

          <div className="profile-top">
            <h2>itcareerhub</h2>

            <button className="follow-btn">
              Follow
            </button>

            <button className="message-btn">
              Message
            </button>
          </div>

          <div className="profile-stats">
            <span><strong>129</strong> posts</span>
            <span><strong>9993</strong> followers</span>
            <span><strong>59</strong> following</span>
          </div>

          <div className="profile-bio">
            <strong>IT Career Hub</strong>

            <p>
              Гарантия помощи с трудоустройством в ведущие IT-компании
            </p>

            <p>https://itcareerhub.de</p>
          </div>

        </div>

      </section>

      <section className="profile-grid">
        Posts grid
      </section>
    </main>
  );
};

export default UserProfile;