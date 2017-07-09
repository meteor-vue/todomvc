Meteor.publish('todos', function (visibility) {
  check(visibility, Match.OneOf('all', 'active', 'completed'));

  this.enableScope();

  this.autorun((computation) => {
    this.setData('all', Collections.Todos.find({}).count());
  });

  this.autorun((computation) => {
    this.setData('remaining', Collections.Todos.find({completed: false}).count());
  });

  if (visibility === 'active') {
    return Collections.Todos.find({completed: false});
  }
  else if (visibility === 'completed') {
    return Collections.Todos.find({completed: true});
  }
  // visibility === 'all'
  else {
    return Collections.Todos.find({});
  }
});
