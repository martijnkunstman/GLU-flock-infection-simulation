
//to do, add mass, add infection radius based on size and infection duration, incubation time, fade out death, add sepreratium radius based on size
//grow over time, natural death and reborn

let flock;
let mortality = 0.4;
let boidsTotal = 150;
let maxAge = 2500;
let infectionRange = 45;
let maxforce = 0.15;
let maxspeed = 2;
let initspeed = 2;
let size = 400;
let animationDuration = 10;
let graphData = []

let separate = 0.8;
let align = 0.2;
let cohesion = 0.2;

function setup() {
    randomSeed(99);
    createCanvas(size, size, P2D);
    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < boidsTotal; i++) {
        let infection = new Infection(200, mortality, 0)
        if (i < 1) {
            infection.startInfection();
        }
        let b = new Boid(random(width), random(height), infection, i);
        flock.addBoid(b);
    }
}
/*
function mousePressed() {
    for (a = 0; a < flock.boids.length; a++) {
        flock.boids[a].clicked();
    }
}
*/

function draw() {
    background('rgb(255,255,255)');
    flock.run();
}


// Add a new boid into the System
/*
unction mouseDragged() {

    let infection = new Infection(200, mortality, 0)
    flock.addBoid(new Boid(mouseX, mouseY, infection));
}
*/



// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com
// Flock object
// Does very little, simply manages the array of all the boids
class Flock {
    constructor() {
        // An array for all the boids
        this.boids = []; // Initialize the array
    }
    run() {
        let uninfected = 0
        let infected = 0
        let deceased = 0
        let recovered = 0
        for (let i = 0; i < this.boids.length; i++) {
            this.boids[i].run(this.boids); // Passing the entire list of boids to each boid individually
            if (this.boids[i].infection.state == 0) {
                uninfected++
            }
            if (this.boids[i].infection.state == 1) {
                infected++
            }
            if (this.boids[i].infection.state == 2) {
                recovered++
            }
            if (this.boids[i].infection.state == 3) {
                deceased++
            }
        }
        graphData.push({ "uninfected": uninfected, "infected": infected, "deceased": deceased, "recovered": recovered })
        this.chart()
    }

    chart() {
        //convert data
        let labels = []
        let uninfectedArray = []
        let infectedArray = []
        let deceasedArray = []
        let recoveredArray = []
        for (let a = 0; a < graphData.length; a++) {
            labels.push(a + "")
            uninfectedArray.push(graphData[a].uninfected)
            infectedArray.push(graphData[a].infected)
            deceasedArray.push(graphData[a].deceased)
            recoveredArray.push(graphData[a].recovered)
        }
        let xaxisstep = 10
        labels = convertArrayLenght(labels, xaxisstep)
        uninfectedArray = convertArrayLenght(uninfectedArray, xaxisstep)
        infectedArray = convertArrayLenght(infectedArray, xaxisstep)
        deceasedArray = convertArrayLenght(deceasedArray, xaxisstep)
        recoveredArray = convertArrayLenght(recoveredArray, xaxisstep)

        chart.data.labels = labels
        chart.data.datasets[0].data = uninfectedArray
        chart.data.datasets[1].data = infectedArray
        chart.data.datasets[2].data = deceasedArray
        chart.data.datasets[3].data = recoveredArray
        chart.update()
    }


    addBoid(b) {
        this.boids.push(b);
    }
}


