import Vue from 'vue';

// To not have dependency on underscore.
function isEmpty(object) {
  for (const name in object) {
    if (object.hasOwnProperty(name)) {
      return true;
    }
  }
  return false;
}

Vue.use({
  install(Vue, options) {
    Vue.mixin({
      beforeCreate() {
        this._onDestroyedCallbacks = [];

        this._allSubsReadyDep = new Tracker.Dependency();
        this._allSubsReady = false;
        this._subscriptionHandles = new Map();
      },

      destroyed() {
        while (this._onDestroyedCallbacks.length) {
          const callback = this._onDestroyedCallbacks.shift();
          if (callback) {
            callback();
          }
        }
      }
    });

    function addOnDestroyedCallback(callbacks, callback) {
      callbacks.push(callback);
    }

    function removeOnDestroyedCallback (callbacks, callback) {
      const index = callbacks.lastIndexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }

    Vue.prototype.$autorun = function (f) {
      const vm = this;
      const computation = Tracker.nonreactive(() => {
        return Tracker.autorun((computation) => {
          f.call(vm, computation);
        });
      });

      const stopComputation = function () {
        computation.stop();
      };

      addOnDestroyedCallback(this._onDestroyedCallbacks, stopComputation);
      computation.onStop(() => {
        removeOnDestroyedCallback(this._onDestroyedCallbacks, stopComputation);
      });

      return computation;
    };

    Vue.prototype.$subscribe = function (/* arguments */) {
      const args = Array.prototype.slice.call(arguments);

      // Duplicate logic from Meteor.subscribe.
      let options = {};
      if (args.length) {
        const lastParam = args[args.length - 1];

        // Match pattern to check if the last arg is an options argument.
        const lastParamOptionsPattern = {
          onReady: Match.Optional(Function),
          onStop: Match.Optional(Function),
          connection: Match.Optional(Match.Any),
        };

        if (typeof lastParam === 'function') {
          options.onReady = args.pop();
        }
        else if (lastParam && !isEmpty(lastParam) && Match.test(lastParam, lastParamOptionsPattern)) {
          options = args.pop();
        }
      }

      const oldStopped = options.onStop;
      options.onStop = (error) => {
        // When the subscription is stopped, remove it from the set of tracked
        // subscriptions to avoid this list growing without bound.
        this._subscriptionHandles.delete(subHandle.subscriptionId);
        removeOnDestroyedCallback(this._onDestroyedCallbacks, stopHandle);

        // Removing a subscription can only change the result of subscriptionsReady
        // if we are not ready (that subscription could be the one blocking us being
        // ready).
        if (!this._allSubsReady) {
          this._allSubsReadyDep.changed();
        }

        if (oldStopped) {
          oldStopped(error);
        }
      };

      const callbacks = {};
      if (options.hasOwnProperty('onReady')) {
        callbacks.onReady = options.onReady;
      }
      if (options.hasOwnProperty('onStop')) {
        callbacks.onStop = options.onStop;
      }

      args.push(callbacks);

      let subHandle;
      if (options.connection) {
        subHandle = options.connection.subscribe.apply(options.connection, args);
      }
      else {
        subHandle = Meteor.subscribe.apply(Meteor, args);
      }

      const stopHandle = function () {
        subHandle.stop();
      };

      addOnDestroyedCallback(this._onDestroyedCallbacks, stopHandle);

      if (!this._subscriptionHandles.has(subHandle.subscriptionId)) {
        this._subscriptionHandles.set(subHandle.subscriptionId, subHandle);

        // Adding a new subscription will always cause us to transition from ready
        // to not ready, but if we are already not ready then this can't make us
        // ready.
        if (this._allSubsReady) {
          this._allSubsReadyDep.changed();
        }
      }

      return subHandle;
    };

    Vue.prototype.$subscriptionsReady = function () {
      this._allSubsReadyDep.depend();

      this._allSubsReady = this._subscriptionHandles.every(function (handle, index, array) {
        return handle.ready();
      });

      return this._allSubsReady;
    };
  }
});

// To allow cursors to be returned from computed fields.
// See: https://github.com/meteor/meteor/pull/8888
if (!LocalCollection.Cursor.prototype[Symbol.iterator]) {
  LocalCollection.Cursor.prototype[Symbol.iterator] = function () {
    var self = this;

    var i = 0;
    var objects = self._getRawObjects({ordered: true});

    if (self.reactive) {
      self._depend({
        addedBefore: true,
        removed: true,
        changed: true,
        movedBefore: true});
    }

    return {
      next: function () {
        if (i < objects.length) {
          // This doubles as a clone operation.
          var elt = self._projectionFn(objects[i++]);

          if (self._transform)
            elt = self._transform(elt);

          return {
            value: elt
          };
        }
        else {
          return {
            done: true
          };
        }
      }
    };
  };
}