// Generated on 2015-03-23 using
// generator-webapp 0.5.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// If you want to recursively match all subfolders, use:
// 'test/spec/**/*.js'

// mouse the actual folder

module.exports = function(grunt) {

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Configurable paths
    var config = {
            
        src : './src/main/webapp',
        dist : './src/dist/dist',
        test : './src/test',
        wartarget : './target'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        config : config,

        // Empties folders to start fresh. The 'post' task runs at the end to remove the unnecessary js files
        clean : {
            dist : {
                files : [ {
                    dot : true,
                    src : [ '.tmp', '<%= config.dist %>/*', '!<%= config.dist %>/.git*' ]
                } ]
            },
            post: {
                files: [ {
                    // this will remove most of the JavaScript source files from the distribution folder - dialcodes.js and links.js remain
                    src: ['<%= config.dist %>/js/*', '<%= config.dist %>/style.css' ,'!<%= config.dist %>/js/avayaChat.js', '!<%= config.dist %>/js/avayaChat.min.js',
                          '!<%= config.dist %>/js/links.js', '!<%= config.dist %>/js/dialcodes.js', '!<%= config.dist %>/js/callbacks.js', '!<%= config.dist %>/*.css', '!<%= config.dist %>/*.min.css']
                } ]
            },
            server : '.tmp'
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint : {
            options : {
                jshintrc : '.jshintrc',         // source of the rule configuration for JSHint
                force: true,                    // if it finds an error, keep building anyway - otherwise it will fail on minor warnings
                reporterOutput: '<%= config.dist %>/reports/jshint_results.xml',
                reporter : 'checkstyle'         // this uses an XML format for the results
            },
            all : [
            // only checks the concatenated file
            '<%= config.dist %>/js/avayaChat.js']
        },

        // Mocha testing framework configuration options
        mocha : {
            all : {
                options : {
                    run : true,                 // injects a script into the PhantomJS instance that loads the spec files. That sets up a reporter and listeners so output can be written to the command line.
                    log : false,                // print any console.log calls to the command line. For quick and dirty debugging only - using a browser is recommended.
                    timeout: 35000,             // the maximum time allowed for the unit tests. If nothing happens within this time, exit.
                    reporter: 'XUnit'
                    },
                    src : [ '<%= config.test %>/index.html', ],
                    dest : './target/surefire/test.xml'
                
            }
        },

        // Add vendor prefixed styles
        autoprefixer : {
            options : {
                browsers : [ '> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1' ]
            },
            dist : {
                files : [ {
                    expand : true,
                    cwd : '.tmp/styles/',
                    src : '{,*/}*.css',
                    dest : '.tmp/styles/'
                } ]
            }
        },

        // Renames files for browser caching purposes

        // Reads HTML for usemin blocks to enable smart builds that
        // automatically
        // concat, minify and revision files. Creates configurations in memory
        // so additional tasks can operate on them
        useminPrepare : {
            options : {
                dest : '<%= config.dist %>'
            },
            html : {
                '<%= config.src %>/home.html' : '<%= config.dist %>/home.html',
                '<%= config.src %>/carinsurance.html' : '<%= config.dist %>/carinsurance.html',
                '<%= config.src %>/houseinsurance.html' : '<%= config.dist %>/houseinsurance.html',
                '<%= config.src %>/WebChat.html' : '<%= config.dist %>/WebChat.html',
                '<%= config.src %>/webChatLogon.html' : '<%= config.dist %>/webChatLogon.html',
            },
            js : {
                src : [ '<%= config.src %>/js/*.js' ],
                dest : '<%=config.dist %>/js/avayaChat.js'
            },
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin : {
            options : {
                assetsDirs : [ '<%= config.dist %>', '<%= config.dist %>/images', '<%= config.dist %>/js' ]
            },
            html : [ '<%= config.dist %>/*.html' ],
            css : [ '<%= config.dist %>/*.css' ]
        },


        // htmlmin will minify HTML files.
        htmlmin : {
            dist : {
                options : {
                    collapseBooleanAttributes : true,
                    collapseWhitespace : true,
                    conservativeCollapse : true,
                    removeAttributeQuotes : false,
                    removeCommentsFromCDATA : true,
                    removeComments: true,
                    removeEmptyAttributes : true,
                    removeOptionalTags : true,
                    removeRedundantAttributes : true,
                    useShortDoctype : true
                },
                files : {
                    // goes in the format 'destination': 'source
                    '<%= config.dist %>/home.min.html' : '<%= config.dist %>/home.html',
                    '<%= config.dist %>/webChatLogon.min.html' : '<%= config.dist %>/webChatLogon.html',
                    '<%= config.dist %>/WebChat.min.html' : '<%= config.dist %>/WebChat.html',
                }
            }
        },

        // By default, your `index.html`'s <!-- Usemin block --> will take care
        // of minification. These next options are pre-configured if you do not
        // wish to use the Usemin blocks.
        cssmin : {
            dist : {
                options: {
                    reporter: 'min'
                },
                files : {
                    '<%= config.dist %>/style.min.css' : '<%= config.src %>/style.css'
                }
            }
        },
        
        // concatenate all of the JavaScript files (barring links.js and dialcodes.js) into one file
        concat : {
            dist : {
                src : [ '<%= config.src %>/js/global.js', '<%= config.src %>/js/webChatConfig.js', 
                        '<%= config.src %>/js/webChat.js', '<%= config.src %>/js/webChatSocket.js',
                        '<%= config.src %>/js/checkQueue.js', '<%= config.src %>/js/webChatLogon.js', '<%= config.src %>/js/callback.js' ],
                dest : '<%= config.dist %>/js/avayaChat.js'
            }
        },
        
        // minify the concatenated file
        uglify : {
            options : {
                preserveComments : 'some',      // preserve any comments that are marked as @licence, and so on
                quoteStyle : 1,                 // enforce single quotes
                screw_ie8 : true,               // because I don't care about compliance with quirks that were in IE 6-8
                compress: {
                    dead_code: true,            // remove dead or unreachable code
                    sequences: true,            // join consecutive statements with the "comma operator"
                    loops: true,                // optimised loops
                    unused: true,               // remove unused variables
                    if_return: true,            // collapse if/return statements
                    join_vars: true,            // join var declarations
                    drop_console: true,         // drop the use of the console
                    pure_funcs : [ 'logToConsole' ]     // drop any calls to logToConsole - it's not needed in production
                },
                report : 'min'
            },
            dist : {
                files : [ {
                    flatten : true,
                    src : '<%= config.dist %>/js/avayaChat.js',
                    dest : '<%= config.dist %>/js/avayaChat.min.js'
                } ]
            }
        },
        
        // Was used to generate a WAR file from the result files. Redundant and no longer used.
        war : {
            target: {
                options: {
                  war_dist_folder: '<%= config.wartarget %>',    /* Folder where to generate the WAR. */
                  war_name: 'CustomerFrontend_deploy'           /* The name fo the WAR file (.war will be the extension) */
                },
                files: [
                  {
                    expand: true,
                    cwd: '<%= config.dist %>',
                    src: ['**', '!reports/*', '!.sonar', '!img'],
                    dest: ''
                  }
                ]
              }
        },

        // Copies remaining files to places other tasks can use
        copy : {
            dist : {
                files : [ {
                    expand : true,
                    dot : true,
                    cwd : '<%= config.src %>',
                    dest : '<%= config.dist %>',
                    src : [ '**/*', '!img/*', '!js/*' ]
                }]
            },
            styles : {
                expand : true,
                dot : true,
                cwd : '<%= config.src %>',
                dest : '<%= config.dist %>',
                src : '*.css'
            },
            js : {
                expand : true,
                dot : true,
                cwd : '<%= config.src %>/js',
                dest : '<%= config.dist %>/js',
                src : '*.js'
            }
        },

        // Run some tasks in parallel to speed up build process
        concurrent : {
            server : [ 'copy:styles' ],
            test : [ 'copy:styles' ],
            dist : [ 'copy:styles', 'copy:js', 'copy:dist' ]
        }
    });

    // load the task for grunt-contrib-concat
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('test', function(target) {
        if (target !== 'watch') {
            grunt.task.run('mocha');
        }

    });
    
    // this is a customised task for verification. It concatenates the JS files before linting the concatenated file.
    grunt.registerTask('verify', ['concat', 'jshint']);

    grunt.registerTask('build', [ 'clean:dist', 'concurrent:dist', 'cssmin',
            'verify', 'useminPrepare', 'usemin', 'htmlmin',  'uglify', 'clean:post', ]);

    grunt.registerTask('default', ['test', 'build', ]);
};
