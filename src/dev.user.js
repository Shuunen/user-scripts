// ==UserScript==
// @name         Dev script - To have some kind of auto-reload
// @author       Romain Racamier-Lafon
// @description  Let's you play with your scripts
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/dev.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/dev.user.js
// @grant        none
// @match        https://www.__HEY_CHANGE_ME__.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @namespace    https://github.com/Shuunen
// @require      file://C:\Users\__HEY_CHANGE_ME__\Projects\github\monorepo\apps\user-scripts\src\utils.js
// @require      file://C:\Users\__HEY_CHANGE_ME__\Projects\github\monorepo\apps\user-scripts\src\hdd-cleaner.user.js
// @version      2.2.2
// ==/UserScript==

function Dev() {
  console.log('hello from dev script, loading __HEY_CHANGE_ME__')
}

if (globalThis.window) Dev()
