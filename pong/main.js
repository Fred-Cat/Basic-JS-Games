


/** @type {HTMLCanvasElement} */
const canvasElement = document.getElementById('canvas')
const c = canvasElement.getContext('2d')
canvasElement.width = innerWidth
canvasElement.height = innerHeight


c.fillStyle = 'white'
c.strokeStyle = 'white'
c.shadowColor = 'white'
c.shadowBlur = 10
c.lineWidth = 4
c.lineCap = "butt"
c.font = '25px Silkscreen'
c.textAlign = 'center'
c.textBaseline = 'middle'


const field = {
    x: 100,
    y: 100,
    w: 750,
    h: 500,
    width: 15,

    setHitbox() {
        const w2 = this.width / 2
        this.x1 = this.x + w2
        this.x2 = this.x + this.w - w2
        this.y1 = this.y + w2
        this.y2 = this.y + this.h - w2
        this.cx = this.x + this.w / 2
        this.cy = this.y + this.h / 2
    },

    draw() {
        c.strokeStyle = '#fff5'
        c.lineWidth = this.width
        c.strokeRect(this.x, this.y, this.w, this.h)
        c.setLineDash([25])
        // c.setLineDash([25, 10, 5, 10])
        c.beginPath()
        c.moveTo(this.cx, this.y1 + 10)
        c.lineTo(this.cx, this.y2 - 10)
        c.stroke()
        c.setLineDash([])
    }
}
field.setHitbox()


class Paddle {
    constructor(x, keyUp, keyDown) {
        this.x = x
        this.w = 10
        this.h = 100
        this.y = field.cy - this.h / 2

        this.x1 = this.x
        this.x2 = this.x + this.w
        this.y1 = this.y
        this.y2 = this.y + this.h

        this.keyUp = keyUp
        this.keyDown = keyDown

        // F = M x A ---> A = F / M
        // this.vy = 0
        // this.mass = 100
        // this.force = 10 / this.mass
        // this.friction = 1 - 1 / this.mass

        // shorter: 
        this.vy = 0
        this.force = .15
        this.friction = .99

        Paddle.all.push(this)
    }
    moveUp() { this.vy -= this.force }
    moveDown() { this.vy += this.force }
    step() {
        if (this.vy) {
            if (Math.abs(this.vy) < 0.01) this.vy = 0
            // console.log('turns off when not moving for a while', this.vy)

            this.vy *= this.friction
            this.y += this.vy

            // update hitbox
            this.y1 = this.y
            this.y2 = this.y + this.h

            // wall collision
            if (this.y1 < field.y1) this.vy *= -.8, this.y = field.y1
            if (this.y2 > field.y2) this.vy *= -.8, this.y = field.y2 - this.h

        }
    }
    draw() {
        c.fillStyle = 'white'
        c.fillRect(this.x, this.y, this.w, this.h)
    }

    static all = []

}


class Computer extends Paddle {
    constructor(x, level) {
        super(x, 1, 2)
        this.setDifficulty(level)
        this.setAim()
    }
    setDifficulty(level) {
        this.level = level
        switch (level) {
            case 0: this.force = .05; this.friction = .999; break
            case 1: this.force = .1; this.friction = .995; break
            case 2: this.force = .2; this.friction = .98; break
        }
    }
    setAim() {
        let rndAim = Math.random() - .5
        switch (this.level) {
            case 0: rndAim *= this.h / 2; break
            case 1: rndAim *= this.h / 5; break
            case 2: rndAim *= 0; break
        }
        this.aim = rndAim
        // console.log(this.aim)
    }
    step() {
        super.step()
        this.cy = this.y + this.h / 2
        if (this.level == 3) { this.y = ball.y - this.h / 2; this.vy += 0.01 }
        else if (ball.vx > 0) {
            if (ball.y + this.aim < this.cy + ball.s) this.moveUp()
            if (ball.y + this.aim > this.cy - ball.s) this.moveDown()
        } else {
            if (this.cy + 50 > field.cy) this.moveUp()
            if (this.cy - 50 < field.cy) this.moveDown()
        }
    }
}


