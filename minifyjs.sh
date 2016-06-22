#!/bin/bash
cd `dirname $0`

cat httpdocs/js/rand_gen.js              >  httpdocs/js/game_field.merge.js
cat httpdocs/js/game_field_utility.js    >> httpdocs/js/game_field.merge.js
cat httpdocs/js/game_field_reactions.js  >> httpdocs/js/game_field.merge.js
cat httpdocs/js/arts_queue.js            >> httpdocs/js/game_field.merge.js
cat httpdocs/js/magic_queue.js           >> httpdocs/js/game_field.merge.js
cat httpdocs/js/game_field.js            >> httpdocs/js/game_field.merge.js

php ./minifyjs.php httpdocs/js/game_field.merge.js   > httpdocs/js/game_field.min.js
php ./minifyjs.php httpdocs/js/deck_list.js          > httpdocs/js/deck_list.min.js
php ./minifyjs.php httpdocs/js/deck_edit.js          > httpdocs/js/deck_edit.min.js
php ./minifyjs.php httpdocs/js/img_delay_load.js     > httpdocs/js/img_delay_load.min.js
