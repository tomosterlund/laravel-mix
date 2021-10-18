const { concat } = require('lodash');
const { ComponentRecord } = require('./ComponentRecord');
const { createFunctionalComponent } = require('../components/FunctionalComponent');

/**
 * @typedef {import('../../types/component').ClassComponent} ClassComponent
 * @typedef {import('../../types/component').ComponentInterface} ComponentInterface
 * @typedef {import('../../types/component').FunctionalComponent} FunctionalComponent
 * @typedef {import('../../types/component').InstallableComponent} InstallableComponent
 * @typedef {import('../../types/component').Component} Component
 **/

/** @typedef {Record<string, (...args: any[]) => PartialAPI>} PartialAPI */

exports.ComponentManager = class ComponentManager {
    /**
     * @private
     * @type {'pending' | 'installed'}
     **/
    state = 'pending';

    /**
     * @private
     * @type {ComponentRecord[]}
     **/
    records = [];

    /**
     * @private
     * @type {PartialAPI}
     */
    #api = {};

    /**
     * @internal
     * @param {import('../Mix')} mix
     */
    constructor(mix) {
        this.mix = mix;
    }

    /**
     *
     * @public
     * @param {Component} component
     * @param {string[]} [names]
     */
    add(component, names) {
        const record = new ComponentRecord(this.mix, component, names);
        this.records.push(record);

        if (this.state !== 'pending') {
            this.install(record);
        }
    }

    get api() {
        return /** @type {import('../../types/index').Api} */ (
            /** @type {unknown} */ (this.#api)
        );
    }

    /**
     * Install all default components.
     */
    installAll() {
        const { components } = require('../components/PreloadedComponents');

        components.map(name => require(`./${name}`)).forEach(c => this.add.bind(this));
        this.records.forEach(record => this.install(record));

        this.state = 'installed';

        return this.api;
    }

    /**
     * @private
     * @param {ComponentRecord} record
     */
    install(record) {
        const ci = record.forGroup(this.mix.currentGroup);
        const instance = ci.instance;

        // Augment the API
        for (const name of record.names) {
            if (name in this.#api) {
                console.warn(
                    `Multiple extensions are using the same name [${name}]. Only the latest will be used.`
                );
            }

            this.#api[name] = (...args) => {
                ci.run({
                    name,
                    args
                });

                return this.#api;
            };
        }

        // Components can optionally write to the Mix API directly.
        const added = instance.mix ? instance.mix() : [];

        Object.entries(added).forEach(([name, cc]) => this.add(cc, [name]));

        // Passive components don't need to be explicitly triggered
        // by the user. They're called immediately after initialization
        if (instance.passive) {
            // Given that a component can have multiple
            // names we just pick the first one
            this.#api[record.names[0]]();
        }

        this.mix.listen('init', () => ci.init());
    }

    /**
     * @internal
     */
    async collectDeps() {
        const results = await Promise.all(this.records.map(r => r.collectDeps()));

        this.throwErrors(results.flat());
    }

    /**
     * @internal
     */
    async init() {
        const results = await Promise.all(this.records.map(r => r.init()));

        this.throwErrors(results.flat());
    }

    /**
     * @template T
     * @param {PromiseSettledResult<T>[]} results
     */
    throwErrors(results) {
        const errors = results.flatMap(r => {
            if (r.status === 'rejected') {
                return [r.reason];
            }

            return [];
        });

        if (errors.length > 0) {
            // TODO:
            // throw new AggregateError(errors)
            throw new Error(errors.map(err => `${err}`).join('\n'));
        }
    }
};
