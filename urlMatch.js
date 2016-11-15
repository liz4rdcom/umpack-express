var wildcard = '*';

function urlMatch(templateUrls, urlWithQuery) {

    var url = trimUrl(urlWithQuery.split('?')[0]);

    var templateUrlArrays = templateUrls.map(function(templateUrl) {

        var trimedUrl = trimUrl(templateUrl);
        var array = trimedUrl.split('/');

        return array;
    });

    var urlArray = url.split('/');

    for (var i = 0; i < templateUrlArrays.length; i++) {
        var array = templateUrlArrays[i];

        if (matchUrlArrayToTemplate(array, urlArray)) return true;
    }

    return false;

}

function trimUrl(url) {
    var startPos = url[0] === '/' ? 1 : 0;
    var endPos = url[url.length - 1] === '/' ? url.length - 1 : url.length;

    return url.substring(startPos, endPos);
}



function matchUrlArrayToTemplate(templateUrlArray, urlArray) {

    if (!wordsCountFitsWell(templateUrlArray, urlArray)) return false;

    for (var i = 0; i < templateUrlArray.length; i++) {
        var templatePart = templateUrlArray[i];

        if (templatePart === wildcard) continue;

        if (templatePart !== urlArray[i]) return false;
    }

    return true;
}

function wordsCountFitsWell(templateArray, urlArray) {
    if (templateArray[templateArray.length - 1] === wildcard) {
        return templateArray.length - 1 <= urlArray.length;
    }

    return templateArray.length === urlArray.length;
}

module.exports = urlMatch;
