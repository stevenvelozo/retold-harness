"use strict";

function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.HarnessApp = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }
          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }
        return n[i].exports;
      }
      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
      return o;
    }
    return r;
  }()({
    1: [function (require, module, exports) {
      const libPictApplication = require('pict-application');
      const libPictRouter = require('pict-router');

      // Views
      const libViewLogin = require('./views/PictView-HarnessApp-Login.js');
      const libViewLayout = require('./views/PictView-HarnessApp-Layout.js');
      const libViewTopBar = require('./views/PictView-HarnessApp-TopBar.js');
      const libViewDashboard = require('./views/PictView-HarnessApp-Dashboard.js');
      const libViewBooks = require('./views/PictView-HarnessApp-Books.js');
      const libViewUsers = require('./views/PictView-HarnessApp-Users.js');
      class HarnessAppApplication extends libPictApplication {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);

          // Prevent pict-router from auto-resolving as each route is added.
          // Without this, routes fire before the DOM is ready (the protected
          // app container is hidden on the login screen), and Navigo marks
          // them as "consumed" so they never fire again.
          this.pict.settings.RouterSkipRouteResolveOnAdd = true;

          // Router provider — routes resolve only after layout renders
          this.pict.addProvider('PictRouter', require('./providers/PictRouter-HarnessApp.json'), libPictRouter);

          // Login view (extends pict-section-login)
          this.pict.addView('HarnessApp-Login', libViewLogin.default_configuration, libViewLogin);

          // Layout shell (top bar + content area)
          this.pict.addView('HarnessApp-Layout', libViewLayout.default_configuration, libViewLayout);

          // Top bar navigation
          this.pict.addView('HarnessApp-TopBar', libViewTopBar.default_configuration, libViewTopBar);

          // Content views (rendered into the content area by the router)
          this.pict.addView('HarnessApp-Dashboard', libViewDashboard.default_configuration, libViewDashboard);
          this.pict.addView('HarnessApp-Books', libViewBooks.default_configuration, libViewBooks);
          this.pict.addView('HarnessApp-Users', libViewUsers.default_configuration, libViewUsers);
        }
        onAfterInitializeAsync(fCallback) {
          // Render the login form first
          this.pict.views['HarnessApp-Login'].render();

          // Inject CSS so the login section styling is applied immediately
          this.pict.CSSMap.injectCSS();

          // Check if a session already exists (e.g. cookie from a previous visit).
          // The login view's onSessionChecked hook will call showProtectedApp()
          // if a valid session is found.
          this.pict.views['HarnessApp-Login'].checkSession();
          return super.onAfterInitializeAsync(fCallback);
        }

        // ===== Application-Level Navigation =====

        /**
         * Switch from the login screen to the protected application.
         * Called by the login view after a successful login or session check.
         */
        showProtectedApp() {
          // Hide the login container
          let tmpLoginElements = this.pict.ContentAssignment.getElement('#HarnessApp-Login-Container');
          if (tmpLoginElements && tmpLoginElements.length > 0) {
            tmpLoginElements[0].style.display = 'none';
          }

          // Show the protected app container
          let tmpAppElements = this.pict.ContentAssignment.getElement('#HarnessApp-Container');
          if (tmpAppElements && tmpAppElements.length > 0) {
            tmpAppElements[0].style.display = 'block';
          }

          // Render the layout shell (triggers TopBar, Dashboard, CSS injection, and router resolve)
          this.pict.views['HarnessApp-Layout'].render();
        }

        /**
         * Switch from the protected application back to the login screen.
         * Called by the doLogout() method after the session is destroyed.
         */
        showLogin() {
          // Clear session data
          this.pict.AppData.Session = null;

          // Hide the protected app container
          let tmpAppElements = this.pict.ContentAssignment.getElement('#HarnessApp-Container');
          if (tmpAppElements && tmpAppElements.length > 0) {
            tmpAppElements[0].style.display = 'none';
          }

          // Show the login container and re-render
          let tmpLoginElements = this.pict.ContentAssignment.getElement('#HarnessApp-Login-Container');
          if (tmpLoginElements && tmpLoginElements.length > 0) {
            tmpLoginElements[0].style.display = 'block';
          }

          // Reset the login view state and re-render
          let tmpLoginView = this.pict.views['HarnessApp-Login'];
          if (tmpLoginView) {
            tmpLoginView.authenticated = false;
            tmpLoginView.sessionData = null;
            tmpLoginView.initialRenderComplete = false;
            tmpLoginView.render();
          }
        }

        /**
         * Render a specific content view into the content container.
         * Called by the router when a route template matches.
         *
         * @param {string} pViewIdentifier - The view identifier to render
         */
        showView(pViewIdentifier) {
          if (pViewIdentifier in this.pict.views) {
            this.pict.views[pViewIdentifier].render();
          } else {
            this.pict.log.warn('View [' + pViewIdentifier + '] not found; falling back to Dashboard.');
            this.pict.views['HarnessApp-Dashboard'].render();
          }
        }

        /**
         * Navigate to a route using pict-router.
         *
         * @param {string} pRoute - The route path (e.g. '/Dashboard', '/Books')
         */
        navigateTo(pRoute) {
          this.pict.providers.PictRouter.navigate(pRoute);
        }

        /**
         * Log out and return to the login screen.
         * Called from the TopBar logout button.
         */
        doLogout() {
          let tmpLoginView = this.pict.views['HarnessApp-Login'];
          if (tmpLoginView) {
            tmpLoginView.logout(() => {
              this.showLogin();
            });
          } else {
            this.showLogin();
          }
        }
      }
      module.exports = HarnessAppApplication;
      module.exports.default_configuration = require('./Harness-App-Configuration.json');
    }, {
      "./Harness-App-Configuration.json": 2,
      "./providers/PictRouter-HarnessApp.json": 9,
      "./views/PictView-HarnessApp-Books.js": 10,
      "./views/PictView-HarnessApp-Dashboard.js": 11,
      "./views/PictView-HarnessApp-Layout.js": 12,
      "./views/PictView-HarnessApp-Login.js": 13,
      "./views/PictView-HarnessApp-TopBar.js": 14,
      "./views/PictView-HarnessApp-Users.js": 15,
      "pict-application": 19,
      "pict-router": 8
    }],
    2: [function (require, module, exports) {
      module.exports = {
        "Name": "Harness App",
        "Hash": "HarnessApp",
        "RouterSkipRouteResolveOnAdd": true
      };
    }, {}],
    3: [function (require, module, exports) {
      module.exports = {
        "name": "fable-serviceproviderbase",
        "version": "3.0.19",
        "description": "Simple base classes for fable services.",
        "main": "source/Fable-ServiceProviderBase.js",
        "scripts": {
          "start": "node source/Fable-ServiceProviderBase.js",
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "types": "tsc -p ./tsconfig.build.json",
          "check": "tsc -p . --noEmit"
        },
        "types": "types/source/Fable-ServiceProviderBase.d.ts",
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "repository": {
          "type": "git",
          "url": "https://github.com/stevenvelozo/fable-serviceproviderbase.git"
        },
        "keywords": ["entity", "behavior"],
        "author": "Steven Velozo <steven@velozo.com> (http://velozo.com/)",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/fable-serviceproviderbase/issues"
        },
        "homepage": "https://github.com/stevenvelozo/fable-serviceproviderbase",
        "devDependencies": {
          "@types/mocha": "^10.0.10",
          "fable": "^3.1.62",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        }
      };
    }, {}],
    4: [function (require, module, exports) {
      /**
      * Fable Service Base
      * @author <steven@velozo.com>
      */

      const libPackage = require('../package.json');
      class FableServiceProviderBase {
        /**
         * The constructor can be used in two ways:
         * 1) With a fable, options object and service hash (the options object and service hash are optional)a
         * 2) With an object or nothing as the first parameter, where it will be treated as the options object
         *
         * @param {import('fable')|Record<string, any>} [pFable] - (optional) The fable instance, or the options object if there is no fable
         * @param {Record<string, any>|string} [pOptions] - (optional) The options object, or the service hash if there is no fable
         * @param {string} [pServiceHash] - (optional) The service hash to identify this service instance
         */
        constructor(pFable, pOptions, pServiceHash) {
          /** @type {import('fable')} */
          this.fable;
          /** @type {string} */
          this.UUID;
          /** @type {Record<string, any>} */
          this.options;
          /** @type {Record<string, any>} */
          this.services;
          /** @type {Record<string, any>} */
          this.servicesMap;

          // Check if a fable was passed in; connect it if so
          if (typeof pFable === 'object' && pFable.isFable) {
            this.connectFable(pFable);
          } else {
            this.fable = false;
          }

          // Initialize the services map if it wasn't passed in
          /** @type {Record<string, any>} */
          this._PackageFableServiceProvider = libPackage;

          // initialize options and UUID based on whether the fable was passed in or not.
          if (this.fable) {
            this.UUID = pFable.getUUID();
            this.options = typeof pOptions === 'object' ? pOptions : {};
          } else {
            // With no fable, check to see if there was an object passed into either of the first two
            // Parameters, and if so, treat it as the options object
            this.options = typeof pFable === 'object' && !pFable.isFable ? pFable : typeof pOptions === 'object' ? pOptions : {};
            this.UUID = "CORE-SVC-".concat(Math.floor(Math.random() * (99999 - 10000) + 10000));
          }

          // It's expected that the deriving class will set this
          this.serviceType = "Unknown-".concat(this.UUID);

          // The service hash is used to identify the specific instantiation of the service in the services map
          this.Hash = typeof pServiceHash === 'string' ? pServiceHash : !this.fable && typeof pOptions === 'string' ? pOptions : "".concat(this.UUID);
        }

        /**
         * @param {import('fable')} pFable
         */
        connectFable(pFable) {
          if (typeof pFable !== 'object' || !pFable.isFable) {
            let tmpErrorMessage = "Fable Service Provider Base: Cannot connect to Fable, invalid Fable object passed in.  The pFable parameter was a [".concat(typeof pFable, "].}");
            console.log(tmpErrorMessage);
            return new Error(tmpErrorMessage);
          }
          if (!this.fable) {
            this.fable = pFable;
          }
          if (!this.log) {
            this.log = this.fable.Logging;
          }
          if (!this.services) {
            this.services = this.fable.services;
          }
          if (!this.servicesMap) {
            this.servicesMap = this.fable.servicesMap;
          }
          return true;
        }
      }
      _defineProperty(FableServiceProviderBase, "isFableService", true);
      module.exports = FableServiceProviderBase;

      // This is left here in case we want to go back to having different code/base class for "core" services
      module.exports.CoreServiceProviderBase = FableServiceProviderBase;
    }, {
      "../package.json": 3
    }],
    5: [function (require, module, exports) {
      !function (t, n) {
        "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define("Navigo", [], n) : "object" == typeof exports ? exports.Navigo = n() : t.Navigo = n();
      }("undefined" != typeof self ? self : this, function () {
        return function () {
          "use strict";

          var t = {
              407: function _(t, n, e) {
                e.d(n, {
                  default: function _default() {
                    return N;
                  }
                });
                var o = /([:*])(\w+)/g,
                  r = /\*/g,
                  i = /\/\?/g;
                function a(t) {
                  return void 0 === t && (t = "/"), v() ? location.pathname + location.search + location.hash : t;
                }
                function s(t) {
                  return t.replace(/\/+$/, "").replace(/^\/+/, "");
                }
                function c(t) {
                  return "string" == typeof t;
                }
                function u(t) {
                  return t && t.indexOf("#") >= 0 && t.split("#").pop() || "";
                }
                function h(t) {
                  var n = s(t).split(/\?(.*)?$/);
                  return [s(n[0]), n.slice(1).join("")];
                }
                function f(t) {
                  for (var n = {}, e = t.split("&"), o = 0; o < e.length; o++) {
                    var r = e[o].split("=");
                    if ("" !== r[0]) {
                      var i = decodeURIComponent(r[0]);
                      n[i] ? (Array.isArray(n[i]) || (n[i] = [n[i]]), n[i].push(decodeURIComponent(r[1] || ""))) : n[i] = decodeURIComponent(r[1] || "");
                    }
                  }
                  return n;
                }
                function l(t, n) {
                  var e,
                    a = h(s(t.currentLocationPath)),
                    l = a[0],
                    p = a[1],
                    d = "" === p ? null : f(p),
                    v = [];
                  if (c(n.path)) {
                    if (e = "(?:/^|^)" + s(n.path).replace(o, function (t, n, e) {
                      return v.push(e), "([^/]+)";
                    }).replace(r, "?(?:.*)").replace(i, "/?([^/]+|)") + "$", "" === s(n.path) && "" === s(l)) return {
                      url: l,
                      queryString: p,
                      hashString: u(t.to),
                      route: n,
                      data: null,
                      params: d
                    };
                  } else e = n.path;
                  var g = new RegExp(e, ""),
                    m = l.match(g);
                  if (m) {
                    var y = c(n.path) ? function (t, n) {
                      return 0 === n.length ? null : t ? t.slice(1, t.length).reduce(function (t, e, o) {
                        return null === t && (t = {}), t[n[o]] = decodeURIComponent(e), t;
                      }, null) : null;
                    }(m, v) : m.groups ? m.groups : m.slice(1);
                    return {
                      url: s(l.replace(new RegExp("^" + t.instance.root), "")),
                      queryString: p,
                      hashString: u(t.to),
                      route: n,
                      data: y,
                      params: d
                    };
                  }
                  return !1;
                }
                function p() {
                  return !("undefined" == typeof window || !window.history || !window.history.pushState);
                }
                function d(t, n) {
                  return void 0 === t[n] || !0 === t[n];
                }
                function v() {
                  return "undefined" != typeof window;
                }
                function g(t, n) {
                  return void 0 === t && (t = []), void 0 === n && (n = {}), t.filter(function (t) {
                    return t;
                  }).forEach(function (t) {
                    ["before", "after", "already", "leave"].forEach(function (e) {
                      t[e] && (n[e] || (n[e] = []), n[e].push(t[e]));
                    });
                  }), n;
                }
                function m(t, n, e) {
                  var o = n || {},
                    r = 0;
                  !function n() {
                    t[r] ? Array.isArray(t[r]) ? (t.splice.apply(t, [r, 1].concat(t[r][0](o) ? t[r][1] : t[r][2])), n()) : t[r](o, function (t) {
                      void 0 === t || !0 === t ? (r += 1, n()) : e && e(o);
                    }) : e && e(o);
                  }();
                }
                function y(t, n) {
                  void 0 === t.currentLocationPath && (t.currentLocationPath = t.to = a(t.instance.root)), t.currentLocationPath = t.instance._checkForAHash(t.currentLocationPath), n();
                }
                function _(t, n) {
                  for (var e = 0; e < t.instance.routes.length; e++) {
                    var o = l(t, t.instance.routes[e]);
                    if (o && (t.matches || (t.matches = []), t.matches.push(o), "ONE" === t.resolveOptions.strategy)) return void n();
                  }
                  n();
                }
                function k(t, n) {
                  t.navigateOptions && (void 0 !== t.navigateOptions.shouldResolve && console.warn('"shouldResolve" is deprecated. Please check the documentation.'), void 0 !== t.navigateOptions.silent && console.warn('"silent" is deprecated. Please check the documentation.')), n();
                }
                function O(t, n) {
                  !0 === t.navigateOptions.force ? (t.instance._setCurrent([t.instance._pathToMatchObject(t.to)]), n(!1)) : n();
                }
                m.if = function (t, n, e) {
                  return Array.isArray(n) || (n = [n]), Array.isArray(e) || (e = [e]), [t, n, e];
                };
                var w = v(),
                  L = p();
                function b(t, n) {
                  if (d(t.navigateOptions, "updateBrowserURL")) {
                    var e = ("/" + t.to).replace(/\/\//g, "/"),
                      o = w && t.resolveOptions && !0 === t.resolveOptions.hash;
                    L ? (history[t.navigateOptions.historyAPIMethod || "pushState"](t.navigateOptions.stateObj || {}, t.navigateOptions.title || "", o ? "#" + e : e), location && location.hash && (t.instance.__freezeListening = !0, setTimeout(function () {
                      if (!o) {
                        var n = location.hash;
                        location.hash = "", location.hash = n;
                      }
                      t.instance.__freezeListening = !1;
                    }, 1))) : w && (window.location.href = t.to);
                  }
                  n();
                }
                function A(t, n) {
                  var e = t.instance;
                  e.lastResolved() ? m(e.lastResolved().map(function (n) {
                    return function (e, o) {
                      if (n.route.hooks && n.route.hooks.leave) {
                        var r = !1,
                          i = t.instance.matchLocation(n.route.path, t.currentLocationPath, !1);
                        r = "*" !== n.route.path ? !i : !(t.matches && t.matches.find(function (t) {
                          return n.route.path === t.route.path;
                        })), d(t.navigateOptions, "callHooks") && r ? m(n.route.hooks.leave.map(function (n) {
                          return function (e, o) {
                            return n(function (n) {
                              !1 === n ? t.instance.__markAsClean(t) : o();
                            }, t.matches && t.matches.length > 0 ? 1 === t.matches.length ? t.matches[0] : t.matches : void 0);
                          };
                        }).concat([function () {
                          return o();
                        }])) : o();
                      } else o();
                    };
                  }), {}, function () {
                    return n();
                  }) : n();
                }
                function P(t, n) {
                  d(t.navigateOptions, "updateState") && t.instance._setCurrent(t.matches), n();
                }
                var R = [function (t, n) {
                    var e = t.instance.lastResolved();
                    if (e && e[0] && e[0].route === t.match.route && e[0].url === t.match.url && e[0].queryString === t.match.queryString) return e.forEach(function (n) {
                      n.route.hooks && n.route.hooks.already && d(t.navigateOptions, "callHooks") && n.route.hooks.already.forEach(function (n) {
                        return n(t.match);
                      });
                    }), void n(!1);
                    n();
                  }, function (t, n) {
                    t.match.route.hooks && t.match.route.hooks.before && d(t.navigateOptions, "callHooks") ? m(t.match.route.hooks.before.map(function (n) {
                      return function (e, o) {
                        return n(function (n) {
                          !1 === n ? t.instance.__markAsClean(t) : o();
                        }, t.match);
                      };
                    }).concat([function () {
                      return n();
                    }])) : n();
                  }, function (t, n) {
                    d(t.navigateOptions, "callHandler") && t.match.route.handler(t.match), t.instance.updatePageLinks(), n();
                  }, function (t, n) {
                    t.match.route.hooks && t.match.route.hooks.after && d(t.navigateOptions, "callHooks") && t.match.route.hooks.after.forEach(function (n) {
                      return n(t.match);
                    }), n();
                  }],
                  S = [A, function (t, n) {
                    var e = t.instance._notFoundRoute;
                    if (e) {
                      t.notFoundHandled = !0;
                      var o = h(t.currentLocationPath),
                        r = o[0],
                        i = o[1],
                        a = u(t.to);
                      e.path = s(r);
                      var c = {
                        url: e.path,
                        queryString: i,
                        hashString: a,
                        data: null,
                        route: e,
                        params: "" !== i ? f(i) : null
                      };
                      t.matches = [c], t.match = c;
                    }
                    n();
                  }, m.if(function (t) {
                    return t.notFoundHandled;
                  }, R.concat([P]), [function (t, n) {
                    t.resolveOptions && !1 !== t.resolveOptions.noMatchWarning && void 0 !== t.resolveOptions.noMatchWarning || console.warn('Navigo: "' + t.currentLocationPath + "\" didn't match any of the registered routes."), n();
                  }, function (t, n) {
                    t.instance._setCurrent(null), n();
                  }])];
                function E() {
                  return (E = Object.assign || function (t) {
                    for (var n = 1; n < arguments.length; n++) {
                      var e = arguments[n];
                      for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
                    }
                    return t;
                  }).apply(this, arguments);
                }
                function x(t, n) {
                  var e = 0;
                  A(t, function o() {
                    e !== t.matches.length ? m(R, E({}, t, {
                      match: t.matches[e]
                    }), function () {
                      e += 1, o();
                    }) : P(t, n);
                  });
                }
                function H(t) {
                  t.instance.__markAsClean(t);
                }
                function j() {
                  return (j = Object.assign || function (t) {
                    for (var n = 1; n < arguments.length; n++) {
                      var e = arguments[n];
                      for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && (t[o] = e[o]);
                    }
                    return t;
                  }).apply(this, arguments);
                }
                var C = "[data-navigo]";
                function N(t, n) {
                  var e,
                    o = n || {
                      strategy: "ONE",
                      hash: !1,
                      noMatchWarning: !1,
                      linksSelector: C
                    },
                    r = this,
                    i = "/",
                    d = null,
                    w = [],
                    L = !1,
                    A = p(),
                    P = v();
                  function R(t) {
                    return t.indexOf("#") >= 0 && (t = !0 === o.hash ? t.split("#")[1] || "/" : t.split("#")[0]), t;
                  }
                  function E(t) {
                    return s(i + "/" + s(t));
                  }
                  function N(t, n, e, o) {
                    return t = c(t) ? E(t) : t, {
                      name: o || s(String(t)),
                      path: t,
                      handler: n,
                      hooks: g(e)
                    };
                  }
                  function U(t, n) {
                    if (!r.__dirty) {
                      r.__dirty = !0, t = t ? s(i) + "/" + s(t) : void 0;
                      var e = {
                        instance: r,
                        to: t,
                        currentLocationPath: t,
                        navigateOptions: {},
                        resolveOptions: j({}, o, n)
                      };
                      return m([y, _, m.if(function (t) {
                        var n = t.matches;
                        return n && n.length > 0;
                      }, x, S)], e, H), !!e.matches && e.matches;
                    }
                    r.__waiting.push(function () {
                      return r.resolve(t, n);
                    });
                  }
                  function q(t, n) {
                    if (r.__dirty) r.__waiting.push(function () {
                      return r.navigate(t, n);
                    });else {
                      r.__dirty = !0, t = s(i) + "/" + s(t);
                      var e = {
                        instance: r,
                        to: t,
                        navigateOptions: n || {},
                        resolveOptions: n && n.resolveOptions ? n.resolveOptions : o,
                        currentLocationPath: R(t)
                      };
                      m([k, O, _, m.if(function (t) {
                        var n = t.matches;
                        return n && n.length > 0;
                      }, x, S), b, H], e, H);
                    }
                  }
                  function F() {
                    if (P) return (P ? [].slice.call(document.querySelectorAll(o.linksSelector || C)) : []).forEach(function (t) {
                      "false" !== t.getAttribute("data-navigo") && "_blank" !== t.getAttribute("target") ? t.hasListenerAttached || (t.hasListenerAttached = !0, t.navigoHandler = function (n) {
                        if ((n.ctrlKey || n.metaKey) && "a" === n.target.tagName.toLowerCase()) return !1;
                        var e = t.getAttribute("href");
                        if (null == e) return !1;
                        if (e.match(/^(http|https)/) && "undefined" != typeof URL) try {
                          var o = new URL(e);
                          e = o.pathname + o.search;
                        } catch (t) {}
                        var i = function (t) {
                          if (!t) return {};
                          var n,
                            e = t.split(","),
                            o = {};
                          return e.forEach(function (t) {
                            var e = t.split(":").map(function (t) {
                              return t.replace(/(^ +| +$)/g, "");
                            });
                            switch (e[0]) {
                              case "historyAPIMethod":
                                o.historyAPIMethod = e[1];
                                break;
                              case "resolveOptionsStrategy":
                                n || (n = {}), n.strategy = e[1];
                                break;
                              case "resolveOptionsHash":
                                n || (n = {}), n.hash = "true" === e[1];
                                break;
                              case "updateBrowserURL":
                              case "callHandler":
                              case "updateState":
                              case "force":
                                o[e[0]] = "true" === e[1];
                            }
                          }), n && (o.resolveOptions = n), o;
                        }(t.getAttribute("data-navigo-options"));
                        L || (n.preventDefault(), n.stopPropagation(), r.navigate(s(e), i));
                      }, t.addEventListener("click", t.navigoHandler)) : t.hasListenerAttached && t.removeEventListener("click", t.navigoHandler);
                    }), r;
                  }
                  function I(t, n, e) {
                    var o = w.find(function (n) {
                        return n.name === t;
                      }),
                      r = null;
                    if (o) {
                      if (r = o.path, n) for (var a in n) r = r.replace(":" + a, n[a]);
                      r = r.match(/^\//) ? r : "/" + r;
                    }
                    return r && e && !e.includeRoot && (r = r.replace(new RegExp("^/" + i), "")), r;
                  }
                  function M(t) {
                    var n = h(s(t)),
                      o = n[0],
                      r = n[1],
                      i = "" === r ? null : f(r);
                    return {
                      url: o,
                      queryString: r,
                      hashString: u(t),
                      route: N(o, function () {}, [e], o),
                      data: null,
                      params: i
                    };
                  }
                  function T(t, n, e) {
                    return "string" == typeof n && (n = z(n)), n ? (n.hooks[t] || (n.hooks[t] = []), n.hooks[t].push(e), function () {
                      n.hooks[t] = n.hooks[t].filter(function (t) {
                        return t !== e;
                      });
                    }) : (console.warn("Route doesn't exists: " + n), function () {});
                  }
                  function z(t) {
                    return "string" == typeof t ? w.find(function (n) {
                      return n.name === E(t);
                    }) : w.find(function (n) {
                      return n.handler === t;
                    });
                  }
                  t ? i = s(t) : console.warn('Navigo requires a root path in its constructor. If not provided will use "/" as default.'), this.root = i, this.routes = w, this.destroyed = L, this.current = d, this.__freezeListening = !1, this.__waiting = [], this.__dirty = !1, this.__markAsClean = function (t) {
                    t.instance.__dirty = !1, t.instance.__waiting.length > 0 && t.instance.__waiting.shift()();
                  }, this.on = function (t, n, o) {
                    var r = this;
                    return "object" != typeof t || t instanceof RegExp ? ("function" == typeof t && (o = n, n = t, t = i), w.push(N(t, n, [e, o])), this) : (Object.keys(t).forEach(function (n) {
                      if ("function" == typeof t[n]) r.on(n, t[n]);else {
                        var o = t[n],
                          i = o.uses,
                          a = o.as,
                          s = o.hooks;
                        w.push(N(n, i, [e, s], a));
                      }
                    }), this);
                  }, this.off = function (t) {
                    return this.routes = w = w.filter(function (n) {
                      return c(t) ? s(n.path) !== s(t) : "function" == typeof t ? t !== n.handler : String(n.path) !== String(t);
                    }), this;
                  }, this.resolve = U, this.navigate = q, this.navigateByName = function (t, n, e) {
                    var o = I(t, n);
                    return null !== o && (q(o.replace(new RegExp("^/?" + i), ""), e), !0);
                  }, this.destroy = function () {
                    this.routes = w = [], A && window.removeEventListener("popstate", this.__popstateListener), this.destroyed = L = !0;
                  }, this.notFound = function (t, n) {
                    return r._notFoundRoute = N("*", t, [e, n], "__NOT_FOUND__"), this;
                  }, this.updatePageLinks = F, this.link = function (t) {
                    return "/" + i + "/" + s(t);
                  }, this.hooks = function (t) {
                    return e = t, this;
                  }, this.extractGETParameters = function (t) {
                    return h(R(t));
                  }, this.lastResolved = function () {
                    return d;
                  }, this.generate = I, this.getLinkPath = function (t) {
                    return t.getAttribute("href");
                  }, this.match = function (t) {
                    var n = {
                      instance: r,
                      currentLocationPath: t,
                      to: t,
                      navigateOptions: {},
                      resolveOptions: o
                    };
                    return _(n, function () {}), !!n.matches && n.matches;
                  }, this.matchLocation = function (t, n, e) {
                    void 0 === n || void 0 !== e && !e || (n = E(n));
                    var o = {
                      instance: r,
                      to: n,
                      currentLocationPath: n
                    };
                    return y(o, function () {}), "string" == typeof t && (t = void 0 === e || e ? E(t) : t), l(o, {
                      name: String(t),
                      path: t,
                      handler: function handler() {},
                      hooks: {}
                    }) || !1;
                  }, this.getCurrentLocation = function () {
                    return M(s(a(i)).replace(new RegExp("^" + i), ""));
                  }, this.addBeforeHook = T.bind(this, "before"), this.addAfterHook = T.bind(this, "after"), this.addAlreadyHook = T.bind(this, "already"), this.addLeaveHook = T.bind(this, "leave"), this.getRoute = z, this._pathToMatchObject = M, this._clean = s, this._checkForAHash = R, this._setCurrent = function (t) {
                    return d = r.current = t;
                  }, function () {
                    A && (this.__popstateListener = function () {
                      r.__freezeListening || U();
                    }, window.addEventListener("popstate", this.__popstateListener));
                  }.call(this), F.call(this);
                }
              }
            },
            n = {};
          function e(o) {
            if (n[o]) return n[o].exports;
            var r = n[o] = {
              exports: {}
            };
            return t[o](r, r.exports, e), r.exports;
          }
          return e.d = function (t, n) {
            for (var o in n) e.o(n, o) && !e.o(t, o) && Object.defineProperty(t, o, {
              enumerable: !0,
              get: n[o]
            });
          }, e.o = function (t, n) {
            return Object.prototype.hasOwnProperty.call(t, n);
          }, e(407);
        }().default;
      });
    }, {}],
    6: [function (require, module, exports) {
      module.exports = {
        "name": "pict-provider",
        "version": "1.0.12",
        "description": "Pict Provider Base Class",
        "main": "source/Pict-Provider.js",
        "scripts": {
          "start": "node source/Pict-Provider.js",
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-provider-image:local",
          "docker-dev-run": "docker run -it -d --name pict-provider-dev -p 24125:8080 -p 30027:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-provider\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-provider-image:local",
          "docker-dev-shell": "docker exec -it pict-provider-dev /bin/bash",
          "lint": "eslint source/**",
          "types": "tsc -p ."
        },
        "types": "types/source/Pict-Provider.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-provider.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-provider/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-provider#readme",
        "devDependencies": {
          "@eslint/js": "^9.39.1",
          "eslint": "^9.39.1",
          "pict": "^1.0.351",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        },
        "dependencies": {
          "fable-serviceproviderbase": "^3.0.19"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        }
      };
    }, {}],
    7: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictProviderSettings = {
        ProviderIdentifier: false,
        // If this is set to true, when the App initializes this will.
        // After the App initializes, initialize will be called as soon as it's added.
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        AutoLoadDataWithApp: true,
        AutoLoadDataOrdinal: 0,
        AutoSolveWithApp: true,
        AutoSolveOrdinal: 0,
        Manifests: {},
        Templates: []
      };
      class PictProvider extends libFableServiceBase {
        /**
         * @param {import('fable')} pFable - The Fable instance.
         * @param {Record<string, any>} [pOptions] - The options for the provider.
         * @param {string} [pServiceHash] - The service hash for the provider.
         */
        constructor(pFable, pOptions, pServiceHash) {
          // Intersect default options, parent constructor, service information
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictProviderSettings)), pOptions);
          super(pFable, tmpOptions, pServiceHash);

          /** @type {import('fable') & import('pict') & { instantiateServiceProviderWithoutRegistration(pServiceType: string, pOptions?: Record<string, any>, pCustomServiceHash?: string): any }} */
          this.fable;
          /** @type {import('fable') & import('pict') & { instantiateServiceProviderWithoutRegistration(pServiceType: string, pOptions?: Record<string, any>, pCustomServiceHash?: string): any }} */
          this.pict;
          /** @type {any} */
          this.log;
          /** @type {Record<string, any>} */
          this.options;
          /** @type {string} */
          this.UUID;
          /** @type {string} */
          this.Hash;
          if (!this.options.ProviderIdentifier) {
            this.options.ProviderIdentifier = "AutoProviderID-".concat(this.fable.getUUID());
          }
          this.serviceType = 'PictProvider';
          /** @type {Record<string, any>} */
          this._Package = libPackage;

          // Convenience and consistency naming
          this.pict = this.fable;

          // Wire in the essential Pict application state
          /** @type {Record<string, any>} */
          this.AppData = this.pict.AppData;
          /** @type {Record<string, any>} */
          this.Bundle = this.pict.Bundle;
          this.initializeTimestamp = false;
          this.lastSolvedTimestamp = false;
          for (let i = 0; i < this.options.Templates.length; i++) {
            let tmpDefaultTemplate = this.options.Templates[i];
            if (!tmpDefaultTemplate.hasOwnProperty('Postfix') || !tmpDefaultTemplate.hasOwnProperty('Template')) {
              this.log.error("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " could not load Default Template ").concat(i, " in the options array."), tmpDefaultTemplate);
            } else {
              if (!tmpDefaultTemplate.Source) {
                tmpDefaultTemplate.Source = "PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " options object.");
              }
              this.pict.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
            }
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                        Code Section: Initialization                        */
        /* -------------------------------------------------------------------------- */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onBeforeInitialize:"));
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-pinitialization.
         *
         * @return {void}
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onInitialize:"));
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow PROVIDER [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " initialize:"));
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            this.onInitialize();
            this.onAfterInitialize();
            this.initializeTimestamp = this.pict.log.getTimeStamp();
            return true;
          } else {
            this.log.warn("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " initialize called but initialization is already completed.  Aborting."));
            return false;
          }
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow PROVIDER [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " initializeAsync:"));
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 0) {
              this.log.info("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " beginning initialization..."));
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            tmpAnticipate.wait(pError => {
              this.initializeTimestamp = this.pict.log.getTimeStamp();
              if (pError) {
                this.log.error("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " initialization failed: ").concat(pError.message || pError), {
                  Stack: pError.stack
                });
              } else if (this.pict.LogNoisiness > 0) {
                this.log.info("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " initialization complete."));
              }
              return fCallback();
            });
          } else {
            this.log.warn("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " async initialize called but initialization is already completed.  Aborting."));
            // TODO: Should this be an error?
            return fCallback();
          }
        }
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onAfterInitialize:"));
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after initialization.
         *
         * @return {void}
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }
        onPreRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onPreRender:"));
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-render.
         *
         * @return {void}
         */
        onPreRenderAsync(fCallback) {
          this.onPreRender();
          return fCallback();
        }
        render() {
          return this.onPreRender();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after render.
         *
         * @return {void}
         */
        renderAsync(fCallback) {
          this.onPreRender();
          return fCallback();
        }
        onPreSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onPreSolve:"));
          }
          return true;
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after pre-solve.
         *
         * @return {void}
         */
        onPreSolveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }
        solve() {
          return this.onPreSolve();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after solve.
         *
         * @return {void}
         */
        solveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data pre-load.
         */
        onBeforeLoadDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * Hook to allow the provider to load data during application data load.
         *
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data load.
         */
        onLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onLoadDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data post-load.
         */
        onAfterLoadDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data pre-load.
         *
         * @return {void}
         */
        onBeforeSaveDataAsync(fCallback) {
          return fCallback();
        }

        /**
         * Hook to allow the provider to load data during application data load.
         *
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data load.
         *
         * @return {void}
         */
        onSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictProvider [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ProviderIdentifier, " onSaveDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(pError?: Error) => void} fCallback - The callback to call after the data post-load.
         *
         * @return {void}
         */
        onAfterSaveDataAsync(fCallback) {
          return fCallback();
        }
      }
      module.exports = PictProvider;
    }, {
      "../package.json": 6,
      "fable-serviceproviderbase": 4
    }],
    8: [function (require, module, exports) {
      const libPictProvider = require('pict-provider');
      const libNavigo = require('navigo');
      const _DEFAULT_PROVIDER_CONFIGURATION = {
        ProviderIdentifier: 'Pict-Router',
        AutoInitialize: true,
        AutoInitializeOrdinal: 0
      };
      class PictRouter extends libPictProvider {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _DEFAULT_PROVIDER_CONFIGURATION, pOptions);
          super(pFable, tmpOptions, pServiceHash);

          // Initialize the navigo router and set the base path to '/'
          this.router = new libNavigo('/', {
            strategy: 'ONE',
            hash: true
          });
          if (this.options.Routes) {
            for (let i = 0; i < this.options.Routes.length; i++) {
              if (this.options.Routes[i].path && this.options.Routes[i].template) {
                this.addRoute(this.options.Routes[i].path, this.options.Routes[i].template);
              } else if (this.options.Routes[i].path && this.options.Routes[i].render) {
                this.addRoute(this.options.Routes[i].path, this.options.Routes[i].render);
              } else {
                this.pict.log.warn("Route ".concat(i, " is missing a render function or template string."));
              }
            }
          }

          // This is the route to render after load
          this.afterPersistView = '/Manyfest/Overview';
        }
        get currentScope() {
          var _this$AppData$Manyfes, _this$AppData;
          return (_this$AppData$Manyfes = (_this$AppData = this.AppData) === null || _this$AppData === void 0 || (_this$AppData = _this$AppData.ManyfestRecord) === null || _this$AppData === void 0 ? void 0 : _this$AppData.Scope) !== null && _this$AppData$Manyfes !== void 0 ? _this$AppData$Manyfes : 'Default';
        }
        forwardToScopedRoute(pData) {
          this.navigate("".concat(pData.url, "/").concat(this.currentScope));
        }
        onInitializeAsync(fCallback) {
          return super.onInitializeAsync(fCallback);
        }

        /**
         * Add a route to the router.
         */
        addRoute(pRoute, pRenderable) {
          if (typeof pRenderable === 'function') {
            this.router.on(pRoute, pRenderable);
          } else if (typeof pRenderable === 'string') {
            // Run this as a template, allowing some whack things with functions in template expressions.
            this.router.on(pRoute, pData => {
              this.pict.parseTemplate(pRenderable, pData, null, this.pict);
            });
          } else {
            // renderable isn't usable!
            this.pict.log.warn("Route ".concat(pRoute, " has an invalid renderable."));
            return;
          }

          // By default, resolve after each route is added (legacy behavior).
          // Applications can set pict.settings.RouterSkipRouteResolveOnAdd = true
          // to skip this and call resolve() explicitly after the DOM is ready,
          // which prevents premature route resolution before views are rendered.
          if (!this.pict.settings.RouterSkipRouteResolveOnAdd) {
            this.resolve();
          }
        }

        /**
         * Navigate to a given route (set the browser URL string, add to history, trigger router)
         * 
         * @param {string} pRoute - The route to navigate to
         */
        navigate(pRoute) {
          this.router.navigate(pRoute);
        }

        /**
         * Trigger the router resolving logic; this is expected to be called after all routes are added (to go to the default route).
         *
         */
        resolve() {
          this.router.resolve();
        }
      }
      module.exports = PictRouter;
      module.exports.default_configuration = _DEFAULT_PROVIDER_CONFIGURATION;
    }, {
      "navigo": 5,
      "pict-provider": 7
    }],
    9: [function (require, module, exports) {
      module.exports = {
        "ProviderIdentifier": "Pict-Router",
        "AutoInitialize": true,
        "AutoInitializeOrdinal": 0,
        "Routes": [{
          "path": "/Dashboard",
          "template": "{~LV:Pict.PictApplication.showView(`HarnessApp-Dashboard`)~}"
        }, {
          "path": "/Books",
          "template": "{~LV:Pict.PictApplication.showView(`HarnessApp-Books`)~}"
        }, {
          "path": "/Users",
          "template": "{~LV:Pict.PictApplication.showView(`HarnessApp-Users`)~}"
        }]
      };
    }, {}],
    10: [function (require, module, exports) {
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-Books",
        DefaultRenderable: "HarnessApp-Books-Content",
        DefaultDestinationAddress: "#HarnessApp-Content-Container",
        AutoRender: false,
        CSS: /*css*/"\n\t\t.harnessapp-books h1\n\t\t{\n\t\t\tfont-size: 1.8rem;\n\t\t\tmargin: 0 0 1rem 0;\n\t\t\tcolor: #264653;\n\t\t}\n\t\t.harnessapp-books-table\n\t\t{\n\t\t\twidth: 100%;\n\t\t\tborder-collapse: collapse;\n\t\t\tbackground: #fff;\n\t\t\tborder: 1px solid #D4A373;\n\t\t\tborder-radius: 6px;\n\t\t\toverflow: hidden;\n\t\t\tbox-shadow: 0 2px 8px rgba(38,70,83,0.08);\n\t\t}\n\t\t.harnessapp-books-table th\n\t\t{\n\t\t\tbackground: #264653;\n\t\t\tcolor: #FAEDCD;\n\t\t\tpadding: 0.6rem 0.75rem;\n\t\t\ttext-align: left;\n\t\t\tfont-size: 0.8rem;\n\t\t\tfont-weight: 600;\n\t\t\ttext-transform: uppercase;\n\t\t\tletter-spacing: 0.04em;\n\t\t}\n\t\t.harnessapp-books-table td\n\t\t{\n\t\t\tpadding: 0.55rem 0.75rem;\n\t\t\tborder-bottom: 1px solid #E8D9C0;\n\t\t\tfont-size: 0.85rem;\n\t\t\tcolor: #264653;\n\t\t}\n\t\t.harnessapp-books-table tr:nth-child(even) td\n\t\t{\n\t\t\tbackground: #FFF9F0;\n\t\t}\n\t\t.harnessapp-books-table tr:hover td\n\t\t{\n\t\t\tbackground: #FAEDCD;\n\t\t}\n\t\t.harnessapp-books-loading\n\t\t{\n\t\t\tpadding: 2rem;\n\t\t\ttext-align: center;\n\t\t\tcolor: #999;\n\t\t\tfont-size: 0.9rem;\n\t\t}\n\t",
        Templates: [{
          Hash: "HarnessApp-Books-Template",
          Template: /*html*/"\n<div class=\"harnessapp-books\">\n\t<h1>Books</h1>\n\t<div id=\"HarnessApp-Books-TableContainer\">\n\t\t<div class=\"harnessapp-books-loading\">Loading books&hellip;</div>\n\t</div>\n</div>\n"
        }],
        Renderables: [{
          RenderableHash: "HarnessApp-Books-Content",
          TemplateHash: "HarnessApp-Books-Template",
          DestinationAddress: "#HarnessApp-Content-Container",
          RenderMethod: "replace"
        }]
      };
      class HarnessAppBooksView extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          this._loadBooks();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _loadBooks() {
          fetch('/1.0/Books/FilteredTo/Title~ILK~a/0/25').then(pResponse => {
            return pResponse.json();
          }).then(pData => {
            let tmpRecords = [];
            if (Array.isArray(pData)) {
              tmpRecords = pData;
            } else if (pData && Array.isArray(pData.Records)) {
              tmpRecords = pData.Records;
            }
            this._renderTable(tmpRecords);
          }).catch(pError => {
            this.log.error('Failed to load books: ' + pError.message);
            let tmpContainer = this.services.ContentAssignment.getElement('#HarnessApp-Books-TableContainer');
            if (tmpContainer && tmpContainer.length > 0) {
              tmpContainer[0].innerHTML = '<div class="harnessapp-books-loading">Failed to load books. Is the server running?</div>';
            }
          });
        }
        _renderTable(pRecords) {
          let tmpContainer = this.services.ContentAssignment.getElement('#HarnessApp-Books-TableContainer');
          if (!tmpContainer || tmpContainer.length < 1) {
            return;
          }
          if (pRecords.length < 1) {
            tmpContainer[0].innerHTML = '<div class="harnessapp-books-loading">No books found.</div>';
            return;
          }
          let tmpHTML = '<table class="harnessapp-books-table">';
          tmpHTML += '<thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Language</th><th>Year</th></tr></thead>';
          tmpHTML += '<tbody>';
          for (let i = 0; i < pRecords.length; i++) {
            let tmpBook = pRecords[i];
            tmpHTML += '<tr>';
            tmpHTML += '<td>' + (tmpBook.IDBook || '') + '</td>';
            tmpHTML += '<td>' + (tmpBook.Title || '') + '</td>';
            tmpHTML += '<td>' + (tmpBook.Type || '') + '</td>';
            tmpHTML += '<td>' + (tmpBook.Language || '') + '</td>';
            tmpHTML += '<td>' + (tmpBook.PublishDate || '') + '</td>';
            tmpHTML += '</tr>';
          }
          tmpHTML += '</tbody></table>';
          tmpContainer[0].innerHTML = tmpHTML;
        }
      }
      module.exports = HarnessAppBooksView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    11: [function (require, module, exports) {
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-Dashboard",
        DefaultRenderable: "HarnessApp-Dashboard-Content",
        DefaultDestinationAddress: "#HarnessApp-Content-Container",
        AutoRender: false,
        CSS: /*css*/"\n\t\t.harnessapp-dashboard h1\n\t\t{\n\t\t\tfont-size: 1.8rem;\n\t\t\tmargin: 0 0 0.5rem 0;\n\t\t\tcolor: #264653;\n\t\t}\n\t\t.harnessapp-dashboard p\n\t\t{\n\t\t\tfont-size: 1rem;\n\t\t\tline-height: 1.6;\n\t\t\tcolor: #555;\n\t\t\tmax-width: 640px;\n\t\t\tmargin: 0 0 1.5rem 0;\n\t\t}\n\t\t.harnessapp-dashboard-cards\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\tgap: 1.25rem;\n\t\t\tflex-wrap: wrap;\n\t\t}\n\t\t.harnessapp-dashboard-card\n\t\t{\n\t\t\tflex: 1;\n\t\t\tmin-width: 220px;\n\t\t\tbackground: #fff;\n\t\t\tborder: 1px solid #D4A373;\n\t\t\tborder-top: 4px solid #E76F51;\n\t\t\tborder-radius: 6px;\n\t\t\tpadding: 1.25rem;\n\t\t\tcursor: pointer;\n\t\t\ttransition: box-shadow 0.15s, transform 0.15s;\n\t\t\tbox-shadow: 0 2px 8px rgba(38,70,83,0.08);\n\t\t}\n\t\t.harnessapp-dashboard-card:hover\n\t\t{\n\t\t\tbox-shadow: 0 4px 16px rgba(38,70,83,0.15);\n\t\t\ttransform: translateY(-2px);\n\t\t}\n\t\t.harnessapp-dashboard-card h3\n\t\t{\n\t\t\tmargin: 0 0 0.5rem;\n\t\t\tcolor: #E76F51;\n\t\t\tfont-size: 1.05rem;\n\t\t}\n\t\t.harnessapp-dashboard-card p\n\t\t{\n\t\t\tmargin: 0;\n\t\t\tfont-size: 0.9rem;\n\t\t\tcolor: #666;\n\t\t}\n\t\t.harnessapp-dashboard-session-info\n\t\t{\n\t\t\tbackground: #264653;\n\t\t\tcolor: #FAEDCD;\n\t\t\tborder-radius: 6px;\n\t\t\tpadding: 0.8rem 1rem;\n\t\t\tfont-size: 0.85rem;\n\t\t\tmargin-bottom: 1.5rem;\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tgap: 0.5rem;\n\t\t}\n\t\t.harnessapp-dashboard-session-info .badge\n\t\t{\n\t\t\tbackground: #E76F51;\n\t\t\tcolor: #fff;\n\t\t\tfont-size: 0.7rem;\n\t\t\tfont-weight: 700;\n\t\t\tpadding: 0.15rem 0.5rem;\n\t\t\tborder-radius: 9999px;\n\t\t}\n\t",
        Templates: [{
          Hash: "HarnessApp-Dashboard-Template",
          Template: /*html*/"\n<div class=\"harnessapp-dashboard\">\n\t<h1>Dashboard</h1>\n\t<div class=\"harnessapp-dashboard-session-info\" id=\"HarnessApp-Dashboard-SessionInfo\"></div>\n\t<p>\n\t\tWelcome to the Bookstore Harness.  This application demonstrates\n\t\t<strong>pict-section-login</strong> combined with <strong>pict-router</strong>\n\t\tfor route-based navigation with authentication.\n\t</p>\n\t<div class=\"harnessapp-dashboard-cards\">\n\t\t<div class=\"harnessapp-dashboard-card\" onclick=\"{~P~}.PictApplication.navigateTo('/Books')\">\n\t\t\t<h3>Books</h3>\n\t\t\t<p>Browse the book catalog from the Meadow ORM.</p>\n\t\t</div>\n\t\t<div class=\"harnessapp-dashboard-card\" onclick=\"{~P~}.PictApplication.navigateTo('/Users')\">\n\t\t\t<h3>Users</h3>\n\t\t\t<p>View registered users in the system.</p>\n\t\t</div>\n\t</div>\n</div>\n"
        }],
        Renderables: [{
          RenderableHash: "HarnessApp-Dashboard-Content",
          TemplateHash: "HarnessApp-Dashboard-Template",
          DestinationAddress: "#HarnessApp-Content-Container",
          RenderMethod: "replace"
        }]
      };
      class HarnessAppDashboardView extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          // Populate session info banner
          let tmpSession = this.pict.AppData.Session;
          let tmpInfoElements = this.services.ContentAssignment.getElement('#HarnessApp-Dashboard-SessionInfo');
          if (tmpInfoElements && tmpInfoElements.length > 0 && tmpSession && tmpSession.UserRecord) {
            let tmpUser = tmpSession.UserRecord;
            let tmpHTML = 'Logged in as <strong>' + (tmpUser.FullName || tmpUser.LoginID || '') + '</strong>';
            if (tmpUser.IDUser) {
              tmpHTML += ' <span class="badge">ID ' + tmpUser.IDUser + '</span>';
            }
            if (tmpUser.Email) {
              tmpHTML += '&nbsp;&nbsp;' + tmpUser.Email;
            }
            tmpInfoElements[0].innerHTML = tmpHTML;
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = HarnessAppDashboardView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    12: [function (require, module, exports) {
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-Layout",
        DefaultRenderable: "HarnessApp-Layout-Shell",
        DefaultDestinationAddress: "#HarnessApp-Container",
        AutoRender: false,
        CSS: /*css*/"\n\t\t#HarnessApp-Container\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\tflex-direction: column;\n\t\t\tmin-height: 100vh;\n\t\t}\n\t\t#HarnessApp-TopBar-Container\n\t\t{\n\t\t\tflex-shrink: 0;\n\t\t}\n\t\t#HarnessApp-Content-Container\n\t\t{\n\t\t\tflex: 1;\n\t\t\tpadding: 1.5rem;\n\t\t\tmax-width: 1100px;\n\t\t\twidth: 100%;\n\t\t\tmargin: 0 auto;\n\t\t\tbox-sizing: border-box;\n\t\t}\n\t",
        Templates: [{
          Hash: "HarnessApp-Layout-Shell-Template",
          Template: /*html*/"\n<div id=\"HarnessApp-TopBar-Container\"></div>\n<div id=\"HarnessApp-Content-Container\"></div>\n"
        }],
        Renderables: [{
          RenderableHash: "HarnessApp-Layout-Shell",
          TemplateHash: "HarnessApp-Layout-Shell-Template",
          DestinationAddress: "#HarnessApp-Container",
          RenderMethod: "replace"
        }]
      };
      class HarnessAppLayoutView extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          // Render the top bar
          this.pict.views['HarnessApp-TopBar'].render();

          // Inject all CSS
          this.pict.CSSMap.injectCSS();

          // Check if a deep-link hash route is in the URL (e.g. #/Books
          // from a pasted bookmark).  If so, navigate() to that route
          // instead of rendering Dashboard — navigate() forces Navigo
          // to fire the handler regardless of prior resolve() calls.
          let tmpHash = typeof window !== 'undefined' ? window.location.hash : '';
          let tmpHasDeepRoute = tmpHash && tmpHash.length > 2 && tmpHash !== '#/';
          if (tmpHasDeepRoute && this.pict.providers.PictRouter) {
            // Strip the leading '#' to get the route path (e.g. '/Books')
            let tmpRoute = tmpHash.replace(/^#/, '');
            this.pict.providers.PictRouter.navigate(tmpRoute);
          } else {
            // No deep-link route — show Dashboard as the default content
            this.pict.views['HarnessApp-Dashboard'].render();
            if (this.pict.providers.PictRouter) {
              this.pict.providers.PictRouter.resolve();
            }
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = HarnessAppLayoutView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    13: [function (require, module, exports) {
      const libPictSectionLogin = require('../../../source/Pict-Section-Login.js');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-Login",
        DefaultRenderable: "Login-Container",
        DefaultDestinationAddress: "#Pict-Login-Container",
        TargetElementAddress: "#HarnessApp-Login-Container",
        AutoRender: false,
        // The application controls when to check the session,
        // so we disable the auto-check built into the section.
        CheckSessionOnLoad: false,
        ShowOAuthProviders: false,
        // orator-authentication endpoints (defaults match, but shown for clarity)
        LoginEndpoint: "/1.0/Authenticate",
        LoginMethod: "POST",
        LogoutEndpoint: "/1.0/Deauthenticate",
        CheckSessionEndpoint: "/1.0/CheckSession",
        SessionDataAddress: "AppData.Session"
      };
      class HarnessAppLoginView extends libPictSectionLogin {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onLoginSuccess(pSessionData) {
          this.log.info('Login succeeded, switching to protected app.');
          if (this.pict.PictApplication && typeof this.pict.PictApplication.showProtectedApp === 'function') {
            this.pict.PictApplication.showProtectedApp();
          }
        }
        onSessionChecked(pSessionData) {
          if (pSessionData && pSessionData.LoggedIn) {
            this.log.info('Existing session found, switching to protected app.');
            if (this.pict.PictApplication && typeof this.pict.PictApplication.showProtectedApp === 'function') {
              this.pict.PictApplication.showProtectedApp();
            }
          }
        }
      }
      module.exports = HarnessAppLoginView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "../../../source/Pict-Section-Login.js": 23
    }],
    14: [function (require, module, exports) {
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-TopBar",
        DefaultRenderable: "HarnessApp-TopBar-Content",
        DefaultDestinationAddress: "#HarnessApp-TopBar-Container",
        AutoRender: false,
        CSS: /*css*/"\n\t\t.harnessapp-topbar\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tjustify-content: space-between;\n\t\t\tbackground: #264653;\n\t\t\tcolor: #FAEDCD;\n\t\t\tpadding: 0 1.25rem;\n\t\t\theight: 52px;\n\t\t\tborder-bottom: 3px solid #E76F51;\n\t\t}\n\t\t.harnessapp-topbar-brand\n\t\t{\n\t\t\tfont-size: 1.15rem;\n\t\t\tfont-weight: 700;\n\t\t\tcolor: #E76F51;\n\t\t\ttext-decoration: none;\n\t\t\tcursor: pointer;\n\t\t\tletter-spacing: 0.02em;\n\t\t}\n\t\t.harnessapp-topbar-brand:hover\n\t\t{\n\t\t\tcolor: #F4845F;\n\t\t}\n\t\t.harnessapp-topbar-nav\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tgap: 0.15rem;\n\t\t}\n\t\t.harnessapp-topbar-nav a\n\t\t{\n\t\t\tcolor: #D4A373;\n\t\t\ttext-decoration: none;\n\t\t\tpadding: 0.4rem 0.75rem;\n\t\t\tborder-radius: 4px;\n\t\t\tfont-size: 0.85rem;\n\t\t\tcursor: pointer;\n\t\t\ttransition: background-color 0.15s, color 0.15s;\n\t\t}\n\t\t.harnessapp-topbar-nav a:hover\n\t\t{\n\t\t\tbackground: #1A3340;\n\t\t\tcolor: #FAEDCD;\n\t\t}\n\t\t.harnessapp-topbar-session\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tgap: 0.5rem;\n\t\t\tfont-size: 0.8rem;\n\t\t\tcolor: #D4A373;\n\t\t}\n\t\t.harnessapp-topbar-session .dot\n\t\t{\n\t\t\twidth: 8px;\n\t\t\theight: 8px;\n\t\t\tborder-radius: 50%;\n\t\t\tbackground: #2A9D8F;\n\t\t\tbox-shadow: 0 0 4px rgba(42,157,143,0.5);\n\t\t}\n\t\t.harnessapp-topbar-logout\n\t\t{\n\t\t\tbackground: #E76F51;\n\t\t\tcolor: #fff;\n\t\t\tborder: none;\n\t\t\tpadding: 0.3rem 0.8rem;\n\t\t\tborder-radius: 4px;\n\t\t\tfont-size: 0.75rem;\n\t\t\tfont-weight: 600;\n\t\t\tcursor: pointer;\n\t\t\tmargin-left: 0.25rem;\n\t\t}\n\t\t.harnessapp-topbar-logout:hover\n\t\t{\n\t\t\tbackground: #C45A3E;\n\t\t}\n\t",
        Templates: [{
          Hash: "HarnessApp-TopBar-Template",
          Template: /*html*/"\n<div class=\"harnessapp-topbar\">\n\t<a class=\"harnessapp-topbar-brand\" onclick=\"{~P~}.PictApplication.navigateTo('/Dashboard')\">Bookstore</a>\n\t<div class=\"harnessapp-topbar-nav\">\n\t\t<a onclick=\"{~P~}.PictApplication.navigateTo('/Dashboard')\">Dashboard</a>\n\t\t<a onclick=\"{~P~}.PictApplication.navigateTo('/Books')\">Books</a>\n\t\t<a onclick=\"{~P~}.PictApplication.navigateTo('/Users')\">Users</a>\n\t</div>\n\t<div class=\"harnessapp-topbar-session\">\n\t\t<span class=\"dot\"></span>\n\t\t<span id=\"HarnessApp-TopBar-UserName\"></span>\n\t\t<button class=\"harnessapp-topbar-logout\" type=\"button\" onclick=\"{~P~}.PictApplication.doLogout()\">Log out</button>\n\t</div>\n</div>\n"
        }],
        Renderables: [{
          RenderableHash: "HarnessApp-TopBar-Content",
          TemplateHash: "HarnessApp-TopBar-Template",
          DestinationAddress: "#HarnessApp-TopBar-Container",
          RenderMethod: "replace"
        }]
      };
      class HarnessAppTopBarView extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          // Populate the user name from session data
          let tmpSession = this.pict.AppData.Session;
          let tmpDisplayName = '';
          if (tmpSession && tmpSession.UserRecord) {
            tmpDisplayName = tmpSession.UserRecord.FullName || tmpSession.UserRecord.LoginID || '';
          }
          let tmpUserNameElements = this.services.ContentAssignment.getElement('#HarnessApp-TopBar-UserName');
          if (tmpUserNameElements && tmpUserNameElements.length > 0) {
            tmpUserNameElements[0].textContent = tmpDisplayName;
          }
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
      }
      module.exports = HarnessAppTopBarView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    15: [function (require, module, exports) {
      const libPictView = require('pict-view');
      const _ViewConfiguration = {
        ViewIdentifier: "HarnessApp-Users",
        DefaultRenderable: "HarnessApp-Users-Content",
        DefaultDestinationAddress: "#HarnessApp-Content-Container",
        AutoRender: false,
        CSS: /*css*/"\n\t\t.harnessapp-users h1\n\t\t{\n\t\t\tfont-size: 1.8rem;\n\t\t\tmargin: 0 0 1rem 0;\n\t\t\tcolor: #264653;\n\t\t}\n\t\t.harnessapp-users-grid\n\t\t{\n\t\t\tdisplay: flex;\n\t\t\tgap: 1rem;\n\t\t\tflex-wrap: wrap;\n\t\t}\n\t\t.harnessapp-user-card\n\t\t{\n\t\t\tbackground: #fff;\n\t\t\tborder: 1px solid #D4A373;\n\t\t\tborder-radius: 6px;\n\t\t\tpadding: 1rem 1.25rem;\n\t\t\tmin-width: 200px;\n\t\t\tflex: 0 0 auto;\n\t\t\tbox-shadow: 0 2px 8px rgba(38,70,83,0.08);\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tgap: 0.75rem;\n\t\t}\n\t\t.harnessapp-user-card-avatar\n\t\t{\n\t\t\twidth: 36px;\n\t\t\theight: 36px;\n\t\t\tborder-radius: 50%;\n\t\t\tbackground: #264653;\n\t\t\tcolor: #FAEDCD;\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tjustify-content: center;\n\t\t\tfont-weight: 700;\n\t\t\tfont-size: 0.85rem;\n\t\t\tflex-shrink: 0;\n\t\t}\n\t\t.harnessapp-user-card-info\n\t\t{\n\t\t\tfont-size: 0.85rem;\n\t\t\tcolor: #264653;\n\t\t}\n\t\t.harnessapp-user-card-info .login-id\n\t\t{\n\t\t\tfont-weight: 600;\n\t\t\tfont-size: 0.9rem;\n\t\t}\n\t\t.harnessapp-user-card-info .full-name\n\t\t{\n\t\t\tcolor: #888;\n\t\t\tfont-size: 0.8rem;\n\t\t}\n\t\t.harnessapp-user-card-info .user-id\n\t\t{\n\t\t\tbackground: #264653;\n\t\t\tcolor: #FAEDCD;\n\t\t\tfont-size: 0.65rem;\n\t\t\tfont-weight: 700;\n\t\t\tpadding: 0.1rem 0.4rem;\n\t\t\tborder-radius: 9999px;\n\t\t\tmargin-left: 0.25rem;\n\t\t}\n\t\t.harnessapp-users-loading\n\t\t{\n\t\t\tpadding: 2rem;\n\t\t\ttext-align: center;\n\t\t\tcolor: #999;\n\t\t\tfont-size: 0.9rem;\n\t\t}\n\t",
        Templates: [{
          Hash: "HarnessApp-Users-Template",
          Template: /*html*/"\n<div class=\"harnessapp-users\">\n\t<h1>Users</h1>\n\t<div id=\"HarnessApp-Users-GridContainer\">\n\t\t<div class=\"harnessapp-users-loading\">Loading users&hellip;</div>\n\t</div>\n</div>\n"
        }],
        Renderables: [{
          RenderableHash: "HarnessApp-Users-Content",
          TemplateHash: "HarnessApp-Users-Template",
          DestinationAddress: "#HarnessApp-Content-Container",
          RenderMethod: "replace"
        }]
      };
      class HarnessAppUsersView extends libPictView {
        constructor(pFable, pOptions, pServiceHash) {
          super(pFable, pOptions, pServiceHash);
        }
        onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent) {
          this._loadUsers();
          return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
        }
        _loadUsers() {
          fetch('/1.0/Demo/Users').then(pResponse => {
            return pResponse.json();
          }).then(pData => {
            let tmpUsers = pData && Array.isArray(pData.Users) ? pData.Users : [];
            this._renderGrid(tmpUsers);
          }).catch(pError => {
            this.log.error('Failed to load users: ' + pError.message);
            let tmpContainer = this.services.ContentAssignment.getElement('#HarnessApp-Users-GridContainer');
            if (tmpContainer && tmpContainer.length > 0) {
              tmpContainer[0].innerHTML = '<div class="harnessapp-users-loading">Failed to load users. Is the server running?</div>';
            }
          });
        }
        _renderGrid(pUsers) {
          let tmpContainer = this.services.ContentAssignment.getElement('#HarnessApp-Users-GridContainer');
          if (!tmpContainer || tmpContainer.length < 1) {
            return;
          }
          if (pUsers.length < 1) {
            tmpContainer[0].innerHTML = '<div class="harnessapp-users-loading">No users found.</div>';
            return;
          }
          let tmpHTML = '<div class="harnessapp-users-grid">';
          for (let i = 0; i < pUsers.length; i++) {
            let tmpUser = pUsers[i];
            let tmpInitial = (tmpUser.LoginID || '?').charAt(0).toUpperCase();
            tmpHTML += '<div class="harnessapp-user-card">';
            tmpHTML += '<div class="harnessapp-user-card-avatar">' + tmpInitial + '</div>';
            tmpHTML += '<div class="harnessapp-user-card-info">';
            tmpHTML += '<div class="login-id">' + (tmpUser.LoginID || '') + ' <span class="user-id">ID ' + (tmpUser.IDUser || '') + '</span></div>';
            if (tmpUser.FullName) {
              tmpHTML += '<div class="full-name">' + tmpUser.FullName + '</div>';
            }
            tmpHTML += '</div>';
            tmpHTML += '</div>';
          }
          tmpHTML += '</div>';
          tmpContainer[0].innerHTML = tmpHTML;
        }
      }
      module.exports = HarnessAppUsersView;
      module.exports.default_configuration = _ViewConfiguration;
    }, {
      "pict-view": 21
    }],
    16: [function (require, module, exports) {
      arguments[4][3][0].apply(exports, arguments);
    }, {
      "dup": 3
    }],
    17: [function (require, module, exports) {
      arguments[4][4][0].apply(exports, arguments);
    }, {
      "../package.json": 16,
      "dup": 4
    }],
    18: [function (require, module, exports) {
      module.exports = {
        "name": "pict-application",
        "version": "1.0.33",
        "description": "Application base class for a pict view-based application",
        "main": "source/Pict-Application.js",
        "scripts": {
          "test": "npx quack test",
          "start": "node source/Pict-Application.js",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-application-image:local",
          "docker-dev-run": "docker run -it -d --name pict-application-dev -p 30001:8080 -p 38086:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-application\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-application-image:local",
          "docker-dev-shell": "docker exec -it pict-application-dev /bin/bash",
          "tests": "npx quack test -g",
          "lint": "eslint source/**",
          "types": "tsc -p ."
        },
        "types": "types/source/Pict-Application.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-application.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-application/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-application#readme",
        "devDependencies": {
          "@eslint/js": "^9.28.0",
          "browser-env": "^3.3.0",
          "eslint": "^9.28.0",
          "pict": "^1.0.348",
          "pict-provider": "^1.0.10",
          "pict-view": "^1.0.66",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "dependencies": {
          "fable-serviceproviderbase": "^3.0.19"
        }
      };
    }, {}],
    19: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictSettings = {
        Name: 'DefaultPictApplication',
        // The main "viewport" is the view that is used to host our application
        MainViewportViewIdentifier: 'Default-View',
        MainViewportRenderableHash: false,
        MainViewportDestinationAddress: false,
        MainViewportDefaultDataAddress: false,
        // Whether or not we should automatically render the main viewport and other autorender views after we initialize the pict application
        AutoSolveAfterInitialize: true,
        AutoRenderMainViewportViewAfterInitialize: true,
        AutoRenderViewsAfterInitialize: false,
        AutoLoginAfterInitialize: false,
        AutoLoadDataAfterLogin: false,
        ConfigurationOnlyViews: [],
        Manifests: {},
        // The prefix to prepend on all template destination hashes
        IdentifierAddressPrefix: 'PICT-'
      };

      /**
       * Base class for pict applications.
       */
      class PictApplication extends libFableServiceBase {
        /**
         * @param {import('fable')} pFable
         * @param {Record<string, any>} [pOptions]
         * @param {string} [pServiceHash]
         */
        constructor(pFable, pOptions, pServiceHash) {
          let tmpCarryOverConfiguration = typeof pFable.settings.PictApplicationConfiguration === 'object' ? pFable.settings.PictApplicationConfiguration : {};
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictSettings)), tmpCarryOverConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);

          /** @type {any} */
          this.options;
          /** @type {any} */
          this.log;
          /** @type {import('pict') & import('fable')} */
          this.fable;
          /** @type {string} */
          this.UUID;
          /** @type {string} */
          this.Hash;
          /**
           * @type {{ [key: string]: any }}
           */
          this.servicesMap;
          this.serviceType = 'PictApplication';
          /** @type {Record<string, any>} */
          this._Package = libPackage;

          // Convenience and consistency naming
          this.pict = this.fable;
          // Wire in the essential Pict state
          /** @type {Record<string, any>} */
          this.AppData = this.fable.AppData;
          /** @type {Record<string, any>} */
          this.Bundle = this.fable.Bundle;

          /** @type {number} */
          this.initializeTimestamp;
          /** @type {number} */
          this.lastSolvedTimestamp;
          /** @type {number} */
          this.lastLoginTimestamp;
          /** @type {number} */
          this.lastMarshalFromViewsTimestamp;
          /** @type {number} */
          this.lastMarshalToViewsTimestamp;
          /** @type {number} */
          this.lastAutoRenderTimestamp;
          /** @type {number} */
          this.lastLoadDataTimestamp;

          // Load all the manifests for the application
          let tmpManifestKeys = Object.keys(this.options.Manifests);
          if (tmpManifestKeys.length > 0) {
            for (let i = 0; i < tmpManifestKeys.length; i++) {
              // Load each manifest
              let tmpManifestKey = tmpManifestKeys[i];
              this.fable.instantiateServiceProvider('Manifest', this.options.Manifests[tmpManifestKey], tmpManifestKey);
            }
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Solve All Views                          */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onPreSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onPreSolve:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onPreSolveAsync(fCallback) {
          this.onPreSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onBeforeSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeSolve:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeSolveAsync(fCallback) {
          this.onBeforeSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onSolve:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onSolveAsync(fCallback) {
          this.onSolve();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        solve() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " executing solve() function..."));
          }

          // Walk through any loaded providers and solve them as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSolve = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSolveWithApp) {
              tmpProvidersToSolve.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpProvidersToSolve.length; i++) {
            tmpProvidersToSolve[i].solve(tmpProvidersToSolve[i]);
          }
          this.onBeforeSolve();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToSolve = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoInitialize) {
              tmpViewsToSolve.push(tmpView);
            }
          }
          // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpViewsToSolve.sort((a, b) => {
            return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
          });
          for (let i = 0; i < tmpViewsToSolve.length; i++) {
            tmpViewsToSolve[i].solve();
          }
          this.onSolve();
          this.onAfterSolve();
          this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        solveAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " solveAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " solveAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          // Walk through any loaded providers and solve them as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSolve = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSolveWithApp) {
              tmpProvidersToSolve.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpProvidersToSolve.length; i++) {
            tmpAnticipate.anticipate(tmpProvidersToSolve[i].solveAsync.bind(tmpProvidersToSolve[i]));
          }

          // Walk through any loaded views and solve them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToSolve = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoSolveWithApp) {
              tmpViewsToSolve.push(tmpView);
            }
          }
          // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpViewsToSolve.sort((a, b) => {
            return a.options.AutoSolveOrdinal - b.options.AutoSolveOrdinal;
          });
          for (let i = 0; i < tmpViewsToSolve.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToSolve[i].solveAsync.bind(tmpViewsToSolve[i]));
          }
          tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterSolveAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " solveAsync() complete."));
            }
            this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterSolve:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterSolveAsync(fCallback) {
          this.onAfterSolve();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application Login                        */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeLoginAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onLoginAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        loginAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loginAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loginAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeLoginAsync.bind(this));
          tmpAnticipate.anticipate(this.onLoginAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterLoginAsync.bind(this));

          // check and see if we should automatically trigger a data load
          if (this.options.AutoLoadDataAfterLogin) {
            tmpAnticipate.anticipate(fNext => {
              if (!this.isLoggedIn()) {
                return fNext();
              }
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto loading data after login..."));
              }
              //TODO: should data load errors funnel here? this creates a weird coupling between login and data load callbacks
              this.loadDataAsync(pError => {
                fNext(pError);
              });
            });
          }
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loginAsync() complete."));
            }
            this.lastLoginTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Check if the application state is logged in. Defaults to true. Override this method in your application based on login requirements.
         *
         * @return {boolean}
         */
        isLoggedIn() {
          return true;
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterLoginAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterLoginAsync:"));
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application LoadData                     */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeLoadDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onLoadDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        loadDataAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loadDataAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loadDataAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeLoadDataAsync.bind(this));

          // Walk through any loaded providers and load their data as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToLoadData = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoLoadDataWithApp) {
              tmpProvidersToLoadData.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToLoadData.sort((a, b) => {
            return a.options.AutoLoadDataOrdinal - b.options.AutoLoadDataOrdinal;
          });
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onBeforeLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onLoadDataAsync.bind(this));

          //TODO: think about ways to parallelize these
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onAfterLoadDataAsync.bind(this));
          for (const tmpProvider of tmpProvidersToLoadData) {
            tmpAnticipate.anticipate(tmpProvider.onAfterLoadDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.wait(/** @param {Error} [pError] */
          pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " loadDataAsync() complete."));
            }
            this.lastLoadDataTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterLoadDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterLoadDataAsync:"));
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Application SaveData                     */
        /* -------------------------------------------------------------------------- */

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeSaveDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onSaveDataAsync:"));
          }
          return fCallback();
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        saveDataAsync(fCallback) {
          const tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
          let tmpCallback = fCallback;
          if (typeof tmpCallback !== 'function') {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " saveDataAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " saveDataAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeSaveDataAsync.bind(this));

          // Walk through any loaded providers and load their data as well.
          let tmpLoadedProviders = Object.keys(this.pict.providers);
          let tmpProvidersToSaveData = [];
          for (let i = 0; i < tmpLoadedProviders.length; i++) {
            let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
            if (tmpProvider.options.AutoSaveDataWithApp) {
              tmpProvidersToSaveData.push(tmpProvider);
            }
          }
          // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
          tmpProvidersToSaveData.sort((a, b) => {
            return a.options.AutoSaveDataOrdinal - b.options.AutoSaveDataOrdinal;
          });
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onBeforeSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onSaveDataAsync.bind(this));

          //TODO: think about ways to parallelize these
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.anticipate(this.onAfterSaveDataAsync.bind(this));
          for (const tmpProvider of tmpProvidersToSaveData) {
            tmpAnticipate.anticipate(tmpProvider.onAfterSaveDataAsync.bind(tmpProvider));
          }
          tmpAnticipate.wait(/** @param {Error} [pError] */
          pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " saveDataAsync() complete."));
            }
            this.lastSaveDataTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterSaveDataAsync(fCallback) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterSaveDataAsync:"));
          }
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Initialize Application                   */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeInitialize:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onInitialize:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initialize:"));
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            if ('ConfigurationOnlyViews' in this.options) {
              // Load all the configuration only views
              for (let i = 0; i < this.options.ConfigurationOnlyViews.length; i++) {
                let tmpViewIdentifier = typeof this.options.ConfigurationOnlyViews[i].ViewIdentifier === 'undefined' ? "AutoView-".concat(this.fable.getUUID()) : this.options.ConfigurationOnlyViews[i].ViewIdentifier;
                this.log.info("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " adding configuration only view: ").concat(tmpViewIdentifier));
                this.pict.addView(tmpViewIdentifier, this.options.ConfigurationOnlyViews[i]);
              }
            }
            this.onInitialize();

            // Walk through any loaded providers and initialize them as well.
            let tmpLoadedProviders = Object.keys(this.pict.providers);
            let tmpProvidersToInitialize = [];
            for (let i = 0; i < tmpLoadedProviders.length; i++) {
              let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
              if (tmpProvider.options.AutoInitialize) {
                tmpProvidersToInitialize.push(tmpProvider);
              }
            }
            // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpProvidersToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpProvidersToInitialize.length; i++) {
              tmpProvidersToInitialize[i].initialize();
            }

            // Now walk through any loaded views and initialize them as well.
            let tmpLoadedViews = Object.keys(this.pict.views);
            let tmpViewsToInitialize = [];
            for (let i = 0; i < tmpLoadedViews.length; i++) {
              let tmpView = this.pict.views[tmpLoadedViews[i]];
              if (tmpView.options.AutoInitialize) {
                tmpViewsToInitialize.push(tmpView);
              }
            }
            // Sort the views by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpViewsToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpViewsToInitialize.length; i++) {
              tmpViewsToInitialize[i].initialize();
            }
            this.onAfterInitialize();
            if (this.options.AutoSolveAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto solving after initialization..."));
              }
              // Solve the template synchronously
              this.solve();
            }
            // Now check and see if we should automatically render as well
            if (this.options.AutoRenderMainViewportViewAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto rendering after initialization..."));
              }
              // Render the template synchronously
              this.render();
            }
            this.initializeTimestamp = this.fable.log.getTimeStamp();
            this.onCompletionOfInitialize();
            return true;
          } else {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initialize called but initialization is already completed.  Aborting."));
            return false;
          }
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initializeAsync:"));
          }

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initializeAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initializeAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 3) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " beginning initialization..."));
            }
            if ('ConfigurationOnlyViews' in this.options) {
              // Load all the configuration only views
              for (let i = 0; i < this.options.ConfigurationOnlyViews.length; i++) {
                let tmpViewIdentifier = typeof this.options.ConfigurationOnlyViews[i].ViewIdentifier === 'undefined' ? "AutoView-".concat(this.fable.getUUID()) : this.options.ConfigurationOnlyViews[i].ViewIdentifier;
                this.log.info("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " adding configuration only view: ").concat(tmpViewIdentifier));
                this.pict.addView(tmpViewIdentifier, this.options.ConfigurationOnlyViews[i]);
              }
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));

            // Walk through any loaded providers and solve them as well.
            let tmpLoadedProviders = Object.keys(this.pict.providers);
            let tmpProvidersToInitialize = [];
            for (let i = 0; i < tmpLoadedProviders.length; i++) {
              let tmpProvider = this.pict.providers[tmpLoadedProviders[i]];
              if (tmpProvider.options.AutoInitialize) {
                tmpProvidersToInitialize.push(tmpProvider);
              }
            }
            // Sort the providers by their priority (if they are all priority 0, it will end up being add order due to JSON Object Property Key order stuff)
            tmpProvidersToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpProvidersToInitialize.length; i++) {
              tmpAnticipate.anticipate(tmpProvidersToInitialize[i].initializeAsync.bind(tmpProvidersToInitialize[i]));
            }

            // Now walk through any loaded views and initialize them as well.
            // TODO: Some optimization cleverness could be gained by grouping them into a parallelized async operation, by ordinal.
            let tmpLoadedViews = Object.keys(this.pict.views);
            let tmpViewsToInitialize = [];
            for (let i = 0; i < tmpLoadedViews.length; i++) {
              let tmpView = this.pict.views[tmpLoadedViews[i]];
              if (tmpView.options.AutoInitialize) {
                tmpViewsToInitialize.push(tmpView);
              }
            }
            // Sort the views by their priority
            // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
            tmpViewsToInitialize.sort((a, b) => {
              return a.options.AutoInitializeOrdinal - b.options.AutoInitializeOrdinal;
            });
            for (let i = 0; i < tmpViewsToInitialize.length; i++) {
              let tmpView = tmpViewsToInitialize[i];
              tmpAnticipate.anticipate(tmpView.initializeAsync.bind(tmpView));
            }
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            if (this.options.AutoLoginAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto login (asynchronously) after initialization..."));
              }
              tmpAnticipate.anticipate(this.loginAsync.bind(this));
            }
            if (this.options.AutoSolveAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto solving (asynchronously) after initialization..."));
              }
              tmpAnticipate.anticipate(this.solveAsync.bind(this));
            }
            if (this.options.AutoRenderMainViewportViewAfterInitialize) {
              if (this.pict.LogNoisiness > 1) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " auto rendering (asynchronously) after initialization..."));
              }
              tmpAnticipate.anticipate(this.renderMainViewportAsync.bind(this));
            }
            tmpAnticipate.wait(pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initializeAsync Error: ").concat(pError.message || pError), {
                  stack: pError.stack
                });
              }
              this.initializeTimestamp = this.fable.log.getTimeStamp();
              if (this.pict.LogNoisiness > 2) {
                this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " initialization complete."));
              }
              return tmpCallback();
            });
          } else {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " async initialize called but initialization is already completed.  Aborting."));
            // TODO: Should this be an error?
            return this.onCompletionOfInitializeAsync(tmpCallback);
          }
        }

        /**
         * @return {boolean}
         */
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterInitialize:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onCompletionOfInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onCompletionOfInitialize:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onCompletionOfInitializeAsync(fCallback) {
          this.onCompletionOfInitialize();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal Data From All Views              */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeMarshalFromViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeMarshalFromViewsAsync(fCallback) {
          this.onBeforeMarshalFromViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onMarshalFromViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onMarshalFromViewsAsync(fCallback) {
          this.onMarshalFromViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        marshalFromViews() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " executing marshalFromViews() function..."));
          }
          this.onBeforeMarshalFromViews();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalFromViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalFromViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalFromViews.length; i++) {
            tmpViewsToMarshalFromViews[i].marshalFromView();
          }
          this.onMarshalFromViews();
          this.onAfterMarshalFromViews();
          this.lastMarshalFromViewsTimestamp = this.fable.log.getTimeStamp();
          return true;
        }

        /**
         * @param {(error?: Error) => void} fCallback
         */
        marshalFromViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalFromViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalFromViewsAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalFromViewsAsync.bind(this));
          // Walk through any loaded views and marshalFromViews them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalFromViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalFromViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalFromViews.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToMarshalFromViews[i].marshalFromViewAsync.bind(tmpViewsToMarshalFromViews[i]));
          }
          tmpAnticipate.anticipate(this.onMarshalFromViewsAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalFromViewsAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalFromViewsAsync() complete."));
            }
            this.lastMarshalFromViewsTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterMarshalFromViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterMarshalFromViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterMarshalFromViewsAsync(fCallback) {
          this.onAfterMarshalFromViews();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal Data To All Views                */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeMarshalToViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeMarshalToViewsAsync(fCallback) {
          this.onBeforeMarshalToViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        onMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onMarshalToViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onMarshalToViewsAsync(fCallback) {
          this.onMarshalToViews();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        marshalToViews() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " executing marshalToViews() function..."));
          }
          this.onBeforeMarshalToViews();
          // Now walk through any loaded views and initialize them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalToViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalToViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalToViews.length; i++) {
            tmpViewsToMarshalToViews[i].marshalToView();
          }
          this.onMarshalToViews();
          this.onAfterMarshalToViews();
          this.lastMarshalToViewsTimestamp = this.fable.log.getTimeStamp();
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        marshalToViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalToViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalToViewsAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalToViewsAsync.bind(this));
          // Walk through any loaded views and marshalToViews them as well.
          let tmpLoadedViews = Object.keys(this.pict.views);
          let tmpViewsToMarshalToViews = [];
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            tmpViewsToMarshalToViews.push(tmpView);
          }
          for (let i = 0; i < tmpViewsToMarshalToViews.length; i++) {
            tmpAnticipate.anticipate(tmpViewsToMarshalToViews[i].marshalToViewAsync.bind(tmpViewsToMarshalToViews[i]));
          }
          tmpAnticipate.anticipate(this.onMarshalToViewsAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalToViewsAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalToViewsAsync() complete."));
            }
            this.lastMarshalToViewsTimestamp = this.fable.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        onAfterMarshalToViews() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterMarshalToViews:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterMarshalToViewsAsync(fCallback) {
          this.onAfterMarshalToViews();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Render View                              */
        /* -------------------------------------------------------------------------- */
        /**
         * @return {boolean}
         */
        onBeforeRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onBeforeRender:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onBeforeRenderAsync(fCallback) {
          this.onBeforeRender();
          return fCallback();
        }

        /**
         * @param {string} [pViewIdentifier] - The hash of the view to render. By default, the main viewport view is rendered.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string} [pTemplateDataAddress] - The address where the data for the template is stored.
         *
         * TODO: Should we support objects for pTemplateDataAddress for parity with pict-view?
         */
        render(pViewIdentifier, pRenderableHash, pRenderDestinationAddress, pTemplateDataAddress) {
          let tmpViewIdentifier = typeof pViewIdentifier !== 'string' ? this.options.MainViewportViewIdentifier : pViewIdentifier;
          let tmpRenderableHash = typeof pRenderableHash !== 'string' ? this.options.MainViewportRenderableHash : pRenderableHash;
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress !== 'string' ? this.options.MainViewportDestinationAddress : pRenderDestinationAddress;
          let tmpTemplateDataAddress = typeof pTemplateDataAddress !== 'string' ? this.options.MainViewportDefaultDataAddress : pTemplateDataAddress;
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " VIEW Renderable[").concat(tmpRenderableHash, "] Destination[").concat(tmpRenderDestinationAddress, "] TemplateDataAddress[").concat(tmpTemplateDataAddress, "] render:"));
          }
          this.onBeforeRender();

          // Now get the view (by hash) from the loaded views
          let tmpView = typeof tmpViewIdentifier === 'string' ? this.servicesMap.PictView[tmpViewIdentifier] : false;
          if (!tmpView) {
            this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " could not render from View ").concat(tmpViewIdentifier, " because it is not a valid view."));
            return false;
          }
          this.onRender();
          tmpView.render(tmpRenderableHash, tmpRenderDestinationAddress, tmpTemplateDataAddress);
          this.onAfterRender();
          return true;
        }
        /**
         * @return {boolean}
         */
        onRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onRender:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onRenderAsync(fCallback) {
          this.onRender();
          return fCallback();
        }

        /**
         * @param {string|((error?: Error) => void)} pViewIdentifier - The hash of the view to render. By default, the main viewport view is rendered. (or the callback)
         * @param {string|((error?: Error) => void)} [pRenderableHash] - The hash of the renderable to render. (or the callback)
         * @param {string|((error?: Error) => void)} [pRenderDestinationAddress] - The address where the renderable will be rendered. (or the callback)
         * @param {string|((error?: Error) => void)} [pTemplateDataAddress] - The address where the data for the template is stored. (or the callback)
         * @param {(error?: Error) => void} [fCallback] - The callback, if all other parameters are provided.
         *
         * TODO: Should we support objects for pTemplateDataAddress for parity with pict-view?
         */
        renderAsync(pViewIdentifier, pRenderableHash, pRenderDestinationAddress, pTemplateDataAddress, fCallback) {
          let tmpViewIdentifier = typeof pViewIdentifier !== 'string' ? this.options.MainViewportViewIdentifier : pViewIdentifier;
          let tmpRenderableHash = typeof pRenderableHash !== 'string' ? this.options.MainViewportRenderableHash : pRenderableHash;
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress !== 'string' ? this.options.MainViewportDestinationAddress : pRenderDestinationAddress;
          let tmpTemplateDataAddress = typeof pTemplateDataAddress !== 'string' ? this.options.MainViewportDefaultDataAddress : pTemplateDataAddress;

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateDataAddress === 'function' ? pTemplateDataAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : typeof pViewIdentifier === 'function' ? pViewIdentifier : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " VIEW Renderable[").concat(tmpRenderableHash, "] Destination[").concat(tmpRenderDestinationAddress, "] TemplateDataAddress[").concat(tmpTemplateDataAddress, "] renderAsync:"));
          }
          let tmpRenderAnticipate = this.fable.newAnticipate();
          tmpRenderAnticipate.anticipate(this.onBeforeRenderAsync.bind(this));
          let tmpView = typeof tmpViewIdentifier === 'string' ? this.servicesMap.PictView[tmpViewIdentifier] : false;
          if (!tmpView) {
            let tmpErrorMessage = "PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " could not asynchronously render from View ").concat(tmpViewIdentifier, " because it is not a valid view.");
            if (this.pict.LogNoisiness > 3) {
              this.log.error(tmpErrorMessage);
            }
            return tmpCallback(new Error(tmpErrorMessage));
          }
          tmpRenderAnticipate.anticipate(this.onRenderAsync.bind(this));
          tmpRenderAnticipate.anticipate(fNext => {
            tmpView.renderAsync.call(tmpView, tmpRenderableHash, tmpRenderDestinationAddress, tmpTemplateDataAddress, fNext);
          });
          tmpRenderAnticipate.anticipate(this.onAfterRenderAsync.bind(this));
          return tmpRenderAnticipate.wait(tmpCallback);
        }

        /**
         * @return {boolean}
         */
        onAfterRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " onAfterRender:"));
          }
          return true;
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        onAfterRenderAsync(fCallback) {
          this.onAfterRender();
          return fCallback();
        }

        /**
         * @return {boolean}
         */
        renderMainViewport() {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderMainViewport:"));
          }
          return this.render();
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        renderMainViewportAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow APPLICATION [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderMainViewportAsync:"));
          }
          return this.renderAsync(fCallback);
        }
        /**
         * @return {void}
         */
        renderAutoViews() {
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " beginning renderAutoViews..."));
          }
          // Now walk through any loaded views and sort them by the AutoRender ordinal
          let tmpLoadedViews = Object.keys(this.pict.views);
          // Sort the views by their priority
          // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
          tmpLoadedViews.sort((a, b) => {
            return this.pict.views[a].options.AutoRenderOrdinal - this.pict.views[b].options.AutoRenderOrdinal;
          });
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoRender) {
              tmpView.render();
            }
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAutoViewsAsync complete."));
          }
        }
        /**
         * @param {(error?: Error) => void} fCallback
         */
        renderAutoViewsAsync(fCallback) {
          let tmpAnticipate = this.fable.instantiateServiceProviderWithoutRegistration('Anticipate');

          // Allow the callback to be passed in as the last parameter no matter what
          let tmpCallback = typeof fCallback === 'function' ? fCallback : false;
          if (!tmpCallback) {
            this.log.warn("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAutoViewsAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAutoViewsAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " beginning renderAutoViewsAsync..."));
          }

          // Now walk through any loaded views and sort them by the AutoRender ordinal
          // TODO: Some optimization cleverness could be gained by grouping them into a parallelized async operation, by ordinal.
          let tmpLoadedViews = Object.keys(this.pict.views);
          // Sort the views by their priority
          // If they are all the default priority 0, it will end up being add order due to JSON Object Property Key order stuff
          tmpLoadedViews.sort((a, b) => {
            return this.pict.views[a].options.AutoRenderOrdinal - this.pict.views[b].options.AutoRenderOrdinal;
          });
          for (let i = 0; i < tmpLoadedViews.length; i++) {
            let tmpView = this.pict.views[tmpLoadedViews[i]];
            if (tmpView.options.AutoRender) {
              tmpAnticipate.anticipate(tmpView.renderAsync.bind(tmpView));
            }
          }
          tmpAnticipate.wait(pError => {
            this.lastAutoRenderTimestamp = this.fable.log.getTimeStamp();
            if (this.pict.LogNoisiness > 0) {
              this.log.trace("PictApp [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAutoViewsAsync complete."));
            }
            return tmpCallback(pError);
          });
        }

        /**
         * @return {boolean}
         */
        get isPictApplication() {
          return true;
        }
      }
      module.exports = PictApplication;
    }, {
      "../package.json": 18,
      "fable-serviceproviderbase": 17
    }],
    20: [function (require, module, exports) {
      module.exports = {
        "name": "pict-view",
        "version": "1.0.67",
        "description": "Pict View Base Class",
        "main": "source/Pict-View.js",
        "scripts": {
          "test": "npx quack test",
          "tests": "npx quack test -g",
          "start": "node source/Pict-View.js",
          "coverage": "npx quack coverage",
          "build": "npx quack build",
          "docker-dev-build": "docker build ./ -f Dockerfile_LUXURYCode -t pict-view-image:local",
          "docker-dev-run": "docker run -it -d --name pict-view-dev -p 30001:8080 -p 38086:8086 -v \"$PWD/.config:/home/coder/.config\"  -v \"$PWD:/home/coder/pict-view\" -u \"$(id -u):$(id -g)\" -e \"DOCKER_USER=$USER\" pict-view-image:local",
          "docker-dev-shell": "docker exec -it pict-view-dev /bin/bash",
          "types": "tsc -p .",
          "lint": "eslint source/**"
        },
        "types": "types/source/Pict-View.d.ts",
        "repository": {
          "type": "git",
          "url": "git+https://github.com/stevenvelozo/pict-view.git"
        },
        "author": "steven velozo <steven@velozo.com>",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/stevenvelozo/pict-view/issues"
        },
        "homepage": "https://github.com/stevenvelozo/pict-view#readme",
        "devDependencies": {
          "@eslint/js": "^9.39.1",
          "browser-env": "^3.3.0",
          "eslint": "^9.39.1",
          "pict": "^1.0.348",
          "quackage": "^1.0.58",
          "typescript": "^5.9.3"
        },
        "mocha": {
          "diff": true,
          "extension": ["js"],
          "package": "./package.json",
          "reporter": "spec",
          "slow": "75",
          "timeout": "5000",
          "ui": "tdd",
          "watch-files": ["source/**/*.js", "test/**/*.js"],
          "watch-ignore": ["lib/vendor"]
        },
        "dependencies": {
          "fable": "^3.1.63",
          "fable-serviceproviderbase": "^3.0.19"
        }
      };
    }, {}],
    21: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const libPackage = require('../package.json');
      const defaultPictViewSettings = {
        DefaultRenderable: false,
        DefaultDestinationAddress: false,
        DefaultTemplateRecordAddress: false,
        ViewIdentifier: false,
        // If this is set to true, when the App initializes this will.
        // After the App initializes, initialize will be called as soon as it's added.
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        // If this is set to true, when the App autorenders (on load) this will.
        // After the App initializes, render will be called as soon as it's added.
        AutoRender: true,
        AutoRenderOrdinal: 0,
        AutoSolveWithApp: true,
        AutoSolveOrdinal: 0,
        CSSHash: false,
        CSS: false,
        CSSProvider: false,
        CSSPriority: 500,
        Templates: [],
        DefaultTemplates: [],
        Renderables: [],
        Manifests: {}
      };

      /** @typedef {(error?: Error) => void} ErrorCallback */
      /** @typedef {number | boolean} PictTimestamp */

      /**
       * @typedef {'replace' | 'append' | 'prepend' | 'append_once' | 'virtual-assignment'} RenderMethod
       */
      /**
       * @typedef {Object} Renderable
       *
       * @property {string} RenderableHash - A unique hash for the renderable.
       * @property {string} TemplateHash - The hash of the template to use for rendering this renderable.
       * @property {string} [DefaultTemplateRecordAddress] - The default address for resolving the data record for this renderable.
       * @property {string} [ContentDestinationAddress] - The default address (DOM CSS selector) for rendering the content of this renderable.
       * @property {RenderMethod} [RenderMethod=replace] - The method to use when projecting the renderable to the DOM ('replace', 'append', 'prepend', 'append_once', 'virtual-assignment').
       * @property {string} [TestAddress] - The address to use for testing the renderable.
       * @property {string} [TransactionHash] - The transaction hash for the root renderable.
       * @property {string} [RootRenderableViewHash] - The hash of the root renderable.
       * @property {string} [Content] - The rendered content for this renderable, if applicable.
       */

      /**
       * Represents a view in the Pict ecosystem.
       */
      class PictView extends libFableServiceBase {
        /**
         * @param {any} pFable - The Fable object that this service is attached to.
         * @param {any} [pOptions] - (optional) The options for this service.
         * @param {string} [pServiceHash] - (optional) The hash of the service.
         */
        constructor(pFable, pOptions, pServiceHash) {
          // Intersect default options, parent constructor, service information
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictViewSettings)), pOptions);
          super(pFable, tmpOptions, pServiceHash);
          //FIXME: add types to fable and ancillaries
          /** @type {any} */
          this.fable;
          /** @type {any} */
          this.options;
          /** @type {String} */
          this.UUID;
          /** @type {String} */
          this.Hash;
          /** @type {any} */
          this.log;
          const tmpHashIsUUID = this.Hash === this.UUID;
          //NOTE: since many places are using the view UUID as the HTML element ID, we prefix it to avoid starting with a number
          this.UUID = "V-".concat(this.UUID);
          if (tmpHashIsUUID) {
            this.Hash = this.UUID;
          }
          if (!this.options.ViewIdentifier) {
            this.options.ViewIdentifier = "AutoViewID-".concat(this.fable.getUUID());
          }
          this.serviceType = 'PictView';
          /** @type {Record<string, any>} */
          this._Package = libPackage;
          // Convenience and consistency naming
          /** @type {import('pict') & { log: any, instantiateServiceProviderWithoutRegistration: (hash: String) => any, instantiateServiceProviderIfNotExists: (hash: string) => any, TransactionTracking: import('pict/types/source/services/Fable-Service-TransactionTracking') }} */
          this.pict = this.fable;
          // Wire in the essential Pict application state
          this.AppData = this.pict.AppData;
          this.Bundle = this.pict.Bundle;

          /** @type {PictTimestamp} */
          this.initializeTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastSolvedTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastRenderedTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastMarshalFromViewTimestamp = false;
          /** @type {PictTimestamp} */
          this.lastMarshalToViewTimestamp = false;
          this.pict.instantiateServiceProviderIfNotExists('TransactionTracking');

          // Load all templates from the array in the options
          // Templates are in the form of {Hash:'Some-Template-Hash',Template:'Template content',Source:'TemplateSource'}
          for (let i = 0; i < this.options.Templates.length; i++) {
            let tmpTemplate = this.options.Templates[i];
            if (!('Hash' in tmpTemplate) || !('Template' in tmpTemplate)) {
              this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Template ").concat(i, " in the options array."), tmpTemplate);
            } else {
              if (!tmpTemplate.Source) {
                tmpTemplate.Source = "PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " options object.");
              }
              this.pict.TemplateProvider.addTemplate(tmpTemplate.Hash, tmpTemplate.Template, tmpTemplate.Source);
            }
          }

          // Load all default templates from the array in the options
          // Templates are in the form of {Prefix:'',Postfix:'-List-Row',Template:'Template content',Source:'TemplateSourceString'}
          for (let i = 0; i < this.options.DefaultTemplates.length; i++) {
            let tmpDefaultTemplate = this.options.DefaultTemplates[i];
            if (!('Postfix' in tmpDefaultTemplate) || !('Template' in tmpDefaultTemplate)) {
              this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Default Template ").concat(i, " in the options array."), tmpDefaultTemplate);
            } else {
              if (!tmpDefaultTemplate.Source) {
                tmpDefaultTemplate.Source = "PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " options object.");
              }
              this.pict.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
            }
          }

          // Load the CSS if it's available
          if (this.options.CSS) {
            let tmpCSSHash = this.options.CSSHash ? this.options.CSSHash : "View-".concat(this.options.ViewIdentifier);
            let tmpCSSProvider = this.options.CSSProvider ? this.options.CSSProvider : tmpCSSHash;
            this.pict.CSSMap.addCSS(tmpCSSHash, this.options.CSS, tmpCSSProvider, this.options.CSSPriority);
          }

          // Load all renderables
          // Renderables are launchable renderable instructions with templates
          // They look as such: {Identifier:'ContentEntry', TemplateHash:'Content-Entry-Section-Main', ContentDestinationAddress:'#ContentSection', RecordAddress:'AppData.Content.DefaultText', ManifestTransformation:'ManyfestHash', ManifestDestinationAddress:'AppData.Content.DataToTransformContent'}
          // The only parts that are necessary are Identifier and Template
          // A developer can then do render('ContentEntry') and it just kinda works.  Or they can override the ContentDestinationAddress
          /** @type {Record<String, Renderable>} */
          this.renderables = {};
          for (let i = 0; i < this.options.Renderables.length; i++) {
            /** @type {Renderable} */
            let tmpRenderable = this.options.Renderables[i];
            this.addRenderable(tmpRenderable);
          }
        }

        /**
         * Adds a renderable to the view.
         *
         * @param {string | Renderable} pRenderableHash - The hash of the renderable, or a renderable object.
         * @param {string} [pTemplateHash] - (optional) The hash of the template for the renderable.
         * @param {string} [pDefaultTemplateRecordAddress] - (optional) The default data address for the template.
         * @param {string} [pDefaultDestinationAddress] - (optional) The default destination address for the renderable.
         * @param {RenderMethod} [pRenderMethod=replace] - (optional) The method to use when rendering the renderable (ex. 'replace').
         */
        addRenderable(pRenderableHash, pTemplateHash, pDefaultTemplateRecordAddress, pDefaultDestinationAddress, pRenderMethod) {
          /** @type {Renderable} */
          let tmpRenderable;
          if (typeof pRenderableHash == 'object') {
            // The developer passed in the renderable as an object.
            // Use theirs instead!
            tmpRenderable = pRenderableHash;
          } else {
            /** @type {RenderMethod} */
            let tmpRenderMethod = typeof pRenderMethod !== 'string' ? pRenderMethod : 'replace';
            tmpRenderable = {
              RenderableHash: pRenderableHash,
              TemplateHash: pTemplateHash,
              DefaultTemplateRecordAddress: pDefaultTemplateRecordAddress,
              ContentDestinationAddress: pDefaultDestinationAddress,
              RenderMethod: tmpRenderMethod
            };
          }
          if (typeof tmpRenderable.RenderableHash != 'string' || typeof tmpRenderable.TemplateHash != 'string') {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Renderable; RenderableHash or TemplateHash are invalid."), tmpRenderable);
          } else {
            if (this.pict.LogNoisiness > 0) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " adding renderable [").concat(tmpRenderable.RenderableHash, "] pointed to template ").concat(tmpRenderable.TemplateHash, "."));
            }
            this.renderables[tmpRenderable.RenderableHash] = tmpRenderable;
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                        Code Section: Initialization                        */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is initialized.
         */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeInitialize:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when the view is initialized.
         */
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onInitialize:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }

        /**
         * Performs view initialization.
         */
        initialize() {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow VIEW [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialize:"));
          }
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            this.onInitialize();
            this.onAfterInitialize();
            this.initializeTimestamp = this.pict.log.getTimeStamp();
            return true;
          } else {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialize called but initialization is already completed.  Aborting."));
            return false;
          }
        }

        /**
         * Performs view initialization (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        initializeAsync(fCallback) {
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow VIEW [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initializeAsync:"));
          }
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 0) {
              this.log.info("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " beginning initialization..."));
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            tmpAnticipate.wait(/** @param {Error} pError */
            pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialization failed: ").concat(pError.message || pError), {
                  stack: pError.stack
                });
              }
              this.initializeTimestamp = this.pict.log.getTimeStamp();
              if (this.pict.LogNoisiness > 0) {
                this.log.info("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialization complete."));
              }
              return fCallback();
            });
          } else {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " async initialize called but initialization is already completed.  Aborting."));
            // TODO: Should this be an error?
            return fCallback();
          }
        }
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterInitialize:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is initialized (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Render                            */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is rendered.
         *
         * @param {Renderable} pRenderable - The renderable that will be rendered.
         */
        onBeforeRender(pRenderable) {
          // Overload this to mess with stuff before the content gets generated from the template
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeRender:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is rendered (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that will be rendered.
         */
        onBeforeRenderAsync(fCallback, pRenderable) {
          this.onBeforeRender(pRenderable);
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers before the view is projected into the DOM.
         *
         * @param {Renderable} pRenderable - The renderable that will be projected.
         */
        onBeforeProject(pRenderable) {
          // Overload this to mess with stuff before the content gets generated from the template
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeProject:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is projected into the DOM (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that will be projected.
         */
        onBeforeProjectAsync(fCallback, pRenderable) {
          this.onBeforeProject(pRenderable);
          return fCallback();
        }

        /**
         * Builds the render options for a renderable.
         *
         * For DRY purposes on the three flavors of render.
         *
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          let tmpRenderOptions = {
            Valid: true
          };
          tmpRenderOptions.RenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderOptions.RenderableHash) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not find a suitable RenderableHash ").concat(tmpRenderOptions.RenderableHash, " (param ").concat(pRenderableHash, "because it is not a valid renderable."));
            tmpRenderOptions.Valid = false;
          }
          tmpRenderOptions.Renderable = this.renderables[tmpRenderOptions.RenderableHash];
          if (!tmpRenderOptions.Renderable) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderOptions.RenderableHash, " (param ").concat(pRenderableHash, ") because it does not exist."));
            tmpRenderOptions.Valid = false;
          }
          tmpRenderOptions.DestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderOptions.Renderable.ContentDestinationAddress === 'string' ? tmpRenderOptions.Renderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : false;
          if (!tmpRenderOptions.DestinationAddress) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderOptions.RenderableHash, " (param ").concat(pRenderableHash, ") because it does not have a valid destination address (param ").concat(pRenderDestinationAddress, ")."));
            tmpRenderOptions.Valid = false;
          }
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRenderOptions.RecordAddress = 'Passed in as object';
            tmpRenderOptions.Record = pTemplateRecordAddress;
          } else {
            tmpRenderOptions.RecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderOptions.Renderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderOptions.Renderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRenderOptions.Record = typeof tmpRenderOptions.RecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRenderOptions.RecordAddress) : undefined;
          }
          return tmpRenderOptions;
        }

        /**
         * Assigns the content to the destination address.
         *
         * For DRY purposes on the three flavors of render.
         *
         * @param {Renderable} pRenderable - The renderable to render.
         * @param {string} pRenderDestinationAddress - The address where the renderable will be rendered.
         * @param {string} pContent - The content to render.
         * @returns {boolean} - Returns true if the content was assigned successfully.
         * @memberof PictView
         */
        assignRenderContent(pRenderable, pRenderDestinationAddress, pContent) {
          return this.pict.ContentAssignment.projectContent(pRenderable.RenderMethod, pRenderDestinationAddress, pContent, pRenderable.TestAddress);
        }

        /**
         * Render a renderable from this view.
         *
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @return {boolean}
         */
        render(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable) {
          return this.renderWithScope(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable);
        }

        /**
         * Render a renderable from this view, providing a specifici scope for the template.
         *
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @return {boolean}
         */
        renderWithScope(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable) {
          let tmpRenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderableHash) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it is not a valid renderable."));
            return false;
          }

          /** @type {Renderable} */
          let tmpRenderable;
          if (tmpRenderableHash == '__Virtual') {
            tmpRenderable = {
              RenderableHash: '__Virtual',
              TemplateHash: this.renderables[this.options.DefaultRenderable].TemplateHash,
              ContentDestinationAddress: typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null,
              RenderMethod: 'virtual-assignment',
              TransactionHash: pRootRenderable && pRootRenderable.TransactionHash,
              RootRenderableViewHash: pRootRenderable && pRootRenderable.RootRenderableViewHash
            };
          } else {
            tmpRenderable = Object.assign({}, this.renderables[tmpRenderableHash]);
            tmpRenderable.ContentDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null;
          }
          if (!tmpRenderable.TransactionHash) {
            tmpRenderable.TransactionHash = "ViewRender-V-".concat(this.options.ViewIdentifier, "-R-").concat(tmpRenderableHash, "-U-").concat(this.pict.getUUID());
            tmpRenderable.RootRenderableViewHash = this.Hash;
            this.pict.TransactionTracking.registerTransaction(tmpRenderable.TransactionHash);
          }
          if (!tmpRenderable) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it does not exist."));
            return false;
          }
          if (!tmpRenderable.ContentDestinationAddress) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it does not have a valid destination address."));
            return false;
          }
          let tmpRecordAddress;
          let tmpRecord;
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRecord = pTemplateRecordAddress;
            tmpRecordAddress = 'Passed in as object';
          } else {
            tmpRecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRecord = typeof tmpRecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRecordAddress) : undefined;
          }

          // Execute the developer-overridable pre-render behavior
          this.onBeforeRender(tmpRenderable);
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow VIEW [".concat(this.UUID, "]::[").concat(this.Hash, "] Renderable[").concat(tmpRenderableHash, "] Destination[").concat(tmpRenderable.ContentDestinationAddress, "] TemplateRecordAddress[").concat(tmpRecordAddress, "] render:"));
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " Beginning Render of Renderable[").concat(tmpRenderableHash, "] to Destination [").concat(tmpRenderable.ContentDestinationAddress, "]..."));
          }
          // Generate the content output from the template and data
          tmpRenderable.Content = this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpRecord, null, [this], pScope, {
            RootRenderable: typeof pRootRenderable === 'object' ? pRootRenderable : tmpRenderable
          });
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " Assigning Renderable[").concat(tmpRenderableHash, "] content length ").concat(tmpRenderable.Content.length, " to Destination [").concat(tmpRenderable.ContentDestinationAddress, "] using render method [").concat(tmpRenderable.RenderMethod, "]."));
          }
          this.onBeforeProject(tmpRenderable);
          this.onProject(tmpRenderable);
          if (tmpRenderable.RenderMethod !== 'virtual-assignment') {
            this.onAfterProject(tmpRenderable);

            // Execute the developer-overridable post-render behavior
            this.onAfterRender(tmpRenderable);
          }
          return true;
        }

        /**
         * Render a renderable from this view.
         *
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable|ErrorCallback} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         *
         * @return {void}
         */
        renderAsync(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback) {
          return this.renderWithScopeAsync(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback);
        }

        /**
         * Render a renderable from this view.
         *
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object|ErrorCallback} [pTemplateRecordAddress] - The address where the data for the template is stored.
         * @param {Renderable|ErrorCallback} [pRootRenderable] - The root renderable for the render operation, if applicable.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         *
         * @return {void}
         */
        renderWithScopeAsync(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, pRootRenderable, fCallback) {
          let tmpRenderableHash = typeof pRenderableHash === 'string' ? pRenderableHash : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;

          // Allow the callback to be passed in as the last parameter no matter what
          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateRecordAddress === 'function' ? pTemplateRecordAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : typeof pRootRenderable === 'function' ? pRootRenderable : null;
          if (!tmpCallback) {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " renderAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          if (!tmpRenderableHash) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not asynchronously render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, "because it is not a valid renderable."));
            return tmpCallback(new Error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not asynchronously render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, "because it is not a valid renderable.")));
          }

          /** @type {Renderable} */
          let tmpRenderable;
          if (tmpRenderableHash == '__Virtual') {
            tmpRenderable = {
              RenderableHash: '__Virtual',
              TemplateHash: this.renderables[this.options.DefaultRenderable].TemplateHash,
              ContentDestinationAddress: typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null,
              RenderMethod: 'virtual-assignment',
              TransactionHash: pRootRenderable && typeof pRootRenderable !== 'function' && pRootRenderable.TransactionHash,
              RootRenderableViewHash: pRootRenderable && typeof pRootRenderable !== 'function' && pRootRenderable.RootRenderableViewHash
            };
          } else {
            tmpRenderable = Object.assign({}, this.renderables[tmpRenderableHash]);
            tmpRenderable.ContentDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : null;
          }
          if (!tmpRenderable.TransactionHash) {
            tmpRenderable.TransactionHash = "ViewRender-V-".concat(this.options.ViewIdentifier, "-R-").concat(tmpRenderableHash, "-U-").concat(this.pict.getUUID());
            tmpRenderable.RootRenderableViewHash = this.Hash;
            this.pict.TransactionTracking.registerTransaction(tmpRenderable.TransactionHash);
          }
          if (!tmpRenderable) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it does not exist."));
            return tmpCallback(new Error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it does not exist.")));
          }
          if (!tmpRenderable.ContentDestinationAddress) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it does not have a valid destination address."));
            return tmpCallback(new Error("Could not render ".concat(tmpRenderableHash)));
          }
          let tmpRecordAddress;
          let tmpRecord;
          if (typeof pTemplateRecordAddress === 'object') {
            tmpRecord = pTemplateRecordAddress;
            tmpRecordAddress = 'Passed in as object';
          } else {
            tmpRecordAddress = typeof pTemplateRecordAddress === 'string' ? pTemplateRecordAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpRecord = typeof tmpRecordAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpRecordAddress) : undefined;
          }
          if (this.pict.LogControlFlow) {
            this.log.trace("PICT-ControlFlow VIEW [".concat(this.UUID, "]::[").concat(this.Hash, "] Renderable[").concat(tmpRenderableHash, "] Destination[").concat(tmpRenderable.ContentDestinationAddress, "] TemplateRecordAddress[").concat(tmpRecordAddress, "] renderAsync:"));
          }
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " Beginning Asynchronous Render (callback-style)..."));
          }
          let tmpAnticipate = this.fable.newAnticipate();
          tmpAnticipate.anticipate(fOnBeforeRenderCallback => {
            this.onBeforeRenderAsync(fOnBeforeRenderCallback, tmpRenderable);
          });
          tmpAnticipate.anticipate(fAsyncTemplateCallback => {
            // Render the template (asynchronously)
            this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpRecord, (pError, pContent) => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render (asynchronously) ").concat(tmpRenderableHash, " (param ").concat(pRenderableHash, ") because it did not parse the template."), pError);
                return fAsyncTemplateCallback(pError);
              }
              tmpRenderable.Content = pContent;
              return fAsyncTemplateCallback();
            }, [this], pScope, {
              RootRenderable: typeof pRootRenderable === 'object' ? pRootRenderable : tmpRenderable
            });
          });
          tmpAnticipate.anticipate(fNext => {
            this.onBeforeProjectAsync(fNext, tmpRenderable);
          });
          tmpAnticipate.anticipate(fNext => {
            this.onProjectAsync(fNext, tmpRenderable);
          });
          if (tmpRenderable.RenderMethod !== 'virtual-assignment') {
            tmpAnticipate.anticipate(fNext => {
              this.onAfterProjectAsync(fNext, tmpRenderable);
            });

            // Execute the developer-overridable post-render behavior
            tmpAnticipate.anticipate(fNext => {
              this.onAfterRenderAsync(fNext, tmpRenderable);
            });
          }
          tmpAnticipate.wait(tmpCallback);
        }

        /**
         * Renders the default renderable.
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        renderDefaultAsync(fCallback) {
          // Render the default renderable
          this.renderAsync(fCallback);
        }

        /**
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        basicRender(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          return this.basicRenderWithScope(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
        }

        /**
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string} [pRenderableHash] - The hash of the renderable to render.
         * @param {string} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|object} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         */
        basicRenderWithScope(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress) {
          let tmpRenderOptions = this.buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
          if (tmpRenderOptions.Valid) {
            this.assignRenderContent(tmpRenderOptions.Renderable, tmpRenderOptions.DestinationAddress, this.pict.parseTemplateByHash(tmpRenderOptions.Renderable.TemplateHash, tmpRenderOptions.Record, null, [this], pScope, {
              RootRenderable: tmpRenderOptions.Renderable
            }));
            return true;
          } else {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not perform a basic render of ").concat(tmpRenderOptions.RenderableHash, " because it is not valid."));
            return false;
          }
        }

        /**
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|Object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         */
        basicRenderAsync(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback) {
          return this.basicRenderWithScopeAsync(this, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback);
        }

        /**
         * @param {any} pScope - The scope to use for the template rendering.
         * @param {string|ErrorCallback} [pRenderableHash] - The hash of the renderable to render.
         * @param {string|ErrorCallback} [pRenderDestinationAddress] - The address where the renderable will be rendered.
         * @param {string|Object|ErrorCallback} [pTemplateRecordAddress] - The address of (or actual obejct) where the data for the template is stored.
         * @param {ErrorCallback} [fCallback] - The callback to call when the async operation is complete.
         */
        basicRenderWithScopeAsync(pScope, pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress, fCallback) {
          // Allow the callback to be passed in as the last parameter no matter what
          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : typeof pTemplateRecordAddress === 'function' ? pTemplateRecordAddress : typeof pRenderDestinationAddress === 'function' ? pRenderDestinationAddress : typeof pRenderableHash === 'function' ? pRenderableHash : null;
          if (!tmpCallback) {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " basicRenderAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " basicRenderAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          const tmpRenderOptions = this.buildRenderOptions(pRenderableHash, pRenderDestinationAddress, pTemplateRecordAddress);
          if (tmpRenderOptions.Valid) {
            this.pict.parseTemplateByHash(tmpRenderOptions.Renderable.TemplateHash, tmpRenderOptions.Record,
            /**
             * @param {Error} [pError] - The error that occurred during template parsing.
             * @param {string} [pContent] - The content that was rendered from the template.
             */
            (pError, pContent) => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render (asynchronously) ").concat(tmpRenderOptions.RenderableHash, " because it did not parse the template."), pError);
                return tmpCallback(pError);
              }
              this.assignRenderContent(tmpRenderOptions.Renderable, tmpRenderOptions.DestinationAddress, pContent);
              return tmpCallback();
            }, [this], pScope, {
              RootRenderable: tmpRenderOptions.Renderable
            });
          } else {
            let tmpErrorMessage = "PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not perform a basic render of ").concat(tmpRenderOptions.RenderableHash, " because it is not valid.");
            this.log.error(tmpErrorMessage);
            return tmpCallback(new Error(tmpErrorMessage));
          }
        }

        /**
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onProject(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onProject:"));
          }
          if (pRenderable.RenderMethod === 'virtual-assignment') {
            this.pict.TransactionTracking.pushToTransactionQueue(pRenderable.TransactionHash, {
              ViewHash: this.Hash,
              Renderable: pRenderable
            }, 'Deferred-Post-Content-Assignment');
          }
          if (this.pict.LogNoisiness > 0) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " Assigning Renderable[").concat(pRenderable.RenderableHash, "] content length ").concat(pRenderable.Content.length, " to Destination [").concat(pRenderable.ContentDestinationAddress, "] using Async render method ").concat(pRenderable.RenderMethod, "."));
          }

          // Assign the content to the destination address
          this.pict.ContentAssignment.projectContent(pRenderable.RenderMethod, pRenderable.ContentDestinationAddress, pRenderable.Content, pRenderable.TestAddress);
          this.lastRenderedTimestamp = this.pict.log.getTimeStamp();
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM (async flow).
         *
         * @param {(error?: Error, content?: string) => void} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that is being projected.
         */
        onProjectAsync(fCallback, pRenderable) {
          this.onProject(pRenderable);
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers after the view is rendered.
         *
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onAfterRender(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterRender:"));
          }
          if (pRenderable && pRenderable.RootRenderableViewHash === this.Hash) {
            const tmpTransactionQueue = this.pict.TransactionTracking.clearTransactionQueue(pRenderable.TransactionHash) || [];
            for (const tmpEvent of tmpTransactionQueue) {
              const tmpView = this.pict.views[tmpEvent.Data.ViewHash];
              if (!tmpView) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterRender: Could not find view for transaction hash ").concat(pRenderable.TransactionHash, " and ViewHash ").concat(tmpEvent.Data.ViewHash, "."));
                continue;
              }
              tmpView.onAfterProject();

              // Execute the developer-overridable post-render behavior
              tmpView.onAfterRender(tmpEvent.Data.Renderable);
            }
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is rendered (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that was rendered.
         */
        onAfterRenderAsync(fCallback, pRenderable) {
          this.onAfterRender(pRenderable);
          const tmpAnticipate = this.fable.newAnticipate();
          if (pRenderable && pRenderable.RootRenderableViewHash === this.Hash) {
            const queue = this.pict.TransactionTracking.clearTransactionQueue(pRenderable.TransactionHash) || [];
            for (const event of queue) {
              /** @type {PictView} */
              const tmpView = this.pict.views[event.Data.ViewHash];
              if (!tmpView) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterRenderAsync: Could not find view for transaction hash ").concat(pRenderable.TransactionHash, " and ViewHash ").concat(event.Data.ViewHash, "."));
                continue;
              }
              tmpAnticipate.anticipate(tmpView.onAfterProjectAsync.bind(tmpView));
              tmpAnticipate.anticipate(fNext => {
                tmpView.onAfterRenderAsync(fNext, event.Data.Renderable);
              });

              // Execute the developer-overridable post-render behavior
            }
          }
          return tmpAnticipate.wait(fCallback);
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM.
         *
         * @param {Renderable} pRenderable - The renderable that was projected.
         */
        onAfterProject(pRenderable) {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterProject:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is projected into the DOM (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         * @param {Renderable} pRenderable - The renderable that was projected.
         */
        onAfterProjectAsync(fCallback, pRenderable) {
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Solver                            */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before the view is solved.
         */
        onBeforeSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeSolve:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeSolveAsync(fCallback) {
          this.onBeforeSolve();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when the view is solved.
         */
        onSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onSolve:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onSolveAsync(fCallback) {
          this.onSolve();
          return fCallback();
        }

        /**
         * Performs view solving and triggers lifecycle hooks.
         *
         * @return {boolean} - True if the view was solved successfully, false otherwise.
         */
        solve() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeSolve();
          this.onSolve();
          this.onAfterSolve();
          this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Performs view solving and triggers lifecycle hooks (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        solveAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " solveAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " solveAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterSolveAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " solveAsync() complete."));
            }
            this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after the view is solved.
         */
        onAfterSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterSolve:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after the view is solved (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterSolveAsync(fCallback) {
          this.onAfterSolve();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal From View                        */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before data is marshaled from the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        onBeforeMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeMarshalFromView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeMarshalFromViewAsync(fCallback) {
          this.onBeforeMarshalFromView();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when data is marshaled from the view.
         */
        onMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onMarshalFromView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onMarshalFromViewAsync(fCallback) {
          this.onMarshalFromView();
          return fCallback();
        }

        /**
         * Marshals data from the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        marshalFromView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeMarshalFromView();
          this.onMarshalFromView();
          this.onAfterMarshalFromView();
          this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Marshals data from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        marshalFromViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalFromViewAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalFromViewAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalFromViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " marshalFromViewAsync() complete."));
            }
            this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after data is marshaled from the view.
         */
        onAfterMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterMarshalFromView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after data is marshaled from the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterMarshalFromViewAsync(fCallback) {
          this.onAfterMarshalFromView();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal To View                          */
        /* -------------------------------------------------------------------------- */
        /**
         * Lifecycle hook that triggers before data is marshaled into the view.
         */
        onBeforeMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeMarshalToView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers before data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onBeforeMarshalToViewAsync(fCallback) {
          this.onBeforeMarshalToView();
          return fCallback();
        }

        /**
         * Lifecycle hook that triggers when data is marshaled into the view.
         */
        onMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onMarshalToView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers when data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onMarshalToViewAsync(fCallback) {
          this.onMarshalToView();
          return fCallback();
        }

        /**
         * Marshals data into the view.
         *
         * @return {boolean} - True if the operation was successful, false otherwise.
         */
        marshalToView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeMarshalToView();
          this.onMarshalToView();
          this.onAfterMarshalToView();
          this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }

        /**
         * Marshals data into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        marshalToViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');

          /** @type {ErrorCallback} */
          let tmpCallback = typeof fCallback === 'function' ? fCallback : null;
          if (!tmpCallback) {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalToViewAsync was called without a valid callback.  A callback will be generated but this could lead to race conditions."));
            tmpCallback = pError => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.Name, " marshalToViewAsync Auto Callback Error: ").concat(pError), pError);
              }
            };
          }
          tmpAnticipate.anticipate(this.onBeforeMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalToViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " marshalToViewAsync() complete."));
            }
            this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
            return tmpCallback(pError);
          });
        }

        /**
         * Lifecycle hook that triggers after data is marshaled into the view.
         */
        onAfterMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterMarshalToView:"));
          }
          return true;
        }

        /**
         * Lifecycle hook that triggers after data is marshaled into the view (async flow).
         *
         * @param {ErrorCallback} fCallback - The callback to call when the async operation is complete.
         */
        onAfterMarshalToViewAsync(fCallback) {
          this.onAfterMarshalToView();
          return fCallback();
        }

        /** @return {boolean} - True if the object is a PictView. */
        get isPictView() {
          return true;
        }
      }
      module.exports = PictView;
    }, {
      "../package.json": 20,
      "fable-serviceproviderbase": 17
    }],
    22: [function (require, module, exports) {
      module.exports = {
        "RenderOnLoad": true,
        "DefaultRenderable": "Login-Container",
        "DefaultDestinationAddress": "#Pict-Login-Container",
        "TargetElementAddress": "#Pict-Login-Container",
        // ----- Endpoint Configuration -----
        // Defaults match orator-authentication routes.
        // Override these to point at any custom backend.
        "LoginEndpoint": "/1.0/Authenticate",
        // "POST" sends JSON body { UserName, Password }.
        // "GET"  appends /:username/:password to LoginEndpoint.
        "LoginMethod": "POST",
        "LogoutEndpoint": "/1.0/Deauthenticate",
        "CheckSessionEndpoint": "/1.0/CheckSession",
        "OAuthProvidersEndpoint": "/1.0/OAuth/Providers",
        "OAuthBeginEndpoint": "/1.0/OAuth/Begin",
        // ----- Behavior -----
        "CheckSessionOnLoad": true,
        "ShowOAuthProviders": false,
        // ----- Data Address -----
        // Where session state is stored in the Pict address space.
        "SessionDataAddress": "AppData.Session",
        // ----- Templates -----
        "Templates": [{
          "Hash": "Pict-Login-Template-Wrapper",
          "Template": "<div class=\"pict-login-card\"><div id=\"pict-login-error\" class=\"pict-login-error\" style=\"display:none\"></div><div id=\"pict-login-form-area\"></div><div id=\"pict-login-oauth-area\"></div><div id=\"pict-login-status-area\" style=\"display:none\"></div></div>"
        }, {
          "Hash": "Pict-Login-Template-Form",
          "Template": "<form id=\"pict-login-form\" class=\"pict-login-form\"><label class=\"pict-login-label\" for=\"pict-login-username\">Username</label><input class=\"pict-login-input\" type=\"text\" id=\"pict-login-username\" name=\"username\" autocomplete=\"username\" placeholder=\"Enter username\" /><label class=\"pict-login-label\" for=\"pict-login-password\">Password</label><input class=\"pict-login-input\" type=\"password\" id=\"pict-login-password\" name=\"password\" autocomplete=\"current-password\" placeholder=\"Enter password\" /><button class=\"pict-login-submit\" type=\"submit\">Log In</button></form>"
        }, {
          "Hash": "Pict-Login-Template-Status",
          "Template": "<div class=\"pict-login-status\"><span class=\"pict-login-dot pict-login-dot--on\"></span><span class=\"pict-login-user-label\">Logged in as <strong id=\"pict-login-display-name\"></strong></span><span class=\"pict-login-user-id\" id=\"pict-login-display-id\"></span><button class=\"pict-login-logout-btn\" id=\"pict-login-logout\" type=\"button\">Log out</button></div>"
        }, {
          "Hash": "Pict-Login-Template-OAuthProviders",
          "Template": "<div class=\"pict-login-oauth\"><div class=\"pict-login-oauth-divider\"><span>or sign in with</span></div><div class=\"pict-login-oauth-buttons\" id=\"pict-login-oauth-buttons\"></div></div>"
        }, {
          "Hash": "Pict-Login-Template-Error",
          "Template": "<div class=\"pict-login-error-message\">{~D:Record.Message~}</div>"
        }],
        // ----- Renderables -----
        "Renderables": [{
          "RenderableHash": "Login-Container",
          "TemplateHash": "Pict-Login-Template-Wrapper",
          "DestinationAddress": "#Pict-Login-Container"
        }],
        // ----- CSS -----
        "CSS": ".pict-login-card\n{\n\tmax-width: 400px;\n\tmargin: 2rem auto;\n\tbackground: #fff;\n\tborder: 1px solid #D4A373;\n\tborder-top: 4px solid #E76F51;\n\tborder-radius: 6px;\n\tpadding: 1.5rem;\n\tbox-shadow: 0 2px 8px rgba(38,70,83,0.08);\n\tfont-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n\tcolor: #264653;\n}\n\n/* ----- Form ----- */\n.pict-login-form\n{\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 0.75rem;\n}\n.pict-login-label\n{\n\tfont-weight: 600;\n\tfont-size: 0.85rem;\n\tcolor: #264653;\n}\n.pict-login-input\n{\n\tborder: 1px solid #D4C4A8;\n\tbackground: #FFFCF7;\n\tpadding: 0.55rem 0.7rem;\n\tborder-radius: 4px;\n\tfont-size: 0.9rem;\n\tcolor: #264653;\n\twidth: 100%;\n\tbox-sizing: border-box;\n}\n.pict-login-input:focus\n{\n\toutline: none;\n\tborder-color: #E76F51;\n\tbox-shadow: 0 0 0 2px rgba(231,111,81,0.15);\n}\n.pict-login-submit\n{\n\tbackground: #E76F51;\n\tcolor: #fff;\n\tborder: none;\n\tpadding: 0.6rem 1.25rem;\n\tborder-radius: 4px;\n\tfont-size: 0.9rem;\n\tfont-weight: 600;\n\tcursor: pointer;\n\tmargin-top: 0.25rem;\n}\n.pict-login-submit:hover\n{\n\tbackground: #C45A3E;\n}\n.pict-login-submit:disabled\n{\n\topacity: 0.6;\n\tcursor: not-allowed;\n}\n\n/* ----- Error ----- */\n.pict-login-error\n{\n\tbackground: #FDECEA;\n\tborder: 1px solid #E76F51;\n\tcolor: #8B2500;\n\tborder-radius: 4px;\n\tpadding: 0.6rem 0.8rem;\n\tfont-size: 0.85rem;\n\tmargin-bottom: 0.75rem;\n}\n\n/* ----- Logged-In Status ----- */\n.pict-login-status\n{\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 0.5rem;\n\tflex-wrap: wrap;\n}\n.pict-login-dot\n{\n\twidth: 10px;\n\theight: 10px;\n\tborder-radius: 50%;\n\tflex-shrink: 0;\n}\n.pict-login-dot--on\n{\n\tbackground: #2A9D8F;\n\tbox-shadow: 0 0 4px rgba(42,157,143,0.5);\n}\n.pict-login-dot--off\n{\n\tbackground: #999;\n}\n.pict-login-user-label\n{\n\tfont-size: 0.9rem;\n}\n.pict-login-user-id\n{\n\tbackground: #264653;\n\tcolor: #FAEDCD;\n\tfont-size: 0.7rem;\n\tfont-weight: 700;\n\tpadding: 0.15rem 0.5rem;\n\tborder-radius: 9999px;\n}\n.pict-login-logout-btn\n{\n\tmargin-left: auto;\n\tbackground: #264653;\n\tcolor: #FAEDCD;\n\tborder: none;\n\tpadding: 0.4rem 1rem;\n\tborder-radius: 4px;\n\tfont-size: 0.8rem;\n\tfont-weight: 600;\n\tcursor: pointer;\n}\n.pict-login-logout-btn:hover\n{\n\tbackground: #1A3340;\n}\n\n/* ----- OAuth ----- */\n.pict-login-oauth\n{\n\tmargin-top: 1rem;\n}\n.pict-login-oauth-divider\n{\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 0.75rem;\n\tmargin-bottom: 0.75rem;\n\tcolor: #999;\n\tfont-size: 0.8rem;\n}\n.pict-login-oauth-divider::before,\n.pict-login-oauth-divider::after\n{\n\tcontent: '';\n\tflex: 1;\n\theight: 1px;\n\tbackground: #D4C4A8;\n}\n.pict-login-oauth-buttons\n{\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 0.5rem;\n}\n.pict-login-oauth-btn\n{\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 0.5rem;\n\tpadding: 0.55rem 1rem;\n\tborder-radius: 4px;\n\tfont-size: 0.85rem;\n\tfont-weight: 600;\n\tcursor: pointer;\n\ttext-decoration: none;\n\tborder: 1px solid #D4C4A8;\n\tbackground: #fff;\n\tcolor: #264653;\n}\n.pict-login-oauth-btn:hover\n{\n\tbackground: #F5F0E8;\n}\n.pict-login-oauth-btn--google\n{\n\tborder-color: #4285F4;\n\tcolor: #4285F4;\n}\n.pict-login-oauth-btn--google:hover\n{\n\tbackground: #EBF2FE;\n}\n.pict-login-oauth-btn--microsoft\n{\n\tborder-color: #00A4EF;\n\tcolor: #00A4EF;\n}\n.pict-login-oauth-btn--microsoft:hover\n{\n\tbackground: #E6F6FE;\n}\n"
      };
    }, {}],
    23: [function (require, module, exports) {
      const libPictViewClass = require('pict-view');
      const _DefaultConfiguration = require('./Pict-Section-Login-DefaultConfiguration.js');
      class PictSectionLogin extends libPictViewClass {
        constructor(pFable, pOptions, pServiceHash) {
          let tmpOptions = Object.assign({}, _DefaultConfiguration, pOptions);
          super(pFable, tmpOptions, pServiceHash);

          // --- State ---
          this.authenticated = false;
          this.sessionData = null;
          this.oauthProviders = [];
          this.initialRenderComplete = false;
        }

        // ===== Lifecycle Hooks =====

        onBeforeInitialize() {
          return super.onBeforeInitialize();
        }
        onAfterRender(pRenderable) {
          // Inject all registered CSS into the DOM
          this.pict.CSSMap.injectCSS();
          if (!this.initialRenderComplete) {
            this.onAfterInitialRender();
            this.initialRenderComplete = true;
          }
          return super.onAfterRender(pRenderable);
        }
        onAfterInitialRender() {
          // Populate the form (or status) into the wrapper placeholders
          this._updateView();
          if (this.options.CheckSessionOnLoad) {
            this.checkSession();
          }
          if (this.options.ShowOAuthProviders) {
            this.loadOAuthProviders();
          }
        }

        // ===== Public API =====

        /**
         * Authenticate with username and password.
         *
         * @param {string} pUsername - The username / login ID
         * @param {string} pPassword - The password
         * @param {function} [fCallback] - Optional callback(pError, pSessionData)
         */
        login(pUsername, pPassword, fCallback) {
          if (typeof fCallback !== 'function') {
            fCallback = () => {};
          }
          this._clearError();
          let tmpFetchOptions = {};
          let tmpURL = this.options.LoginEndpoint;
          if (this.options.LoginMethod === 'GET') {
            tmpURL = tmpURL + '/' + encodeURIComponent(pUsername) + '/' + encodeURIComponent(pPassword);
            tmpFetchOptions.method = 'GET';
          } else {
            tmpFetchOptions.method = 'POST';
            tmpFetchOptions.headers = {
              'Content-Type': 'application/json'
            };
            tmpFetchOptions.body = JSON.stringify({
              UserName: pUsername,
              Password: pPassword
            });
          }
          fetch(tmpURL, tmpFetchOptions).then(pResponse => {
            return pResponse.json();
          }).then(pData => {
            if (pData && pData.LoggedIn) {
              this.authenticated = true;
              this.sessionData = pData;
              this._storeSessionData(pData);
              this._updateView();
              this.onLoginSuccess(pData);
              this._solveApp();
              return fCallback(null, pData);
            } else {
              let tmpError = pData && pData.Error ? pData.Error : 'Authentication failed.';
              this._displayError(tmpError);
              this.onLoginFailed(tmpError);
              return fCallback(tmpError);
            }
          }).catch(pError => {
            let tmpMessage = 'Login request failed.';
            this.log.error('PictSectionLogin login error: ' + pError.message);
            this._displayError(tmpMessage);
            this.onLoginFailed(tmpMessage);
            return fCallback(tmpMessage);
          });
        }

        /**
         * End the current session.
         *
         * @param {function} [fCallback] - Optional callback(pError)
         */
        logout(fCallback) {
          if (typeof fCallback !== 'function') {
            fCallback = () => {};
          }
          fetch(this.options.LogoutEndpoint).then(pResponse => {
            return pResponse.json();
          }).then(() => {
            this.authenticated = false;
            this.sessionData = null;
            this._storeSessionData(null);
            this._updateView();
            this.onLogout();
            this._solveApp();
            return fCallback(null);
          }).catch(pError => {
            this.log.error('PictSectionLogin logout error: ' + pError.message);
            // Clear local state even if network failed
            this.authenticated = false;
            this.sessionData = null;
            this._storeSessionData(null);
            this._updateView();
            this.onLogout();
            this._solveApp();
            return fCallback(pError.message);
          });
        }

        /**
         * Check whether an existing session is active (e.g. from a cookie).
         *
         * @param {function} [fCallback] - Optional callback(pError, pSessionData)
         */
        checkSession(fCallback) {
          if (typeof fCallback !== 'function') {
            fCallback = () => {};
          }
          fetch(this.options.CheckSessionEndpoint).then(pResponse => {
            return pResponse.json();
          }).then(pData => {
            if (pData && pData.LoggedIn) {
              this.authenticated = true;
              this.sessionData = pData;
              this._storeSessionData(pData);
              this._updateView();
            }
            this.onSessionChecked(pData);
            this._solveApp();
            return fCallback(null, pData);
          }).catch(pError => {
            this.log.error('PictSectionLogin checkSession error: ' + pError.message);
            this.onSessionChecked(null);
            return fCallback(pError.message);
          });
        }

        /**
         * Fetch available OAuth providers and render buttons.
         *
         * @param {function} [fCallback] - Optional callback(pError, pProviders)
         */
        loadOAuthProviders(fCallback) {
          if (typeof fCallback !== 'function') {
            fCallback = () => {};
          }
          fetch(this.options.OAuthProvidersEndpoint).then(pResponse => {
            return pResponse.json();
          }).then(pData => {
            if (pData && Array.isArray(pData.Providers)) {
              this.oauthProviders = pData.Providers;
              this._renderOAuthButtons();
            }
            return fCallback(null, this.oauthProviders);
          }).catch(pError => {
            this.log.warn('PictSectionLogin loadOAuthProviders: ' + pError.message);
            return fCallback(pError.message);
          });
        }

        // ===== Overridable Hooks =====
        // Developers override these for custom post-login/logout behavior.

        /**
         * Called after a successful login.
         * @param {object} pSessionData - The session data from the server
         */
        onLoginSuccess(pSessionData) {
          // Override in subclass or instance
        }

        /**
         * Called after a failed login attempt.
         * @param {string} pError - The error message
         */
        onLoginFailed(pError) {
          // Override in subclass or instance
        }

        /**
         * Called after a successful logout.
         */
        onLogout() {
          // Override in subclass or instance
        }

        /**
         * Called after a session check completes.
         * @param {object|null} pSessionData - The session data, or null on error
         */
        onSessionChecked(pSessionData) {
          // Override in subclass or instance
        }

        // ===== Internal Helpers =====

        /**
         * Wire up DOM event handlers on the login form and logout button.
         */
        _wireFormEvents() {
          let tmpFormElements = this.services.ContentAssignment.getElement('#pict-login-form');
          if (tmpFormElements && tmpFormElements.length > 0) {
            let tmpForm = tmpFormElements[0];
            tmpForm.addEventListener('submit', pEvent => {
              pEvent.preventDefault();
              let tmpUsernameInput = tmpForm.querySelector('#pict-login-username');
              let tmpPasswordInput = tmpForm.querySelector('#pict-login-password');
              let tmpUsername = tmpUsernameInput ? tmpUsernameInput.value : '';
              let tmpPassword = tmpPasswordInput ? tmpPasswordInput.value : '';
              if (!tmpUsername) {
                this._displayError('Please enter a username.');
                return;
              }
              this.login(tmpUsername, tmpPassword);
            });
          }
          let tmpLogoutElements = this.services.ContentAssignment.getElement('#pict-login-logout');
          if (tmpLogoutElements && tmpLogoutElements.length > 0) {
            tmpLogoutElements[0].addEventListener('click', () => {
              this.logout();
            });
          }
        }

        /**
         * Show an error message in the error area.
         * @param {string} pMessage - The error text
         */
        _displayError(pMessage) {
          let tmpErrorElements = this.services.ContentAssignment.getElement('#pict-login-error');
          if (tmpErrorElements && tmpErrorElements.length > 0) {
            let tmpErrorEl = tmpErrorElements[0];
            tmpErrorEl.textContent = pMessage;
            tmpErrorEl.style.display = 'block';
          }
        }

        /**
         * Hide the error area.
         */
        _clearError() {
          let tmpErrorElements = this.services.ContentAssignment.getElement('#pict-login-error');
          if (tmpErrorElements && tmpErrorElements.length > 0) {
            let tmpErrorEl = tmpErrorElements[0];
            tmpErrorEl.textContent = '';
            tmpErrorEl.style.display = 'none';
          }
        }

        /**
         * Re-render the view to reflect current authentication state.
         * Shows the login form when unauthenticated, or the status bar when authenticated.
         */
        _updateView() {
          let tmpFormAreaElements = this.services.ContentAssignment.getElement('#pict-login-form-area');
          let tmpStatusAreaElements = this.services.ContentAssignment.getElement('#pict-login-status-area');
          let tmpOAuthAreaElements = this.services.ContentAssignment.getElement('#pict-login-oauth-area');
          if (this.authenticated && this.sessionData) {
            // --- Authenticated: show status, hide form ---
            if (tmpFormAreaElements && tmpFormAreaElements.length > 0) {
              tmpFormAreaElements[0].style.display = 'none';
            }
            if (tmpOAuthAreaElements && tmpOAuthAreaElements.length > 0) {
              tmpOAuthAreaElements[0].style.display = 'none';
            }
            if (tmpStatusAreaElements && tmpStatusAreaElements.length > 0) {
              let tmpStatusArea = tmpStatusAreaElements[0];
              tmpStatusArea.style.display = 'block';

              // Render the status template
              let tmpStatusHTML = this.pict.parseTemplateByHash('Pict-Login-Template-Status', {});
              tmpStatusArea.innerHTML = tmpStatusHTML;

              // Populate display values
              let tmpDisplayName = '';
              let tmpDisplayID = '';
              if (this.sessionData.UserRecord) {
                tmpDisplayName = this.sessionData.UserRecord.FullName || this.sessionData.UserRecord.LoginID || this.sessionData.UserRecord.Email || '';
                tmpDisplayID = this.sessionData.UserRecord.IDUser || this.sessionData.UserID || '';
              } else if (this.sessionData.UserID) {
                tmpDisplayID = this.sessionData.UserID;
              }
              let tmpNameElements = tmpStatusArea.querySelectorAll('#pict-login-display-name');
              if (tmpNameElements.length > 0) {
                tmpNameElements[0].textContent = tmpDisplayName;
              }
              let tmpIDElements = tmpStatusArea.querySelectorAll('#pict-login-display-id');
              if (tmpIDElements.length > 0) {
                if (tmpDisplayID) {
                  tmpIDElements[0].textContent = 'ID ' + tmpDisplayID;
                } else {
                  tmpIDElements[0].style.display = 'none';
                }
              }

              // Wire logout button
              let tmpLogoutBtn = tmpStatusArea.querySelector('#pict-login-logout');
              if (tmpLogoutBtn) {
                tmpLogoutBtn.addEventListener('click', () => {
                  this.logout();
                });
              }
            }
            this._clearError();
          } else {
            // --- Unauthenticated: show form, hide status ---
            if (tmpStatusAreaElements && tmpStatusAreaElements.length > 0) {
              tmpStatusAreaElements[0].style.display = 'none';
              tmpStatusAreaElements[0].innerHTML = '';
            }
            if (tmpFormAreaElements && tmpFormAreaElements.length > 0) {
              let tmpFormArea = tmpFormAreaElements[0];
              tmpFormArea.style.display = 'block';

              // Re-render form if empty
              if (!tmpFormArea.querySelector('#pict-login-form')) {
                let tmpFormHTML = this.pict.parseTemplateByHash('Pict-Login-Template-Form', {});
                tmpFormArea.innerHTML = tmpFormHTML;
                this._wireFormEvents();
              }
            }
            if (tmpOAuthAreaElements && tmpOAuthAreaElements.length > 0) {
              if (this.options.ShowOAuthProviders && this.oauthProviders.length > 0) {
                tmpOAuthAreaElements[0].style.display = 'block';
              } else {
                tmpOAuthAreaElements[0].style.display = 'none';
              }
            }
          }
        }

        /**
         * Render OAuth provider buttons into the OAuth area.
         */
        _renderOAuthButtons() {
          let tmpOAuthAreaElements = this.services.ContentAssignment.getElement('#pict-login-oauth-area');
          if (!tmpOAuthAreaElements || tmpOAuthAreaElements.length < 1) {
            return;
          }
          if (!this.oauthProviders || this.oauthProviders.length < 1) {
            tmpOAuthAreaElements[0].style.display = 'none';
            return;
          }

          // Render the OAuth container template
          let tmpOAuthHTML = this.pict.parseTemplateByHash('Pict-Login-Template-OAuthProviders', {});
          tmpOAuthAreaElements[0].innerHTML = tmpOAuthHTML;
          tmpOAuthAreaElements[0].style.display = 'block';

          // Build individual provider buttons
          let tmpButtonContainer = tmpOAuthAreaElements[0].querySelector('#pict-login-oauth-buttons');
          if (!tmpButtonContainer) {
            return;
          }
          let tmpButtonsHTML = '';
          for (let i = 0; i < this.oauthProviders.length; i++) {
            let tmpProvider = this.oauthProviders[i];
            let tmpName = tmpProvider.Name || 'provider';
            let tmpBeginURL = tmpProvider.BeginURL || this.options.OAuthBeginEndpoint + '/' + tmpName;
            let tmpDisplayName = tmpName.charAt(0).toUpperCase() + tmpName.slice(1);
            let tmpCSSModifier = tmpName.toLowerCase();
            tmpButtonsHTML += '<a class="pict-login-oauth-btn pict-login-oauth-btn--' + tmpCSSModifier + '" href="' + tmpBeginURL + '">Sign in with ' + tmpDisplayName + '</a>';
          }
          tmpButtonContainer.innerHTML = tmpButtonsHTML;
        }

        /**
         * Store session data at the configured Pict address.
         * @param {object|null} pData - Session data to store
         */
        _storeSessionData(pData) {
          if (this.options.SessionDataAddress) {
            let tmpAddressSpace = {
              Fable: this.fable,
              Pict: this.fable,
              AppData: this.pict.AppData,
              Bundle: this.pict.Bundle
            };
            this.fable.manifest.setValueByHash(tmpAddressSpace, this.options.SessionDataAddress, pData);
          }
        }

        /**
         * Trigger a solve on the PictApplication if one exists.
         */
        _solveApp() {
          if (this.pict && this.pict.PictApplication && typeof this.pict.PictApplication.solve === 'function') {
            this.pict.PictApplication.solve();
          }
        }
      }
      module.exports = PictSectionLogin;
      module.exports.default_configuration = _DefaultConfiguration;
    }, {
      "./Pict-Section-Login-DefaultConfiguration.js": 22,
      "pict-view": 21
    }]
  }, {}, [1])(1);
});
//# sourceMappingURL=harness_app.js.map
