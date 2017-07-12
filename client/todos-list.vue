<template>
  <ul class="todo-list">
    <li class="todo" v-for="todo in todos" :key="todo._id" :class="{completed: todo.completed, editing: todo._id == (editedTodo && editedTodo._id)}">
      <div class="view">
        <input class="toggle" type="checkbox" :checked="todo.completed" @change="setCompleted(todo, $event.target.checked)">
        <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
        <button class="destroy" @click="removeTodo(todo)"></button>
      </div>
      <input class="edit" type="text" :value="todo.title" v-todo-focus="todo._id == (editedTodo && editedTodo._id)" @blur="doneEdit(todo, $event.target.value)" @keyup.enter="doneEdit(todo, $event.target.value)" @keyup.esc="cancelEdit(todo)">
    </li>
  </ul>
</template>

<script>
  export default {
    props: ['todos'],

    data() {
      return {
        editedTodo: null,
      };
    },

    methods: {
      removeTodo(todo) {
        // TODO: Handle errors.
        Methods.Todos.Remove.call({todoId: todo._id});
      },

      editTodo(todo) {
        this.beforeEditCache = todo.title;
        this.editedTodo = todo;
      },

      doneEdit(todo, title) {
        if (!this.editedTodo) {
          return;
        }
        this.editedTodo = null;
        title = title.trim();
        if (!title) {
          this.removeTodo(todo);
        }
        else {
          // TODO: Handle errors.
          Methods.Todos.SetTitle.call({todoId: todo._id, title});
        }
      },

      cancelEdit(todo) {
        this.editedTodo = null;
        todo.title = this.beforeEditCache;
      },

      setCompleted(todo, completed) {
        // TODO: Handle errors.
        Methods.Todos.SetCompleted.call({todoId: todo._id, completed});
      },
    },

    // A custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    directives: {
      'todo-focus'(el, binding) {
        if (binding.value) {
          el.focus();
        }
      },
    },
  }
</script>