/*
 * grunt-force-developer
 * https://github.com/jkentjnr/grunt-force-developer
 *
 * Copyright (c) 2015 James Kent
 * Licensed under the MIT license.
 */

// To debug run 'node-inspector' in one terminal window.
// Then execute: node --debug-brk /usr/local/lib/node_modules/grunt-cli/bin/grunt from project root.

'use strict';

var crypto = require('crypto'),
    path = require('path'),
    nforce = require('nforce'),
    meta = require('nforce-metadata')(nforce),
    glob = require("glob");

var force = {

  deletePackageOutput: function(grunt, options, cache) {

    if (cache == true) {
      if (grunt.file.exists('./' + options.outputDirectory))
        grunt.file.delete('./' + options.outputDirectory, { force: true });
    }
    else {
      if (grunt.file.exists('./' + options.outputDirectory + '/package.xml'))
        grunt.file.delete('./' + options.outputDirectory + '/package.xml', { force: true });

      if (grunt.file.exists('./' + options.outputDirectory + '/src'))
        grunt.file.delete('./' + options.outputDirectory + '/src', { force: true });
    }
  },

  commitChangesToHashfile: function(grunt, options) {

    var fileDiffLive = './' + options.outputDirectory + '/' + options.fileChangeHashFile;
    var fileDiffStage = './' + options.outputDirectory + '/' + options.fileChangeHashStagingFile;

    // Commit the staged changes to the most recent hashfile.
    grunt.file.copy(fileDiffStage, fileDiffLive);
  },

  evaluateProjectFiles: function(grunt, options) {

    // TODO: Add support for delete (?)

    // Used to track what actions need to take place.
    var metadataAction = {};

    var fileDiffLive = './' + options.outputDirectory + '/' + options.fileChangeHashFile;
    var fileDiffStage = './' + options.outputDirectory + '/' + options.fileChangeHashStagingFile;

    // Read the hash file (if possible) 
    var fileDiff = (grunt.file.exists(fileDiffLive))
      ? grunt.file.readJSON(fileDiffLive)
      : {};   

    // Iterate through all folders under the project folder.
    grunt.file.expand({ filter: 'isDirectory' }, './' + options.projectBaseDirectory + '/**').forEach(function(dir) {

      // TODO - check for config file.
      // If config file - check for processor.  If custom processor, hand off processing
      // customProc(dir, metadataAction, fillDiff)

      // If no custom provider, iterate through all files in the folder.
      grunt.file.expand({ filter: 'isFile' }, [dir + '/*', '!' + dir + '/force.config', '!' + dir + '/*-meta.xml']).forEach(function(f) {

        // Read the file into memory
        var data = grunt.file.read(f);

        // Get any previous hash for the file.
        var existingHash = fileDiff[f];

        // Generate a hash for the data in the current file.
        var currentHash = crypto
          .createHash('md5')
          .update(data)
          .digest('hex');

        // Check to see if there is any difference in the file.
        if (existingHash != currentHash) {
          // If yes -- put an 'add' action for the file in the action collection.
          console.log('Change: ' + f);
          metadataAction[f] = { add: true };
        }

        // Save the latest hash for the file.
        fileDiff[f] = currentHash;

      });

    });

    // Persist the hashes to the staging file.
    grunt.file.write(fileDiffStage, JSON.stringify(fileDiff));

    // Return the actions to be performed.
    return metadataAction;

  },

  generatePackageStructure: function(grunt, options, metadataAction) {

    // TODO: make the packager customisable.
    // Suggestion: Make a packager for classes, pages and components that allows you to put the metadata in the source.

    // Create a path to the temp output dir.  This will house the unpackaged package.xml and source
    var targetSrc = './' + options.outputDirectory + '/' + options.outputTempDirectory + '/';

    var buildMetadata = function(f, metadataTarget, options) {

      var ext = path.extname(f);
      var name = path.basename(f, ext);

      var data = null;
      switch (ext) {
        case '.cls':
          data = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<ApexClass xmlns=\"http:\/\/soap.sforce.com\/2006\/04\/metadata\">\r\n    <apiVersion>' + options.apiVersion + '.0<\/apiVersion>\r\n    <status>Active<\/status>\r\n<\/ApexClass>';
          break;
        case '.page':
          data = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<ApexPage xmlns=\"http:\/\/soap.sforce.com\/2006\/04\/metadata\">\r\n    <apiVersion>' + options.apiVersion + '.0<\/apiVersion>\r\n    <availableInTouch>false<\/availableInTouch>\r\n    <confirmationTokenRequired>false<\/confirmationTokenRequired>\r\n    <label>' + name + '<\/label>\r\n<\/ApexPage>';
          break;
      }

      grunt.file.write(metadataTarget, data);

    };

    // 
    var copier = function(grunt, options, f, objectDir, hasMetadata) {

      var target = targetSrc + objectDir;

      var sourceFilename = path.basename(f);
      grunt.file.copy(f, target + '/' + sourceFilename);

      if (hasMetadata) {
        
        var metadataFilename = sourceFilename + '-meta.xml';
        var metadataTarget = target + '/' + metadataFilename;

        var matches = glob.sync(
          options.projectBaseDirectory + '/**/*' + metadataFilename
        );

        if (matches.length > 0) {
          grunt.file.copy(matches[0], metadataTarget);
        }
        else {
          var metadataSource = './' + options.projectBaseDirectory + '/' + options.metadataSourceDirectory + '/' + metadataFilename;

          grunt.log.writeln('Generating metadata - ' + metadataTarget);
          buildMetadata(f, metadataTarget, options);
        }
        
      }
    };

    for(var f in metadataAction) {
      
      var ext = path.extname(f);

      // TODO: Check for custom packager for a file ext.

      switch (ext) {
        case '.app':
          copier(grunt, options, f, 'applications', false);
          break;
        case '.approvalProcess':
          copier(grunt, options, f, 'approvalProcesses', false);
          break;
        case '.assignmentRules':
          copier(grunt, options, f, 'assignmentRules', false);
          break;
        case '.authproviders':
          copier(grunt, options, f, 'authprovider', false);
          break;
        case '.autoResponseRules':
          copier(grunt, options, f, 'autoResponseRules', false);
          break;
        case '.cls':
          copier(grunt, options, f, 'classes', true);
          break;
        case '.community':
          copier(grunt, options, f, 'communities', false);
          break;
        case '.component':
          copier(grunt, options, f, 'components', true);
          break;
        case '.group':
          copier(grunt, options, f, 'group', false);
          break;
        case '.homePageLayout':
          copier(grunt, options, f, 'homePageLayouts', false);
          break;
        case '.labels':
          copier(grunt, options, f, 'labels', false);
          break;
        case '.layout':
          copier(grunt, options, f, 'layouts', false);
          break;
        case '.letter':
          copier(grunt, options, f, 'letterhead', false);
          break;
        case '.object':
          copier(grunt, options, f, 'objects', false);
          break;
        case '.object':
          copier(grunt, options, f, 'objects', false);
          break;
        case '.objectTranslation':
          copier(grunt, options, f, 'objectTranslations', false);
          break;
        case '.page':
          copier(grunt, options, f, 'pages', true);
          break;
        case '.permissionset':
          copier(grunt, options, f, 'permissionsets', false);
          break;
        case '.profile':
          copier(grunt, options, f, 'profiles', false);
          break;
        case '.queue':
          copier(grunt, options, f, 'queues', false);
          break;
        case '.quickAction':
          copier(grunt, options, f, 'quickActions', false);
          break;
        case '.remoteSite':
          copier(grunt, options, f, 'remoteSiteSettings', false);
          break;
        case '.reportType':
          copier(grunt, options, f, 'reportTypes', false);
          break;
        case '.role':
          copier(grunt, options, f, 'role', false);
          break;
        case '.resource':
          copier(grunt, options, f, 'staticresources', true);
          break;
        case '.tab':
          copier(grunt, options, f, 'tabs', false);
          break;
        case '.trigger':
          copier(grunt, options, f, 'triggers', true);
          break;
      }

    }

    // TODO: load generic package XML file from filesystem. 
    var packageXml = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<Package xmlns=\"http:\/\/soap.sforce.com\/2006\/04\/metadata\">\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>AnalyticSnapshot<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ApexClass<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ApexComponent<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ApexPage<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ApexTrigger<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ApprovalProcess<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>AssignmentRules<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>AuthProvider<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>AutoResponseRules<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>BusinessProcess<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CallCenter<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Community<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CompactLayout<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ConnectedApp<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomApplication<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomApplication<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomApplicationComponent<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomField<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomLabels<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomObject<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomObjectTranslation<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomPageWebLink<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomSite<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>CustomTab<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Dashboard<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>DataCategoryGroup<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Document<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>EmailTemplate<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>EntitlementProcess<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>EntitlementTemplate<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ExternalDataSource<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>FieldSet<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Flow<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Group<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>HomePageComponent<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>HomePageLayout<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Layout<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Letterhead<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ListView<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>LiveChatAgentConfig<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>LiveChatButton<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>LiveChatDeployment<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>MilestoneType<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>NamedFilter<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Network<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>PermissionSet<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Portal<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>PostTemplate<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Profile<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Queue<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>QuickAction<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>RecordType<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>RemoteSiteSetting<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Report<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ReportType<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Role<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>SamlSsoConfig<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Scontrol<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>SharingReason<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Skill<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>StaticResource<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Territory<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>Translations<\/name>\r\n    <\/types>\r\n    <types>\r\n        <members>*<\/members>\r\n        <name>ValidationRule<\/name>\r\n    <\/types>\r\n    <version>32.0<\/version>\r\n<\/Package>';
    grunt.file.write(targetSrc + 'package.xml', packageXml);

  },

  deployPackage: function(done, grunt, options) {

  var org = nforce.createConnection({
    clientId: options.consumerKey,
    clientSecret: options.consumerSecret,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    version: 32,
    mode: 'single',
    metaOpts: {       // options for nforce-metadata
      interval: options.pollInterval  // poll interval can be specified (optional)
    },
    plugins: ['meta'] // loads the plugin in this connection
  });

  console.log('Connected as \'' + options.username + '\'');

    org.authenticate({ username: options.username, password: options.password, securityToken: options.token }).then(function() {

      console.log('Authenticated.');

      var fs = require("fs");
      var data = fs.readFileSync(path.resolve(options.outputPackageZip));
      console.log(data);

      var promise = org.meta.deployAndPoll({
        zipFile: data
      });

      promise.poller.on('poll', function(res) {
        console.log('Poll status: ' + res.status);
      });

      return promise;
    }).then(function(res) {
      console.log('Deployment Completed (Status: ' + res.status + ')');
      done();
    }).error(function(err) {
      console.error(err);
      done();
    });

  }

};

