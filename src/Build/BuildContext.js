const { Chunks } = require('../Chunks');
const Task = require('../tasks/Task');
const { Manifest } = require('./Manifest');

/**
 * Holds all the data necessary for the current build
 */
exports.BuildContext = class BuildContext {
    /**
     * @param {import('./BuildGroup').BuildGroup} group
     */
    constructor(group) {
        /** @internal */
        this.group = group;

        /**
         * @public
         * @type {typeof group.mix.config}
         */
        this.config = Object.create(group.mix.config);

        /**
         * @public
         */
        this.chunks = new Chunks(group.mix);

        /**
         * @public
         */
        this.manifest = new Manifest();

        /**
         * @type {Task<any>[]}
         * @internal
         **/
        this.tasks = [];

        /** Record<string, any> */
        this.metadata = {};

        // TODO: Do we want an event dispatcher here?
        // How would we implement mix.before on a per-group basis
        // Maybe it is only meant to be top-level?
    }

    /**
     * Queue up a new task.
     * TODO: Add a "stage" to tasks so they can run at different points during the build
     *
     * @param {Task<any>} task
     * @param {{ when: "before" | "during" | "after"}} options
     */
    addTask(task, options) {
        this.tasks.push(task);
    }

    /**
     * @returns {import("../../types/index")}
     */
    get api() {
        return this.group.components.api;
    }
};
