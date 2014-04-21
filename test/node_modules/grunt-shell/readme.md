# grunt-shell [![Build Status](https://secure.travis-ci.org/sindresorhus/grunt-shell.png?branch=master)](http://travis-ci.org/sindresorhus/grunt-shell) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

> Run shell commands

A good way to interact with other CLI tools. E.g. compiling Compass `compass compile` or get the current git branch `git branch`.


## Getting Started

If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide, as it explains how to create a [gruntfile][Getting Started] as well as install and use grunt plugins. Once you're familiar with that process, install this plugin with this command:

```shell
npm install --save-dev grunt-shell
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-shell');
```

*Tip: the [load-grunt-tasks](https://github.com/sindresorhus/load-grunt-tasks) module makes it easier to load multiple grunt tasks.*

[grunt]: http://gruntjs.com
[Getting Started]: https://github.com/gruntjs/grunt/wiki/Getting-started


## Documentation


### Example config

```js
grunt.initConfig({
	shell: {								// Task
		listFolders: {						// Target
			options: {						// Options
				stdout: true
			},
			command: 'ls'
		}
	}
});

grunt.loadNpmTasks('grunt-shell');
grunt.registerTask('default', ['shell']);
```


### Example usage


#### Run command

Create a folder named `test`.

```js
grunt.initConfig({
	shell: {
		makeDir: {
			command: 'mkdir test'
		}
	}
});
```

The `command` property supports templates:

```js
grunt.initConfig({
	testDir: 'test',
	shell: {
		makeDir: {
			command: 'mkdir <%= testDir %>'
		}
	}
});
```

You can also supply a function that returns the command:

```js
grunt.initConfig({
	shell: {
		hello: {
			command: function () {
				return 'echo hello';
			}
		}
	}
});
```
Which can also take arguments:

```js
shell: {
	hello: {
		command: function (greeting) {
			return 'echo ' + greeting;
		}
	}
}

grunt.loadNpmTasks('grunt-shell');
grunt.registerTask('default', ['shell:hello']);
```


#### Run command and display the output

Output a directory listing in your Terminal.

```js
grunt.initConfig({
	shell: {
		dirListing: {
			command: 'ls',
			options: {
				stdout: true
			}
		}
	}
});
```


#### Custom callback

Do whatever you want with the output.

```js
function log(err, stdout, stderr, cb) {
	console.log(stdout);
	cb();
}

grunt.initConfig({
	shell: {
		dirListing: {
			command: 'ls',
			options: {
				callback: log
			}
		}
	}
});
```


#### Option passed to the .exec() method

Run a command in another directory. In this example we run it in a subfolder using the `cwd` (current working directory) option.

```js
grunt.initConfig({
	shell: {
		subfolderLs: {
			command: 'ls',
			options: {
				stdout: true,
				execOptions: {
					cwd: 'tasks'
				}
			}
		}
	}
});
```


#### Multiple commands

Run multiple commands by placing them in an array which is joined using `&&` or `;`. `&&` means run this only if the previous command succeeded. You can also use `&` to have the commands run concurrently (by executing all commands except the last one in a subshell).

```js
grunt.initConfig({
	shell: {
		multiple: {
			command: [
				'mkdir test',
				'cd test',
				'ls'
			].join('&&')
		}
	}
});
```


### Config


#### command

**Required**  
Type: `String|Function`

The command you want to run or a function which returns it. Supports underscore templates.


### Options


#### stdout

Default: `false`  
Type: `Boolean`

Show stdout in the Terminal.


#### stderr

Default: `false`  
Type: `Boolean`

Show stderr in the Terminal.


#### stdin

Default: `true`  
Type: `Boolean`

Forward the terminal's stdin to the command.


#### failOnError

Default: `false`  
Type: `Boolean`

Fail task if it encounters an error. Does not apply if you specify a `callback`.


#### callback(err, stdout, stderr, cb)

Default: `function () {}`  
Type: `Function`

Lets you override the default callback with your own.

**Make sure to call the `cb` method when you're done.**


#### execOptions

Default: `undefined`  
Accepts: Object

Specify some options to be passed to the [.exec()](http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback) method:

- `cwd` String *Current working directory of the child process*
- `env` Object *Environment key-value pairs*
- `setsid` Boolean
- `encoding` String *(Default: 'utf8')*
- `timeout` Number *(Default: 0)*
- `maxBuffer` Number *(Default: 200\*1024)*
- `killSignal` String *(Default: 'SIGTERM')*


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
