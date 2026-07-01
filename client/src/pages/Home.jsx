import Feed from "../components/feed/Feed";
import RightSidebar from "../components/layout/RightSidebar";

import "../styles/home.css";

const Home = () => {
  return (
    <main className="home-page">
      <Feed />
      <RightSidebar />
    </main>
  );
};

export default Home;