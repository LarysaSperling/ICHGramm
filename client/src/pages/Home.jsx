import Feed from "../components/feed/Feed";
import RightSidebar from "../components/layout/RightSidebar";
import StoryList from "../components/story/StoryList";
import "../styles/home.css";

const Home = () => {
  return (
    <main className="home-page">
      <StoryList stories={[]} />
      <Feed />
      <RightSidebar />
    </main>
  );
};

export default Home;