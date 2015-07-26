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

## The "force" task

### Overview

#### Traditional Folder Structure
Traditionally, when a developer is developing for salesforce / force.com, they are constrained to a package structure.  This structure is extremely limiting and, as the size of projects / packages grow, becomes unweildly.

```
package.xml
== classes
    -- Class1.cls
    -- Class1.cls-meta.xml
    -- Class2.cls
    -- Class2.cls-meta.xml
== pages
    -- Page1.page
    -- Page1.page-meta.xml
== objects
    -- Test_Object__c.object
```

#### Force Developer Folder Structure
Using `grunt-force-developer`, a developer can adopt a more complex file structure.  The developer has configured their code in a structure appropriate for their project.

```
== .metadata
    -- PaymentController.cls-meta.xml
    -- PaymentController.cls-meta.xml
    -- PaymentController.cls-meta.xml
== Admin
   == Users
      -- UserManagementController.cls
      -- UserManagement.page
== Payments
    -- PaymentController.cls
    -- Payment.page
```

In your project's Gruntfile, add a section named `force` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  force: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  force: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  force: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
