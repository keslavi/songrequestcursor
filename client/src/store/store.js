import { create } from "zustand";
import { devtools } from "zustand/middleware";

import api from "./slice/api-slice"; //http request counter
import option from "./slice/option-slice";
import task from "./slice/task-slice";
import auth from "./slice/auth-slice";
import show from "./slice/show-slice";
import nearbyShows from "./slice/nearby-shows-slice";
import user from "./slice/user-slice";
import song from "./slice/song-slice";
import profile from "./slice/profile-slice";

export const useStoreDirectly = create(devtools((...a) => ({
    ...api(...a),//http request counter
    ...auth(...a),
    ...option(...a),
    ...task(...a),
    ...show(...a),
    ...nearbyShows(...a),
    ...user(...a),
    ...song(...a),
    ...profile(...a),
  }))
);

//export const useStore=useStoreDangerously;

const createSelectors= _store=>{
  const store=_store;
  store.use={};
  for (const k of Object.keys(store.getState())){
    store.use[k]=()=>store(s=>s[k]);
  }
  return store;
}

export const store=createSelectors(useStoreDirectly);
//export const useStore=store;
export default store;
