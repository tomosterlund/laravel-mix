let mergeWebpackConfig = require('../builder/MergeWebpackConfig');
const { Component } = require('./Component');
const { concat } = require('lodash');

let components = [
    'JavaScript',
    'Preact',
    'React',
    'Coffee',
    'Define',
    'TypeScript',
    'Less',
    'Sass',
    'Stylus',
    'PostCss',
    'CssWebpackConfig',
    'BrowserSync',
    'Combine',
    'Copy',
    'Autoload',
    'Alias',
    'Vue',
    'React',
    'Preact',
    'Version',
    'Extend',
    'Extract',
    'Notifications',
    'DisableNotifications',
    'PurifyCss',
    'LegacyNodePolyfills',
    'WebpackConfig',
    'DumpWebpackConfig',
    'Then',
    'Override',
    'SourceMaps',
    'SetPublicPath',
    'SetResourceRoot',
    'Options',
    'When',
    'BabelConfig',
    'Before'
];

class ComponentRegistrar {
    /**
     *
     * @param {import('../Mix')} [mix]
     */
    constructor(mix) {
        this.mix = mix || global.Mix;

        this.components = {};
    }

    /**
     * Install all default components.
     */
    installAll() {
        components.map(name => require(`./${name}`)).forEach(c => this.install(c));

        return this.components;
    }

    /**
     * Install a component.
     *
     * @param {import("laravel-mix").Component} ComponentDefinition
     * @param {string[]} [names]
     */
    install(ComponentDefinition, names) {
        /** @type {import("laravel-mix").Component} */
        let component;

        // If we're extending from the internal `Component` class then we provide the mix API object
        if (Component.isPrototypeOf(ComponentDefinition)) {
            // @ts-ignore
            // This API is not finalized which is why we've restricted to to the internal component class for now
            component = new ComponentDefinition(this.mix);
        } else if (typeof ComponentDefinition === 'function') {
            component = new ComponentDefinition();
        } else {
            component = ComponentDefinition;
        }

        this.registerComponent(component, names || this.getComponentNames(component));

        Mix.listen('internal:gather-dependencies', () => {
            if (!component.activated && !component.passive) {
                return;
            }

            if (!component.dependencies) {
                return;
            }

            this.mix.dependencies.enqueue(
                concat([], component.dependencies()),
                component.requiresReload || false
            );
        });

        Mix.listen('init', () => {
            if (!component.activated && !component.passive) {
                return;
            }

            component.boot && component.boot();
            component.babelConfig && this.applyBabelConfig(component);

            Mix.listen('loading-entry', entry => {
                if (component.webpackEntry) {
                    component.webpackEntry(entry);
                }
            });

            Mix.listen('loading-rules', rules => {
                component.webpackRules && this.applyRules(rules, component);
            });

            Mix.listen('loading-plugins', plugins => {
                component.webpackPlugins && this.applyPlugins(plugins, component);
            });

            Mix.listen('configReady', config => {
                component.webpackConfig && component.webpackConfig(config);
            });
        });

        return this.components;
    }

    /**
     *
     * @param {*} component
     * @returns {string[]}
     */
    getComponentNames(component) {
        if (typeof component.name === 'function') {
            return concat([], component.name());
        }

        return [
            component.constructor.name.replace(/^([A-Z])/, letter => letter.toLowerCase())
        ];
    }

    /**
     * Register the component.
     *
     * @param {Object} component
     * @param {string[]} names
     */
    registerComponent(component, names) {
        names.forEach(name => {
            this.components[name] = (...args) => {
                Mix.components.record(name, component);

                component.caller = name;

                component.register && component.register(...args);

                component.activated = true;

                return this.components;
            };

            // If we're dealing with a passive component that doesn't
            // need to be explicitly triggered by the user, we'll
            // call it now.
            if (component.passive) {
                this.components[name]();
            }

            // Components can optionally write to the Mix API directly.
            if (component.mix) {
                Object.keys(component.mix()).forEach(name => {
                    this.components[name] = component.mix()[name];
                });
            }
        });
    }

    /**
     * Install the component's dependencies.
     *
     * @deprecated
     * @param {Object} component
     */
    installDependencies(component) {
        throw new Error(
            'ComponentRegistrar.installDependencies is an implementation detail and no longer used'
        );
    }

    /**
     *
     * Apply the Babel configuration for the component.
     *
     * @param {Object} component
     */
    applyBabelConfig(component) {
        Config.babelConfig = mergeWebpackConfig(
            Config.babelConfig,
            component.babelConfig()
        );
    }

    /**
     *
     * Apply the webpack rules for the component.
     *
     * @param {Object} component
     */
    applyRules(rules, component) {
        const newRules = component.webpackRules() || [];

        rules.push(...[].concat(newRules));
    }

    /**
     *
     * Apply the webpack plugins for the component.
     *
     * @param {Object} component
     */
    applyPlugins(plugins, component) {
        const newPlugins = component.webpackPlugins() || [];

        plugins.push(...[].concat(newPlugins));
    }
}

module.exports = ComponentRegistrar;