// ---------------------------------------------------------------------------------------------------

module.exports = function(grunt) {

  grunt.registerMultiTask('force', 'A task for salesforce and force.com development', function() {
    
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      action: 'package',
      apiVersion: 34,
      fileChangeHashFile: '.force-developer.filehash.json',
      fileChangeHashStagingFile: '.force-developer.filehash.staging.json',
      projectBaseDirectory: 'project',
      outputDirectory: '.package',
      outputTempDirectory: 'src',
      outputPackageZip: './.package/package.zip',
      metadataSourceDirectory: 'app-metadata',
      environment: 'production',
      pollInterval: 500,
    });

    // TODO: consider moving output Directory to system temp dir & use https://www.npmjs.com/package/temporary

    if (options.action == 'reset') {

      // Clear the meta data output directory & difference cache file.
      force.deletePackageOutput(grunt, options, true);

    }

    if (options.action == 'package') {

        // Detect any new file or modified files.
      var metadataAction = force.evaluateProjectFiles(grunt, options);

      // Clear the meta data output directory.
      force.deletePackageOutput(grunt, options, false);

      // Check to see if ahny file changes were detected.
      if (Object.keys(metadataAction).length == 0) {
        grunt.fail.warn('No new or modified files detected.');
        return;
      }

      // Generate package folder structure with new & modified files.
      force.generatePackageStructure(grunt, options, metadataAction);

    }

    if (options.action == 'deploy') {

      // Deploy async using nforce.
      var done = this.async();
      force.deployPackage(done, grunt, options);
    }

    if (options.action == 'commit') {

      // Replace the hashfile with the staging hashfile.
      force.commitChangesToHashfile(grunt, options);
    }

  });

};