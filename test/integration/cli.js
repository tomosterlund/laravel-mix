import test from 'ava';
import path from 'path';
// import request from 'supertest';
import { cli } from '../helpers/cli.js';

const mix = cli({
    testing: false,
    env: { NODE_ENV: 'development' },
    cwd: path.resolve(__dirname, './fixture')
});

test('Missing config files result in non-zero exit code', async t => {
    const { code } = await mix(['--mix-config=webpack.mix.does-not-exist']);

    t.not(0, code);
});

test('Webpack errors result in non-zero exit code', async t => {
    const { code } = await mix(['--mix-config=webpack.mix.error']);

    t.not(0, code);
});

test('An empty mix file results in a successful build', async t => {
    const { code, stderr } = await mix(['--mix-config=webpack.mix.empty']);

    // TODO: This should show a warning that nothing is being compiled

    t.is(0, code);
    t.is(stderr, '');
});

const configFiles = {
    CJS: 'webpack.mix',
    'CJS with replaced export': 'webpack.mix.fn.raw',
    'CJS with default export': 'webpack.mix.fn.default',
    'CJS with default export + defineConfig': 'webpack.mix.fn.define',

    ESM: 'webpack.mix.esm',
    'ESM with default export': 'webpack.mix.esm.fn.raw',
    'ESM with default export + defineConfig': 'webpack.mix.esm.fn.define'
};

for (const [testName, fileName] of Object.entries(configFiles)) {
    test(`Run CLI with config: ${testName}`, async t => {
        const { code, stderr } = await mix([`--mix-config=${fileName}`]);

        t.is(0, code);
        t.is('', stderr);
    });
}

/*
test('Can run HMR', async t => {
    const req = request('http://localhost:8080');

    const { code, stdout } = await mix(['watch --hot'], async child => {
        // Give the server some time to start
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Make sure requesting assets works…
        const response = await req.get('/js/app.js').timeout(10000);
        t.is(200, response.statusCode);

        // Then stop the server
        child.kill('SIGINT');
    });

    t.is(0, code);
    t.regex(stdout, /webpack compiled successfully/i);
});
*/
