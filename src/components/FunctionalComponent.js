/** @typedef {import('../../types/component').ClassComponent} ClassComponent */
/** @typedef {import('../../types/component').FunctionalComponent} FunctionalComponent */

/**
 * @param {FunctionalComponent} component
 * @returns {ClassComponent}
 */
exports.createFunctionalComponent = function createFunctionalComponent(component) {
    return class {
        /** @type {any[]} */
        args = [];

        /**
         * @param {import("../Build/BuildContext").BuildContext} context
         */
        constructor(context) {
            this.context = context;
        }

        /**
         *
         * @param  {...any} args
         */
        register(...args) {
            this.args = args;
        }

        /**
         *
         * @param {import('webpack').Configuration} config
         */
        webpackConfig(config) {
            component.call(this, this.context.api, config, ...this.args);
        }
    };
};
