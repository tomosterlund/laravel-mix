const { Component } = require('./Component');

module.exports = class Utilities extends Component {
    static names = () => [];

    mix() {
        return {
            inProduction: () => this.context.config.production
        };
    }
};
