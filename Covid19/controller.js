$(document).ready(function() {
    $('#ftu-btn').click();
});
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 650;
const MOBILE_CANVAS_WIDTH = 350;
const MOBILE_CANVAS_HEIGHT = 700;

const colors = { HEALTHY: "#4ecca3", INFECTED: "#ff6363", DECEASED: "#f5f5f5", STAFF: "#4ecca3" }

/*
            (-75,130)    (75,130)
             ____________
            /            \
  (-150,0) /              \(150,0)
           \              /
            \____________/
            (-75,-130)   (75,-130)
width:300*0.25 = 75
height:260*0.25 = 65
*/
let BOXES;
let HOSPITAL;
if (onMobile()) {
    BOXES = [
        [{ x: 126, y: 80 },
            { x: 228.5, y: 80 },
            { x: 74.5, y: 171.5 },
            { x: 176.5, y: 171.5 },
            { x: 278, y: 171.5 },
            { x: 125.5, y: 263.5 },
            { x: 228.5, y: 263.5 }
        ],
        [{ x: 126, y: 400 },
            { x: 228.5, y: 400 },
            { x: 74.5, y: 490 },
            { x: 176.5, y: 490 },
            { x: 278, y: 490 },
            { x: 125.5, y: 583 },
            { x: 228.5, y: 583 }
        ],
    ];
    HOSPITAL = [
        [
            { x: 228.5, y: 80 }
        ],
        [
            { x: 228.5, y: 400 },
            { x: 278, y: 490 }
        ]
    ];
} else {
    BOXES = [
        [{ x: 126, y: 80 },
            { x: 228.5, y: 80 },
            { x: 74.5, y: 171.5 },
            { x: 176.5, y: 171.5 },
            { x: 278, y: 171.5 },
            { x: 125.5, y: 263.5 },
            { x: 228.5, y: 263.5 }
        ],
        [{ x: 431, y: 203 },
            { x: 535.5, y: 203 },
            { x: 380, y: 295 },
            { x: 483, y: 295 },
            { x: 588, y: 295 },
            { x: 431, y: 387 },
            { x: 535.5, y: 387 }
        ],
        [{ x: 126, y: 400 },
            { x: 228.5, y: 400 },
            { x: 74.5, y: 490 },
            { x: 176.5, y: 490 },
            { x: 278, y: 490 },
            { x: 125.5, y: 583 },
            { x: 228.5, y: 583 }
        ],
    ];
    HOSPITAL = [
        [
            { x: 228.5, y: 80 }
        ],
        [
            { x: 431, y: 203 },
            { x: 380, y: 295 },
            { x: 588, y: 295 }
        ],
        [
            { x: 228.5, y: 400 },
            { x: 278, y: 490 }
        ]
    ];
}
const PERSON_RADIUS = 7;
// control params
let PHI = 0.2;
let PID = 0.03;
let P_DETECTION = 0.4;
let SD = 0.01;
let FPS = 12;
let PCENTRAL_LOCATIONS = 0.03;
let P_FROM_CENTRAL_LOCATIONS = 0.9;

// other params
const POP_SIZE = 180; // per city 180 and per hex 30 total 450 + hospital 10 each
const INFECTION_RADIUS = 12;
const INFECTION_DAYS = 21;
const HOSP_DAYS = 50;
const DIRECTION_CHANGE_PROB = 0.5;

let paused = false;
let lockdown = false;
let city_choice = 0;
let sd = false;
let days = 0;
let daystoprint = 0;
let population;
let bed_count = 30;
let population_per_box = 40;
const directions = { UP: "UP", DOWN: "DOWN", LEFT: "LEFT", RIGHT: "RIGHT" };
const status = { HEALTHY: "HEALTHY", INFECTED: "INFECTED", DECEASED: "DECEASED", STAFF: "STAFF" };

