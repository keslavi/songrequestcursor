import { create } from "zustand";
import { devtools } from "zustand/middleware";

import api from "./slice/api-slice"; //http request counter
import option from "./slice/option-slice";
import task from "./slice/task-slice";
import auth from "./slice/auth-slice";
import show from "./slice/show-slice";

export const useStoreDirectly = create(devtools((...a) => ({
    ...api(...a),//http request counter
    ...auth(...a),
    ...option(...a),
    ...task(...a),
    ...show(...a),
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
