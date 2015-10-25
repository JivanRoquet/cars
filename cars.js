$(document).ready(function() {
    var mode;
    mode = "manual";

    $("button[name=auto]").on("click", function() {
        mode = "auto";
        console.log(mode);
    });

    $("button[name=manual]").on("click", function() {
        mode = "manual";
        console.log(mode);
    });

    svg = document.getElementById("main");

    var maxForce = 0.5

    var score = 0;

    var forceX = 0;
    var brakeX = 0;
    var speedX = 0;
    var thrust = false;
    var brake = false;
    var resistance = 0;
    var heading = 0;
    var turnLeft = false;
    var turnRight = false;

    var rightKey = 39;
    var leftKey = 37;
    var upKey = 38;
    var downKey = 40;

    var machine = $("svg #machine");
    var body = $(machine).children().not(".sensor, #sensorMask");
    var bodyRect = document.getElementById("body");
    var boundariesElements = document.getElementsByClassName("boundary");
    var sensorElements = document.getElementsByClassName("sensor");

    var boundaries = [];
    [].forEach.call(boundariesElements, function(el) {
        var rect = svg.createSVGRect();
        rect.x = el.x.animVal.value;
        rect.y = el.y.animVal.value;
        rect.height = el.height.animVal.value;
        rect.width = el.width.animVal.value;
        boundaries.push(rect);
    });

    function resetMachine() {
        // resets machine's speed and heading
        speedX = 0;
        heading = 0;

        // places the machine in the center of the viewPort
        machine.velocity({
            translateZ: 0,
            translateX: "600px",
            translateY: "300px",
        }, 0);
    }

    resetMachine();

    window.onkeydown = function(e) {
        if (mode == "manual") {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == upKey) {
                thrust = true;
            } else if (key == downKey) {
                brake = true;
            } else if (key == leftKey) {
                turnLeft = true;
            } else if (key == rightKey) {
                turnRight = true;
            }
        }
    }

    window.onkeyup = function(e) {
        if (mode == "manual") {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == upKey) {
                thrust = false;
            } else if (key == downKey) {
                brake = false;
            } else if (key == leftKey) {
                turnLeft = false;
            } else if (key == rightKey) {
                turnRight = false;
            }
        }
    }

    window.setInterval(function() {
        if (mode == "auto") {
            console.log(Math.random()<.5);
            thrust = Math.random()<.8;
            if (!thrust) { brake = Math.random()<.2; }
            else { brake = false; }
            turnLeft = Math.random()<.5;
            turn = Math.random()<.5;
            if (!turn) { turnLeft = false; turnRight = false; }
            else if (turn && !turnLeft) { turnRight = true; }
        }
    }, 200);

    function move(machine, tranX, tranY, direction) {
        machine.velocity({
            translateZ: 0, // adds a 3d move to enable Hardware Acceleration by default
            translateX: "+=" + tranX + "px",
            translateY: "+=" + tranY + "px",
            rotateZ: direction + "deg"
        }, 0);
    }

    function setColor(hasThrust, hasBrake) {
        var color;

        if (hasThrust && hasBrake) {
            color = "#cc6666";
        } else if (hasThrust) {
            color = "#dd3333";
        } else if (hasBrake) {
            color = "#669999";
        } else {
            color = "#000000";
        }

        body.velocity({
            fill: color
        }, 10);
    }

    function updateDashboard(speedX, heading, score) {
        $("#speed").html(Math.round(speedX * 10) / 10);
        $("#heading").html(heading);
        $("#score").html(Math.round(score * 10) / 10);
    }

    function collisionHappened() {
        score -= 10;
        resetMachine();
    }

    function detectCollision() {
        var collision = false;

        boundaries.forEach(function(el) {
            if (svg.checkIntersection(bodyRect, el)) {
                collisionHappened();
                collision = true;
            }
        });
        return collision;
    }

    function detectSensors() {
        [].forEach.call(sensorElements, function(sensorEl) {
            var sensorCollision = false;
            sensorCollision = boundaries.some(function(el) {
                if (svg.checkIntersection(sensorEl, el)) {
                    return true;
                }
            });
            if (sensorCollision) {
                console.log("erk");
                $(sensorEl).velocity({
                    fill: "#ffcccc"
                }, 10);
            } else {
                $(sensorEl).velocity({
                    fill: "#f9f9f9"
                }, 10);
            }
        });
    }

    function tick() {
        detectSensors();

        if (!detectCollision()) {
            if (thrust) {
                if (forceX < maxForce) {
                    forceX += 1/30;
                } else {
                    forceX = maxForce;
                }
            } else {
                forceX = 0;
            }

            if (brake) {
                if (speedX > 0) {
                    brakeX = 1;
                } else {
                    speedX = 0;
                    brakeX = 0;
                }
            } else {
                brakeX = 0;
            }

            if (turnLeft && speedX > 0) {
                heading -= 1 * Math.pow(speedX, 0.5);
            }
            if (turnRight && speedX > 0) {
                heading += 1 * Math.pow(speedX, 0.5);
            }

            speedX += forceX / 10;

            resistance = 1/2 + speedX * speedX / 10;

            if (speedX > 0) {
                speedX -= brakeX / 10 + resistance / 30;
            } else if (speedX < 0) {
                speedX = 0;
            }

            score += speedX / 100;

            tranX = speedX * Math.cos(heading / 180 * Math.PI);
            tranY = speedX * Math.sin(heading / 180 * Math.PI);

            move(machine, tranX, tranY, heading);

            updateDashboard(speedX, heading, score);
            setColor(thrust, brake);
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
});
