<template>
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo" autofocus autocomplete="off" placeholder="What needs to be done?" v-model="newTodo" @keyup.enter="addTodo">
    </header>

    <section class="main" v-show="all">
      <input class="toggle-all" type="checkbox" id="toggle-all" v-model="allDone"><label for="toggle-all">Mark all as complete</label>
      <todos-list :todos="todos" />
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
        // TODO: How to not hard-code the name of the current component here?
        component: Vue.component('todos-display'),
        props: true,
        // TODO: Validate also on parameter change.
        //       See: https://github.com/vuejs/vue-router/issues/1577
        //       See: https://github.com/vuejs/vue-router/issues/1195
        beforeEnter(to, from, next) {
          if (!to.params.visibility || ['all', 'active', 'completed'].includes(to.params.visibility)) {
            next();
          }
          else {
            next({name: 'todos-display', replace: true});
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

        return Collections.Todos.find(this.subHandle.scopeQuery(), {sort: {timestamp: 1}});
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

      removeCompleted() {
        // TODO: Handle errors.
        Methods.Todos.RemoveCompleted.call({});
      },
    },
  }
</script>
