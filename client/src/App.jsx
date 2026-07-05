import AppRoutes from "./routes/AppRoutes";
import { MessagesProvider } from "./context/MessagesContext";

function App() {
  return (
    <MessagesProvider>
      <AppRoutes />
    </MessagesProvider>
  );
}

export default App;
