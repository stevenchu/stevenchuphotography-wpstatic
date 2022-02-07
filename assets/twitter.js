function format_tweets(tweetdata) {
    var statusHTML = [];
    for (var i = 0; i < tweetdata.length; i++) {
        var username = tweetdata[i].user.screen_name;
        var status = tweetdata[i].text.replace(/(((f|ht){1}tp:\/\/)[-a-zA-Z0-9@:%_\+.~#?&//=]+)/g,
            function(url) {
                return '<a href="' + url + '">' + url + '</a>';
            }).replace(/\B#(\w+)/g,
            function(hash) {
                return  hash.charAt(0) + '<a href="http://search.twitter.com/search?q=' + hash.substring(1) + '">' + hash.substring(1) + '</a>';
            }).replace(/\B@([_a-z0-9]+)/ig, function(reply) {
                return  reply.charAt(0) + '<a href="http://twitter.com/' + reply.substring(1) + '">' + reply.substring(1) + '</a>';
            });
        statusHTML.push('<li><span>' + status + '</span><small><a href="http://twitter.com/' + username + '/statuses/' + tweetdata[i].id_str + '">' + relative_time(tweetdata[i].created_at) + '</a></small></li>');
    }
    return statusHTML.join('');
}

function relative_time(time_value) {
    var values = time_value.split(" ");
    time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
    var parsed_date = Date.parse(time_value);
    var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
    var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
    delta = delta + (relative_to.getTimezoneOffset() * 60);

    if (delta < 60) {
        return 'less than a minute ago';
    } else if (delta < 120) {
        return 'about a minute ago';
    } else if (delta < (60 * 60)) {
        return (parseInt(delta / 60)).toString() + ' minutes ago';
    } else if (delta < (120 * 60)) {
        return 'about an hour ago';
    } else if (delta < (24 * 60 * 60)) {
        return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
    } else if (delta < (48 * 60 * 60)) {
        return '1 day ago';
    } else {
        return (parseInt(delta / 86400)).toString() + ' days ago';
    }
}