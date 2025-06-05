import "@testing-library/react";
import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import '@/helpers/extensions/lodashExtensions';  // Make isEmpty globally available
//import "@testing-library/user-event"; //maybe add here? 

//import { expect, afterEach } from 'vitest';
// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup () is called automatically
// afterEach(() => {
// }); 


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
