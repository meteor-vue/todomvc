Meteor.startup(function() {
  WebApp.addHtmlAttributeHook(function (request) {
    return {
      'data-framework': 'meteor-vue'
    }
  });
});