Methods = {};

Methods.Todos = {};

Methods.Todos.Add = new ValidatedMethod({
  name: 'todos.add',
  validate(args) {
    check(args, {
      todo: {
        title: Match.NonEmptyString,
        completed: Boolean,
      },
    });
  },
  run({todo}) {
    todo.timestamp = new Date();
    return Collections.Todos.insert(todo);
  },
});

Methods.Todos.Remove = new ValidatedMethod({
  name: 'todos.remove',
  validate(args) {
    check(args, {
      todoId: Match.DocumentId,
    });
  },
  run({todoId}) {
    return Collections.Todos.remove(todoId);
  },
});

Methods.Todos.SetTitle = new ValidatedMethod({
  name: 'todos.set-title',
  validate(args) {
    check(args, {
      todoId: Match.DocumentId,
      title: Match.NonEmptyString,
    });
  },
  run({todoId, title}) {
    return Collections.Todos.update(todoId, {$set: {title}});
  },
});

Methods.Todos.SetCompleted = new ValidatedMethod({
  name: 'todos.set-completed',
  validate(args) {
    check(args, {
      todoId: Match.DocumentId,
      completed: Boolean,
    });
  },
  run({todoId, completed}) {
    return Collections.Todos.update(todoId, {$set: {completed}});
  },
});

Methods.Todos.AllCompleted = new ValidatedMethod({
  name: 'todos.all-completed',
  validate(args) {
    check(args, {
      completed: Boolean,
    });
  },
  run({completed}) {
    return Collections.Todos.update({}, {$set: {completed}});
  },
});

Methods.Todos.RemoveCompleted = new ValidatedMethod({
  name: 'todos.remove-completed',
  validate(args) {
    check(args, {});
  },
  run() {
    return Collections.Todos.remove({completed: true});
  },
});
