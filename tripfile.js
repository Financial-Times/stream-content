import _ from 'lodash';
import autoprefixer from 'autoprefixer';
import chalk from 'chalk';
import cssnano from 'cssnano';
import execa from 'execa';
import path from 'path';
import { directory, chain, plugin } from 'exhibit';

const src = directory('src');
const dist = directory('dist');

const PORT = process.env.PORT || 5000;

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

	plugin('postcss', cssnano({ safe: true }), { match: 'client/**/*.css', map: false }),
);

export async function build() {
	await src.read()
		.then(preprocess)
		.then(optimise)
		.then(dist.write);
}

export async function develop({ prod }) {
	await src.watch(chain(
		preprocess,

		prod ? optimise : null,

		dist.write,

		// [re]start development server
		(() => {
			let serverProcess;
			let started;
			const serverScript = path.join('dist', 'server', 'server.js');

			const restart = _.debounce(() => {
				if (serverProcess) serverProcess.kill();

				console.log('\nnode', serverScript);
				serverProcess = execa.spawn('node', [serverScript], { stdio: 'inherit' });

				if (!started) {
					started = true;

					setTimeout(() => {
						console.log(
							'\nIf you like, run BrowserSync in another terminal:',
							chalk.grey('\n  >'),
							chalk.cyan(
								`browser-sync start --proxy="localhost:${PORT}" --files="./dist/**" --open=1`
							)
						);
					}, 2000);
				}
			}, 500);

			return files => {
				restart();
				return files;
			};
		})(),
	));
}