// for graph
let daysData;
let healthyData;
let infectedData;
let deceasedData;
let eradicated_days;
let highlight;
if (onMobile()) {
    healthyData = [
        [],
        []
    ];
    infectedData = [
        [],
        []
    ];
    deceasedData = [
        [],
        []
    ];
    eradicated_days = [0, 0];
    highlight = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];
} else {
    healthyData = [
        [],
        [],
        []
    ];
    infectedData = [
        [],
        [],
        []
    ];
    deceasedData = [
        [],
        [],
        []
    ];
    eradicated_days = [0, 0, 0];
    highlight = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];
}

$('#playpause').on('click', togglePause);
$('#reset').on('click', reset);

// Slider handlers
const LOCKDOWN = document.querySelector('#LOCKDOWN');
$('#LOCKDOWN').change(function() {
    if ($(this).is(':checked')) {
        lockdown = true;
        SD = 0.8;
        PHI = 0.02;
    } else {
        lockdown = false;
        SD = 0.1;
        PHI = 0.2;
    }
});

$('#SD').change(function() {
    if ($(this).is(':checked')) {
        if ($('#LOCKDOWN').is(':checked')) {
            sd = 0.8;
            PHI = 0.02;
        } else {
            sd = 0.4;
            PHI = 0.2;
        }
        sd = true;
    } else {
        sd = false;
        SD = 0.1;
        PHI = 0.1;
    }
});

$('#cityA').change(function() {
    if ($(this).is(':checked')) {
        city_choice = 0;
        if (days > 1) {
            drawGraph();
        }
    }
});

$('#cityB').change(function() {
    if ($(this).is(':checked')) {
        city_choice = 1;
        if (days > 1) {
            drawGraph();
        }
    }
});

$('#cityC').change(function() {
    if ($(this).is(':checked')) {
        city_choice = 2;
        if (days > 1) {
            drawGraph();
        }
    }
});

$('#cityA').change(function() {
    if ($(this).is(':checked')) {
        city_choice = 0;
        if (days > 1) {
            drawGraph();
        }
    }
});

$('#NO_BED').on("input", function(e) {
    /*if(days>1){
        $(this).disabled=true;
    }else{*/
    var input = $(this);
    var val = input.val();
    bed_count = parseInt(val);
    setupControls();
    setupPopulation();
    paused = false;
    //}
});

$('#POP_PER_BOX').on("input", function(e) {
    /*if(days>2){
        $(this).disabled = true;
    }else{*/
    var input = $(this);
    var val = input.val();
    population_per_box = parseInt(val);
    setupControls();
    setupPopulation();
    paused = false;
    redraw();
    //}
});

const FPS_slider = document.querySelector('#FPS-slider');
FPS_slider.addEventListener('input', e => {
    FPS += (FPS_slider.value - FPS)
});


function setup() {
    let canvas;
    days = 0;
    blink = false;
    daystoprint = 0;
    if (onMobile()) {
        canvas = createCanvas(MOBILE_CANVAS_WIDTH, MOBILE_CANVAS_HEIGHT);
        background('#222831');
        //BOXES.splice(4, 1);
        //BOXES.splice(2, 1);
    } else {
        canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        background('#222831');
    }
    canvas.parent("canvas-container");
    setGraphOptions();
    setupControls();
    setupPopulation();
}

