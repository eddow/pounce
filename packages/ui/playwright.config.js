var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { defineConfig, devices } from '@playwright/test';
var isCI = Boolean(process.env.CI);
var projectRootDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
var port = 5274;
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    timeout: 30000,
    expect: {
        timeout: 5000,
    },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: "http://127.0.0.1:".concat(port),
        headless: true,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chrome',
            use: __assign(__assign({}, devices['Desktop Chrome']), { channel: 'chrome' }),
        },
    ],
    webServer: {
        command: "node_modules/.bin/vite --host=127.0.0.1 --port=".concat(port, " --strictPort"),
        cwd: projectRootDir,
        port: port,
        timeout: 120000,
        reuseExistingServer: true,
    },
});
