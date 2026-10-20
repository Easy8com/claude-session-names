"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
var claude_code_1 = require("claude-code");
var PANE = 'sessions';
var MODEL = 'haiku';
var DIGEST_CHARS = 14000;
var rows = (0, claude_code_1.atom)({ plugin: 'session-names', key: 'rows' }, []);
var query = (0, claude_code_1.atom)({ plugin: 'session-names', key: 'query' }, '');
var status = (0, claude_code_1.atom)({ plugin: 'session-names', key: 'status' }, '');
// Tag colors, picked by the tag's hash so a project keeps its color.
var TAG_COLORS = ['cyan', 'magenta', 'yellow', 'green', '#5fafff', '#ff8787', '#d7af5f', '#af87ff'];
var TAG_WIDTH = 10;
var SYSTEM = "You name coding-assistant sessions for a list the user searches later.\nRead the conversation digest and answer with JSON only: {\"title\": \"...\", \"summary\": \"...\"}.\n- title: 3 to 7 words, at most 60 characters, naming the main goal or outcome of the whole\n  conversation so far, not just its first request. Use the language the user writes in.\n  No quotes, no trailing period, no generic words like \"session\" or \"help with\".\n- summary: one or two sentences, at most 220 characters, in the same language: what was done\n  or decided, with concrete identifiers (repository, ticket numbers, file or feature names).\n- When a current title is given and still fits the focus of the conversation, keep it exactly.";
var recordKey = function (id) { return "s:".concat(id); };
function recall($, id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, $.store.get(recordKey(id))];
                case 1: return [2 /*return*/, (_a = (_b.sent())) !== null && _a !== void 0 ? _a : {}];
            }
        });
    });
}
function remember($, id, patch) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _b = (_a = $.store).set;
                    _c = [recordKey(id)];
                    _d = [{}];
                    return [4 /*yield*/, recall($, id)];
                case 1: return [4 /*yield*/, _b.apply(_a, _c.concat([__assign.apply(void 0, [__assign.apply(void 0, _d.concat([(_e.sent())])), patch])]))];
                case 2:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Names at the first three turns, then every third, so a session that changes topic follows.
