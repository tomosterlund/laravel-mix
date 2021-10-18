const { concat } = require('lodash');
const { Component } = require('./Component');

class Extend extends Component {
    /**
     * Register the component.
     *
     * @param {string | string[]} name
     * @param {import('../../types/component').Component} component
     */
    register(name, component) {
        this.context.group.mix.registrar.add(component, concat([], name));
    }
}

module.exports = Extend;
