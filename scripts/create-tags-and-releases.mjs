#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && options.check !== false) {
    throw new Error(
      `Command failed (${result.status}): ${command} ${args.join(" ")}`
    );
  }

  return result;
}

function usage() {
  console.log(`Usage: create-tags-and-releases.mjs [options]

Create git tags and GitHub releases for packages listed in
pnpm-publish-summary.json (written by \`pnpm publish -r --report-summary\`).
Requires GITHUB_REPOSITORY (owner/repo) and an authenticated gh CLI.

Options:
  -n, --dry-run   Print the tags/releases that would be created
  -h, --help      Show this help`);
}

function parseArgs(argv) {
  const args = { dryRun: false, help: false };
  for (const arg of argv) {
    if (arg === "-n" || arg === "--dry-run") args.dryRun = true;
    else if (arg === "-h" || arg === "--help") args.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return args;
}

function buildPackageMap(repoRoot) {
  const result = run("pnpm", ["ls", "-r", "--depth", "-1", "--json"], {
    capture: true,
    cwd: repoRoot,
  });
  const packageMap = new Map();

  for (const pkg of JSON.parse(result.stdout)) {
    if (!pkg.name || pkg.private || pkg.path === repoRoot) {
      continue;
    }

    packageMap.set(pkg.name, {
      name: pkg.name,
      version: pkg.version,
      dir: path.relative(repoRoot, pkg.path),
      changelogPath: path.join(pkg.path, "CHANGELOG.md"),
    });
  }

  return packageMap;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractChangelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const versionPattern = new RegExp(
    `^##\\s+\\[?${escapeRegExp(version)}\\]?\\b`,
    "i"
  );

  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (versionPattern.test(lines[i])) {
      start = i;
      break;
    }
  }

  if (start === -1) {
    return "";
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

function remoteTagExists(tag) {
  const result = run(
    "git",
    ["ls-remote", "--tags", "origin", `refs/tags/${tag}`],
    { capture: true, check: false }
  );
  return (result.stdout || "").trim().length > 0;
}

function localTagExists(tag) {
  const result = run("git", ["tag", "-l", tag], { capture: true, check: false });
  return (result.stdout || "").trim() === tag;
}

function githubReleaseExists(repo, tag) {
  const result = run(
    "gh",
    ["release", "view", tag, "--repo", repo],
    { capture: true, check: false }
  );
  return result.status === 0;
}

function buildNotes({ repoUrl, refForLinks, pkg, version, changelogSection }) {
  const notes = [];
  notes.push(`# ${pkg.name}@${version}`);
  notes.push("");
  notes.push(`- Package: \`${pkg.name}\``);
  notes.push(`- Version: \`${version}\``);
  notes.push(`- npm: https://www.npmjs.com/package/${pkg.name}/v/${version}`);
  notes.push(`- Changelog: ${repoUrl}/blob/${refForLinks}/${pkg.dir}/CHANGELOG.md`);
  notes.push("");

  if (changelogSection) {
    notes.push("## Changelog");
    notes.push("");
    notes.push(changelogSection);
  } else {
    notes.push("## Changelog");
    notes.push("");
    notes.push("No matching changelog section found for this version.");
  }

  return notes.join("\n");
}

async function main() {
  const repoRoot = process.cwd();
  const summaryPath = path.join(repoRoot, "pnpm-publish-summary.json");
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const dryRun = args.dryRun;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!repo) {
    throw new Error("GITHUB_REPOSITORY is required (owner/repo).");
  }

  if (!existsSync(summaryPath)) {
    console.log("No pnpm-publish-summary.json found. Skipping tags/releases.");
    return;
  }

  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const publishedPackages = Array.isArray(summary.publishedPackages)
    ? summary.publishedPackages
    : [];

  if (publishedPackages.length === 0) {
    console.log("No packages were published. Skipping tags/releases.");
    return;
  }

  const packageMap = buildPackageMap(repoRoot);
  const repoUrl = `https://github.com/${repo}`;
  const refForLinks = process.env.GITHUB_SHA || "main";

  for (const published of publishedPackages) {
    const name = published.name;
    const version = published.version;
    if (!name || !version) {
      continue;
    }

    const pkg = packageMap.get(name);
    if (!pkg) {
      console.log(`Skipping ${name}@${version}: not found in workspace map.`);
      continue;
    }

    const tag = `${name}@${version}`;
    console.log(`Processing ${tag}`);

    const tagExistsRemote = remoteTagExists(tag);
    if (!tagExistsRemote) {
      if (!localTagExists(tag)) {
        if (!dryRun) {
          // Lightweight tags avoid requiring git user identity on CI runners.
          run("git", ["tag", tag, process.env.GITHUB_SHA || "HEAD"]);
        }
      }

      if (!dryRun) {
        run("git", ["push", "origin", `refs/tags/${tag}`]);
      } else {
        console.log(`[dry-run] Would push tag ${tag}`);
      }
    } else {
      console.log(`Tag already exists: ${tag}`);
    }

    if (githubReleaseExists(repo, tag)) {
      console.log(`GitHub release already exists: ${tag}`);
      continue;
    }

    let changelogSection = "";
    if (existsSync(pkg.changelogPath)) {
      const changelog = readFileSync(pkg.changelogPath, "utf8");
      changelogSection = extractChangelogSection(changelog, version);
    }

    const notes = buildNotes({
      repoUrl,
      refForLinks,
      pkg,
      version,
      changelogSection,
    });
    const notesFile = path.join(
      os.tmpdir(),
      `release-notes-${Buffer.from(tag).toString("hex")}.md`
    );
    writeFileSync(notesFile, notes, "utf8");

    try {
      if (!dryRun) {
        run("gh", [
          "release",
          "create",
          tag,
          "--repo",
          repo,
          "--verify-tag",
          "--title",
          tag,
          "--notes-file",
          notesFile,
        ]);
      } else {
        console.log(`[dry-run] Would create GitHub release ${tag}`);
      }
    } finally {
      if (existsSync(notesFile)) {
        unlinkSync(notesFile);
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
