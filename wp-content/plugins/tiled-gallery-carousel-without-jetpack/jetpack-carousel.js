
jQuery(document).ready(function($) {

	// gallery faded layer and container elements
	var overlay, comments, gallery, container, nextButton, previousButton, info, title,
	caption, resizeTimeout, mouseTimeout, photo_info, close_hint, commentInterval, buttons,
	screenPadding = 110, originalOverflow = $('body').css('overflow'), originalHOverflow = $('html').css('overflow'), proportion = 85, isMobile;

	isMobile = /Android|iPhone|iPod/i.test(navigator.userAgent);

	if (isMobile)
		screenPadding = 0;

	var keyListener = function(e){
		switch(e.which){
			case 38: // up
				e.preventDefault();
				container.scrollTop(container.scrollTop() - 100);
				break;
			case 40: // down
				e.preventDefault();
				container.scrollTop(container.scrollTop() + 100);
				break;
			case 39: // right
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				gallery.jp_carousel('next');
				break;
			case 37: // left
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				gallery.jp_carousel('previous');
				break;
			case 27: // escape
				e.preventDefault();
				gallery.jp_carousel('clearCommentTextAreaValue');
				container.jp_carousel('close');
				break;
			default:
				// making jslint happy
				break;
		}
	};

	var resizeListener = function(e){
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function(){
			gallery
				.jp_carousel('slides')
				.jp_carousel('fitSlide', true);
			gallery
				.jp_carousel('fitInfo', true)
				.jp_carousel('fitMeta', true);
		}, 200);
	};

	// For each image in the carousel, emit likes widget markup
	var getCarouselLikeWidgets = function( dataCarouselExtra ) {

		// Only do this if likes is enabled
		if ( "undefined" === typeof jetpackLikesWidgetQueue )
			return "";

		var blogId = dataCarouselExtra.likes_blog_id;
		var attachmentId = 0;
		var protocol = 'http';
		var originDomain = 'http://wordpress.com';

		if ( dataCarouselExtra.permalink.length ) {
			var parts = dataCarouselExtra.permalink.split( ':' );
			var protocol = parts[0];
			if ( ( protocol != 'http' ) && ( protocol != 'https' ) ) {
				protocol = 'http';
			}

			parts = dataCarouselExtra.permalink.split( '/' );
			if ( parts.length >= 2 ) {
				originDomain = protocol + "://" + parts[2];
			}
		}

		var likesWidgetContainer = $("<div class='likes-widget-container'></div>");

		$( 'div.gallery, div.tiled-gallery' ).find( 'img' ).each( function() {

			attachmentId = $( this ).attr( "data-attachment-id" );
			var dataSource = protocol + "://widgets.wp.com/likes/#blog_id=" + blogId + "&amp;post_id=" + attachmentId + "&amp;slim=1&amp;origin=" + originDomain;

			if ( 'en' !== jetpackCarouselStrings.lang ) {
				dataSource += "&amp;lang=" + jetpackCarouselStrings.lang;
			}

			var likesWidgetWrapper = $( "<div></div>" );
			likesWidgetWrapper.addClass( "jetpack-likes-widget-wrapper" )
				.addClass( "jetpack-likes-widget-unloaded" )
				.addClass( "slim-likes-widget" )
				.attr( "id", "like-post-wrapper-" + blogId + "-" + attachmentId )
				.attr( "data-src", dataSource )
				.attr( "data-name", "like-post-frame-" + blogId + "-" + attachmentId )
				.attr( "data-attachment-id", attachmentId )
				.css( "display", "none" )
				.css( "vertical-align", "middle" );

			var likesWidget = $( "<iframe class='post-likes-widget jetpack-likes-widget jetpack-resizeable'></iframe>" );
			likesWidget.attr( "name", "like-post-frame-" + blogId + "-" + attachmentId )
				.attr( "src", dataSource );
			likesWidget.css( "display", "inline-block" );
			likesWidgetWrapper.append( likesWidget );

			likesWidgetWrapper.append( "<div class='post-likes-widget-placeholder'></div>" );

			likesWidgetContainer.append( likesWidgetWrapper );
		});

		return likesWidgetContainer.html();
	};

	var prepareGallery = function( dataCarouselExtra ){
		if (!overlay) {
			overlay = $('<div></div>')
				.addClass('jp-carousel-overlay')
				.css({
					'position' : 'absolute',
					'top'      : 0,
					'right'    : 0,
					'bottom'   : 0,
					'left'     : 0
				});

			buttons  = '<a class="jp-carousel-commentlink" href="#">' + jetpackCarouselStrings.comment + '</a>';
			if ( 1 == jetpackCarouselStrings.is_logged_in ) {
			}
			buttons += getCarouselLikeWidgets( dataCarouselExtra );
			buttons  = $('<div class="jp-carousel-buttons">' + buttons + '</div>');

			caption    = $('<h2></h2>');
			photo_info = $('<div class="jp-carousel-photo-info"></div>').append(caption);

			imageMeta = $('<div></div>')
				.addClass('jp-carousel-image-meta')
				.css({
					'float'      : 'right',
					'margin-top' : '20px',
					'width'      :  '250px'
				});

			imageMeta.append( buttons );
			imageMeta.append( "<ul class='jp-carousel-image-exif' style='display:none;'></ul>" );
			imageMeta.append( "<a class='jp-carousel-image-download' style='display:none;'></a>" );
			imageMeta.append( "<div class='jp-carousel-image-map' style='display:none;'></div>" );
			imageMeta=$('<div></div>');
			titleAndDescription = $('<div></div>')
				.addClass('jp-carousel-titleanddesc')
				.css({
					'width'      : '100%',
					'margin-top' : imageMeta.css('margin-top')
				});

			var commentFormMarkup = '';
			var iframeSrc = '';

			commentFormMarkup  = '<div id="jp-carousel-comment-form-container">';
			if (iframeSrc && iframeSrc.length) {
				// We're using Jetpack comments!
				var iframeHeight = (jetpackCarouselStrings.is_logged_in || iframeSrc.match('comment_registration=1')) ? 220 : 340;
				iframeSrc = iframeSrc.replace(/(blogid=\d+)/, '$1&postid='+window.location.hash.replace(/#jp-carousel-/,'')); // get initial attachment id from URL hash
				commentFormMarkup += '<iframe src="'+iframeSrc+'" width="100%" height="'+iframeHeight+'" style="width:100%;height:'+iframeHeight+'px;" allowtransparency="true" frameBorder="0" scrolling="no" name="jp-carousel-comment-iframe" id="jp-carousel-comment-iframe"></iframe>';
			} else if ( jetpackCarouselStrings.local_comments_commenting_as && jetpackCarouselStrings.local_comments_commenting_as.length ) {
				// Jetpack comments not enabled, fallback to local comments

				if ( 1 != jetpackCarouselStrings.is_logged_in && 1 == jetpackCarouselStrings.comment_registration ) {
					commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
				} else {
					commentFormMarkup += '<form id="jp-carousel-comment-form">';
					commentFormMarkup += '<textarea name="comment" class="jp-carousel-comment-form-field jp-carousel-comment-form-textarea" id="jp-carousel-comment-form-comment-field" placeholder="Write a comment&hellip;"></textarea>';
					commentFormMarkup += '<div id="jp-carousel-comment-form-submit-and-info-wrapper">';
					commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
					commentFormMarkup += '<input type="submit" name="submit" class="jp-carousel-comment-form-button" id="jp-carousel-comment-form-button-submit" value="'+jetpackCarouselStrings.post_comment+'" />';
					commentFormMarkup += '<span id="jp-carousel-comment-form-spinner">&nbsp;</span>';
					commentFormMarkup += '<div id="jp-carousel-comment-post-results"></div>';
					commentFormMarkup += '</div>';
					commentFormMarkup += '</form>';
				}
			}
			commentFormMarkup += '</div>';

			commentForm = $(commentFormMarkup)
				.css({
					'width'      : '100%',
					'margin-top' : '20px',
					'color'      : '#999'
				});

			comments = $('<div></div>')
				.addClass('jp-carousel-comments')
				.css({
					'width'      : '100%',
					'bottom'     : '10px',
					'margin-top' : '20px'
				});

			commentsLoading = $('<div id="jp-carousel-comments-loading"><span>'+jetpackCarouselStrings.loading_comments+'</span></div>')
				.css({
					'width'      : '100%',
					'bottom'     : '10px',
					'margin-top' : '20px'
				});

			leftWidth = ( $(window).width() - ( screenPadding * 2 ) ) - (imageMeta.width() + 40);
			leftWidth += 'px';

			if (isMobile)
				leftWidth = '100%';

			leftColWrapper = $('<div></div>')
				.addClass('jp-carousel-left-column-wrapper')
				.css({
					'width' : leftWidth
				})
				.append(titleAndDescription)
				.append(commentForm)
				.append(comments)
				.append(commentsLoading);
			leftColWrapper = $('<div></div>');
			fadeaway = $('<div></div>')
				.addClass('jp-carousel-fadeaway');

			info = $('<div></div>')
				.addClass('jp-carousel-info')
				.css({
					'top'   : ($(window).height() / 100) * proportion,
					'left'  : screenPadding,
					'right' : screenPadding
				})
				.append(photo_info)
				.append(imageMeta)
				.append(leftColWrapper);

			if (isMobile)
				info.prepend(leftColWrapper);
			else
				info.append(leftColWrapper);

			targetBottomPos = ( $(window).height() - parseInt( info.css('top'), 10 ) ) + 'px';

			nextButton = $("<div><span></span></div>")
				.addClass('jp-carousel-next-button')
				.css({
					'position' : 'fixed',
					'top'      : 0,
					'right'    : '15px',
					'bottom'   : 0,
					'width'    : screenPadding
				});

			$('span', nextButton).css({
				'top'    : '40px',
				'bottom' : targetBottomPos
			});

			previousButton = $("<div><span></span></div>")
				.addClass('jp-carousel-previous-button')
				.css({
					'position' : 'fixed',
					'top'      : 0,
					'left'     : 0,
					'bottom'   : 0,
					'width'    : screenPadding
				});

			$('span', previousButton).css({
				'top'    : '40px',
				'bottom' : targetBottomPos
			});

			gallery = $('<div></div>')
				.addClass('jp-carousel')
				.css({
					'position' : 'absolute',
					'top'      : 0,
					'bottom'   : targetBottomPos,
					'left'     : 0,
					'right'    : 0
				});

			close_hint = $('<div class="jp-carousel-close-hint"><span>&times;</span></div>')
				.css({
					position : 'fixed'
				});

			container = $("<div></div>")
				.addClass('jp-carousel-wrap');

			if ( 'white' == jetpackCarouselStrings.background_color )
				 container.addClass('jp-carousel-light');

			container.css({
					'position'   : 'fixed',
					'top'        : 0,
					'right'      : 0,
					'bottom'     : 0,
					'left'       : 0,
					'z-index'    : 2147483647,
					'overflow-x' : 'hidden',
					'overflow-y' : 'auto',
					'direction'  : 'ltr'
				})
				.hide()
				.append(overlay)
				.append(gallery)
				.append(fadeaway)
				.append(info)
				.append(nextButton)
				.append(previousButton)
				.append(close_hint)
				.appendTo($('body'))
				.click(function(e){
					var target = $(e.target), wrap = target.parents('div.jp-carousel-wrap'), data = wrap.data('carousel-extra'),
						slide = wrap.find('div.selected'), attachment_id = slide.data('attachment-id');
					data = data || [];

					if ( target.is(gallery) || target.parents().add(target).is(close_hint) ) {
						container.jp_carousel('close');
					} else if ( target.hasClass('jp-carousel-commentlink') ) {
						e.preventDefault();
						e.stopPropagation();
						$(window).unbind('keydown', keyListener);
						container.animate({scrollTop: parseInt(info.position()['top'], 10)}, 'fast');
						$('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
						$('#jp-carousel-comment-form-comment-field').focus();
					} else if ( target.hasClass('jp-carousel-comment-login') ) {
						var url = jetpackCarouselStrings.login_url + '%23jp-carousel-' + attachment_id;

						document.location.href = url;
					} else if ( target.parents('#jp-carousel-comment-form-container').length ) {
						var textarea = $('#jp-carousel-comment-form-comment-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var emailField = $('#jp-carousel-comment-form-email-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var authorField = $('#jp-carousel-comment-form-author-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						var urlField = $('#jp-carousel-comment-form-url-field')
							.blur(function(){
								$(window).bind('keydown', keyListener);
							})
							.focus(function(){
								$(window).unbind('keydown', keyListener);
							});

						if ( textarea && textarea.attr('id') == target.attr('id')) {
							// For first page load
							$(window).unbind('keydown', keyListener);
							$('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
						} else if ( target.is( 'input[type="submit"]' ) ) {
							e.preventDefault();
							e.stopPropagation();

							$('#jp-carousel-comment-form-spinner').spin('small', 'white');

							var ajaxData = {
								action: 'post_attachment_comment',
								nonce:   jetpackCarouselStrings.nonce,
								blog_id: data['blog_id'],
								id:      attachment_id,
								comment: textarea.val()
							};

							if ( ! ajaxData['comment'].length ) {
								gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.no_comment_text});
								return;
							}

							if ( 1 != jetpackCarouselStrings.is_logged_in ) {
								ajaxData['email']  = emailField.val();
								ajaxData['author'] = authorField.val();
								ajaxData['url']    = urlField.val();

								if ( 1 == jetpackCarouselStrings.require_name_email ) {
									if ( ! ajaxData['email'].length || ! ajaxData['email'].match('@') ) {
										gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-email-field', 'error': jetpackCarouselStrings.no_comment_email});
										return;
									} else if ( ! ajaxData['author'].length ) {
										gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-author-field', 'error': jetpackCarouselStrings.no_comment_author});
										return;
									}
								}
							}

							$.ajax({
								type:       'POST',
								url:        jetpackCarouselStrings.ajaxurl,
								data:       ajaxData,
								dataType:   'json',
								success: function(response, status, xhr) {
									if ( 'approved' == response.comment_status ) {
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_approved + '</span>').slideDown('fast');
									} else if ( 'unapproved' == response.comment_status ) {
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_unapproved + '</span>').slideDown('fast');
									} else {
										// 'deleted', 'spam', false
										$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">' + jetpackCarouselStrings.comment_post_error + '</span>').slideDown('fast');
									}
									gallery.jp_carousel('clearCommentTextAreaValue');
									gallery.jp_carousel('getComments', {attachment_id: attachment_id, offset: 0, clear: true});
									$('#jp-carousel-comment-form-button-submit').val(jetpackCarouselStrings.post_comment);
									$('#jp-carousel-comment-form-spinner').spin(false);
								},
								error: function(xhr, status, error) {
									// TODO: Add error handling and display here
									gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.comment_post_error});
									return;
								}
							});
						}
					} else if ( ! target.parents( '.jp-carousel-info' ).length ) {
						container.jp_carousel('next');
					}
				})
				.bind('jp_carousel.afterOpen', function(){
					$(window).bind('keydown', keyListener);
					$(window).bind('resize', resizeListener);
					gallery.opened = true;
				})
				.bind('jp_carousel.beforeClose', function(){
					var scroll = $(window).scrollTop();

					$(window).unbind('keydown', keyListener);
					$(window).unbind('resize', resizeListener);
					$(window).scrollTop(scroll);
				})
				.bind('jp_carousel.afterClose', function(){
					if ( history.pushState ) {
						history.pushState("", document.title, window.location.pathname + window.location.search);
					} else {
						document.location.hash = '';
					}
					gallery.opened = false;
				});

				$('.jp-carousel').touchwipe({
				     wipeLeft: function() { gallery.jp_carousel('next'); },
				     wipeRight: function() { gallery.jp_carousel('previous'); },
				     min_move_x: 20,
				     min_move_y: 20,
				     preventDefaultEvents: true
				});

			$( '.jetpack-likes-widget-unloaded' ).each( function() {
				jetpackLikesWidgetQueue.push( this.id );
				});

			nextButton.add(previousButton).click(function(e){
				e.preventDefault();
				e.stopPropagation();
				if ( nextButton.is(this) ) {
					gallery.jp_carousel('next');
				} else {
					gallery.jp_carousel('previous');
				}
			});
		}
	};

	var methods = {
		testForData: function(gallery) {
			gallery = $( gallery ); // make sure we have it as a jQuery object.
			if ( ! gallery.length || undefined == gallery.data( 'carousel-extra' ) ) {
				return false;
			}
			return true;
		},

		testIfOpened: function() {
			if ( 'undefined' != typeof(gallery) && 'undefined' != typeof(gallery.opened) && true == gallery.opened )
				return true;
			return false;
		},

		open: function(options) {
			var settings = {
				'items_selector' : ".gallery-item [data-attachment-id], .tiled-gallery-item [data-attachment-id]",
				'start_index': 0
			},
			data = $(this).data('carousel-extra');

			if ( !data )
				return; // don't run if the default gallery functions weren't used

			prepareGallery( data );

			if ( gallery.jp_carousel( 'testIfOpened' ) )
				return; // don't open if already opened

			// make sure to stop the page from scrolling behind the carousel overlay, so we don't trigger
			// infiniscroll for it when enabled (Reader, theme infiniscroll, etc).
			originalOverflow = $('body').css('overflow');
			$('body').css('overflow', 'hidden');
			// prevent html from overflowing on some of the new themes.
			originalHOverflow = $('html').css('overflow');
			$('html').css('overflow', 'hidden');

			// Re-apply inline-block style here and give an initial value for the width
			// This value will get replaced with a more appropriate value once the slide is loaded
			// This avoids the likes widget appearing initially full width below the comment button and then shuffling up
			jQuery( '.slim-likes-widget' ).find( 'iframe' ).css( 'display', 'inline-block' ).css( 'width', '60px' );

			container.data('carousel-extra', data);

			return this.each(function() {
				// If options exist, lets merge them
				// with our default settings
				var $this = $(this);

				if ( options )
					$.extend( settings, options );
				if ( -1 == settings.start_index )
					settings.start_index = 0; //-1 returned if can't find index, so start from beginning

				container.trigger('jp_carousel.beforeOpen').fadeIn('fast',function(){
					container.trigger('jp_carousel.afterOpen');
					gallery
						.jp_carousel('initSlides', $this.find(settings.items_selector), settings.start_index)
						.jp_carousel('start', settings.start_index);
				});
				gallery.html('');
			});
		},

		start : function(start_index){
			var slides = this.jp_carousel('slides'), selected = slides.eq(start_index);

			if ( 0 === selected.length )
				selected = slides.eq(0);

			gallery.jp_carousel('selectSlide', selected, false);
			return this;
		},

		close : function(){
			// make sure to let the page scroll again
			$('body').css('overflow', originalOverflow);
			$('html').css('overflow', originalHOverflow);
			return container
				.trigger('jp_carousel.beforeClose')
				.fadeOut('fast', function(){
					container.trigger('jp_carousel.afterClose');
				});

		},

		next : function(){
			var selected = this.jp_carousel('selectedSlide'), slide;
			container.animate({scrollTop:0}, 'fast');
			if ( 0 === selected.length ) { // no selection return first item
				slide = this.jp_carousel('slides').first(0);
			} else if( selected.is( this.jp_carousel('slides').last() ) ) {
				gallery.jp_carousel('loopSlides');
			} else {
				slide = selected.next();
			}
			if (!slide) {
				return this;
			} else {
				return this.jp_carousel('selectSlide', slide);
			}
		},

		previous : function(){
			var selected = this.jp_carousel('selectedSlide'), slide;
			container.animate({scrollTop:0}, 'fast');
			if ( 0 === selected.length ) { // no selection return first item
				slide = this.jp_carousel('slides').first();
			} else if ( selected.is( this.jp_carousel('slides').first() ) ) { // if it's the last slide
				gallery.jp_carousel('loopSlides', true);
			} else {
				slide = selected.prev();
			}
			if (!slide) {
				return this;
			} else {
				return this.jp_carousel('selectSlide', slide);
			}
		},

		resetButtons : function(current) {
			if ( current.data('liked') )
				$('.jp-carousel-buttons a.jp-carousel-like').addClass('liked').text(jetpackCarouselStrings.unlike);
			else
				$('.jp-carousel-buttons a.jp-carousel-like').removeClass('liked').text(jetpackCarouselStrings.like);
		},

		loopSlides : function(reverse){
			var slides = gallery.jp_carousel('slides'), last, first;
			gallery.jp_carousel('selectedSlide').removeClass('selected').css({'position': 'fixed'});
			if (reverse !== true ) {
				last = slides.last();
				slides.first().nextAll().not(last).jp_carousel('setSlidePosition', gallery.width()+slides.first().width()).hide();
				last.jp_carousel('setSlidePosition', -last.width());
				last.prev().jp_carousel('setSlidePosition', -last.width() - last.prev().width());
				slides.first().jp_carousel('setSlidePosition', gallery.width());
				setTimeout(function(){
					gallery.jp_carousel('selectSlide', slides.show().first());
				}, 400);

			} else {
				first = slides.first();
				first.jp_carousel('setSlidePosition', gallery.width());
				first.next().jp_carousel('setSlidePosition', gallery.width() + first.width());
				first.next().nextAll().hide().jp_carousel('setSlidePosition', -slides.last().width());
				slides.last().jp_carousel('setSlidePosition', -slides.last().width());
				slides.last().prevAll().not(first, first.next()).hide().jp_carousel('setSlidePosition', -slides.last().width()-slides.last().prev().width());
				setTimeout(function(){
					gallery.jp_carousel('selectSlide', slides.show().last());
				}, 400);

			}
		},

		selectedSlide : function(){
			return this.find('.selected');
		},

		setSlidePosition : function(x) {
			return this.css({
					'-webkit-transform':'translate3d(' + x + 'px,0,0)',
					'-moz-transform':'translate3d(' + x + 'px,0,0)',
					'-ms-transform':'translate(' + x + 'px,0)',
					'-o-transform':'translate(' + x + 'px,0)',
					'transform':'translate3d(' + x + 'px,0,0)'
			});
		},

		selectSlide : function(slide, animate){
			var last = this.find('.selected').removeClass('selected'),
				slides = gallery.jp_carousel('slides').css({'position': 'fixed'}),
				current = $(slide).addClass('selected').css({'position': 'relative'}),
				previous = current.prev(),
				next = current.next(),
				width = $(window).width(),
				previous_previous = previous.prev(),
				next_next = next.next(),
				left = (gallery.width() - current.width()) * 0.5,
				info_left,
				animated,
				info_min;
			// center the main image

			caption.hide();

			method = 'css';
			animated = current
				.add(previous)
				.add(previous.prev())
				.add(next)
				.add(next.next())
				.jp_carousel('loadSlide');
			// slide the whole view to the x we want
			slides.not(animated).hide();

			current.jp_carousel('setSlidePosition', left).show();

			// minimum width
			gallery.jp_carousel('fitInfo', animate);

			// prep the slides
			var direction = last.is(current.prevAll()) ? 1 : -1;
			if ( 1 == direction ) {
				next_next.jp_carousel('setSlidePosition', gallery.width() + next.width()).show();
				next.hide().jp_carousel('setSlidePosition', gallery.width() + current.width()).show();
				previous_previous.jp_carousel('setSlidePosition', -previous_previous.width() - current.width()).show();
			} else {
				previous.jp_carousel('setSlidePosition', -previous.width() - current.width()).show();
				next_next.jp_carousel('setSlidePosition', gallery.width() + current.width()).show();
			}

			// if advancing prepare the slide that will enter the screen
			previous.jp_carousel('setSlidePosition', -previous.width() + (screenPadding * 0.75)).show();
			next.jp_carousel('setSlidePosition', gallery.width() - (screenPadding * 0.75)).show();
			next.css({'position': ''});
			document.location.href = document.location.href.replace(/#.*/, '') + '#jp-carousel-' + current.data('attachment-id');
			gallery.jp_carousel('resetButtons', current);
			container.trigger('jp_carousel.selectSlide', [current]);

			gallery.jp_carousel( 'getTitleDesc', { title: current.data( 'title' ), desc: current.data( 'desc' ) } );
			gallery.jp_carousel( 'updateLikesWidgetVisibility', current.data( 'attachment-id' ) )
			gallery.jp_carousel( 'updateExif', current.data( 'image-meta' ) );
			gallery.jp_carousel( 'updateFullSizeLink', current );
			gallery.jp_carousel( 'updateMap', current.data( 'image-meta' ) );
			gallery.jp_carousel( 'testCommentsOpened', current.data( 'comments-opened' ) );
			gallery.jp_carousel( 'getComments', { 'attachment_id': current.data( 'attachment-id' ), 'offset': 0, 'clear': true } );

			$('#jp-carousel-comment-post-results').slideUp();

			// $('<div />').text(sometext).html() is a trick to go to HTML to plain text (including HTML entities decode, etc)
			if ( current.data('caption') ) {
				if ( $('<div />').text(current.data('caption')).html() == $('<div />').text(current.data('title')).html() )
					$('.jp-carousel-titleanddesc-title').fadeOut('fast').empty();
				if ( $('<div />').text(current.data('caption')).html() == $('<div />').text(current.data('desc')).html() )
					$('.jp-carousel-titleanddesc-desc').fadeOut('fast').empty();
				caption.html( current.data('caption') ).fadeIn('slow');
			} else {
				caption.fadeOut('fast').empty();
			}

		},

		slides : function(){
			return this.find('.jp-carousel-slide');
		},

		slideDimensions : function(){
			return {
				width: $(window).width() - (screenPadding * 2),
				height: $(window).height() / 100 * proportion - 60
			};
		},

		loadSlide : function() {
			return this.each(function(){
				var slide = $(this);
				slide.find('img')
					.one('load', function(){
						// set the width/height of the image if it's too big
						slide
							.jp_carousel('fitSlide',false);
					});
			});
		},

		bestFit : function(){
			var max        = gallery.jp_carousel('slideDimensions'),
			    orig       = this.jp_carousel('originalDimensions'),
			    orig_ratio = orig.width / orig.height,
			    w_ratio    = 1,
			    h_ratio    = 1;

			if ( orig.width > max.width )
				w_ratio = max.width / orig.width;
			if ( orig.height > max.height )
				h_ratio = max.height / orig.height;

			if ( w_ratio < h_ratio ) {
				width = max.width;
				height = width / orig_ratio;
			} else if ( h_ratio < w_ratio ) {
				height = max.height;
				width = height * orig_ratio;
			} else {
				width = orig.width;
				height = orig.height;
			}

			return {
				width: width,
				height: height
			};
		},

		fitInfo : function(animated){
			var current = this.jp_carousel('selectedSlide'),
				size = current.jp_carousel('bestFit');

			photo_info.css({
				'left'  : (info.width() - size.width) * 0.5,
				'width' : size.width
			});

			if (isMobile){
				photo_info.css('left', '0px');
				photo_info.css('top', '-20px');
			}

			return this;
		},

		fitMeta : function(animated){
			var newInfoTop   = { top: ( $(window).height() / 100 * proportion + 5 ) + 'px' };
			var newLeftWidth = { width: ( info.width() - (imageMeta.width() + 80) ) + 'px' };

			if (animated) {
				info.animate(newInfoTop);
				leftColWrapper.animate(newLeftWidth);
			} else {
				info.animate(newInfoTop);
				leftColWrapper.css(newLeftWidth);
			}
		},

		fitSlide : function(animated){
			return this.each(function(){
				var selected   = gallery.jp_carousel('selectedSlide'),
				    $this      = $(this),
				    dimensions = $this.jp_carousel('bestFit'),
				    method     = 'css',
				    max        = gallery.jp_carousel('slideDimensions');

				dimensions.left = 0;
				dimensions.top = ( (max.height - dimensions.height) * 0.5 ) + 40;
				$this[method](dimensions);
			});
		},

		texturize : function(text) {
				text = new String(text); // make sure we get a string. Title "1" came in as int 1, for example, which did not support .replace().
				text = text.replace(/'/g, '&#8217;').replace(/&#039;/g, '&#8217;').replace(/[\u2019]/g, '&#8217;');
				text = text.replace(/"/g, '&#8221;').replace(/&#034;/g, '&#8221;').replace(/&quot;/g, '&#8221;').replace(/[\u201D]/g, '&#8221;');
				text = text.replace(/([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"'); // untexturize allowed HTML tags params double-quotes
				return $.trim(text);
		},

		initSlides : function(items, start_index){
			var width = this.jp_carousel('slideDimensions').width,
				x = 0;

			// Calculate the new src.
			items.each(function(i){
				var src_item  = $(this),
					orig_size = src_item.data('orig-size') || '',
					max       = gallery.jp_carousel('slideDimensions'),
					parts     = orig_size.split(',');
					orig_size = {width: parseInt(parts[0], 10), height: parseInt(parts[1], 10)},
					medium_file     = src_item.data('medium-file') || '',
					large_file      = src_item.data('large-file') || '';

					src = src_item.data('orig-file');

					src = gallery.jp_carousel('selectBestImageSize', {
						orig_file   : src,
						orig_width  : orig_size.width,
						orig_height : orig_size.height,
						max_width   : max.width,
						max_height  : max.height,
						medium_file : medium_file,
						large_file  : large_file
					});

				// Set the final src
				$(this).data( 'gallery-src', src );
			});

			// If the start_index is not 0 then preload the clicked image first.
			if ( 0 !== start_index )
				$('<img/>')[0].src = $(items[start_index]).data('gallery-src');

			// create the 'slide'
			items.each(function(i){
				var src_item        = $(this),
					attachment_id   = src_item.data('attachment-id') || 0,
					comments_opened = src_item.data('comments-opened') || 0,
					image_meta      = src_item.data('image-meta') || {},
					orig_size       = src_item.data('orig-size') || '',
					title           = src_item.data('image-title') || '',
					description     = src_item.data('image-description') || '',
					caption         = src_item.parents('dl').find('dd.gallery-caption').html() || '',
					src		= src_item.data('gallery-src') || '',
					medium_file     = src_item.data('medium-file') || '',
					large_file      = src_item.data('large-file') || '',
					orig_file	= src_item.data('orig-file') || '';

				var tiledCaption = src_item.parents('div.tiled-gallery-item').find('div.tiled-gallery-caption').html();
				if ( tiledCaption )
					caption = tiledCaption;

				if ( attachment_id && orig_size.length ) {
					title       = gallery.jp_carousel('texturize', title);
					description = gallery.jp_carousel('texturize', description);
					caption     = gallery.jp_carousel('texturize', caption);

					var slide = $('<div class="jp-carousel-slide"></div>')
							.hide()
							.css({
								//'position' : 'fixed',
								'left'     : i < start_index ? -1000 : gallery.width()
							})
							.append($('<img>'))
							.appendTo(gallery)
							.data('src', src )
							.data('title', title)
							.data('desc', description)
							.data('caption', caption)
							.data('attachment-id', attachment_id)
							.data('permalink', src_item.parents('a').attr('href'))
							.data('orig-size', orig_size)
							.data('comments-opened', comments_opened)
							.data('image-meta', image_meta)
							.data('medium-file', medium_file)
							.data('large-file', large_file)
							.data('orig-file', orig_file)
							.jp_carousel('fitSlide', false);

					// Preloading all images
					slide.find('img').first().attr('src', src );
				}
			});
			return this;
		},

		selectBestImageSize: function(args) {
			if ( 'object' != typeof args )
				args = {};

			if ( 'undefined' == typeof args.orig_file )
				return '';

			if ( 'undefined' == typeof args.orig_width || 'undefined' == typeof args.max_width )
				return args.orig_file;

			if ( 'undefined' == typeof args.medium_file || 'undefined' == typeof args.large_file )
				return args.orig_file;

			var medium_size       = args.medium_file.replace(/-([\d]+x[\d]+)\..+$/, '$1'),
				medium_size_parts = (medium_size != args.medium_file) ? medium_size.split('x') : [args.orig_width, 0],
				medium_width      = parseInt( medium_size_parts[0], 10 ),
				medium_height     = parseInt( medium_size_parts[1], 10 ),
				large_size        = args.large_file.replace(/-([\d]+x[\d]+)\..+$/, '$1'),
				large_size_parts  = (large_size != args.large_file) ? large_size.split('x') : [args.orig_width, 0],
				large_width       = parseInt( large_size_parts[0], 10 ),
				large_height      = parseInt( large_size_parts[1], 10 );

			// Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
			if ('undefined' != typeof window.devicePixelRatio && window.devicePixelRatio > 1) {
				args.max_width  = args.max_width * window.devicePixelRatio;
				args.max_height = args.max_height * window.devicePixelRatio;
			}

			if ( large_width >= args.max_width || large_height >= args.max_height )
				return args.large_file;

			if ( medium_width >= args.max_width || medium_height >= args.max_height )
				return args.medium_file;

			return args.orig_file;
		},


		originalDimensions: function() {
			var splitted = $(this).data('orig-size').split(',');
			return {width: parseInt(splitted[0], 10), height: parseInt(splitted[1], 10)};
		},

		format: function( args ) {
			if ( 'object' != typeof args )
				args = {};
			if ( ! args.text || 'undefined' == typeof args.text )
				return;
			if ( ! args.replacements || 'undefined' == typeof args.replacements )
				return args.text;
			return args.text.replace(/{(\d+)}/g, function(match, number) {
				return typeof args.replacements[number] != 'undefined' ? args.replacements[number] : match;
			});
		},

		shutterSpeed: function(d) {
			if (d >= 1)
				return Math.round(d) + 's';
			var df = 1, top = 1, bot = 1;
			var limit = 1e5; //Increase for greater precision.
			while (df != d && limit-- > 0) {
				if (df < d) {
					top += 1;
				}
				else {
					bot += 1;
					top = parseInt(d * bot, 10);
				}
				df = top / bot;
			}
			if (top > 1) {
				bot = Math.round(bot / top);
				top = 1;
			}
			if (bot <= 1)
				return '1s';
			return top + '/' + bot + 's';
		},

		parseTitleDesc: function( value ) {
			if ( !value.match(' ') && value.match('_') )
				return '';
			// Prefix list originally based on http://commons.wikimedia.org/wiki/MediaWiki:Filename-prefix-blacklist
			var prefixes = $([
				'CIMG',                   // Casio
				'DSC_',                   // Nikon
				'DSCF',                   // Fuji
				'DSCN',                   // Nikon
				'DUW',                    // some mobile phones
				'GEDC',                   // GE
				'IMG',                    // generic
				'JD',                     // Jenoptik
				'MGP',                    // Pentax
				'PICT',                   // misc.
				'Imagen',                 // misc.
				'Foto',                   // misc.
				'DSC',                    // misc.
				'Scan',                   // Scanners
				'SANY',                   // Sanyo
				'SAM',                    // Samsung
				'Screen Shot [0-9]+'      // Mac screenshots
			])
			.each(function(key, val){
				regex = new RegExp('^' + val);
				if ( regex.test(value) ) {
					value = '';
					return;
				}
			});
			return value;
		},

		getTitleDesc: function( data ) {
			var title ='', desc = '', markup = '', target, commentWrappere;

			target = $( 'div.jp-carousel-titleanddesc', 'div.jp-carousel-wrap' );
			target.hide();

			title = gallery.jp_carousel('parseTitleDesc', data.title) || '';
			desc  = gallery.jp_carousel('parseTitleDesc', data.desc)  || '';

			if ( title.length || desc.length ) {
				// $('<div />').text(sometext).html() is a trick to go to HTML to plain text (including HTML entities decode, etc)
				if ( $('<div />').text(title).html() == $('<div />').text(desc).html() )
					title = '';

				markup  = ( title.length ) ? '<div class="jp-carousel-titleanddesc-title">' + title + '</div>' : '';
				markup += ( desc.length )  ? '<div class="jp-carousel-titleanddesc-desc">' + desc + '</div>'   : '';

				target.html( markup ).fadeIn('slow');
			}

			$( 'div#jp-carousel-comment-form-container' ).css('margin-top', '20px');
			$( 'div#jp-carousel-comments-loading' ).css('margin-top', '20px');
		},

		updateLikesWidgetVisibility: function( attachmentId ) {
			// Hide all likes widgets except for the one for the attachmentId passed in

			$( '.jp-carousel-buttons' ).find( '.jetpack-likes-widget-wrapper' ).each( function() {
				var widgetWrapper = $( this );
				if ( widgetWrapper.attr('data-attachment-id') == attachmentId ) {
					widgetWrapper.css( 'display', 'inline-block' );
				} else {
					widgetWrapper.css( 'display', 'none' );
				}
				});
		},

		// updateExif updates the contents of the exif UL (.jp-carousel-image-exif)
		updateExif: function( meta ) {
			if ( !meta || 1 != jetpackCarouselStrings.display_exif )
				return false;

			var $ul = $( "<ul class='jp-carousel-image-exif'></ul>" );
			$.each( meta, function( key, val ) {
				if ( 0 === parseFloat(val) || !val.length || -1 === $.inArray( key, [ 'camera', 'aperture', 'shutter_speed', 'focal_length' ] ) )
					return;

				switch( key ) {
					case 'focal_length':
						val = val + 'mm';
						break;
					case 'shutter_speed':
						val = gallery.jp_carousel('shutterSpeed', val);
						break;
					case 'aperture':
						val = 'f/' + val;
						break;
					default:
						// making jslint happy
						break;
				}

				$ul.append( '<li><h5>' + jetpackCarouselStrings[key] + '</h5>' + val + '</li>' );
			});

			// Update (replace) the content of the ul
			$( 'div.jp-carousel-image-meta ul.jp-carousel-image-exif' ).replaceWith( $ul );
		},

		// updateFullSizeLink updates the contents of the jp-carousel-image-download link
		updateFullSizeLink: function(current) {
			if(!current || !current.data)
				return false;
			var original  = current.data('orig-file').replace(/\?.+$/, ''),
				origSize  = current.data('orig-size').split(','),
				permalink = $( '<a>'+gallery.jp_carousel('format', {'text': jetpackCarouselStrings.download_original, 'replacements': origSize})+'</a>' )
					.addClass( 'jp-carousel-image-download' )
					.attr( 'href', original )
					.attr( 'target', '_blank' );

			// Update (replace) the content of the anchor
			$( 'div.jp-carousel-image-meta a.jp-carousel-image-download' ).replaceWith( permalink );
		},

		updateMap: function( meta ) {
			if ( !meta.latitude || !meta.longitude || 1 != jetpackCarouselStrings.display_geo )
				return;

			var latitude  = meta.latitude,
				longitude = meta.longitude,
				$metabox  = $( 'div.jp-carousel-image-meta', 'div.jp-carousel-wrap' ),
				$mapbox   = $( '<div></div>' ),
				style     = '&scale=2&style=feature:all|element:all|invert_lightness:true|hue:0x0077FF|saturation:-50|lightness:-5|gamma:0.91';

			$mapbox
				.addClass( 'jp-carousel-image-map' )
				.html( '<img width="154" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=8&\
							size=154x154&\
							sensor=false&\
							markers=size:medium%7Ccolor:blue%7C' + latitude + ',' + longitude + style +'" class="gmap-main" />\
							\
						<div class="gmap-topright"><div class="imgclip"><img width="175" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=3&\
							size=175x154&\
							sensor=false&\
							markers=size:small%7Ccolor:blue%7C' + latitude + ',' + longitude + style + '"c /></div></div>\
							\
						' )
				.prependTo( $metabox );
		},

		testCommentsOpened: function( opened ) {
			if ( 1 == parseInt( opened, 10 ) ) {
					$('.jp-carousel-buttons').fadeIn('fast');
				commentForm.fadeIn('fast');
			} else {
					$('.jp-carousel-buttons').fadeOut('fast');
				commentForm.fadeOut('fast');
			}
		},

		getComments: function( args ) {
			if ( 'object' != typeof args )
				args = {};

			if ( ! args.attachment_id || 'undefined' == typeof args.attachment_id )
				return;

			if ( ! args.offset || 'undefined' == typeof args.offset || args.offset < 1 )
				args.offset = 0;

			var comments        = $('.jp-carousel-comments'),
				commentsLoading = $('#jp-carousel-comments-loading');

			commentsLoading.show();

			if ( args.clear ) {
				comments.hide();
				comments.empty();
			}

			$.ajax({
				type:       'GET',
				url:        jetpackCarouselStrings.ajaxurl,
				dataType:   'json',
				data: {
					action: 'get_attachment_comments',
					nonce:  jetpackCarouselStrings.nonce,
					id:     args.attachment_id,
					offset: args.offset
				},
				success: function(data, status, xhr) {
					if ( args.clear ) {
						comments.fadeOut('fast');
						comments.empty();
					}

					$( data ).each(function(){
						var comment = $('<div></div>')
							.addClass('jp-carousel-comment')
							.attr('id', 'jp-carousel-comment-' + this['id'])
							.css({})
							.html(
								  '<div class="comment-gravatar">'
								+   this['gravatar_markup']
								+ '</div>'
								+ '<div class="comment-author">'
								+   this['author_markup']
								+ '</div>'
								+ '<div class="comment-date">'
								+   this['date_gmt']
								+ '</div>'
								+ '<div class="comment-content">'
								+   this['content']
								+ '</div>'
							);
						comments.append(comment);

						// Set the interval to check for a new page of comments.
						clearInterval( commentInterval );
						commentInterval = setInterval( function() {
							if ( ( $('.jp-carousel-overlay').height() - 150 ) < $('.jp-carousel-wrap').scrollTop() + $(window).height() ) {
								gallery.jp_carousel('getComments',{ attachment_id: args.attachment_id, offset: args.offset + 10, clear: false });
								clearInterval( commentInterval );
							}
						}, 150 );
					});

					// Verify (late) that the user didn't repeatldy click the arrows really fast, in which case the requested
					// attachment id might no longer match the current attachment id by the time we get the data back or a now
					// registered infiniscroll event kicks in, so we don't ever display comments for the wrong image by mistake.
					var current = $('.jp-carousel div.selected');
					if ( current && current.data && current.data('attachment-id') != args.attachment_id ) {
						comments.fadeOut('fast');
						comments.empty();
						return;
					}

					// Increase the height of the background, semi-transparent overlay to match the new length of the comments list.
					$('.jp-carousel-overlay').height( $(window).height() + titleAndDescription.height() + commentForm.height() + ( (comments.height() > 0) ? comments.height() : imageMeta.height() ) + 200 );

					comments.show();
					commentsLoading.hide();
				},
				error: function(xhr, status, error) {
					// TODO: proper error handling
					console.log( 'Comment get fail...', xhr, status, error );
					comments.fadeIn('fast');
					commentsLoading.fadeOut('fast');
				}
			});
		},

		postCommentError: function(args) {
			if ( 'object' != typeof args )
				args = {};
			if ( ! args.field || 'undefined' == typeof args.field ||  ! args.error || 'undefined' == typeof args.error )
				return;
			$('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">'+args.error+'</span>').slideDown('fast');
			$('#jp-carousel-comment-form-spinner').spin(false);
		},

		setCommentIframeSrc: function(attachment_id) {
			var iframe = $('#jp-carousel-comment-iframe');
			// Set the proper irame src for the current attachment id
			if (iframe && iframe.length) {
				iframe.attr('src', iframe.attr('src').replace(/(postid=)\d+/, '$1'+attachment_id) );
				iframe.attr('src', iframe.attr('src').replace(/(%23.+)?$/, '%23jp-carousel-'+attachment_id) );
			}
		},

		clearCommentTextAreaValue: function() {
			var commentTextArea = $('#jp-carousel-comment-form-comment-field');
			if ( commentTextArea )
				commentTextArea.val('');
		}
	};

	$.fn.jp_carousel = function(method){
		// ask for the HTML of the gallery
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.open.apply( this, arguments );
		} else {
			$.error( 'Method ' +	method + ' does not exist on jQuery.jp_carousel' );
		}

	};

	// register the event listener for starting the gallery
	$( document.body ).on( 'click', 'div.gallery,div.tiled-gallery', function(e) {
		if ( ! $(this).jp_carousel( 'testForData', e.currentTarget ) )
			return;
		if ( $(e.target).parent().hasClass('gallery-caption') )
			return;
		e.preventDefault();
		$(this).jp_carousel('open', {start_index: $(this).find('.gallery-item, .tiled-gallery-item').index($(e.target).parents('.gallery-item, .tiled-gallery-item'))});
	});

	// Set an interval on page load to load the carousel if hash exists and not already opened.
	// Makes carousel work on page load and when back button leads to same URL with carousel hash (ie: no actual document.ready trigger)
	$(document).ready(function(){
		last_known_location_hash = '';

		var jp_carousel_open_interval = window.setInterval(function(){
			// We should have a URL hash by now.
			if ( ! document.location.hash || ! document.location.hash.match(/jp-carousel-(\d+)/) )
				return;

			if ( document.location.hash == last_known_location_hash )
				return;

			last_known_location_hash = document.location.hash;

			var gallery = $('div.gallery, div.tiled-gallery'), index = -1, n = document.location.hash.match(/jp-carousel-(\d+)/);

			if ( ! $(this).jp_carousel( 'testForData', gallery ) )
				return;

			n = parseInt(n[1], 10);

			gallery.find('img').each(function(num, el){
				if ( n && $(el).data('attachment-id') == n ) { // n cannot be 0 (zero)
					index = num;
					return false;
				}
			});

			if ( index != -1 )
				gallery.jp_carousel('open', {start_index: index}); // open method checks if already opened
		}, 1000);
	});
});

// Swipe gesture detection
(function($){$.fn.touchwipe=function(settings){var config={min_move_x:20,min_move_y:20,wipeLeft:function(){},wipeRight:function(){},wipeUp:function(){},wipeDown:function(){},preventDefaultEvents:true};if(settings)$.extend(config,settings);this.each(function(){var startX;var startY;var isMoving=false;function cancelTouch(){this.removeEventListener('touchmove',onTouchMove);startX=null;isMoving=false}function onTouchMove(e){if(config.preventDefaultEvents){e.preventDefault()}if(isMoving){var x=e.touches[0].pageX;var y=e.touches[0].pageY;var dx=startX-x;var dy=startY-y;if(Math.abs(dx)>=config.min_move_x){cancelTouch();if(dx>0){config.wipeLeft()}else{config.wipeRight()}}else if(Math.abs(dy)>=config.min_move_y){cancelTouch();if(dy>0){config.wipeDown()}else{config.wipeUp()}}}}function onTouchStart(e){if(e.touches.length==1){startX=e.touches[0].pageX;startY=e.touches[0].pageY;isMoving=true;this.addEventListener('touchmove',onTouchMove,false)}}if('ontouchstart'in document.documentElement){this.addEventListener('touchstart',onTouchStart,false)}});return this}})(jQuery);
