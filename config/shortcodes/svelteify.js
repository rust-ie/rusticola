const esbuild = require("esbuild");
const glob = require('glob-all'); // to enable * glob pattern in esbuild
const isProd = process.env.ELEVENTY_ENV === 'prod' ? true : false
const { sveltePlugin } = require('esbuild-svelte');
const fsPromises = require('fs').promises;
const { http, default_schemes } = require('@hyrious/esbuild-plugin-http');

module.exports = async (code, filename, bundled) => {
  let bundleSvelte = bundled !== 'bundleOff' ? true : false;
  await fsPromises.writeFile('./_tmp/sv-' + filename + '.svelte', code),
  
  // esm version
  await esbuild.build({
    entryPoints: glob.sync(['_tmp/sv-*.svelte']),
    entryNames: '[name]',
    outdir: './docs/assets/app',
    bundle: bundleSvelte,
    watch: !isProd,
    format: 'esm',
    plugins: [
      http({
        filter: (url) => true,
        schemes: { default_schemes },
        cache: new Map()
      }),
      sveltePlugin()
    ],
    minify: isProd,
    target: isProd ? 'es6' : 'esnext'
  }).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  const svelteJs = await fsPromises.readFile('./docs/assets/app/sv-' + filename + '.js', 'utf8');
  return `<script type="module">${svelteJs}</script>`;
};
