import { useSyncExternalStore } from "react";

import {
  getServerStatus,
  subscribeServerStatus,
} from "../api/serverStatus";

const useServerStatus = () =>
  useSyncExternalStore(
    subscribeServerStatus,
    getServerStatus,
  );

export default useServerStatus;
