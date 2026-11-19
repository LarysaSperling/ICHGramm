import AppRoutes from "./routes/AppRoutes";
import { MessagesProvider } from "./context/MessagesContext";
import ServerWakeBanner from "./components/ui/ServerWakeBanner";

function App() {
  return (
    <MessagesProvider>
      <ServerWakeBanner />
      <AppRoutes />
    </MessagesProvider>
  );
}

export default App;