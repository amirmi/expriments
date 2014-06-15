$(document).ready(function () {
    freesound.setToken("f1a50772c4d7af4d54180a2ae7ea48a5787301cf");

    var onChange = _.throttle(onSearchChanged, 300, {leading: false});

    $("#search").keyup(onChange)
})

function onSearchChanged(e) {
    var val = $(e.currentTarget).val();
    $(".results").children().remove();
    freesound.textSearch(val, {
        "filter": 'duration:[1 TO 15]'
    }, function (response) {
        for (var i = 0; i < response.results.length; i++) {
            var result = response.results[i];
            var compiled = Handlebars.compile($("#template-item").html());
            result.name = result.name.replace(".wav", "")
            var html = compiled(result);
            var $item = $(html);
            var $title = $item.find(".result-title");
            $title.data("d", result);
            $title.click(onItemClick)
          $(".results").append($item);
        }
    });
}

function onItemClick(e) {
    var $title = $(e.currentTarget);
    var data = $title.data("d");
    freesound.getSound(data.id, function (sound) {
        var ctrl = $title.find("+ .control");
        var $audio = ctrl.find("audio");

        if ($audio.length == 0) {
            var t = _.template('<audio controls>' +
                '<source src="<%=ogg %>" type="audio/ogg">' +
                '<source src="<%= mp3 %>" type="audio/mpeg">' +
                'Your browser does not support the audio element.' +
                '</audio>')

            var mp3Url = sound.previews["preview-lq-mp3"];
            var html = t({
                mp3: mp3Url,
                ogg: sound.previews["preview-lq-ogg"]
            });
            $audio = $(html)
            ctrl.append($audio);
        }

        var audioElem = $audio.get(0);

        audioElem.play();


    })
}