function convertArrayLenght(inputArray, length){

    //return inputArray
    length = length - 1
    let myNewArray = []
    for (let a = 0; a < length; a++) {
        myNewArray.push(inputArray[Math.floor(a / length * inputArray.length)])
    }
    myNewArray.push(inputArray[Math.ceil(inputArray.length - 1)])
    return myNewArray
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com
// Boid class
// Methods for Separation, Cohesion, Alignment added
class Boid {
    constructor(x, y, infection, id) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(random(-initspeed, initspeed), random(-initspeed, initspeed));
        this.position = createVector(x, y);
        //this.r = random(3, 5);
        this.r = 5;
        this.maxspeed = maxspeed; // Maximum speed
        this.maxforce = maxforce; // Maximum steering force
        this.infection = infection;
        this.id = id;
        this.deathTime = 0;
        this.age = random(maxAge);
        this.animationTime = 0;
    }

    clicked() {
        var d = dist(mouseX, mouseY, this.position.x, this.position.y)
        if (d < 10) {
            this.infection.startInfection()
        }
    }

    run(boids) {
        this.flock(boids);
        this.update();
        this.borders();
        this.render();
        this.checkInfection(boids);
    }
    applyForce(force) {
        // We could add mass here if we want A = F / M
        this.acceleration.add(force.div(this.r / 4));
    }
    // We accumulate a new acceleration each time based on three rules
    flock(boids) {
        let sep = this.separate(boids); // Separation
        let ali = this.align(boids); // Alignment
        let coh = this.cohesion(boids); // Cohesion

        // Arbitrarily weight these forces
        sep.mult(separate);
        ali.mult(align);
        coh.mult(cohesion);
        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }
    // Method to update location
    update() {
        if (this.infection.state != 3) {
            // Update velocity
            this.velocity.add(this.acceleration);
            // Limit speed
            this.velocity.limit(this.maxspeed);
            this.position.add(this.velocity);
            // Reset accelertion to 0 each cycle
            this.acceleration.mult(0);
        }
    }
    // A method that calculates and applies a steering force towards a target
    // STEER = DESIRED MINUS VELOCITY
    seek(target) {
        let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce); // Limit to maximum steering force
        return steer;
    }
    render() {
        // Draw a triangle rotated in the direction of velocity
        let theta = this.velocity.heading() + radians(90);
        push();
        translate(this.position.x, this.position.y);
        rotate(theta);
        /*
        if (this.infection.state != 3) {
        beginShape(LINES);
        stroke('rgba(0,0,0, 0.25)');
        vertex(0, -this.r);
        var d = dist(0, 0, this.velocity.x, this.velocity.y)
        vertex(0, (-this.r * 2 * d) - (this.r));
        endShape(CLOSE);
        }
        */

        beginShape();
        if (this.infection.state == 0) {
            fill('rgba(0,0,255, 1)');
            stroke('rgba(0,0,0, 0)');
        }
        if (this.infection.state == 1) {
            fill('rgba(255,100,0, 1)');
            stroke('rgba(0,0,0, 0)');
        }
        if (this.infection.state == 2) {
            fill('rgba(0,255,0, 1)');
            stroke('rgba(0,0,0, 0)');
        }
        if (this.infection.state == 3) {
            fill('rgba(255,0,0, 1)');
            stroke('rgba(0,0,0, 0)');
        }
        ellipse(0, 0, this.r * 2, this.r * 2);
        endShape(CLOSE);
        if (this.infection.state == 1) {
            this.animationTime++;
            if (this.animationTime > animationDuration) {
                this.animationTime = animationDuration;
            }
            beginShape()
            fill('rgba(255,100,0, 0.25)');
            stroke('rgba(0,0,0, 0)');
            ellipse(0, 0, this.infection.range * this.animationTime / animationDuration, this.infection.range * this.animationTime / animationDuration);
            endShape(CLOSE);
        }
        if ((this.infection.state == 3) || (this.infection.state == 2)) {
            this.animationTime--;
            if (this.animationTime < 0) {
                this.animationTime = 0;
            }
            beginShape()
            fill('rgba(255,100,0, 0.25)');
            stroke('rgba(0,0,0, 0)');
            ellipse(0, 0, this.infection.range * this.animationTime / animationDuration, this.infection.range * this.animationTime / animationDuration);
            endShape(CLOSE);
        }

        pop();
    }
    // Wraparound
    borders() {
        if (this.position.x < -this.r)
            this.position.x = width + this.r;
        if (this.position.y < -this.r)
            this.position.y = height + this.r;
        if (this.position.x > width + this.r)
            this.position.x = -this.r;
        if (this.position.y > height + this.r)
            this.position.y = -this.r;
    }
    // Separation
    // Method checks for nearby boids and steers away
    separate(boids) {
        boids = this.onlyAlive(boids)
        let desiredseparation = 30.0;
        let steer = createVector(0, 0);
        let count = 0;
        // For every boid in the system, check if it's too close
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position, boids[i].position);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < desiredseparation)) {
                // Calculate vector pointing away from neighbor
                let diff = p5.Vector.sub(this.position, boids[i].position);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++; // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }
        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce);
        }
        return steer;
    }
    // Alignment
    // For every nearby boid in the system, calculate the average velocity
    align(boids) {
        boids = this.onlyAlive(boids)
        let neighbordist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids[i].velocity);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxspeed);
            let steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxforce);
            return steer;
        }
        else {
            return createVector(0, 0);
        }
    }
    // Cohesion
    // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
    cohesion(boids) {
        boids = this.onlyAlive(boids)
        let neighbordist = 50;
        let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
        let count = 0;
        for (let i = 0; i < boids.length; i++) {
            let d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids[i].position); // Add location
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum); // Steer towards the location
        }
        else {
            return createVector(0, 0);
        }
    }
    // Infection
    checkInfection(boids) {
        boids = this.onlyAlive(boids)
        this.infection.checkInfection();
        for (let i = 0; i < boids.length; i++) {
            if (boids[i].infection.state == 1) {
                let d = p5.Vector.dist(this.position, boids[i].position);
                if (d < this.infection.range / 2) {
                    if (this.infection.state == 0) {
                        this.infection.state = 1
                    }
                }
            }
        }
        if (this.infection.state == 3) {
            this.deathTime++;
            if (this.deathTime > 100) {
                this.velocity = createVector(random(-1, 1), random(-1, 1));
                this.infection.state = 0;
                this.infection.time = 0;
                this.acceleration = createVector(0, 0);
                this.position = createVector(random(width), random(height));
                this.deathTime = 0;
                this.age = 0;
            }
        }
        this.age++;
        if (this.age > maxAge) {
            this.infection.state = 3
        }
    }
    //filter dead boids out 
    onlyAlive(boids) {
        let boidsNew = [];
        for (let i = 0; i < boids.length; i++) {
            if (boids[i].infection.state != 3) {
                boidsNew.push(boids[i]);
            }
        }
        return boidsNew;
    }

}

