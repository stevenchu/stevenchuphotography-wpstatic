/**
 * Created by JetBrains PhpStorm.
 * User: sQrt121
 * Date: 2/1/12
 * Time: 12:27 PM
 * To change this template use File | Settings | File Templates.
 */
//global variables
var $ = jQuery.noConflict();

$(document).ready(function () {

    $('.flexslider').flexslider()
    $(window).load(contentLoaded);

});

// all the content has been loaded
function contentLoaded() {

}

