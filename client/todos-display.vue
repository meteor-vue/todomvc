<template>
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo" @keyup.enter="addTodo">
    </header>

    <section class="main" v-show="todos.length">
      <input class="toggle-all" type="checkbox" id="toggle-all" v-model="allDone"><label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li class="todo" v-for="todo in filteredTodos" :class="{completed: todo.completed, editing: todo == editedTodo}">
          <div class="view">
            <input class="toggle" type="checkbox" v-model="todo.completed">
            <label @dblclick="editTodo(todo)">{{todo.title}}</label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input class="edit" type="text" v-model="todo.title" v-todo-focus="todo == editedTodo" @blur="doneEdit(todo)" @keyup.enter="doneEdit(todo)" @keyup.esc="cancelEdit(todo)">
        </li>
      </ul>
    </section>

    <footer class="footer" v-show="todos.length">
      <span class="todo-count">
        <strong>{{ remaining }}</strong> {{ pluralize('item', remaining) }} left
      </span>
      <ul class="filters">
        <li><router-link to="/all" :class="{selected: visibility == 'all'}">All</router-link></li>
        <li><router-link to="/active" :class="{selected: visibility == 'active'}">Active</router-link></li>
        <li><router-link to="/completed" :class="{selected: visibility == 'completed'}">Completed</router-link></li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">Clear completed</button>
    </footer>
  </section>
</template>

<script>
  import Vue from 'vue';
  import {RouterFactory} from 'meteor/akryum:vue-router2';

  RouterFactory.configure((factory) => {
    factory.addRoutes([
      {
        path: '/:visibility?',
        name: 'todos-display',
        component: Vue.component('todos-display'),
        props: true,
        // TODO: Validate also on parameter change. See: https://github.com/vuejs/vue-router/issues/1577
        beforeEnter(to, from, next) {
          if (!to.params.visibility || ['all', 'active', 'completed'].includes(to.params.visibility)) {
            next();
          }
          else {
            // TODO: Replace current URL. See: https://github.com/vuejs/vue-router/issues/1578
            next({name: 'todos-display'});
          }
        },
      },
    ]);
  });

  var STORAGE_KEY = 'todos-vuejs';

  var todoStorage = {
    fetch: function () {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    },
    save: function (todos) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  };

  var filters = {
    all: function (todos) {
      return todos;
    },
    active: function (todos) {
      return todos.filter(function (todo) {
        return !todo.completed;
      });
    },
    completed: function (todos) {
      return todos.filter(function (todo) {
        return todo.completed;
      });
    }
  };

  export default {
    props: {
      visibility: {
        type: String,
        default: 'all',
        validator: (value) => {
          return ['all', 'active', 'completed'].includes(value);
        },
      },
    },

    // app initial state
    data: function () {
      return {
        todos: todoStorage.fetch(),
        newTodo: '',
        editedTodo: null
      }
    },

    // watch todos change for localStorage persistence
    watch: {
      todos: {
        deep: true,
        handler: todoStorage.save
      }
    },

    // computed properties
    // http://vuejs.org/guide/computed.html
    computed: {
      filteredTodos: function () {
        return filters[this.visibility](this.todos);
      },
      remaining: function () {
        return filters.active(this.todos).length;
      },
      allDone: {
        get: function () {
          return this.remaining === 0;
        },
        set: function (value) {
          this.todos.forEach(function (todo) {
            todo.completed = value;
          });
        }
      }
    },

    // methods that implement data logic.
    // note there's no DOM manipulation here at all.
    methods: {

      pluralize: function (word, count) {
        return word + (count === 1 ? '' : 's');
      },

      addTodo: function () {
        var value = this.newTodo && this.newTodo.trim();
        if (!value) {
          return;
        }
        this.todos.push({ title: value, completed: false });
        this.newTodo = '';
      },

      removeTodo: function (todo) {
        var index = this.todos.indexOf(todo);
        this.todos.splice(index, 1);
      },

      editTodo: function (todo) {
        this.beforeEditCache = todo.title;
        this.editedTodo = todo;
      },

      doneEdit: function (todo) {
        if (!this.editedTodo) {
          return;
        }
        this.editedTodo = null;
        todo.title = todo.title.trim();
        if (!todo.title) {
          this.removeTodo(todo);
        }
      },

      cancelEdit: function (todo) {
        this.editedTodo = null;
        todo.title = this.beforeEditCache;
      },

      removeCompleted: function () {
        this.todos = filters.active(this.todos);
      }
    },

    // a custom directive to wait for the DOM to be updated
    // before focusing on the input field.
    // http://vuejs.org/guide/custom-directive.html
    directives: {
      'todo-focus': function (el, binding) {
        if (binding.value) {
          el.focus();
        }
      }
    }
  }
</script>
