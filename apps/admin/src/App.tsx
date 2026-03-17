import { useAuthContext } from "@repo/app-providers";
import Private from "./Private";
import Public from "./Public";

function App() {
  const { authData } = useAuthContext();

  return authData?.token ? <Private /> : <Public />;
}

export default App;