function draw() {
    if (onMobile()) {
        //scale(0.5);
    }
    background('#222831');
    frameRate(FPS);

    //fill(0);
    strokeWeight(3);

    cityNo = -1;
    BOXES.forEach(city => {
        cityNo++;
        boxNo = -1;
        city.forEach(box => {
            boxNo++;
            if (inArray(box, HOSPITAL)) {
                if (highlight[cityNo][boxNo] == 1) {
                    hexagon(box.x, box.y, 0.4, true, "#ce0505");
                } else {
                    hexagon(box.x, box.y, 0.4, true);
                }
                //extraLeft = $('#canvas-container').position().left + $('.area').position().left - 40;
                extraTop = $('canvas').position().top + 40;
                extraLeft = $('canvas').position().left - 40;
                icon = createElement('i');
                icon.addClass('fa fa-hospital-o fa-lg');
                icon.position(box.x + extraLeft, box.y + extraTop);
                icon.style('color', '#222831');
                icon.style('font-size', '40px');
                //icon.style('opacity',0.5);
            }
            /*else if(city.indexOf(box)==3){
                            stroke(255);
                            hexagon(box.x,box.y,0.4,false);
                            extraLeft = $('#canvas-container').position().left + $('.area').position().left-58;
                            extraTop = $('#canvas-container').position().top-6;
                            icon = createElement('i');
                            icon.addClass('fas fa-shopping-cart fa-3x');
                            icon.position(box.x+extraLeft, box.y+extraTop);
                            icon.style('color','#222831');
                            //icon.style('opacity','0.6');
                        }*/
            else {
                hexagon(box.x, box.y, 0.4, false);
            }
        });
        p = createP(String.fromCharCode(97 + BOXES.indexOf(city)).toUpperCase());
        p.style('font-size', '30px');
        let ex;
        if (onMobile()) {
            ex = 70;
        } else {
            ex = 30;
        }
        p.position(city[4].x + $('canvas').position().left, city[1].y + $('canvas').position().top + 40);
    });
    drawPopulation();
    nextRound();
}

function setGraphOptions() {
    let w;
    if (onMobile()) {
        w = 320;
    } else {
        w = 700;
    }
    Highcharts.setOptions({
        chart: {
            backgroundColor: "#222831",
            height: 500,
            width: w
        },
        title: {
            style: { color: '#bbb' }
        },
        credits: { enabled: false },
        yAxis: { gridLineColor: '#333' },
        legend: {
            itemStyle: { color: '#bbb' },
            itemHoverStyle: { color: '#FFF' },
            itemHiddenStyle: { color: '#606063' }
        }
    });
}

function setupControls() {
    FPS_slider.value = FPS;
    $('#BED_NO').value = bed_count;
    $('#POP_PER_BOX').value = population_per_box;
}

function setupPopulation() {
    days = 0;

    population = [];

    daysData = [];
    if (onMobile()) {
        healthyData = [
            [],
            []
        ];
        infectedData = [
            [],
            []
        ];
        deceasedData = [
            [],
            []
        ];
        eradicated_days = [0, 0];
        highlight = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
    } else {
        healthyData = [
            [],
            [],
            []
        ];
        infectedData = [
            [],
            [],
            []
        ];
        deceasedData = [
            [],
            [],
            []
        ];
        eradicated_days = [0, 0, 0];
        highlight = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
    }
    $("#eradicated").html("");
    count = 0;
    for (let i = 0; i < BOXES.length; i++) {
        let cityNo = i;
        for (let j = 0; j < 7 * population_per_box; j++) {
            let boxNo = j % 7;
            if (!inArray(BOXES[cityNo][boxNo], HOSPITAL)) {
                population[count] = getpoint(BOXES[cityNo][boxNo].x, BOXES[cityNo][boxNo].y);
                let dir = Object.keys(directions)[randomIntFromRange(0, 3)];
                population[count].dir = dir;
                population[count].status = status.HEALTHY;
                population[count].city = BOXES[cityNo];
                population[count].cityNo = cityNo;
                population[count].boxNo = boxNo;
                population[count].box = BOXES[cityNo][boxNo];
                population[count].isTravelling = false;
                count++;
            }
        }
    }
    for (let i = 0; i < HOSPITAL.length; i++) {
        for (let j = 0; j < HOSPITAL[i].length * 10; j++) {
            k = j % HOSPITAL[i].length;
            population[count] = getpoint(HOSPITAL[i][k].x, HOSPITAL[i][k].y);
            let dir = Object.keys(directions)[randomIntFromRange(0, 3)];
            population[count].dir = dir;
            population[count].status = status.STAFF;
            population[count].city = BOXES[i];
            population[count].cityNo = i;
            bn = FindMyindex(BOXES[i], HOSPITAL[i][k]);
            population[count].boxNo = bn;
            population[count].box = BOXES[i][bn];
            population[count].isTravelling = false;
            count++;
        }
    }
    // Randomly infect one
    flag = [0, 0, 0];
    population.forEach(person => {
        if (person.boxNo == 3 && flag[person.cityNo] == 0) {
            flag[person.cityNo] = 1;
            person.status = status.INFECTED;
            person.infectedDays = 0;
        }
    });

    updateStats();

    // Start with pause
    if (!paused) {
        togglePause();
    }
}

