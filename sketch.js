let flock;

function setup() {
    createCanvas(700, 700);
    createP("Drag the mouse to generate new boids.");

    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < 200; i++) {
        let infection = new Infection(200, 0.2, 0)
        if (i < 2) {
            infection.startInfection();
        }
        let b = new Boid(random(width), random(height), infection);
        flock.addBoid(b);
    }
}

function draw() {
    background('rgb(255,255,255)');
    flock.run();
}

// Add a new boid into the System
function mouseDragged() {

    let infection = new Infection(200, 0.2, 0)
    flock.addBoid(new Boid(mouseX, mouseY, infection));
}

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
        for (let i = 0; i < this.boids.length; i++) {
            this.boids[i].run(this.boids); // Passing the entire list of boids to each boid individually
        }
    }
    addBoid(b) {
        this.boids.push(b);
    }
}
// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com
// Boid class
// Methods for Separation, Cohesion, Alignment added
class Boid {
    constructor(x, y, infection) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.position = createVector(x, y);
        this.r = 3.0;
        this.maxspeed = 3; // Maximum speed
        this.maxforce = 0.02; // Maximum steering force
        this.infection = infection
    }
    run(boids) {
        this.flock(boids);
        this.update();
        this.borders();
        this.render();
    }
    applyForce(force) {
        // We could add mass here if we want A = F / M
        this.acceleration.add(force);
    }
    // We accumulate a new acceleration each time based on three rules
    flock(boids) {
        let sep = this.separate(boids); // Separation
        let ali = this.align(boids); // Alignment
        let coh = this.cohesion(boids); // Cohesion
        this.checkInfection(boids);
        // Arbitrarily weight these forces
        //sep.mult(1.5);
        //ali.mult(1.0);
        //coh.mult(1.0);

        // My own
        sep.mult(1.5);
        ali.mult(0);
        coh.mult(0);
        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }
    // Method to update location
    update() {
        // Update velocity
        this.velocity.add(this.acceleration);
        // Limit speed
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
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
        if (this.infection.state == 0) {
            fill('rgba(0,0,255, 0.75)');
        }
        if (this.infection.state == 1) {
            fill('rgba(255,100,0, 0.75)');
        }
        if (this.infection.state == 2) {
            fill('rgba(0,255,0, 0.75)');
        }
        if (this.infection.state == 3) {
            fill('rgba(255,0,0, 0.75)');
        }
        stroke('rgba(0,0,0, 0.25)');
        push();
        translate(this.position.x, this.position.y);
        rotate(theta);
        beginShape();
        vertex(0, -this.r * 2);
        vertex(-this.r, this.r * 2);
        vertex(this.r, this.r * 2);
        endShape(CLOSE);
        if (this.infection.state == 1) {
            beginShape()
            fill('rgba(255,100,0, 0.25)');
            stroke('rgba(0,0,0, 0)');
            ellipse(0, 0, this.infection.range, this.infection.range);
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
        let desiredseparation = 25.0;
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
        let count = 0;
        this.infection.checkInfection();
        for (let i = 0; i < boids.length; i++) {
            if (boids[i].infection.state == 1) {
                let d = p5.Vector.dist(this.position, boids[i].position);
                if (d < this.infection.range/2) {
                    this.infection.state = 1
                }
            }
        }
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
        this.range = 50
    }
    startInfection() {
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

var gui = new dat.GUI();