class Infection {
    //state 0 = uninfected
    //state 1 = infected
    //state 2 = cured
    //state 3 = deceased
    time = 0
    constructor(duration, mortality, state) {
        this.duration = duration
        this.mortality = mortality
        this.state = state
        this.range = infectionRange
    }
    startInfection() {
        this.time = 0;
        this.state = 1
    }
    checkInfection() {
        if (this.state == 1) {
            this.time++
            if (this.time > this.duration) {
                this.state = 2
            }
            let d = Math.random()
            if (d < this.mortality / this.duration) {
                this.state = 3
            }
        }
    }
}

//var gui = new dat.GUI();
let body = document.getElementById("container")
let canvasChart = document.createElement('canvas')
canvasChart.id = "chart"
canvasChart.width = size
canvasChart.height = size
canvasChart.style.border = "1px solid"
canvasChart.style.order = 2

body.appendChild(canvasChart)
Chart.defaults.global.defaultFontSize = 10;
let chart = new Chart(canvasChart, {
    type: 'line',
    data: {
        datasets: [{
            barPercentage: 1,
            lineTension: 0,
            pointRadius: 0,
            label: 'uninfected',
            data: [],
            backgroundColor: '#0000ff'
        },
        {
            barPercentage: 1,
            lineTension: 0,
            pointRadius: 0,
            label: 'infected',
            data: [],
            backgroundColor: '#ffaf00'
        },

        {
            barPercentage: 1,
            lineTension: 0,
            pointRadius: 0,
            label: 'deceased',
            data: [],
            backgroundColor: '#ff0000'
        },
        {
            barPercentage: 1,
            lineTension: 0,
            pointRadius: 0,
            label: 'recovered',
            data: [],
            backgroundColor: '#00ff00',
        }]
    },
    options: {

        tooltips: { enabled: false },
        hover: { mode: null },
        animation: {
            duration: 0
        },
        elements: {
            line: {
                cubicInterpolationMode: 'monotone'
            }
        },
        responsiveAnimationDuration: 0,
        responsive: false,
        scales: {
            xAxes: [{
                stacked: true,
            }],
            yAxes: [{
                stacked: true,
            }]
        }
    }
})