function updateStats() {
    let healthyCount;
    let infectedCount;
    let deceasedCount;
    if (onMobile()) {
        healthyCount = [0, 0];
        infectedCount = [0, 0];
        deceasedCount = [0, 0];
        totalcities = 2;
    } else {
        healthyCount = [0, 0, 0];
        infectedCount = [0, 0, 0];
        deceasedCount = [0, 0, 0];
        totalcities = 3;
    }
    population.forEach(person => {
        if (person.status === status.HEALTHY || person.status === status.STAFF)
            healthyCount[person.cityNo]++;
        if (person.status === status.INFECTED)
            infectedCount[person.cityNo]++;
        if (person.status === status.DECEASED)
            deceasedCount[person.cityNo]++;
    });
    if (days % 25 === 0) {
        daysData.push(days);
        for (i = 0; i < totalcities; i++) {
            healthyData[i].push(healthyCount[i]);
            infectedData[i].push(infectedCount[i]);
            deceasedData[i].push(deceasedCount[i]);
        }
        drawGraph();
    }
    if (infectedCount[city_choice] <= 0) {
        $("#eradicated").html("Epidemic Eradicated!");
        if (onMobile()) {
            highlight = [
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0]
            ];
        } else {
            highlight = [
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0]
            ];
        }
        drawGraph();
        if (eradicated_days[city_choice] == 0) eradicated_days[city_choice] = days;
        if (infectedCount[0] <= 0 && infectedCount[1] <= 0 && infectedCount[2] <= 0) {
            togglePause();
            mtext = "<p>";
            for (i = 0; i < totalcities; i++) {
                mtext += 'Block ' + String.fromCharCode(97 + i).toUpperCase() + '<br>';
                mtext += 'Days required to eradicate pandemic: ' + eradicated_days[i] + '<br>';
                mtext += 'Number of healthy: ' + healthyCount[i] + '<br>';
                mtext += 'Number of deceased: ' + deceasedCount[i] + '<br>';
            }
            mtext += "</p>";
            $('.modal-body').html(mtext);
            $('.btn-invisible').click();
        }
    } else {
        $("#eradicated").html("");
    }

    updateStatsDisplay(healthyCount, infectedCount, deceasedCount);
}

function togglePause() {
    if (paused) {
        paused = false;
        $('#playpause').html("<i class='fa fa-pause'></i>");
        $('#NO_BED').prop('disabled', true);
        $('#POP_PER_BOX').prop('disabled', true);
        loop();
    } else {
        paused = true;
        $('#playpause').html("<i class='fa fa-play'></i>");
        noLoop();
    }
}

function drawGraph() {
    const graph = {};
    if (city_choice == 0) {
        graph.title = { text: "Epidemic Statistics for city A" };
    } else if (city_choice == 1) {
        graph.title = { text: "Epidemic Statistics for city B" };
    } else {
        graph.title = { text: "Epidemic Statistics for city C" };
    }


    graph.xAxis = { categories: daysData };
    graph.yAxis = {
        title: { text: "Number of cases" }
    };

    graph.series = [{
            name: "Healthy",
            data: healthyData[city_choice],
            color: colors[status.HEALTHY]
        },
        {
            name: "Infected",
            data: infectedData[city_choice],
            color: colors[status.INFECTED]
        },
        {
            name: "Deceased",
            data: deceasedData[city_choice],
            color: colors[status.DECEASED]
        }
    ];

    graph.plotOptions = {
        series: {
            marker: {
                enabled: false,
                symbol: "circle"
            },
            animation: false
        }
    };

    $("#graph-container").highcharts(graph);
}

