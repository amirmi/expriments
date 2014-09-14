// draw the clock
window.personCounter = -1;




$(document).ready(function () {

    var clock = window.clock = new Clock();
    $("#goBtn").click(clock.go.bind(clock))
    $("#max-seconds").change(clock.reset.bind(clock))
});


var Clock = function () {
    this.reset();
}

Clock.prototype.reset = function () {
    this.MAX_SECS = $("#max-seconds").val() || 42;
    this.radius = 180;
    this.margin = 20;
    this.msPassed = 0;
    this.msOffset = 100;
    this.center = this.radius + this.margin;
    this.answers = {};
    this.countOfVoters = 0;
    this._timeEnd = false;


    $("#tiktok_svg").children().remove();
    $("#answers").children().remove();
    $(".all-answers").children().remove();
    $("#info").removeClass("finito");
    clearInterval(window.interval);

    var $totalTime = $("#time_state .total");
    $totalTime.text(this.MAX_SECS);

    $("#clock-container").show();

    //Use YOUR Firebase URL (not the one below)
    this.questions = new Firebase("https://tiktokapp.firebaseio.com/questions");
    this.answers = new Firebase("https://tiktokapp.firebaseio.com/questions/mock/answers");
    this.answers.off();

    this.answers.on('child_added', this.onAnswerRecieved.bind(this));


};

Clock.prototype.go = function () {
    $("#clock-container").removeClass("hide");

    this.reset();

    // Randomize user answers times
    mock_times = [];
    for (i = 0; i < 20; i++) {
        mock_times.push(getRandomInt(0, this.MAX_SECS * 1000))
    }

    mock_times.sort();

    var center = this.center;
    var $secondsLeft = $(".seconds_left");
    var $totalTime = $(".total");

    var arcElem = d3.select("#tiktok_svg").append("path")
        .attr("id", "arc")
        .attr("transform", "translate(" + center + ',' + center + ")")


    window.interval = setInterval(function () {
        if (this._timeEnd)
            return;

        this.msPassed += this.msOffset;

        // for mock
        if (mock_times[0] <= this.msPassed) {
            this.onAnswerRecieved();
            mock_times.shift();
        }

        this.secondsPassed = this.msPassed / 1000;

        $secondsLeft.text(this.MAX_SECS - Math.floor(this.secondsPassed));
        var fill_state;
        var angle = this.secondsPassed * (360 / this.MAX_SECS);

        var angleInRad = angle * (Math.PI / 180);

        this.angleInRad = angleInRad;


        if (angle <= 90) {
            fill_state = "defconA"
        }
        else if (angle <= 180) {
            fill_state = "defconB"
        }
        else if (angle <= 270) {
            fill_state = "defconC"
        }
        else if (angle < 360) {
            fill_state = "defconD"
        }
        else {
            fill_state = "filled"
        }

        var arc = d3.svg.arc()
            .innerRadius(this.radius / 2)
            .outerRadius(this.radius)
            .startAngle(0) //converting from degs to radians
            .endAngle(angleInRad) //just radians

        arcElem
            .attr("class", fill_state)
            .attr("d", arc)

        this.currentArc = arc;

        if (this.secondsPassed === this.MAX_SECS) {
            this._onTimeEnd()
            return;
        }

    }.bind(this), this.msOffset)
};

Clock.prototype._onTimeEnd = function () {
    this._timeEnd = true;
    clearInterval(window.interval);
    if (this._lastAnswer) {
        $(this._lastAnswer).tooltip("hide");
    }

    $(".answer-title").text("Best Answer:")
    $("#info").addClass("finito");

    // create pie

    var w = 100;
    var h = 100;
    var r = h / 2;
    var color = d3.scale.category20c();


    var vis = d3.select('.all-answers')
        .append("svg:svg")
        .data([answers])
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(" + r + "," + r + ")");


    var pie = d3.layout.pie().value(function (d) {
        return this.answers[d];
    }.bind(this));

    // declare an arc generator function
    var arc = d3.svg.arc().outerRadius(r);

    // select paths, use arc generator to draw
    var arcs = vis.selectAll("g.slice")
        .data(pie)
        .enter()
        .append("svg:g")
        .attr("class", "slice");

    arcs.append("svg:path")
        .attr("fill", function (d, i) {
            return color(i);
        })
        .attr("d", function (d) {
            // log the result of the arc generator to show how cool it is :)
            console.log(arc(d));
            return arc(d);
        });

};

var answers = ["Chez Maman!", "Landver", "Mission Beach Cafe", "Zazzie"];


Clock.prototype.onAnswerRecieved = function () {
    var that = this;

    $.ajax({
        url: 'http://api.randomuser.me/',
        dataType: 'json',
        success: function (data) {
            if (that._timeEnd)
                return;


            var angle = this.angleInRad - (Math.PI / 2);
            var x = this.center + this.radius * Math.cos(angle)
            var y = this.center + this.radius * Math.sin(angle)


            var answerDiv = d3.select("#answers").append("div")
                .attr("class", "answer")
                .attr("angle", angle / (Math.PI / 180))
                .style("background-image", "url(" + data.results[0].user.picture.thumbnail + ")")
                .style("top", function (d) {
                    return y + "px";
                })
                .style("left", function (d) {
                    return x + "px";
                })
                .each(function () {
                    var randomInt = getRandomInt(0, 3);
                    var answer = answers[randomInt];
                    if (that.answers[answer] === undefined)
                        that.answers[answer] = -1;

                    that.answers[answer]++;
                    that.countOfVoters++;

                    if (that._lastAnswer) {
                        $(that._lastAnswer).tooltip("hide");
                    }

                    $(this).tooltip({
                        animation: true,
                        title: capitaliseFirstLetter(data.results[0].user.name.first) + " says: " + answer,
                        placement: "right"
                    })

                    $(this).tooltip("show");

                    that._lastAnswer = this;
                })


            this.updateDisplay();

        }.bind(this)
    });

};

Clock.prototype.updateDisplay = function () {
    var bestAnswer;

    for (i = 0; i < answers.length; i++) {
        var answer = answers[i];
        if (!bestAnswer) {
            bestAnswer = answer;
        }
        else {
            if (this.answers[bestAnswer] < this.answers[answer]) {
                bestAnswer = answer;
            }
        }
    }
    $(".best-answer").text(bestAnswer);
    $(".voters").text(this.countOfVoters + " has voted!");
}



function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}