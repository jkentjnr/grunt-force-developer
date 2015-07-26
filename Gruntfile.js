/*
 * grunt-force-developer
 * https://github.com/jkentjnr/grunt-force-developer
 *
 * Copyright (c) 2015 James Kent
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var credentials = {
    consumerKey: '3MVG98SW_UPr.JFjzEoUdZZczc4pPByJsJh_3hvL_dxAMPsA8DpjdYBXepSg3GztwV.PPEG2Q6YaK1l.WQtdG',
    consumerSecret: '5053699717749088016',
    username: 'james.kent@consultingdemo.vertic.com.au',
    password: 'p@ssw0rd1',
    token: 'O7uccvnguEXqLnOBiTLCzwWQ'
  };

  // Project configuration.
  grunt.initConfig({

    // Configuration to be run (and then tested).
    force: {
      createPackage: {
        options: {
          action: 'package'
        },
      },
      deployPackage: {
        options: {
          action: 'deploy',
          consumerKey: credentials.consumerKey,
          consumerSecret: credentials.consumerSecret,
          username: credentials.username,
          password: credentials.password,
          token: credentials.token
        },
      }
    },

    compress: {
      packageZip: {
        options: {
          archive: './package/package.zip'
        },
        files: [
          {cwd: 'package/src/', expand: true, src: ['**']} // includes files in path and its subdirs
        ]
      }
    },

    antdeploy: {
      options: {
        root: './package/src/', // note trailing slash is important
        apiVersion: '32.0',
        existingPackage: true
      },
      deployPackage: {
        options: {
          user: credentials.username,
          pass: credentials.password,
          token: credentials.token
        }
      }
    }

    // Unit tests.
    //nodeunit: {
    //  tests: ['test/*_test.js']
    //}
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-ant-sfdc');
  grunt.loadNpmTasks('grunt-contrib-compress');
  //grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('default', ['force:createPackage', 'compress:packageZip', 'antdeploy:deployPackage']);
  grunt.registerTask('default-nforce', ['force:createPackage', 'compress:packageZip', 'force:deployPackage']);

  //grunt.registerTask('debug', ['compress:packageZip', 'force:deployPackage']);
  //grunt.registerTask('deploy', ['force:deployPackage']);

};