function nextRound() {
    days++;
    $('#day-value').html(days);
    population.forEach(person => {
        if (person.status !== status.DECEASED) {
            if (person.isTravelling) {
                moveTowardDestination(person);
            } else if (random() < SD) {
                person.dir = getSafestDirection(person);
                move(person, person.dir, person.box, person.city);
            }
            // randomly change direction
            else if (random() < DIRECTION_CHANGE_PROB) {
                let dir = Object.keys(directions)[randomIntFromRange(0, 3)];
                person.dir = dir;
                move(person, person.dir, person.box, person.city);
            }
        }
    });

    actions();
    updateStats();
}

function moveTowardDestination(person) {
    let moved = false;
    if (person.x + 20 < person.destinationX) {
        person.x += 10;
        moved = true;
    }
    if (person.x - 20 > person.destinationX) {
        person.x -= 10;
        moved = true;
    }
    if (person.y + 20 < person.destinationY) {
        person.y += 10;
        moved = true;
    }
    if (person.y - 20 > person.destinationY) {
        person.y -= 10;
        moved = true;
    }
    // reached destination
    if (!moved) {
        person.isTravelling = false;
    }
}

function getSafestDirection(person) {
    let leftClosest = 999,
        rightClosest = 999,
        upClosest = 999,
        downClosest = 999;

    population.forEach(p => {
        if (person.box === p.box) {
            let d = squaredDistance(person.x, person.y, p.x, p.y);
            if (p.x < person.x && leftClosest > d)
                leftClosest = d;
            if (p.x > person.x && rightClosest > d)
                rightClosest = d;
            if (p.y > person.y && upClosest > d)
                upClosest = d;
            if (p.y < person.y && downClosest > d)
                downClosest = d;
        }
    });

    let closest = leftClosest;
    let safestDir = directions.RIGHT;
    if (rightClosest < closest) {
        closest = rightClosest;
        safestDir = directions.LEFT;
    }
    if (upClosest < closest) {
        closest = upClosest;
        safestDir = directions.DOWN;
    }
    if (downClosest < closest) {
        closest = downClosest;
        safestDir = directions.UP;
    }

    return safestDir;
}

function move(person, direction, box, city) {
    let newX = -1,
        newY = -1;

    if (direction === directions.UP) {
        newX = person.x;
        newY = person.y - 3;
    }
    if (direction === directions.DOWN) {
        newX = person.x;
        newY = person.y + 3;
    }
    if (direction === directions.LEFT) {
        newX = person.x - 3;
        newY = person.y;
    }
    if (direction === directions.RIGHT) {
        newX = person.x + 3;
        newY = person.y;
    }
    inside = isInside(newX, newY, box);
    if (inside) {
        person.x = newX;
        person.y = newY;
    }
}

function actions() {
    population.forEach(person => {
        // if infected -> infect nearby, try to heal
        if (person.status === status.INFECTED) {
            person.infectedDays++;
            if (!inArray(person.box, HOSPITAL)) {
                infectNearby(person);
            } else if (person.status == status.INFECTED) {
                person.hospdays++;
            }
            tryToHeal(person);
            if (person.infectedDays % 21 == 0) {
                detectAndSetMoveToHospital();
            }
        }
    });

    if (days % 25 == 0) {
        // set move to central locations
        setMoveToCentral();
        // random migrations
        //setMigration();
    }
    if (days % 30 == 0) {
        setMoveFromCentral();
    }
    // move recovered out of hospital
    setMoveFromHospital();
}

function infectNearby(infected) {
    population.forEach(person => {
        if (person.status === status.HEALTHY &&
            squaredDistance(infected.x, infected.y, person.x, person.y) <= INFECTION_RADIUS * INFECTION_RADIUS) {
            if (random() < PHI) {
                person.status = status.INFECTED;
                person.infectedDays = 0;
            }
        }
    });
}

function tryToHeal(person) {
    if (person.hospdays > HOSP_DAYS) {
        if (inArray(person.box, HOSPITAL)) {
            if (random() < PID) {
                person.status = status.DECEASED;
            } else {
                person.status = status.HEALTHY;
            }
        } else {
            person.status = status.DECEASED;
        }
    }
}

