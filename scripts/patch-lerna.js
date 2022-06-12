const { writeFileSync } = require('fs');

// Workaround for https://github.com/ghiscoding/lerna-lite/issues/220

writeFileSync(
	'node_modules/.pnpm/@lerna-lite+version@1.5.1/node_modules/@lerna-lite/core/dist/utils/collect-updates/lib/has-tags.js',
	`
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTags = void 0;
const npmlog_1 = __importDefault(require("npmlog"));
const child_process_1 = require("../../../child-process");
/**
 * Determine if any git tags are reachable.
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function hasTags(opts) {
    npmlog_1.default.silly('hasTags', '');
    let result = false;
    try {
        result = !!(0, child_process_1.execSync)('git', ['tag', "--list", "*@*"], opts);
    }
    catch (err) {
        npmlog_1.default.warn('ENOTAGS', 'No git tags were reachable from this branch!');
        npmlog_1.default.verbose('hasTags error', err);
    }
    npmlog_1.default.verbose('hasTags', result.toString());
    return result;
}
exports.hasTags = hasTags;
//# sourceMappingURL=has-tags.js.map
`
);

writeFileSync(
	'node_modules/.pnpm/@lerna-lite+version@1.5.1/node_modules/@lerna-lite/core/dist/utils/collect-updates/collect-updates.js',
	`
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectUpdates = void 0;
const npmlog_1 = __importDefault(require("npmlog"));
const describe_ref_1 = require("../describe-ref");
const collect_packages_1 = require("./lib/collect-packages");
const get_packages_for_option_1 = require("./lib/get-packages-for-option");
const has_tags_1 = require("./lib/has-tags");
const make_diff_predicate_1 = require("./lib/make-diff-predicate");
/**
 * Create a list of graph nodes representing packages changed since the previous release, tagged or otherwise.
 * @param {import("@lerna/package").Package[]} filteredPackages
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {UpdateCollectorOptions} commandOptions
 */
function collectUpdates(filteredPackages, packageGraph, execOpts, commandOptions, gitDryRun = false) {
    const { forcePublish, conventionalCommits, conventionalGraduate, excludeDependents } = commandOptions;
    // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish
    const useConventionalGraduate = conventionalCommits && conventionalGraduate;
    const forced = (0, get_packages_for_option_1.getPackagesForOption)(useConventionalGraduate ? conventionalGraduate : forcePublish);
    const packages = filteredPackages.length === packageGraph.size
        ? packageGraph
        : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));
    let committish = commandOptions.since;
    if ((0, has_tags_1.hasTags)(execOpts)) {
        // describe the last annotated tag in the current branch
        const { sha, refCount, lastTagName } = (0, describe_ref_1.describeRefSync)({...execOpts, match: '*@*'}, commandOptions.includeMergedTags, gitDryRun);
        // TODO: warn about dirty tree?
        if (refCount === '0' && forced.size === 0 && !committish) {
            // no commits since previous release
            npmlog_1.default.notice('', 'Current HEAD is already released, skipping change detection.');
            return [];
        }
        if (commandOptions.canary) {
            // if it's a merge commit, it will return all the commits that were part of the merge
            // ex: If \`ab7533e\` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
            committish = \`\${sha}^..\${sha}\`;
        }
        else if (!committish) {
            // if no tags found, this will be undefined and we'll use the initial commit
            committish = lastTagName;
        }
    }
    if (forced.size) {
        // "warn" might seem a bit loud, but it is appropriate for logging anything _forced_
        npmlog_1.default.warn(useConventionalGraduate ? 'conventional-graduate' : 'force-publish', forced.has('*') ? 'all packages' : Array.from(forced.values()).join('\\n'));
    }
    if (useConventionalGraduate) {
        // --conventional-commits --conventional-graduate
        if (forced.has('*')) {
            npmlog_1.default.info('', 'Graduating all prereleased packages');
        }
        else {
            npmlog_1.default.info('', 'Graduating prereleased packages');
        }
    }
    else if (!committish || forced.has('*')) {
        // --force-publish or no tag
        npmlog_1.default.info('', 'Assuming all packages changed');
        return (0, collect_packages_1.collectPackages)(packages, {
            onInclude: (name) => npmlog_1.default.verbose('updated', name),
            excludeDependents,
        });
    }
    npmlog_1.default.info('', \`Looking for changed packages since \${committish}\`);
    const hasDiff = (0, make_diff_predicate_1.makeDiffPredicate)(committish, execOpts, commandOptions.ignoreChanges);
    const needsBump = !commandOptions.bump || commandOptions.bump.startsWith('pre')
        ? () => false
        : /* skip packages that have not been previously prereleased */
            (node) => node.prereleaseId;
    const isForced = (node, name) => (forced.has('*') || forced.has(name)) && (useConventionalGraduate ? node.prereleaseId : true);
    return (0, collect_packages_1.collectPackages)(packages, {
        isCandidate: (node, name) => isForced(node, name) || needsBump(node) || hasDiff(node),
        onInclude: (name) => npmlog_1.default.verbose('updated', name),
        excludeDependents,
    });
}
exports.collectUpdates = collectUpdates;
//# sourceMappingURL=collect-updates.js.map
`
);
