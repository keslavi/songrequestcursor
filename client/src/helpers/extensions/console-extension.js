

(() => {
  /** @typedef {"all" | "jw" | "hubble"} LogGroup */

  /**
   * Log group key for localStorage
   * @type {string}
   */
  const keyLogGroup = "logGroups";

  /**
   * Global log group identifiers
   * @type {{ all: string, jw: string, hubble: string }}
   */
  globalThis.lg = {
    all: "all",
    jw: "jw",
    hubble: "hubble",
  };

  const originalLog = console.log.bind(console);

  /**
   * Get active log groups from localStorage
   * @returns {LogGroup[] | null}
   */
  function getGroups() {
    const stored = localStorage.getItem(keyLogGroup);
    if (stored === null) return null;

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  }

  /**
   * Override console.log to respect log groups
   * @param {...any} args
   */
  console.log = (...args) => {
    if (Array.isArray(args[0]) && args[0].includes("all")) {
      return originalLog(...args);
    }

    const currentGroups = getGroups();

    if (currentGroups === null) {
      if (Array.isArray(args[0]) && typeof args[0][0] !== "string") {
        console.error(
          "console.log('whatever') is being deprecated! see console-extension_README.txt"
        );
        return originalLog("use logGroups, see error above!", ...args); // fallback to regular logging
      } else if (!Array.isArray(args[0])) {
        console.error(
          "console.log('whatever') is being deprecated! see console-extension_README.txt"
        );
        return originalLog("use logGroups, see error above!", ...args); // fallback to regular logging
      } else {
        //originalLog("console .log supressed"); //(...args);        
        return 
      }
    }

    if (args.length === 1) {
      //originalLog("console .log supressed");
      return;
    }

    const maybeGroup = args[0];

    if (
      Array.isArray(maybeGroup) &&
      maybeGroup.some((g) => typeof g !== "string")
    ) {
      //originalLog("console suppressed"); 
      return;
    }
 
    if (maybeGroup.some((group) => currentGroups.includes(group))) {
      return originalLog(...args);
    }
  };

  /**
   * Console log group controller
   * @type {{
   *   add: (string) => add item to the log group,
   *   remove: (string) => remove item from the log group,
   *   set: ([string,string]) => set the log group,
   *   clear: () => clear the log group,
   *   list: () => logGroup collection
   * }}
   */
  console.logGroup = {
    add(key) {
      let current = getGroups() || [];
      if (current.length === 0 && key !== "all") {
        current.push("all");
      }
      if (!current.includes(key)) current.push(key);
      localStorage.setItem(keyLogGroup, JSON.stringify(current));
      console.info("added: ",key, console.logGroup.list());
      return console.logGroup.list();
    },

    remove(key) {
      let current = getGroups() || [];
      current = current.filter((g) => g !== group);
      localStorage.setItem(key, JSON.stringify(current));
      return console.logGroup.list();
    },

    set(...keys) {
      // Flatten the groups array in case it's nested (due to rest parameters)
      const flattenedKeys = keys.flat();

      // Check if "all" is already in the array
      if (!flattenedKeys.includes("all")) {
        // Add "all" to the beginning of the array
        flattenedKeys.unshift("all");
      } else {
        // If "all" exists but not at the first position, move it to the front
        const index = flattenedKeys.indexOf("all");
        if (index > 0) {
          flattenedKeys.splice(index, 1); // Remove "all" from its current position
          flattenedKeys.unshift("all"); // Add "all" to the beginning
        }
      }

      // Store the modified array in localStorage
      localStorage.setItem(keyLogGroup, JSON.stringify(flattenedKeys));
      return this.list();
    },

    clear() {
      localStorage.removeItem(keyLogGroup);
      return this.list();
    },

    list() {
      return getGroups();
    },
    test(){
      console.clear();
      console.info("beginning tests");
      const tmp = console.logGroup.list();

      //test1
      console.info("T1.1 should be true and also throw error message");
      console.logGroup.clear(); 
      console.log ( true, "test 1.1 should print, no log Groups set");

      console.info("T1.2 should be true")
      console.log([lg.all],true, "test1.2 should print"); 

      console.info("T1.3 should not print");
      console.log ([lg.jw],"ERROR test 1.3 should not print");
      
      //test2
      console.logGroup.add(lg.jw); //should add "all" by default and "jw" to localstorage
      console.info("T2.1 should be true");
      console.log([lg.jw],true, "Test 2.1 should print"); //adds "jw". if logGroups is empty, it should add "all" by default as first array item. 
      
      console.info("T2.2 should NOT print"); 
      console.log("test 2.2 should NOT print");
      
      console.info("T2.3 should be true");
      console.log([lg.all],true, "test 2.3 should print");
      
      console.info("T2.4 should be true");
      console.log([lg.jw],true, "test 2.4 should print");
      
      console.info("T2.5 should NOT print");
      console.log([lg.hubble],"ERROR test 2.5 should NOT print");
      
      //test3
      console.logGroup.add(lg.hubble);
      console.info("T3.1 should be true"); 
      console.log([lg.hubble],true, "test 3.1 should print");
      
      console.logGroup.clear();
      if (tmp) {
        console.logGroup.set(tmp);
      }
      console.info("test complete");            
    }
  };
})();
