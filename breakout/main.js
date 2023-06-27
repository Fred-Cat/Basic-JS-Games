// Breakout by yt/@_FredCat
// 6-25-23
// Monitor 144HZ


/** @type {HTMLCanvasElement} */
const canvasElement = document.getElementById('canvas')
const c = canvasElement.getContext('2d')
canvasElement.width = innerWidth
canvasElement.height = innerHeight


c.fillStyle = 'white'
c.strokeStyle = 'white'
c.shadowColor = 'white'
c.shadowBlur = 10
c.lineWidth = 5
c.lineCap = 'butt'
c.font = '50px Silkscreen'
c.textAlign = 'center'
c.textBaseline = 'middle'


const field = {
    x: 0,
    y: 0,
    w: 750,
    h: 750,
    lineWidth: 15,

    setHitbox() {

        // center field
        this.x = (innerWidth - this.w) / 2
        this.y = (innerHeight - this.h) / 2

        // setHitbox
        const w2 = this.lineWidth / 2
        this.x1 = this.x + w2
        this.x2 = this.x + this.w - w2
        this.y1 = this.y + w2
        this.y2 = this.y + this.h - w2
        this.cx = this.x + this.w / 2
        this.cy = this.y + this.h / 2
    },

    draw() {
        c.strokeStyle = '#fff8'
        c.lineWidth = this.lineWidth
        c.strokeRect(this.x, this.y, this.w, this.h)
    }
}
field.setHitbox()


const paddle = {
    x: field.cx - 75,
    y: field.y2 - 40,
    h: 15,
    w: 150,
    vx: 0,
    force: .3,
    friction: .98,

    setHitbox() {
        this.x1 = this.x
        this.x2 = this.x + this.w
        this.y1 = this.y
        this.y2 = this.y + this.h
    },

    moveLeft() { this.vx -= this.force },
    moveRight() { this.vx += this.force },

    step() {
        if (this.vx) {
            if (Math.abs(this.vx) < 0.01) this.vx = 0
            // console.log('this turns off when vx < .01, see:', this.vx)

            // update pos
            this.vx *= this.friction
            this.x += this.vx

            // update hitbox
            this.x1 = this.x
            this.x2 = this.x + this.w

            // wall collision
            if (this.x1 < field.x1) this.vx *= -.8, this.x = field.x1
            if (this.x2 > field.x2) this.vx *= -.8, this.x = field.x2 - this.w
        }
    },

    draw() {
        c.fillStyle = 'white'
        c.beginPath()
        c.roundRect(this.x, this.y, this.w, this.h, 10)
        c.fill()
    },
}
paddle.setHitbox()



const sound = {
    sounds: {
        pops: [
            new Audio('./sounds/pop1.mp3'),
            new Audio('./sounds/pop2.mp3'),
            new Audio('./sounds/pop3.mp3'),
        ],
        boofs: [
            new Audio('./sounds/boof1.mp3'),
            new Audio('./sounds/boof2.mp3'),
            new Audio('./sounds/boof3.mp3'),
        ],
    },

    playRandom(soundArray) {
        soundArray[Math.floor(Math.random() * soundArray.length)].play()
    },

    pop() { this.playRandom(this.sounds.pops) },
    boof() { this.playRandom(this.sounds.boofs) },
}





const ball = {
    x: field.cx,
    y: field.cy,
    r: 15,
    vx: 0,
    vy: 0,

    reset() {
        this.x = field.cx
        this.y = field.cy
        this.vx = 0
        this.vy = 3
    },

    step() {

        // update pos
        this.x += this.vx
        this.y += this.vy

        // update hitbox
        this.x1 = this.x - this.r
        this.x2 = this.x + this.r
        this.y1 = this.y - this.r
        this.y2 = this.y + this.r

        // wall collision
        if (this.x1 < field.x1) this.vx *= -1, this.x = field.x1 + this.r
        if (this.x2 > field.x2) this.vx *= -1, this.x = field.x2 - this.r
        if (this.y1 < field.y1) this.vy *= -1, this.y = field.y1 + this.r


        // paddle collision using axis-aligned bounding box (AABB)
        if (
            this.y2 > paddle.y1 && // optimisation: check y2 first
            this.x1 < paddle.x2 &&
            this.x2 > paddle.x1 &&
            this.y1 < paddle.y2
        ) {
            this.vy *= -1

            // traditional breakout
            // this.vx = (this.x - (paddle.x + paddle.w / 2)) / 15

            this.vx += paddle.vx / 2
            this.y = paddle.y1 - this.r // prevent glitch

            sound.boof()
        }

        // brick collision
        for (const brick of Brick.bricks) {
            if (
                this.y1 < brick.y2 &&
                this.y2 > brick.y1 &&
                this.x1 < brick.x2 &&
                this.x2 > brick.x1
            ) {
                brick.break()

                const overlapW = Math.min(this.x2, brick.x2) - Math.max(this.x1, brick.x1)
                const overlapH = Math.min(this.y2, brick.y2) - Math.max(this.y1, brick.y1)
                if (overlapW < overlapH) this.vx *= -1
                else this.vy *= -1

                // set shadow color to the color of the last hit brick
                c.shadowColor = brick.color

                sound.pop()
            }
        }
    },
    draw() {
        c.fillStyle = 'white'
        c.beginPath()
        c.arc(this.x, this.y, this.r, 0, 7)
        c.fill()
    }
}


