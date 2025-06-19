import {render,screen,userEvent,waitFor,act,within} from "@testing-library/react";
import "@testing-library/jest-dom";

global.render = render;
global.screen = screen;
global.userEvent = userEvent;
global.waitFor = waitFor;
global.act = act;
global.within = within;

//import "@testing-library/user-event"; //maybe add here? 

/*
 vitest setup outlined here: https://www.youtube.com/watch?v=G-4zgIPsjkU

add this do package.scripts or run: 

"installTesting": "npm install -D vitest vitest/ui jsdom @testing-library/jest-dom @testing-library/react @testing-library/user-event"

--------------------------------------
add to vite config.js
/// <reference types="vitest" />
/// <reference types="vite/client" />

//you can create a separate config file for vitest, but this is recommended. 
import { defineConfig } from "vitest/config"; !important

...

export default defineConfig({
  test: {
    globals:true,
    environment:"jsdom",
    setupFiles: './src/test/_setupTest.js',
    css: true
  },

  ---------------------------------------


*/



import { afterEach } from "vitest";
//import { cleanup } from "@testing-library/react";

afterEach(()=>{
    //cleanup(); //it's called automaticaly since v9
})