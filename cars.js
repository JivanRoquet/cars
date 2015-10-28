$(document).ready(function() {
    var mode;
    mode = "manual";

    $("button[name=auto]").on("click", function() {
        mode = "auto";
    });

    $("button[name=manual]").on("click", function() {
        mode = "manual";
    });

    svg = document.getElementById("main");

    var maxForce = 2

    var score = 0;
    var distance = 0;
    var time = 0;

    var originX = 600;
    var originY = 300;
    window.posX = 0;
    window.posY = 0;

    var force = 0;
    var brakeX = 0;
    var speed = 0;
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

    var sensorsObject = {};
    [].forEach.call(sensorElements, function(el) {
        sensorsObject[el.getAttribute("id")] = 0;
    });

    window.setInterval(function() {
        updateDashboard();

        // summarizes all data to be sent to NN
        // and sends it - then wait for the response
        var neuralNetworkInput = [
            sensorsObject.centerSensor1,
            sensorsObject.centerSensor2,
            sensorsObject.rightSensor1,
            sensorsObject.rightSensor2,
            sensorsObject.leftSensor1,
            sensorsObject.leftSensor2,
            speed
        ]

        // todo: send to neural network

    }, 50);

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
        speed = 0;
        heading = 0;
        distance = 0;
        time = 0;
        posX = originX;
        posY = originY;

        // places the machine in the center of the viewPort
        machine.velocity({
            translateZ: 0,
            translateX: posX + "px",
            translateY: posY + "px",
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
        // calculate elapsed time
        // indepedently from display frame rate
        time += 1;
    }, 50);

    window.setInterval(function() {
        if (mode == "auto") {
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
        posX += tranX;
        posY += tranY;

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

    function updateDashboard() {
        $("#speed").html(Math.round(speed * 10) / 10);
        $("#heading").html(heading);
        $("#score").html(Math.round(score * 10) / 10);
        $("#posX").html(Math.round(posX * 10) / 10);
        $("#posY").html(Math.round(posY * 10) / 10);
        $("#left2").html(Math.round(sensorsObject["leftSensor2"] * 100) / 100);
        $("#left1").html(Math.round(sensorsObject["leftSensor1"] * 100) / 100);
        $("#center1").html(Math.round(sensorsObject["centerSensor1"] * 100) / 100);
        $("#center2").html(Math.round(sensorsObject["centerSensor2"] * 100) / 100);
        $("#right1").html(Math.round(sensorsObject["rightSensor2"] * 100) / 100);
        $("#right2").html(Math.round(sensorsObject["rightSensor1"] * 100) / 100);
    }

    function collisionHappened(time, distance) {
        score -= 10;
        score += distance / time; // bonus for avg speed
        resetMachine();
    }

    function detectCollision() {
        var collision = false;

        boundaries.forEach(function(el) {
            if (svg.checkIntersection(bodyRect, el)) {
                collisionHappened(time, distance);
                collision = true;
            }
        });
        return collision;
    }

    function getSensorIntersectionValue(sensorEl, el) {
        // first checks if boundary'drawing box is in sensor's drawing box
        // if so, determines if the boundary's drawing box fits the equation for the sensor
        //     if so, computes the nearest intersection point relative to the machine's center
        //     and retrieves the distance between machine's center and intersection point

        var sensorIntersectionValue = 0;

        if (svg.checkIntersection(sensorEl, el)) {
            // gets sensor coordinates relative to the machine
            var sensorPoint2 = [sensorEl.getAttribute("x2"), sensorEl.getAttribute("y2")];
            var sensorAngle = Math.atan(sensorPoint2[1] / sensorPoint2[0]) * 180 / Math.PI;
            var sensorLength = Math.sqrt(Math.pow(sensorPoint2[0], 2) + Math.pow(sensorPoint2[1], 2));

            // gets sensor coordinates relative to the viewport
            var sensorAngleVP = (sensorAngle + heading) / 180 * Math.PI;
            var sensorPoint2VPX = sensorLength * Math.cos(sensorAngleVP) + posX;
            var sensorPoint2VPY = sensorLength * Math.sin(sensorAngleVP) + posY;

            // sensor equation: y = Ax + B
            var sensorEquationA = (sensorPoint2VPY - posY) / (sensorPoint2VPX - posX)
            var sensorEquationB = sensorPoint2VPY - sensorEquationA * sensorPoint2VPX;

            // X and Y limits for the currently evaluated boundary
            var rangeX = [el.x, el.x + el.width];
            var rangeY = [el.y, el.y + el.height];

            // the following depends on whether x<posX or x>posX
            var delta = (sensorPoint2VPX > posX) ? 0.1 : -0.1;
            function checkXRange(i, sensorPoint2VPX) {
                if (delta > 0) {
                    return i <= sensorPoint2VPX;
                } else {
                    return i >= sensorPoint2VPX;
                }
            }

            // actual intersection checking
            for (var i=posX; checkXRange(i, sensorPoint2VPX); i+=delta) {
                var j = sensorEquationA * i + sensorEquationB;
                if (i <= rangeX[1] && i >= rangeX[0] && j <= rangeY[1] && j >= rangeY[0]) {
                    sensorIntersectionValue = 1 - Math.abs(i - posX) / Math.abs((sensorPoint2VPX - posX));
                    break;
                }
            }
        }
        return sensorIntersectionValue;
    }

    function detectSensors() {
        [].forEach.call(sensorElements, function(sensorEl) {
            var sensorIntersectionValues = [];
            boundaries.forEach(function(el) {
                sensorIntersectionValues.push(getSensorIntersectionValue(sensorEl, el));
            });
            sensorsObject[sensorEl.getAttribute("id")] = Math.max.apply(null, sensorIntersectionValues);
        });
    }

    function tick() {
        detectSensors();

        if (!detectCollision()) {
            if (thrust) {
                if (force < maxForce) {
                    force += 1/30;
                } else {
                    force = maxForce;
                }
            } else {
                force = 0;
            }

            if (brake) {
                if (speed > 0) {
                    brakeX = 1;
                } else {
                    speed = 0;
                    brakeX = 0;
                }
            } else {
                brakeX = 0;
            }

            if (turnLeft && speed > 0) {
                heading -= 0.5 * Math.pow(speed, 0.6);
            }
            if (turnRight && speed > 0) {
                heading += 0.5 * Math.pow(speed, 0.6);
            }

            speed += force / 10;
            distance += speed;

            resistance = 1/5 + speed * speed / 10;

            if (speed > 0) {
                speed -= brakeX / 30 + resistance / 30;
            } else if (speed < 0) {
                speed = 0;
            }

            score += speed / 100;

            tranX = speed * Math.cos(heading / 180 * Math.PI);
            tranY = speed * Math.sin(heading / 180 * Math.PI);

            move(machine, tranX, tranY, heading);

            setColor(thrust, brake);
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
});