var isNamingTurn = function (turn, namedAt) {
    if (namedAt === void 0) { namedAt = 0; }
    return turn > namedAt && (turn <= 3 || turn - namedAt >= 3);
};
var clip = function (text, max) {
    return text.length <= max ? text : "".concat(text.slice(0, max), "\u2026");
};
function digest(messages) {
    var lines = messages.flatMap(function (m) {
        var _a;
        var tools = m.toolUses.map(function (t) { return t.tool; });
        var text = m.text.replace(/\s+/g, ' ').trim();
        if (m.role === 'user') {
            return text && !((_a = m.toolResults) === null || _a === void 0 ? void 0 : _a.length) ? ["USER: ".concat(clip(text, 700))] : [];
        }
        var used = tools.length ? " [tools: ".concat(__spreadArray([], new Set(tools), true).join(', '), "]") : '';
        return text || used ? ["ASSISTANT: ".concat(clip(text, 400)).concat(used)] : [];
    });
    // Keep the opening request and as much of the recent conversation as fits.
    var head = lines.slice(0, 2);
    var tail = [];
    var room = DIGEST_CHARS - head.join('\n').length;
    for (var _i = 0, _a = lines.slice(2).reverse(); _i < _a.length; _i++) {
        var line = _a[_i];
        if ((room -= line.length + 1) < 0)
            break;
        tail.unshift(line);
    }
    var skipped = lines.length - head.length - tail.length;
    return __spreadArray(__spreadArray(__spreadArray([], head, true), (skipped > 0 ? ["\u2026 (".concat(skipped, " messages left out) \u2026")] : []), true), tail, true).join('\n');
}
function parseNaming(text) {
    var _a;
    var json = (_a = text.match(/\{[\s\S]*\}/)) === null || _a === void 0 ? void 0 : _a[0];
    if (!json)
        return undefined;
    try {
        var _b = JSON.parse(json), title = _b.title, summary = _b.summary;
        if (typeof title !== 'string' || !title.trim())
            return undefined;
        var clean = title.replace(/^["'„“]+|["'“”.]+$/g, '').replace(/\s+/g, ' ').trim();
        return { title: clip(clean, 60), summary: typeof summary === 'string' ? clip(summary.trim(), 240) : '' };
    }
    catch (_c) {
        return undefined;
    }
}
function nameSession($, isForced) {
    return __awaiter(this, void 0, void 0, function () {
        var id, turn, known, messages, current, reply, named;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.session.id()];
                case 1:
                    id = _a.sent();
                    return [4 /*yield*/, $.session.turns()];
                case 2:
                    turn = _a.sent();
                    return [4 /*yield*/, recall($, id)];
                case 3:
                    known = _a.sent();
                    if (known.isLocked && !isForced)
                        return [2 /*return*/, 'Auto-naming is off for this session.'];
                    if (!isForced && !isNamingTurn(turn, known.namedAtTurn))
                        return [2 /*return*/, 'Not a naming turn.'];
                    return [4 /*yield*/, $.session.messages()];
                case 4:
                    messages = _a.sent();
                    current = known.title ? "Current title: ".concat(known.title, "\n\n") : '';
                    return [4 /*yield*/, $.model.complete({
                            model: MODEL,
                            system: SYSTEM,
                            prompt: "".concat(current, "Conversation digest:\n").concat(digest(messages)),
                            maxTokens: 300,
                            effort: 'low',
                            timeoutMs: 30000,
                        })];
                case 5:
                    reply = _a.sent();
                    if (!reply.isAnswered)
                        return [2 /*return*/, "No title: ".concat(reply.reason)];
                    named = parseNaming(reply.text);
                    if (!named)
                        return [2 /*return*/, 'No title: the reply was not JSON.'];
                    return [4 /*yield*/, remember($, id, __assign(__assign({}, named), { namedAtTurn: turn }))];
                case 6:
                    _a.sent();
                    if (named.title !== known.title) {
                        // From a timer: a command hook (/autoname) may not run another command while it holds the turn.
                        $.clock.after(0, function () {
                            void $.command.run({ command: 'rename', args: named.title }).catch(function (err) { return $.ui.log("session-names: ".concat(String(err))); });
                        });
                    }
                    return [2 /*return*/, "Session named: ".concat(named.title)];
            }
        });
    });
}
function configDir($) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, $.env.get('CLAUDE_CONFIG_DIR')];
                case 1:
                    if (!((_c = (_e.sent())) !== null && _c !== void 0)) return [3 /*break*/, 2];
                    _a = _c;
                    return [3 /*break*/, 4];
                case 2:
                    _b = "".concat;
                    return [4 /*yield*/, $.env.get('HOME')];
                case 3:
                    _a = _b.apply("", [(_d = (_e.sent())) !== null && _d !== void 0 ? _d : '', "/.claude"]);
                    _e.label = 4;
                case 4: return [2 /*return*/, _a];
            }
        });
    });
}
// Explicit tags from <config dir>/session-names/tags.json: { "~/code/backend": "API" }.
// Kept outside the plugin, so an update of the plugin leaves them alone.
function loadAliases($, config, home) {
    return __awaiter(this, void 0, void 0, function () {
        var path, raw, _a, _b, err_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    path = "".concat(config, "/session-names/tags.json");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, $.fs.exists(path)];
                case 2:
                    if (!(_c.sent()))
                        return [2 /*return*/, new Map()];
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, $.fs.read(path)];
                case 3:
                    raw = _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/, new Map(Object.entries(raw).map(function (_a) {
                            var dir = _a[0], tag = _a[1];
                            return [dir.replace(/^~(?=\/|$)/, home), tag];
                        }))];
                case 4:
                    err_1 = _c.sent();
                    // A broken tags.json must not hide the list: fall back to the folder names.
                    $.ui.toast("session-names: tags.json ignored: ".concat(err_1.message));
                    return [2 /*return*/, new Map()];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Tags the model made up for projects, kept across sessions: { "/abs/path": "TAG" }.
