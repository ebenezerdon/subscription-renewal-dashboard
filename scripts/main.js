/* main.js - entry point
   Only calls App methods defined on window.App and guards missing methods.
*/
$(function(){
  try {
    if (!window.App || typeof App.init !== 'function' || typeof App.render !== 'function') {
      console.error('[Contract] Missing App.init/App.render');
      return;
    }
    App.init();
    App.render();
  } catch (e) {
    console.error('Initialization failed', e);
  }
});