function setMoveToCentral() {
    population.forEach(person => {
        if (!person.isTravelling &&
            person.status !== status.DECEASED &&
            person.status != status.STAFF &&
            !inArray(person.box, HOSPITAL)) {
            if (random() < PCENTRAL_LOCATIONS) {
                person.isTravelling = true;
                person.destinationX = person.city[3].x;
                person.destinationY = person.city[3].y;
            }
        }
    });
}

function setMoveFromCentral() {
    population.forEach(person => {
        if (!person.isTravelling &&
            person.status !== status.DECEASED &&
            person.boxNo === 3) {
            if (random() < P_FROM_CENTRAL_LOCATIONS) {
                person.isTravelling = true;
                if (onMobile) {
                    if (person.cityNo == 0) {
                        boxes = [0, 2, 3, 4, 5, 6]
                    } else if (person.cityNo == 1) {
                        boxes = [1, 3, 5, 6]
                    }
                } else {
                    if (person.cityNo == 0) {
                        boxes = [0, 2, 3, 4, 5, 6]
                    } else if (person.cityNo == 1) {
                        boxes = [1, 3, 5, 6]
                    } else {
                        boxes = [0, 2, 3, 5, 6]
                    }
                }

                temp = BOXES[person.cityNo][boxes[floor(random(boxes.length))]];
                point = getpoint(temp.x, temp.y);
                person.destinationX = point.x;
                person.destinationY = point.y;
            }
        }
    });
}

function detectAndSetMoveToHospital() {
    population.forEach(person => {
        if (!inArray(person.box, HOSPITAL) &&
            person.status === status.INFECTED &&
            person.infectedDays > INFECTION_DAYS) {
            if (random() < P_DETECTION) {
                hosp_temp = HOSPITAL[person.cityNo];
                temp = shuffle(hosp_temp);
                for (i = 0; i < temp.length; i++) {
                    count = countPerson(temp[i]);
                    //console.log(temp[i]);
                    temptemp = temp[i];
                    idx = FindMyindex(person.city, temptemp);
                    //console.log(temptemp);
                    if (count < 10 + bed_count) {
                        person.isTravelling = true;
                        point = getpoint(temptemp.x, temptemp.y);
                        person.destinationX = point.x;
                        person.destinationY = point.y;
                        person.box = temptemp;
                        person.boxNo = idx;
                        person.hospdays = 0;
                        highlight[person.cityNo][idx] = 0;
                    } else {
                        highlight[person.cityNo][idx] = 1;
                    }
                }
            }
        }
    });
}

function setMoveFromHospital() {
    population.forEach(person => {
        if (inArray(person.box, HOSPITAL) &&
            person.status === status.HEALTHY &&
            !person.isTravelling) {
            if (onMobile) {
                if (person.cityNo == 0) {
                    boxes = [0, 2, 3, 4, 5, 6]
                } else if (person.cityNo == 1) {
                    boxes = [1, 3, 5, 6]
                }
            } else {
                if (person.cityNo == 0) {
                    boxes = [0, 2, 3, 4, 5, 6]
                } else if (person.cityNo == 1) {
                    boxes = [1, 3, 5, 6]
                } else {
                    boxes = [0, 2, 3, 5, 6]
                }
            }
            newBox = person.city[boxes[floor(random(boxes.length))]];
            //let newBox = person.city[floor(random(6))];
            person.isTravelling = true;
            point = getpoint(newBox.x, newBox.y);
            person.destinationX = point.x;
            person.destinationY = point.y;
            person.box = newBox;
        }
    });
}

function drawPopulation() {
    stroke(0);
    strokeWeight(1);
    for (let i = 0; i < population.length; i++) {
        const person = population[i];
        if (person.status === status.INFECTED) {
            noFill();
            stroke(color("#ff6363"));
            ellipse(person.x, person.y, INFECTION_RADIUS, INFECTION_RADIUS);
            stroke(0);
        }

        fill(color(colors[person.status]))
        ellipse(person.x, person.y, PERSON_RADIUS, PERSON_RADIUS);
    }
}

