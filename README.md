# grunt-force-developer

> A grunt task for salesforce and force.com development.  Designed to help force.com developers to work using the benefits of grunt and a folder structure when developing. 

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-force-developer --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-force-developer');
```

### Overview

Using grunt and the `grunt-force-developer` tasks, developers for salesforce & force.com can:

* Manage their projects / packages in any folder structure they like.
* Integrate the full suite of grunt tasks into their deployment process.
* Ensure only new & modified code is published as part of each deployment / build.  This enables a developer to code using any IDE, pushing changes via grunt. 

To use `grunt-force-developer` as quickly as possible, we recommend starting with the `Gruntfile.js` in examples.

### Folder Structures

#### Traditional Folder Structure
Traditionally, when a developer is developing for salesforce / force.com, they are constrained by the mandated package structure.  This structure is extremely limiting and, as the size of projects / packages grow, raplidly becomes unwieldy.

```
package.xml
== classes
    -- PaymentController.cls
    -- PaymentController.cls-meta.xml
    -- UserManagement.cls
    -- UserManagement.cls-meta.xml
== pages
    -- Payment.page
    -- Payment.page-meta.xml
    -- UserManagement.page
    -- UserManagement.page-meta.xml
== objects
    -- Payment__c.object
```

#### grunt-force-developer Folder Structure
Using `grunt-force-developer`, a developer can adopt a fully dynamic file structure that operates independent of the prescribed salesforce package structure.  The below example is a snippet from a developer managing their package in structure with little constraints, appropriate for their project.

```
== .metadata
    -- Payment.page-meta.xml
    -- PaymentController.cls-meta.xml
    -- UserManagement.page-meta.xml
    -- UserManagementController.cls-meta.xml
== Admin
   == Users
      -- UserManagementController.cls
      -- UserManagement.page
== Payments
    -- PaymentController.cls
    -- Payment.page
    -- Payment__c.object
```

### Usage

In your project's Gruntfile, add a section named `force` to the data object passed into `grunt.initConfig()`.

```js
var credentials = {
  consumerKey: '3MVG98SW_UPr.JFjzEoUdZZczc4pPByJsJh_3hvL_dxAMPsA8DpjdYBXepSg3GztwV.PPEG2Q6YaK1l.11111',
  consumerSecret: '1233452345246423523',
  username: 'james.kent@gruntdemo.vertic.com.au',
  password: 'qwerty123',
  token: 'O7uccvnguEXqLnOBiTLC1234'
};

// Project configuration.
grunt.initConfig({
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
  }
});
```

### Options

#### options.action
Type: `String`
Default value: `'deploy'`

This option drives the behaviour of the plugin. There are 3 available modes:
* reset = Deletes the 'package' directory and clears any files hashes.  Ensures the next 'package' action will package all project files.
* package = Copies all supported new & modified project files into the standard salesforce package structure.
* deploy = Deploys the code to salesforce using nforce (Currently not working -- [grunt-ant-sfdc](https://github.com/kevinohara80/grunt-ant-sfdc] as an alternative).

#### options.environment
Type: `String`
Default value: `'production'`

Values can be 'production' or 'sandbox'. Maps to [nforce createConnection](https://github.com/kevinohara80/nforce/blob/master/README.md#createconnectionopts).

#### options.fileChangeHashFile
Type: `String`
Default value: `'.force-developer.filehash.json'`

Persists the file hashes to determine modified and new files.

#### options.metadataSourceDirectory
Type: `String`
Default value: `'.metadata'`

The folder used to store all `'-meta.xml'` files for the project.  A corresponding file is required for all pages, components, trigger and classes.  If the `projectBaseDirectory` isn't altered, the default location is `./project/.metadata`.

#### options.pollInterval
Type: `Integer`
Default value: `500`

Sets the polling interval when deploying a package.

#### options.projectBaseDirectory
Type: `String`
Default value: `'project'`

Used to determine the root of the project folder.

#### options.outputDirectory
Type: `String`
Default value: `'package'`

The folder used when the files are copied from the project folder into a salesforce package-compliant folder structure.

#### options.outputPackageZip
Type: `String`
Default value: `'./package/package.zip'`

The location where the zipped package is to be stored.

### Recommended Gruntfile.js

In this example, the default task is configured to package the new and modified project files and upload these using `ant`.   `ant` has been used due to problems getting `nforce-metadata` to deploy zip files -- this will be addressed.  

This script enables a developer to work using any folder structure and uploading changes by executing `grunt`.  Once the `nforce` issue is addressed, this script would be executed `grunt default-nforce`.

Install the appropriate dependancies required for this Gruntfile by executing: 
```shell
npm install grunt-force-developer grunt-ant-sfdc grunt-force-developer --save-dev
```
Please ensure `ant` is installed and available as part of the environment path.

Gruntfile.js:
```js
'use strict';
module.exports = function(grunt) {

  // TODO: Update the credentials.
  var credentials = {
    // Not required for ant deployment
    consumerKey: '3MVG98SW_UPr.JFjzEoUdZZczc4pPByJsJh_3hvL_dxAMPsA8DpjdYBXepSg3GztwV.PPEG2Q6YaK1l.11111', 
    // Not required for ant deployment
    consumerSecret: '1233452345246423523',
    
    username: 'james.kent@gruntdemo.vertic.com.au',
    password: 'qwerty123',
    token: 'O7uccvnguEXqLnOBiTLC1234'
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

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-ant-sfdc');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-force-developer');

  grunt.registerTask('default', ['force:createPackage', 'compress:packageZip', 'antdeploy:deployPackage']);
  grunt.registerTask('default-nforce', ['force:createPackage', 'compress:packageZip', 'force:deployPackage']);

};
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Acknowledgements 
* [Kevin O'Hara](https://twitter.com/kevohara) for his exceptional nodejs/salesforce work ... and especially his [nforce](https://github.com/kevinohara80/nforce) libraries.

## Release History
_(Nothing yet)_
