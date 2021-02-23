import babel from '@rollup/plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import del from 'rollup-plugin-delete';
import extensions from 'rollup-plugin-extensions';
import pkg from './package.json';

export default {
	input: pkg.source,
	output: [
		{ file: pkg.main, format: 'cjs', sourcemap: true },
		{ file: pkg.module, format: 'esm', sourcemap: true },
	],
	plugins: [
		external(),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
		}),
		del({ targets: ['dist/*'] }),
		extensions({
			extensions: ['.jsx', '.js'],
			resolveIndex: true,
		}),
	],
	external: [
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {}),
	],
};