function reset() {
    $('#NO_BED').prop('disabled', false);
    $('#POP_PER_BOX').prop('disabled', false);
    setupPopulation();
    redraw();
}

function updateStatsDisplay(healthyCount, infectedCount, deceasedCount) {
    $("#healthy-count").html(healthyCount[city_choice]);
    $("#infected-count").html(infectedCount[city_choice]);
    $("#deceased-count").html(deceasedCount[city_choice]);
}

function randomIntFromRange(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function onMobile() {
    return $(window).width() < 768;
}

function squaredDistance(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

function hexagon(transX, transY, s, hospital, Mycolor = "#c45f1a") {
    strokeWeight(5);
    stroke(Mycolor);
    if (hospital) {
        //fill('rgba(242,163,101,200)');
        let c = color(Mycolor);
        c.setAlpha(200);
        fill(c);
    } else {
        fill('#30475e');
    }
    push();
    translate(transX, transY);
    rotate(PI / 2);
    scale(s);
    beginShape();
    vertex(-75, -130);
    vertex(75, -130);
    vertex(150, 0);
    vertex(75, 130);
    vertex(-75, 130);
    vertex(-150, 0);
    endShape(CLOSE);
    pop();
}

function getpoint(x, y) {
    point = createVector(randomIntFromRange(x - 52, x + 52), randomIntFromRange(y + 47, y - 47));
    var vs = [
        [x, y + 47],
        [x + 52, y - 23.5],
        [x + 52, y + 23.5],
        [x, y - 47],
        [x - 52, y + 23.5],
        [x - 52, y - 23.5]
    ];
    var x1 = point.x,
        y1 = point.y;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect = ((yi > y1) != (yj > y1)) && (x1 < (xj - xi) * (y1 - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    if (inside) return point;
    else return getpoint(x, y);
};

function isInside(x, y, vs) {
    centerx = vs.x;
    centery = vs.y;
    var vs = [
        [centerx, centery + 30],
        [centerx + 30, centery - 15],
        [centerx + 30, centery + 15],
        [centerx, centery - 30],
        [centerx - 30, centery + 15],
        [centerx - 30, centery - 15]
    ];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function inArray(box, HOSPITAL) {
    flag = false;
    HOSPITAL.forEach(city => {
        city.forEach(hosp_box => {
            if (box.x == hosp_box.x && box.y == hosp_box.y) {
                flag = true;
            }
        });
    });
    return flag;
}

function countPerson(hospBox) {
    count = 0;
    population.forEach(person => {
        if (person.box.x == hospBox.x && person.box.y == hospBox.y && person.status !== status.DECEASED) {
            count++;
        }
    });
    return count;
}

function getpointNoOver(x, y) {
    point = createVector(randomIntFromRange(x - 52, x + 52), randomIntFromRange(y + 47, y - 47));
    var vs = [
        [x, y + 47],
        [x + 52, y - 23.5],
        [x + 52, y + 23.5],
        [x, y - 47],
        [x - 52, y + 23.5],
        [x - 52, y - 23.5]
    ];
    var x1 = point.x,
        y1 = point.y;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect = ((yi > y1) != (yj > y1)) && (x1 < (xj - xi) * (y1 - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    flag = false;
    if (inside) {
        population.forEach(person => {
            if (inArray(person.box, HOSPITAL) && flag == false) {
                if (person.x == x1 && person.y == y1) {
                    flag = true;
                }
            }
        });
        if (flag == false) return point;
        else return getpointNoOver(x, y);
    } else return getpointNoOver(x, y);
}

function shuffle(arr) {
    for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
}

function FindMyindex(city, box) {
    flag = 0;
    idx = -1;
    for (i = 0; i < city.length; i++) {
        if (city[i].x == box.x && city[i].y == box.y) {
            idx = i;
            flag = 1;
        }
    }
    if (flag == 1) return idx;
    else return -1;
}