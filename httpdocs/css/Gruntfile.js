rts = function(grunt){
grunt.loadNpmTasks('grunt-contrib-sass');
grunt.loadNpmTasks('grunt-contrib-watch');

grunt.registerTask('default', ['watch']);
grunt.initConfig({
sass : {
dist : {
options : {
style: 'nested'
},
files : {
'./style.css' : './library/scss/style.scss'
}
}
},
watch : {
sass : {
files : ['./library/scss/*.scss'],
tasks : ['sass:dist']
}
}
});
};
rts = function(grunt){
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
 
    grunt.registerTask('default', ['watch']);
    grunt.initConfig({
        sass : {
            dist : {
                options : {
                    style: 'nested'
                },
                files : {
                    './style.css' : './library/scss/style.scss'
                }
            }
        },
        watch : {
            sass : {
                files : ['./library/scss/*.scss'],
        tasks : ['sass:dist']
            }
        }
    });
};
