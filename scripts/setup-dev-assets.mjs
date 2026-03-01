#!/usr/bin/env node
/**
 * Creates public/series/<slug>/assets -> content/series/<slug>/assets symlinks
 * for local development. CI populates public/ with real files; this script
 * makes them available in `npm run dev` by symlinking through the content symlinks.
 *
 * Only creates a symlink when content/series/<slug>/assets resolves to a real
 * directory (existsSync follows symlinks). Safe to run on CI — the CI assets
 * step uses rm -rf + cp -r so any pre-existing symlinks are replaced.
 */

import { readdirSync, existsSync, mkdirSync, symlinkSync, lstatSync } from 'fs';
import { join } from 'path';

const seriesDir = join(process.cwd(), 'content/series');
const publicSeriesDir = join(process.cwd(), 'public/series');

if (!existsSync(seriesDir)) {
  process.exit(0);
}

for (const slug of readdirSync(seriesDir)) {
  const assetsTarget = join(seriesDir, slug, 'assets');
  // existsSync follows symlinks — true only if the assets dir is reachable
  if (!existsSync(assetsTarget)) continue;

  const publicSlugDir = join(publicSeriesDir, slug);
  const assetsLink = join(publicSlugDir, 'assets');

  // Skip if the link (or a real directory) already exists
  if (existsSync(assetsLink) || lstatSync(assetsLink, { throwIfNoEntry: false })) continue;

  mkdirSync(publicSlugDir, { recursive: true });
  // Relative symlink: public/series/<slug>/assets -> ../../../content/series/<slug>/assets
  symlinkSync(join('..', '..', '..', 'content', 'series', slug, 'assets'), assetsLink);
  console.log(`Linked: public/series/${slug}/assets -> content/series/${slug}/assets`);
}
