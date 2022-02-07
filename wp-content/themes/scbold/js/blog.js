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


    /*
    *  title transition
    * */

    $('.post-list .type-post .entry-meta .trans').css('top', function (index) {
        return -$('.post-list .type-post .entry-meta').height();
    });
    $('.post-list .type-post').hover(
        function () {
            var _me = $(this);
            // title
            _me.find('.entry-title .trans').css('top', function (index) {
                return -_me.children('.entry-title').height();
            });
            //meta
            _me.find('.entry-meta .trans').css('top', function (index) {
                return 0;
            });

        },
        function () {
            var _me = $(this);
            _me.find('.entry-title .trans').css('top', function (index) {
                return 0;
            });
            //meta
            _me.find('.entry-meta .trans').css('top', function (index) {
                return -_me.children('.entry-meta').height();
            });
        }
    )

});


