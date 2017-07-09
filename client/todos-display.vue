<template>
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo" @keyup.enter="addTodo">
    </header>

    <section class="main" v-show="all">
      <input class="toggle-all" type="checkbox" id="toggle-all" v-model="allDone"><label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li class="todo" v-for="todo in todos" :class="{completed: todo.completed, editing: todo == editedTodo}">
          <div class="view">
            <input class="toggle" type="checkbox" :checked="todo.completed" @change="setCompleted(todo, $event.target.checked)">
            <label @dblclick="editTodo(todo)">{{todo.title}}</label>
            <button class="destroy" @click="removeTodo(todo)"></button>
          </div>
          <input class="edit" type="text" :value="todo.title" v-todo-focus="todo == editedTodo" @blur="doneEdit(todo, $event.target.value)" @keyup.enter="doneEdit(todo, $event.target.value)" @keyup.esc="cancelEdit(todo)">
        </li>
      </ul>
    </section>

    <footer class="footer" v-show="all">
      <span class="todo-count">
        <strong>{{ remaining }}</strong> {{ pluralize('item', remaining) }} left
      </span>
      <ul class="filters">
        <li><router-link to="/all" :class="{selected: visibility == 'all'}">All</router-link></li>
        <li><router-link to="/active" :class="{selected: visibility == 'active'}">Active</router-link></li>
        <li><router-link to="/completed" :class="{selected: visibility == 'completed'}">Completed</router-link></li>
      </ul>
      <button class="clear-completed" @click="removeCompleted" v-show="all > remaining">Clear completed</button>
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

    data() {
      return {
        newTodo: '',
        editedTodo: null,
        subHandle: null,
      };
    },

    created() {
      this.$autorun((computation) => {
        this.subHandle = this.$subscribe('todos', this.visibility);
      });
    },

    computed: {
      todos() {
        if (!this.subHandle) return [];

        // TODO: Return cursor.
        return Collections.Todos.find(this.subHandle.scopeQuery(), {sort: {timestamp: 1}}).fetch();
      },

      all() {
        if (!this.subHandle) return 0;

        return this.subHandle.data('all') || 0;
      },

      remaining() {
        if (!this.subHandle) return 0;

        return this.subHandle.data('remaining') || 0;
      },

      allDone: {
        get() {
          return this.remaining === 0;
        },
        set(completed) {
          // TODO: Handle errors.
          Methods.Todos.AllCompleted.call({completed});
        },
      },
    },

    methods: {
      pluralize(word, count) {
        return word + (count === 1 ? '' : 's');
      },

      addTodo() {
        var value = this.newTodo && this.newTodo.trim();
        if (!value) {
          return;
        }
        // TODO: Handle errors.
        Methods.Todos.Add.call({todo: {title: value, completed: false}});
        this.newTodo = '';
      },

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

      removeCompleted() {
        // TODO: Handle errors.
        Methods.Todos.RemoveCompleted.call({});
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