var TAGS_KEY = 'tags';
var TAG_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,7}$/;
var TAG_SYSTEM = "You make short tags for a list of coding projects, one per repository path.\nAnswer with JSON only: an object mapping each path exactly as given to its tag.\n- A tag is 2 to 8 characters: capital letters, digits, at most one hyphen.\n- Make it recognizable from the folder name; common abbreviations are welcome\n  (devel -> DEV, frontend -> FE, opencode-otel -> OTEL, translatoid2 -> TRANS2).\n- Every tag differs from the others and from the tags already in use.";
function generatedTags($) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, $.store.get(TAGS_KEY)];
                case 1: return [2 /*return*/, (_a = (_b.sent())) !== null && _a !== void 0 ? _a : {}];
            }
        });
    });
}
// Asks the model once for the projects that have no tag yet and keeps the answer.
function generateTags($, origins, used) {
    return __awaiter(this, void 0, void 0, function () {
        var reply, json, answered, taken, made, _i, origins_1, origin_1, raw, base, tag, n, _a, _b, _c, _d;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, $.model.complete({
                        model: MODEL,
                        system: TAG_SYSTEM,
                        prompt: "Tags already in use: ".concat(used.join(', ') || 'none', "\n\nPaths:\n").concat(origins.join('\n')),
                        maxTokens: 800,
                        effort: 'low',
                        timeoutMs: 30000,
                    })];
                case 1:
                    reply = _f.sent();
                    if (!reply.isAnswered)
                        return [2 /*return*/, {}];
                    json = (_e = reply.text.match(/\{[\s\S]*\}/)) === null || _e === void 0 ? void 0 : _e[0];
                    if (!json)
                        return [2 /*return*/, {}];
                    answered = JSON.parse(json);
                    taken = new Set(used);
                    made = {};
                    for (_i = 0, origins_1 = origins; _i < origins_1.length; _i++) {
                        origin_1 = origins_1[_i];
                        raw = answered[origin_1];
                        base = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
                        if (!TAG_PATTERN.test(base))
                            continue;
                        tag = base;
                        for (n = 2; taken.has(tag); n++)
                            tag = "".concat(base.slice(0, 7)).concat(n);
                        taken.add(tag);
                        made[origin_1] = tag;
                    }
                    _b = (_a = $.store).set;
                    _c = [TAGS_KEY];
                    _d = [{}];
                    return [4 /*yield*/, generatedTags($)];
                case 2: return [4 /*yield*/, _b.apply(_a, _c.concat([__assign.apply(void 0, [__assign.apply(void 0, _d.concat([(_f.sent())])), made])]))];
                case 3:
                    _f.sent();
                    return [2 /*return*/, made];
            }
        });
    });
}
// Tags known without asking the model: an alias from tags.json, the home directory, /tmp.
function fixedTag(origin, home, aliases) {
    var alias = aliases.get(origin);
    if (alias)
        return alias;
    if (origin === home)
        return '~';
    if (origin.startsWith('/tmp/'))
        return 'TMP';
    return undefined;
}
// Until the model has named a project, its folder name stands in.
function folderTag(origin) {
    var _a, _b;
    var name = (_a = origin.split('/').filter(Boolean).at(-1)) !== null && _a !== void 0 ? _a : '?';
    // shop.example.com reads as SHOP.
    var short = /^[\w-]+(\.[a-z]{2,})+$/i.test(name) ? ((_b = name.split('.')[0]) !== null && _b !== void 0 ? _b : name) : name;
    return short.toUpperCase().slice(0, TAG_WIDTH);
}
function tagColor(tag) {
    var hash = 0;
    for (var _i = 0, tag_1 = tag; _i < tag_1.length; _i++) {
        var ch = tag_1[_i];
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return TAG_COLORS[hash % TAG_COLORS.length];
}
function loadRows($) {
    return __awaiter(this, void 0, void 0, function () {
        var config, home, aliases, cache, run, scanned, generated, untagged, list;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, configDir($)];
                case 1:
                    config = _c.sent();
                    return [4 /*yield*/, $.env.get('HOME')];
                case 2:
                    home = (_a = (_c.sent())) !== null && _a !== void 0 ? _a : '';
                    return [4 /*yield*/, loadAliases($, config, home)];
                case 3:
                    aliases = _c.sent();
                    cache = "".concat(home, "/.cache/claude-session-names/scan.json");
                    return [4 /*yield*/, $.process.run(['python3', '-I', "".concat($.plugin.root, "/scripts/scan.py"), "".concat(config, "/projects"), cache], { timeoutMs: 120000 })];
                case 4:
                    run = _c.sent();
                    if (run.exitCode !== 0)
                        throw new Error((_b = run.stderr.trim().split('\n').at(-1)) !== null && _b !== void 0 ? _b : 'scan failed');
                    scanned = JSON.parse(run.stdout);
                    return [4 /*yield*/, generatedTags($)];
                case 5:
                    generated = _c.sent();
                    untagged = new Set();
                    return [4 /*yield*/, Promise.all(scanned.map(function (s) { return __awaiter(_this, void 0, void 0, function () {
                            var named, lastDoneAt, cwd, origin, tag;
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                            return __generator(this, function (_m) {
                                switch (_m.label) {
                                    case 0: return [4 /*yield*/, recall($, s.id)];
                                    case 1:
                                        named = _m.sent();
                                        lastDoneAt = named.lastDoneAt && named.lastDoneAt > s.lastDoneAt ? named.lastDoneAt : s.lastDoneAt;
                                        cwd = (_b = (_a = s.resumeDir) !== null && _a !== void 0 ? _a : s.cwd) !== null && _b !== void 0 ? _b : '';
                                        origin = (_c = s.origin) !== null && _c !== void 0 ? _c : cwd;
                                        tag = (_d = fixedTag(origin, home, aliases)) !== null && _d !== void 0 ? _d : generated[origin];
                                        if (!tag)
                                            untagged.add(origin);
                                        return [2 /*return*/, {
                                                id: s.id,
                                                cwd: cwd,
                                                origin: origin,
                                                tag: tag !== null && tag !== void 0 ? tag : folderTag(origin),
                                                // A /rename the person typed (custom title) wins over the plugin's own name.
                                                title: (_h = (_g = (_f = (_e = s.customTitle) !== null && _e !== void 0 ? _e : named.title) !== null && _f !== void 0 ? _f : s.aiTitle) !== null && _g !== void 0 ? _g : s.firstPrompt) !== null && _h !== void 0 ? _h : '(untitled)',
                                                summary: (_j = named.summary) !== null && _j !== void 0 ? _j : '',
                                                firstPrompt: (_k = s.firstPrompt) !== null && _k !== void 0 ? _k : '',
                                                lastPrompt: (_l = s.lastPrompt) !== null && _l !== void 0 ? _l : '',
                                                lastDoneAt: lastDoneAt,
                                            }];
                                }
                            });
                        }); }))];
                case 6:
                    list = _c.sent();
                    return [2 /*return*/, { list: list.sort(function (a, b) { return (a.lastDoneAt < b.lastDoneAt ? 1 : -1); }), untagged: __spreadArray([], untagged, true) }];
            }
        });
    });
}
var fold = function (text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
};
// Every word of the query has to occur somewhere in the row.
function matches(row, words) {
    var hay = fold([row.title, row.tag, row.summary, row.cwd, row.firstPrompt, row.lastPrompt, row.id].join(' '));
    return words.every(function (w) { return hay.includes(w); });
}
function when(iso) {
    var d = new Date(iso);
    var two = function (n) { return String(n).padStart(2, '0'); };
    return "".concat(d.getFullYear(), "-").concat(two(d.getMonth() + 1), "-").concat(two(d.getDate()), " ").concat(two(d.getHours()), ":").concat(two(d.getMinutes()));
}
function tagProjects($, untagged) {
    return __awaiter(this, void 0, void 0, function () {
        var used, _a, _b, made;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = [[]];
                    _b = Set.bind;
                    return [4 /*yield*/, (0, claude_code_1.read)($, rows)];
                case 1:
                    used = __spreadArray.apply(void 0, _a.concat([new (_b.apply(Set, [void 0, (_c.sent()).map(function (r) { return r.tag; })]))(), true]));
                    return [4 /*yield*/, generateTags($, untagged, used)];
                case 2:
                    made = _c.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, rows, function (list) {
                            return list.map(function (r) {
                                var tag = made[r.origin];
                                return tag ? __assign(__assign({}, r), { tag: tag }) : r;
                            });
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function openOverview($, initial) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, list_1, untagged_1, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, claude_code_1.update)($, query, function () { return initial; })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, status, function () { return 'Loading sessions…'; })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, $.ui.open({ id: PANE, title: 'Sessions', focus: true, closeOnEscape: true })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 8, , 10]);
                    return [4 /*yield*/, loadRows($)];
                case 5:
                    _a = _b.sent(), list_1 = _a.list, untagged_1 = _a.untagged;
                    return [4 /*yield*/, (0, claude_code_1.update)($, rows, function () { return list_1; })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, status, function () { return ''; })];
                case 7:
                    _b.sent();
                    if (untagged_1.length) {
                        // Off the command's dispatch: the list shows at once, the tags follow.
                        $.clock.after(0, function () {
                            void tagProjects($, untagged_1).catch(function (err) { return $.ui.log("session-names: tags: ".concat(String(err))); });
                        });
                    }
                    return [3 /*break*/, 10];
                case 8:
                    err_2 = _b.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, status, function () { return "Scan failed: ".concat(err_2.message); })];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
