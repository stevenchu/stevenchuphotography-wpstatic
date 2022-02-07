/**
 * Created by JetBrains PhpStorm.
 * User: sQrt121
 * Date: 2/1/12
 * Time: 12:27 PM
 * To change this template use File | Settings | File Templates.
 */
//global variables
var $ = jQuery.noConflict();
var nTitleFS;

$(document).ready(function () {


    /* Background fix ------------------------------*/
    $(window).load(function() {

        var theWindow        = jQuery(window),
            $bg              = jQuery("#background"),
            aspectRatio      = $bg.width() / $bg.height();

        function resizeBg() {

            if ( (theWindow.width() / theWindow.height()) < aspectRatio ) {
                $bg
                    .removeClass()
                    .addClass('bgheight');
            } else {
                $bg
                    .removeClass()
                    .addClass('bgwidth');
            }

        }

        theWindow.resize(function() {
            resizeBg();
        }).trigger("resize");

    });

    // enable menu
    $('.mainmenu ul').superfish({
        delay:100,
        animation:{opacity:'show'},
        speed:'fast',
        autoArrows:false
//        dropShadows:true
    });

    // show submenu
    $('.sf-menu > li').hover(
        function () {
            if ($(this).find('ul').length) {
                $('.sf-menu').stop().animate({
                    'margin-bottom':'1.39em'

                })


            }
        },
        function () {
            if ($(this).find('ul').length) {
                $('.sf-menu').stop().animate({
                    'margin-bottom':'0'

                })


            }
        }
    )

    // improves menu for mobile devices
    var optionsList = '<option value="" selected>Navigate to...</option>';
    $('.sf-menu').find('li').each(
        function () {
            var anchor = $(this).children('a');
            var depth = $(this).parents('ul').length - 1;
            var indent = '';

            if (depth) {
                while (depth > 0) {
                    indent += '&nbsp;-';
                    depth--;
                }
            }

            optionsList += '<option value="' + anchor.attr('href') + '">' + indent + ' ' + anchor.text() + '</option>';
        }).end();
    $('.header .row .mainmenu').after('<div class="responsive menu "><select class="responsive-mainmenu">' + optionsList + '</select></div>');

    $('.responsive-mainmenu').change(function () {
        window.location = $(this).val();
    });


    /* Tabs Shortcode ------------------------------*/
    $("#tabs").tabs({ fx:{ opacity:'show' } });
    $(".tabs").tabs({ fx:{ opacity:'show' } });

    /* Toggle Shortcode ----------------------------*/
    $(".toggle").each(function () {
        if ($(this).attr('data-id') == 'closed') {
            $(this).accordion({ header:'h4', animated:false, collapsible:true, autoHeight:false, active:false  });
        } else {
            $(this).accordion({ header:'h4', animated:false, autoHeight:false, collapsible:true});
        }
    });


    $('.fitvid').fitVids();

    // Title
    nTitleFS = parseInt($('div.title.container .text').css('font-size'));
    // draw oblique line over title
    drawLine();
    $(window).resize(drawLine);


    $(window).load(initConf);
});


function drawLine() {
    // get the canvas element using the DOM
    var canvas = document.getElementById('mycanvas');

    // get the color
    var _color = $('body').css('background-color');


    // Make sure we don't execute when canvas isn't supported
    if (canvas.getContext) {


        canvas.width = $('.oline').width();
        canvas.height = $('.oline').height();
        // use getContext to use the canvas for drawing
        var ctx = canvas.getContext('2d');

        // Stroked triangle
        ctx.strokeStyle = _color;
        ctx.beginPath();
        ctx.moveTo(700, 0);
        ctx.lineTo(0, 500);
        ctx.closePath();
        ctx.stroke();

    }


    // title
    $('div.title.container .text').css('font-size', function () {
        return $('div.title.container .row').width() / 1140 * nTitleFS + 'px';
    })

}


function initConf() {

    $('.conf-container').height($('body').height());

    // move confetti
    $(window).scroll(function () {
        var _bH = $('body').height();
        var _wH = $(window).height();
        var _sH = _bH - _wH;
        var _wST = $(window).scrollTop();


        $('.conf').css('top', function () {
            return _wST + _wST / _sH * 500;
        })

    })

}
function parseBol(s) {
    if (s == 'true')
        return true;
    else
        return false;
}