const ball = {
    x: field.cx - 100,
    y: field.cy,
    s: 15, // size
    vx: 0,
    vy: 0,

    reset() {
        this.x = field.cx
        this.y = field.cy
        this.vx = Math.random() > .5 ? 1 : -1
        this.vy = (Math.random() - .5) / 5
    },

    step() {

        // update pos
        this.x += this.vx
        this.y += this.vy

        // update hitbox
        this.x1 = this.x
        this.x2 = this.x + this.s
        this.y1 = this.y
        this.y2 = this.y + this.s

        // only bounce off walls if within the playing field
        if (this.x > field.x1 && this.x < field.x2) {
            // bounce off walls
            if (this.y1 < field.y1) this.vy *= -.95, this.y = field.y1
            if (this.y2 > field.y2) this.vy *= -.95, this.y = field.y2 - this.s
        }

        // loop over paddles and collide using AABB, axis-aligned bounding box
        for (const p of Paddle.all) {
            if (
                this.x1 < p.x2 &&
                this.x2 > p.x1 &&
                this.y1 < p.y2 &&
                this.y2 > p.y1
            ) {
                // on collision:

                // invert vx
                this.vx *= -1

                // traditional pong
                // this.vy += (this.y + this.s / 2 - (p.y + p.h / 2)) / 50

                // My version
                this.vy += p.vy / 2

                // regular % = part / whole * 100
                // inverted % = 100 - part / whole * 100 
                // shorter % = 1 - part / whole
                const padCenter = p.y + p.h / 2
                const distance = Math.abs(this.y + this.s / 2 - padCenter)
                const part = distance
                const whole = p.h / 2
                const percent = 1 - part / whole
                const nerf = .5
                const buff = 1.25

                // on edge ball slow, in center ball fast
                this.vx *= nerf + buff * percent
                // clamping v between min and max then times 1 or -1
                this.vx = Math.min(Math.max(Math.abs(this.vx), 1), 6) * Math.sign(this.vx)


                // set computer aim
                // console.log(paddle.constructor.name)
                // paddle.constructor.name == 'Computer' && paddle.setAim()
                // ?. = optional chaining operator
                p.setAim?.()
            }
        }
    },

    draw() {
        c.fillStyle = 'white'
        c.fillRect(this.x, this.y, this.s, this.s)
    }
}


const score = {
    states: { game: 0, left: 1, right: 2 },
    state: 0,
    left: 0,
    right: 0,
    reset() { this.left = 0; this.right = 0; this.state = this.states.game },
    draw() {
        switch (this.state) {
            case this.states.game:
                c.font = '200px Silkscreen'
                c.fillStyle = '#fff4'
                c.fillText(this.left, field.cx / 2, field.cy)
                c.fillText(this.right, field.cx + field.cx / 2, field.cy)
                break
            case this.states.left:
                c.font = '75px Silkscreen'
                c.fillStyle = '#fff'
                c.fillText('left wins!', field.cx, field.cy / 2)
                c.font = '25px Silkscreen'
                c.fillText('press "enter"', field.cx, field.cy + field.cy / 2)
                break
            case this.states.right:
                c.font = '75px Silkscreen'
                c.fillStyle = '#fff'
                c.fillText('right wins!', field.cx, field.cy / 2)
                c.font = '25px Silkscreen'
                c.fillText('press "enter"', field.cx, field.cy + field.cy / 2)
                break
        }
    }
}


const input = {
    keys: [],
    keyDown(e) { this.keys[e.key] = true; this.keySwitch(e) },
    keyUp(e) { this.keys[e.key] = false },
    blur() { this.keys = [] },
    keySwitch(e) {
        switch (e.key) {
            // case ' ': ball.reset(); break
            case 'Enter': if (score.state != 0) score.reset(), ball.reset(); break
        }
    },
    step() {
        for (const p of Paddle.all) this.keys[p.keyUp] && p.moveUp(), this.keys[p.keyDown] && p.moveDown()
    }
}

const game = {
    loop() {

        // update
        input.step()
        for (const p of Paddle.all) p.step()
        ball.step()
        game.step()

        // render
        c.clearRect(0, 0, innerWidth, innerHeight)
        field.draw()
        for (const p of Paddle.all) p.draw()
        ball.draw()
        score.draw()

    },

    maxScore: 5,
    step() {
        if (ball.x < field.x1 - 100) ++score.right >= this.maxScore ? score.state = score.states.right : ball.reset()
        if (ball.x > field.x2 + 100) ++score.left >= this.maxScore ? score.state = score.states.left : ball.reset()
    },


    requestID: 0,
    start() { game.requestID = requestAnimationFrame(game.start); game.loop() },
    stop() { cancelAnimationFrame(this.requestID) }
}


// addEventListener('focus', e => setTimeout(() => location.reload(), 150))
addEventListener('keydown', e => input.keyDown(e))
addEventListener('keyup', e => input.keyUp(e))
addEventListener('blur', e => input.blur())


new Paddle(field.x1 + 25, 'd', 'f')
// new Paddle(field.x2 - 35, 'j', 'k')
new Computer(field.x2 - 35, 2)

ball.reset()
game.start()
