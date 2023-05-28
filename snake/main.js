

/** @type {HTMLCanvasElement} */
const canvasElement = document.getElementById('canvas')
const c = canvasElement.getContext('2d')
canvasElement.width = innerWidth
canvasElement.height = innerHeight

if (!localStorage.highscore) localStorage.highscore = 0

// playing field
const board = {
    w: 10,
    h: 10,
    draw() {
        c.strokeStyle = '#fff4'
        c.shadowColor = 'white'
        c.lineWidth = .2
        c.strokeRect(0, 0, this.w, this.h)
    }
}

// foods enum
const foods = {
    normal: 1,
    healthy: 2,
    invis: 3,
}
const food = {
    x: 1,
    y: 1,
    type: foods.normal,

    respawn() {

        // pick random spot on board
        this.x = Math.floor(Math.random() * board.w)
        this.y = Math.floor(Math.random() * board.h)

        // guess and try again, causes lag
        // for (const segment of snake.body) if (this.x == segment.x && this.y == segment.y) this.respawn()

        // spawn with random type
        const chance = Math.random()
        if (chance > .9) this.type = foods.invis
        else if (chance > .8) this.type = foods.healthy
        else this.type = foods.normal

    },

    draw() {
        switch (this.type) {
            case foods.normal: c.fillStyle = 'red'; break
            case foods.healthy: c.fillStyle = 'gold'; break
            case foods.invis: c.fillStyle = 'cyan'; break
        }
        c.shadowColor = c.fillStyle
        c.fillRect(this.x + .1, this.y + .1, 1 - .2, 1 - .2)
    },
}


const score = {
    value: 0,
    setHighScore() {
        if (this.value > localStorage.highscore) localStorage.highscore = this.value
    },
    draw() {

        // this.value
        c.font = '5px Silkscreen'
        c.fillStyle = '#fff4'
        c.shadowColor = 'white'
        c.textBaseline = 'middle'
        c.textAlign = 'center'
        c.fillText(this.value, board.w / 2, board.h / 2)

        // highscore
        c.font = '2px Silkscreen'
        c.textAlign = 'right'
        c.textBaseline = "bottom"
        c.fillText(localStorage.highscore, board.w, board.h)

        // invisCount
        if (snake.invisCount > 0) {
            c.textAlign = 'left'
            c.textBaseline = 'top'
            c.fillText(snake.invisCount, 0, 0)
        }
    },
}


// directions enum
const dirs = {
    up: 0,
    left: 1,
    down: 2,
    right: 3,
}
const snake = {
    x: 0,
    y: 0,
    dir: dirs.right,
    prevDir: dirs.right,
    body: [],
    invisCount: 0,

    eat() {
        switch (food.type) {
            case foods.normal:
                this.body.push({ x: this.x, y: this.y })
                score.value++
                break
            case foods.healthy:
                for (let i = 0; i < 5; i++) this.body.push({ x: this.x, y: this.y })
                score.value += 5
                break
            case foods.invis: this.invisCount = score.value; break
        }
        food.respawn()
    },

    step() {

        // update body
        for (let i = this.body.length - 1; i > 0; i--) {
            const current = this.body[i]
            const next = this.body[i - 1]
            current.x = next.x
            current.y = next.y
        }

        // dont go backwards
        if (this.dir == dirs.up && this.prevDir == dirs.down) this.dir = dirs.down
        else if (this.dir == dirs.down && this.prevDir == dirs.up) this.dir = dirs.up
        else if (this.dir == dirs.right && this.prevDir == dirs.left) this.dir = dirs.left
        else if (this.dir == dirs.left && this.prevDir == dirs.right) this.dir = dirs.right
        this.prevDir = this.dir

        // move
        switch (this.dir) {
            case dirs.up: this.y--; break
            case dirs.left: this.x--; break
            case dirs.down: this.y++; break
            case dirs.right: this.x++; break
        }

        // tp
        if (this.x < 0) this.x = board.w - 1
        else if (this.x > board.w - 1) this.x = 0
        else if (this.y < 0) this.y = board.h - 1
        else if (this.y > board.h - 1) this.y = 0

        // check self
        if (this.invisCount > 0) this.invisCount--
        else for (const segment of this.body) if (this != segment && this.x == segment.x && this.y == segment.y) die()

        // check food
        if (this.x == food.x && this.y == food.y) this.eat()


    },
    draw() {
        this.invisCount > 0 ? c.fillStyle = 'cyan' : c.fillStyle = 'lime'
        c.shadowColor = c.fillStyle
        for (const segment of this.body)
            c.fillRect(segment.x + .1, segment.y + .1, 1 - .2, 1 - .2)
    }
}

function startMenu() {
    c.strokeStyle = 'lime'
    c.fillStyle = '#0f04'
    c.lineWidth = 0.05
    c.beginPath()
    c.rect(0, 0, board.w, board.h)
    c.fill()
    c.stroke()

    c.font = '1.5px Silkscreen'
    c.textBaseline = 'middle'
    c.textAlign = 'center'
    c.fillStyle = 'lime'
    c.fillText('snek.js', board.w / 2, board.h / 5)
    c.font = '.5px silkscreen'
    c.fillText('---by fredcat---', board.w / 2, board.h / 2)
    c.fillText('press "enter"', board.w / 2, board.h / 1.25)
}

function deathScreen() {
    c.strokeStyle = 'red'
    c.fillStyle = '#f004'
    c.lineWidth = 0.05
    c.beginPath()
    c.rect(0, 0, board.w, board.h)
    c.fill()
    c.stroke()

    c.font = '1.5px Silkscreen'
    c.textBaseline = 'middle'
    c.textAlign = 'center'
    c.fillStyle = 'red'
    c.fillText('you died', board.w / 2, board.h / 5)
    c.font = '.5px silkscreen'
    c.fillText('score: ' + score.value, board.w / 2, board.h / 2)
    c.fillText('press "enter"', board.w / 2, board.h / 1.25)
}


function die() { score.setHighScore(); gameState = gameStates.death }
function reset() {
    gameState = gameStates.running
    snake.x = Math.floor(board.w / 2)
    snake.y = Math.floor(board.h / 2)
    snake.dir = dirs.up
    snake.prevDir = snake.dir
    snake.body = []
    snake.body.push(snake)
    snake.body.push({ x: snake.x, y: snake.y - 1 })
    food.respawn()
    score.value = 2
}

// reload page automatically
addEventListener('focus', e => setTimeout(() => location.reload(), 100))

addEventListener('keydown', e => {
    switch (e.key) {
        case 'g': snake.dir = dirs.up; break
        case 'r': snake.dir = dirs.left; break
        case 's': snake.dir = dirs.down; break
        case 't': snake.dir = dirs.right; break
        case ' ': snake.eat(); break // comment this out
        case 'Enter': reset(); break

    }
})

// gamestate enum
const gameStates = {
    start: 1,
    running: 2,
    death: 3,
}
let gameState = gameStates.start

// canvas settings
c.scale(60, 60)
c.translate(2, 2)

function gameloop() {
    setTimeout(gameloop, 1000 / 2) // (2 + score.value / 10))

    c.clearRect(-1, -1, innerWidth, innerHeight)
    c.shadowBlur = 0

    switch (gameState) {
        case gameStates.start: startMenu(); break
        case gameStates.running:

            // update
            snake.step()

            // render
            c.shadowBlur = 20
            snake.draw()
            food.draw()
            board.draw()
            score.draw()

                ; break
        case gameStates.death: deathScreen(); break
    }
}
gameloop()
