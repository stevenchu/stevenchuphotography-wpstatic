/**
 * Created with JetBrains PhpStorm.
 * User: sQrt121
 * Date: 6/19/12
 * Time: 12:05 PM
 * To change this template use File | Settings | File Templates.
 */


//global variables
var $ = jQuery.noConflict();

jQuery(document).ready(function () {

    // create event handlers
    $(window).load(contentLoaded);


    /*-----------------------------------------------------------------------------------*/
    /*	Prettyphoto
     /*-----------------------------------------------------------------------------------*/

    $("a[rel^='pp[gall]']").prettyPhoto({
        deeplinking:false,
        // theme:'light_square',
        overlay_gallery:false
    });


});


// all the content has been loaded
function contentLoaded() {
    /*-----------------------------------------------------------------------------------*/
    /*	Make Video/Audio Responsive
     /*-----------------------------------------------------------------------------------*/

    if ($().jPlayer && $('.jp-jplayer').length) {
        $('.jp-jplayer').each(function () {
            var player = $(this),
                orig_width = player.width(),
                orig_height = player.height();

            player.attr('data-ratio', orig_width / orig_height);

            // show/hide controls
            player.parent().hover(function () {
                $(this).children('.jp-video-container').animate({opacity:1}, 300)
            }, function () {
                $(this).children('.jp-video-container').animate({opacity:0}, 300)
            })

        });

        $(window).resize(function () {
            $('.jp-jplayer').each(function () {
                var player = $(this),
                    ratio = player.attr('data-ratio'),
                    nWidth = player.parent().width(),
                    nHeight = nWidth / ratio;

                //new_height = Math.round((new_width / orig_width) * orig_height);
                if (player.hasClass('jp-jplayer'))  player.jPlayer('option', 'size', { width:nWidth, height:nHeight });
                if (player.hasClass('embed-video')) player.width(nWidth).height(nHeight);


            });
        });
        $(window).trigger('resize'); // inital resize


    }
}
