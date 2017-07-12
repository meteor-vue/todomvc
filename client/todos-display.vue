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
    // "props" are like arguments to Blaze Components.
    props: {
      visibility: {
        type: String,
        default: 'all',
        validator: (value) => {
          return ['all', 'active', 'completed'].includes(value);
        },
      },
    },

    // "data" is like assigning ReactiveFields inside onCreated in Blaze Components. Your internal state you want to
    // use and reactively modify. You can access their value by just accessing them on component's instance, and
    // they will define reactive dependencies. No need to call any getter. And you can update their value just by
    // assigning them a new value.
    data() {
      return {
        newTodo: '',
        subHandle: null,
      };
    },

    created() {
      // You can define autorun's computation which runs for the life-span of the component.
      this.$autorun((computation) => {
        // You can subscribe in the same way you would do in Blaze.
        // You can use this.$subscriptionsReady to have a reactive value which
        // is set to true once all subscriptions are ready.
        this.subHandle = this.$subscribe('todos', this.visibility);
      });
    },

    // Computed properties are like ComputedFields inside onCreated in Blaze Components.
    // All existing Tracker-based code just works as expected, having computed values rerun
    // when reactive dependencies change.
    computed: {
      todos() {
        // This defines a reactive dependency on "subHandle" as well.
        if (!this.subHandle) return [];

        // You can return Minimongo cursors directly. Make sure you use ":key" to _id in v-for directive.
        // In our case, we set ":key" to "todo._id".
        // "scopeQuery" is provided by peerlibrary:subscription-scope package.
        return Collections.Todos.find(this.subHandle.scopeQuery(), {sort: {timestamp: 1}});
      },

      all() {
        if (!this.subHandle) return 0;

        // This is something provided by peerlibrary:subscription-data package.
        return this.subHandle.data('all') || 0;
      },

      remaining() {
        if (!this.subHandle) return 0;

        // This is something provided by peerlibrary:subscription-data package.
        return this.subHandle.data('remaining') || 0;
      },

      // In contrast with ComputedFields, computed properties also allow setters
      // where you can define what should happen if value is assigned to them.
      allDone: {
        get() {
          // Using another computed value, which makes everything reactive and
          // recomputed when "remaining" changes.
          return this.remaining === 0;
        },
        set(completed) {
          // TODO: Handle errors.
          // Simply calling a Meteor method when needed.
          // This is using mdg:validated-method package.
          Methods.Todos.AllCompleted.call({completed});
        },
      },
    },

    // Methods are like methods on Blaze Components. You can call them as template helpers or use them
    // for event handlers. When used as template helpers they are run inside reactive context as well.
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
        // Setting a new value triggers reactive update everywhere where a dependency on "newTodo" has been made.
        this.newTodo = '';
      },

      removeCompleted() {
        // TODO: Handle errors.
        Methods.Todos.RemoveCompleted.call({});
      },
    },
  }
</script>