class Brick {
    constructor(x, y, w, h, hp) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h

        // set hitbox
        this.x1 = this.x
        this.x2 = this.x + this.w
        this.y1 = this.y
        this.y2 = this.y + this.h

        this.hp = hp

        this.setColor()

        Brick.bricks.push(this)
    }

    setColor() {
        this.color = `hsl(${(this.hp - 1) * 30}, 100%, ${50 + this.hp * 2}%)`
    }

    break() {

        this.hp--
        this.setColor()

        if (this.hp < 1) {
            const thisIndex = Brick.bricks.indexOf(this)
            Brick.bricks.splice(thisIndex, 1)
            if (!Brick.bricks.length) game.levelCleared()
        }
    }

    draw() {
        c.fillStyle = this.color
        c.beginPath()
        c.roundRect(this.x, this.y, this.w, this.h, 5)
        c.fill()
    }


    static bricks = []
    static levels = [
        '0000 0 0 0 1111 1111 1111',
        '00000 0 0 01010 10101 01010 10101 01010 10101 01010',
        '11111 10001 10001 10001 10001 10001 10001 10001 10001 10001 10001 10001 10001 10001 10001',
        '000000000 0 0 121212121 212121212 121212121',
        '000000000 0 0 000333000 000353000 000333000',
        '000000000 0 000505000 000000000 005000500 000555000',
        '0000000 0 0 5555555 4444444 3333333 2222222 1111111',
        '000 0 0 0 0a0',
        'f 0 0 0 f',
        '00 0 0z',
        '0000000000000000 7 7 7 7 7 7 7 7 7 7 7 7 7',
        '00000000 0 bbbbbbbb aaaaaaaa 99999999 88888888 77777777 66666666 55555555 44444444 33333333 22222222 11111111',
        '1000000000000000',
    ]
    static loadLevel(level) {

        if (!this.levels[level]) return true

        const brickMap = this.levels[level].split(' ')
        const bricksPerRow = brickMap[0].length
        const gap = 10
        const w = (field.x2 - field.x1) / bricksPerRow - gap + gap / bricksPerRow
        const h = 40

        this.bricks = []
        for (let row = 0; row < brickMap.length; row++) {
            for (let brick = 0; brick < brickMap[row].length; brick++) {
                const healthPoints = parseInt(brickMap[row][brick], 36)
                healthPoints && new Brick(
                    field.x1 + (w + gap) * brick,
                    field.y1 + (h + gap) * row,
                    w, h, healthPoints)
            }
        }
    }
    static draw() {
        const blur = c.shadowBlur
        c.shadowBlur = 0
        for (const brick of this.bricks) brick.draw()
        c.shadowBlur = blur
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
            // case 'y': Brick.loadLevel(--game.currentLevel); break
            // case 'g': Brick.loadLevel(++game.currentLevel); break
            // case 'l': game.lives++; break
            case 'Enter': game.reset(); break
        }
    },
    step() {
        this.keys['d'] && paddle.moveLeft()
        this.keys['f'] && paddle.moveRight()
    }
}


const game = {
    loop() {

        // update
        input.step()
        paddle.step()
        ball.step()
        game.step()

        // render
        c.clearRect(0, 0, innerWidth, innerHeight)
        field.draw()
        paddle.draw()
        ball.draw()
        Brick.draw()
        game.draw()

    },

    levelCleared() {
        this.currentLevel++
        this.lives += 2
        if (Brick.loadLevel(this.currentLevel)) this.hasWon = true
    },

    reset() {
        this.lives = 4
        this.currentLevel = 0
        Brick.loadLevel(this.currentLevel)
        ball.reset()
        this.hasStarted = true
        this.hasWon = false
    },

    step() {
        if (ball.y > field.y2 + 200) {
            ball.reset()
            this.lives--
            !this.lives && this.reset()
        }
    },

    draw() {
        for (let i = 1; i < this.lives; i++) {
            c.fillStyle = '#fff4'
            c.beginPath()
            c.roundRect(field.x2 - 15, field.y2 - 30 * i, -paddle.w / 2, paddle.h, 10)
            c.fill()
        }

        if (this.hasWon) {
            c.fillStyle = 'white'
            c.font = '75px Silkscreen'
            c.fillText('you win!', field.cx, field.cy)
        }

        if (!this.hasStarted) {
            c.fillStyle = 'white'
            c.font = '50px Silkscreen'
            c.fillText('press "enter"', field.cx, field.cy - 100)
        }
    },

    requestID: 0,
    start() { game.requestID = requestAnimationFrame(game.start); game.loop() },
    stop() { cancelAnimationFrame(this.requestID) }
}



// addEventListener('focus', e => setTimeout(() => location.reload(), 150))
addEventListener('keydown', e => input.keyDown(e))
addEventListener('keyup', e => input.keyUp(e))
addEventListener('blur', e => { input.blur() })



game.start()
