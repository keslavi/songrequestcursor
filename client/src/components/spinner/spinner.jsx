import { useEffect, useState } from "react";
import spinner from "./spinner.gif";
import { store } from "@/store";

export const Spinner = () => {
const apiRequestCount =store.use.apiRequestCount();

  return (
    <div className={apiRequestCount < 1 ? "hidden" : "spinner"}>
      <div className="spinner-middle">
        <div className="spinner-inner">
          <img id="spinner-image" src={spinner} alt="Loading..." />
        </div>
      </div>
    </div>
  );
};
export default Spinner;
