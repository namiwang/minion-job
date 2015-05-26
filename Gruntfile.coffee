module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    coffee:
      compile:
        options:
          trace: true
          bare: false
          sourceMap: false
        files: [
          {
            expand: true
            flatten: false
            cwd: 'src'
            src: [ '*.coffee' ]
            dest: 'lib'
            ext: '.js'
            extDot: 'last'
          },{
            expand: true
            flatten: false
            cwd: ''
            src: [ 'index.coffee' ]
            dest: ''
            ext: '.js'
            extDot: 'last'
          }
        ]
    browserify:
      bundle:
        files: [
          src: [ 'index.js' ]
          dest: 'minion-job.js'
        ]

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-browserify'

  grunt.registerTask 'build', ['coffee', 'browserify']
