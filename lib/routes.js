// Simple client-side routing without iron:router
if (Meteor.isClient) {
  function handleRouting() {
    const path = window.location.pathname;
    const accessCodeMatch = path.match(/\/(\d+)\/?$/);

    if (accessCodeMatch && accessCodeMatch[1]) {
      const accessCode = accessCodeMatch[1];
      Session.set("urlAccessCode", accessCode);
      Session.set("currentView", "joinGame");
    } else {
      Session.set("currentView", "startMenu");
    }
  }

  // Handle routing on history change
  window.addEventListener('popstate', handleRouting);
}
