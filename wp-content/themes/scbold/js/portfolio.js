/**
 * Created by JetBrains WebStorm.
 * User: sQrt121
 * Date: 12/2/11
 * Time: 4:21 PM
 * To change this template use File | Settings | File Templates.
 */

//global variables
var $ = jQuery.noConflict();


jQuery(document).ready(function () {
    // DOM LOADED

    Categories.create();
    Items.create();

    $('.filter .categories a:first').click();

});


/*-----------------------------------------------------------------------------------*/
// Categories
/*-----------------------------------------------------------------------------------*/
var Categories = new function () {
    var me = this;
    //create an array to store the tag data
    this.category = new Array();
    this.selected = null;

    this.create = function () {


        // add name and items to each tag
        $('.categories a').each(function (i) {
            me.category[i] = new Object();
            me.category[i].name = $(this).attr('data-tag');
            me.category[i].item = new Array();

            $('.items .hentry').each(function (j) {
                if (i == 0) me.category[i].item.push($(this));
                if ($(this).is('.tag-' + me.category[i].name)) me.category[i].item.push($(this));
            });

        });


        // tags actions
        // create a variable to store the current selected tag
        var selectedCat;
        $('.categories a').click(function (e) {
            e.preventDefault();
            var filter = $(this).attr('data-tag');

            if (selectedCat)
                selectedCat.removeClass('category-item-selected').addClass('category-item-default');

            selectedCat = $(this);
            selectedCat.removeClass('category-item-default').addClass('category-item-selected');


            // select category
            selectCategory(filter);
            //select1

        });
    };

    var selectCategory = function (f) {
        // hide portfolio items
        $('.items .hentry').hide();

        for (var i = 0; i < me.category.length; i++) {
            if (f == me.category[i].name) {
                me.selected = me.category[i].item;
                Items.show();
            }
        }
    }
    var select1 = function (f) {

    }

};


/*-----------------------------------------------------------------------------------*/
// Items
/*-----------------------------------------------------------------------------------*/
var Items = new function () {
    var me = this;

    this.create = function () {
        $('.items .hentry').hide();

    }
    this.show = function () {
        var item = Categories.selected;
        for (var i = 0; i < item.length; i++) {
            // default
            item[i].css({
                '-webkit-transition':'none',
                '-moz-transition':'none',
                'transition':'none',
                opacity:0
            });
            item[i].show();
            //animate
            item[i].delay(i * 40)
                .animate({
                    opacity:1
                }, function () {
                    $(this).removeAttr('style');
                });
        }

    };


};

