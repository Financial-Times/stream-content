import _ from 'lodash';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import execa from 'execa';
import path from 'path';
import { directory, chain, plugin } from 'exhibit';

const src = directory('src');

const preprocess = chain(
	plugin('sass', {
		root: 'src',
		loadPaths: ['bower_components'],
	}),

	plugin('postcss', autoprefixer(['last 2 versions', 'ie 9'])),

	plugin('babel', { root: 'src' }),

	plugin('browserify', {
		root: 'src',
		match: 'client/**/*.js',
		transforms: ['debowerify'],
	})
);

const optimise = chain(
	// plugin('uglify')

	plugin('postcss', cssnano(), { match: 'client/**/*.css', map: false }),
);

export async function build() {
	const dist = directory('dist');

	await src.read()
		.then(preprocess)
		.then(optimise)
		.then(dist.write);
}

export async function develop({ prod }) {
	const outputDir = prod ? 'dist' : 'stage';

	await src.watch(chain(
		preprocess,

		prod ? optimise : null,

		directory(outputDir).write,

		// [re]start development server
		(() => {
			let serverProcess;
			const serverScript = path.join(outputDir, 'server', 'server.js');

			const restart = _.debounce(() => {
				if (serverProcess) serverProcess.kill();

				console.log('\nnode', serverScript);
				serverProcess = execa.spawn('node', [serverScript], { stdio: 'inherit' });
			}, 500);

			return files => {
				restart();
				return files;
			};
		})(),
	));
}