var register = function (on) {
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.command.register({
                        name: 'sessions',
                        description: 'Finished sessions by last completion, searchable',
                        argumentHint: '[search]',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, $.command.register({
                            name: 'autoname',
                            description: 'Name this session from the conversation (now | off | on)',
                            argumentHint: 'now | off | on',
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('turn.complete', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var done, id, _a, _b, _c;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    done = _e.sent();
                    if (!(e.agentId === undefined && e.reason === 'answer')) return [3 /*break*/, 5];
                    return [4 /*yield*/, $.session.id()];
                case 2:
                    id = _e.sent();
                    _a = remember;
                    _b = [$, id];
                    _d = {};
                    _c = Date.bind;
                    return [4 /*yield*/, $.clock.now()];
                case 3: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_d.lastDoneAt = new (_c.apply(Date, [void 0, _e.sent()]))().toISOString(), _d)]))
                    // Off the turn's dispatch: the model call must not hold the prompt.
                ];
                case 4:
                    _e.sent();
                    // Off the turn's dispatch: the model call must not hold the prompt.
                    $.clock.after(0, function () {
                        void nameSession($, false).catch(function (err) { return $.ui.log("session-names: ".concat(String(err))); });
                    });
                    _e.label = 5;
                case 5: return [2 /*return*/, done];
            }
        });
    }); });
    // A rename the person typed is theirs: stop renaming this session.
    on('command.run', { command: 'rename' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(e.origin.kind !== 'plugin')) return [3 /*break*/, 3];
                    _a = remember;
                    _b = [$];
                    return [4 /*yield*/, $.session.id()];
                case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([_c.sent(), { isLocked: true }]))];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3: return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('command.run', { command: 'autoname' }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var id, arg;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, $.session.id()];
                case 1:
                    id = _b.sent();
                    arg = e.args.trim();
                    if (!(arg === 'off')) return [3 /*break*/, 3];
                    return [4 /*yield*/, remember($, id, { isLocked: true })];
                case 2:
                    _b.sent();
                    return [2 /*return*/, { text: 'Auto-naming is off for this session.' }];
                case 3:
                    if (!(arg === 'on')) return [3 /*break*/, 5];
                    return [4 /*yield*/, remember($, id, { isLocked: false })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _a = {};
                    return [4 /*yield*/, nameSession($, true)];
                case 6: return [2 /*return*/, (_a.text = _b.sent(), _a)];
            }
        });
    }); });
    on('command.run', { command: 'sessions' }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openOverview($, e.args.trim())];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { text: 'Sessions pane opened.' }];
            }
        });
    }); });
    on('ui.render', { component: 'Pane', requestId: PANE }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var table, Box, Text, Button, list, q, note, words, found, room, width, tagWidth, resume;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    table = $.ui.resolve(e);
                    Box = table.Box, Text = table.Text, Button = table.Button;
                    return [4 /*yield*/, (0, claude_code_1.read)($, rows)];
                case 1:
                    list = _c.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, query)];
                case 2:
                    q = _c.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, status)];
                case 3:
                    note = _c.sent();
                    words = fold(q).split(/\s+/).filter(Boolean);
                    found = words.length ? list.filter(function (r) { return matches(r, words); }) : list;
                    room = Math.max(3, ((_b = (_a = e.viewport) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : 30) - 6);
                    width = e.props.bodyColumns;
                    tagWidth = Math.max.apply(Math, __spreadArray([1], found.slice(0, room).map(function (r) { return r.tag.length; }), false));
                    resume = function (row) { return __awaiter(void 0, void 0, void 0, function () {
                        var cmd, copied;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    cmd = "cd '".concat(row.cwd, "' && claude --resume ").concat(row.id);
                                    return [4 /*yield*/, $.ui.copy({ text: cmd, surface: e.surface })];
                                case 1:
                                    copied = _a.sent();
                                    $.ui.toast(copied.isCopied ? "Copied: ".concat(cmd) : cmd);
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [2 /*return*/, (<Box flexDirection="column">
        {'Input' in table ? (<table.Input key="q" label="Search" placeholder="words from title, summary, prompt or path" value={q} autoFocus onInput={function (value) { return void (0, claude_code_1.update)($, query, function () { return value; }); }} onSubmit={function (value) { return void (0, claude_code_1.update)($, query, function () { return value; }); }}/>) : (q && <Text>Search: {q}</Text>)}
        <Text dimColor>
          {note || "".concat(found.length, " of ").concat(list.length, " sessions \u00B7 Enter copies the resume command \u00B7 Esc closes")}
        </Text>
        {found.slice(0, room).map(function (row) { return (<Button key={row.id} plain onPress={function () { return void resume(row); }}>
            <Text dimColor>{when(row.lastDoneAt)} </Text>
            <Text color={tagColor(row.tag)}>{"[".concat(row.tag, "]").padEnd(tagWidth + 3)}</Text>
            {clip(row.title, Math.max(20, width - tagWidth - 21))}
          </Button>); })}
        {found.length > room && <Text dimColor>… {found.length - room} more, narrow the search</Text>}
      </Box>)];
            }
        });
    }); });
};
exports.register = register;
