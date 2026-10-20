"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var SCANNED = [
    {
        id: 'older',
        cwd: '/home/t/code/backend',
        customTitle: null,
        aiTitle: 'Fix login',
        firstPrompt: 'oprav prihlaseni',
        lastPrompt: null,
        lastDoneAt: '2026-10-01T10:00:00.000Z',
        resumeDir: '/home/t/code/_workspaces/backend/backend-42-login',
        origin: '/home/t/code/backend',
    },
    {
        id: 'newer',
        cwd: '/home/t/code/shop.example.com',
        customTitle: 'Školení nových kolegů',
        aiTitle: null,
        firstPrompt: 'priprav osnovu',
        lastPrompt: 'dopln agendu',
        lastDoneAt: '2026-10-19T10:00:00.000Z',
        resumeDir: '/home/t/code/shop.example.com',
        origin: '/home/t/code/shop.example.com',
    },
];
var PANE_PROPS = {
    title: 'Sessions',
    isFocused: true,
    bodyColumns: 100,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
};
(0, testing_1.test)('the overview lists sessions newest first and searches without diacritics', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, surface, ui, first, _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                testing_1.mock.store(on);
                testing_1.mock.clock(on);
                testing_1.mock.env(on, { HOME: '/home/t' });
                on('process.run', function () { return ({
                    value: { exitCode: 0, stdout: JSON.stringify(SCANNED), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
                }); });
                on('ui.open', function () { return ({ value: { isPlaced: true } }); });
                on('fs.exists', function () { return ({ value: false }); });
                return [4 /*yield*/, $.command.run({
                        command: 'sessions',
                        args: '',
                        origin: { kind: 'composer' },
                        presentation: { isFullscreen: true, columns: 160 },
                    })];
            case 1:
                _j.sent();
                _i = 0, _a = ['terminal', 'desktop'];
                _j.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 17];
                surface = _a[_i];
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'session-names',
                        surface: surface,
                        component: 'Pane',
                        requestId: 'sessions',
                        props: PANE_PROPS,
                    })];
            case 3:
                ui = _j.sent();
                return [4 /*yield*/, ui.find({ type: 'Button' })];
            case 4:
                first = _j.sent();
                (0, testing_1.expect)(first === null || first === void 0 ? void 0 : first.key).toBe('newer');
                // A worktree of backend is tagged by the repository it comes from, not its own folder.
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /\[BACKEND\]/ })];
            case 5:
                // A worktree of backend is tagged by the repository it comes from, not its own folder.
                _b.apply(void 0, [_j.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /\[SHOP\]/ })];
            case 6:
                _c.apply(void 0, [_j.sent()]).toBeDefined();
                return [4 /*yield*/, ui.input({ key: 'q', text: 'skoleni', kind: 'change' })];
            case 7:
                _j.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'newer' })];
            case 8:
                _d.apply(void 0, [(_j.sent())]).toBeDefined();
                _e = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'older' })];
            case 9:
                _e.apply(void 0, [(_j.sent())]).toBeUndefined();
                _f = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /1 of 2 sessions/ })];
            case 10:
                _f.apply(void 0, [(_j.sent())]).toBeDefined();
                return [4 /*yield*/, ui.input({ key: 'q', text: 'backend', kind: 'change' })];
            case 11:
                _j.sent();
                _g = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'older' })];
            case 12:
                _g.apply(void 0, [_j.sent()]).toBeDefined();
                _h = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'newer' })];
            case 13:
                _h.apply(void 0, [_j.sent()]).toBeUndefined();
                return [4 /*yield*/, ui.input({ key: 'q', text: '', kind: 'change' })];
            case 14:
                _j.sent();
                return [4 /*yield*/, ui.unmount()];
            case 15:
                _j.sent();
                _j.label = 16;
            case 16:
                _i++;
                return [3 /*break*/, 2];
            case 17: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('/autoname now renames the session from the conversation', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, renamed, run;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                testing_1.mock.store(on);
                clock = testing_1.mock.clock(on);
                renamed = [];
                on('session.id', function () { return ({ value: 'abc' }); });
                on('session.turns', function () { return ({ value: 5 }); });
                on('session.messages', function () { return ({
                    value: [
                        { role: 'user', text: 'ahoj, pomoz mi s dockerem', toolUses: [] },
                        { role: 'assistant', text: 'Jasně.', toolUses: [] },
                        { role: 'user', text: 'vlastně nasaď plugin do stagingu', toolUses: [] },
                    ],
                }); });
                on('model.complete', function ($, e) {
                    (0, testing_1.expect)(e.prompt).toContain('nasaď plugin');
                    return {
                        value: {
                            isAnswered: true,
                            text: '```json\n{"title": "Nasazení pluginu do stagingu.", "summary": "Plugin nasazen."}\n```',
                            usage: {
                                input_tokens: 1,
                                output_tokens: 1,
                                cache_creation_input_tokens: 0,
                                cache_read_input_tokens: 0,
                            },
                        },
                    };
                });
                on('command.run', { command: 'rename' }, function ($, e) {
                    renamed.push(e.args);
                    return { text: "Session renamed to: ".concat(e.args) };
                });
                return [4 /*yield*/, $.command.run({
                        command: 'autoname',
                        args: 'now',
                        origin: { kind: 'composer' },
                        presentation: { isFullscreen: true, columns: 160 },
                    })];
            case 1:
                run = _a.sent();
                (0, testing_1.expect)(run.text).toBe('Session named: Nasazení pluginu do stagingu');
                return [4 /*yield*/, clock.advance(1)];
            case 2:
                _a.sent();
                (0, testing_1.expect)(renamed).toEqual(['Nasazení pluginu do stagingu']);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('projects without a tag get one from the model, kept for later', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, asked, open, ui, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                testing_1.mock.store(on);
                clock = testing_1.mock.clock(on);
                testing_1.mock.env(on, { HOME: '/home/t' });
                on('process.run', function () { return ({
                    value: { exitCode: 0, stdout: JSON.stringify(SCANNED), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
                }); });
                on('ui.open', function () { return ({ value: { isPlaced: true } }); });
                on('fs.exists', function () { return ({ value: false }); });
                asked = 0;
                on('model.complete', function () {
                    asked += 1;
                    return {
                        value: {
                            isAnswered: true,
                            // Lower case is accepted, and a clash is resolved: the second BE becomes BE2.
                            text: JSON.stringify({ '/home/t/code/backend': 'be', '/home/t/code/shop.example.com': 'BE' }),
                            usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
                        },
                    };
                });
                open = function () {
                    return $.command.run({
                        command: 'sessions',
                        args: '',
                        origin: { kind: 'composer' },
                        presentation: { isFullscreen: true, columns: 160 },
                    });
                };
                return [4 /*yield*/, open()];
            case 1:
                _c.sent();
                return [4 /*yield*/, clock.advance(1)];
            case 2:
                _c.sent();
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'session-names',
                        surface: 'terminal',
                        component: 'Pane',
                        requestId: 'sessions',
                        props: PANE_PROPS,
                    })];
            case 3:
                ui = _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /\[BE\]/ })];
            case 4:
                _a.apply(void 0, [_c.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /\[BE2\]/ })];
            case 5:
                _b.apply(void 0, [_c.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()
                    // The tags are kept: opening the overview again asks the model nothing.
                ];
            case 6:
                _c.sent();
                // The tags are kept: opening the overview again asks the model nothing.
                return [4 /*yield*/, open()];
            case 7:
                // The tags are kept: opening the overview again asks the model nothing.
                _c.sent();
                return [4 /*yield*/, clock.advance(1)];
            case 8:
                _c.sent();
                (0, testing_1.expect)(asked).toBe(1);
                return [2 /*return*/];
        }
    });
}); });
