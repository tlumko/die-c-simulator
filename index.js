

// 2,3,4,5 price
const combinations = [
    [[4, 4, 4], [6, 6],],
    [[4, 4], [8],],
    [[4, 4, 4, 4], [8, 8],],
    [[4, 4, 4, 4, 4], [10, 10],],
    [[6, 4], [10],],
    [[6, 6, 4, 4], [10, 10]],
    [[6, 6, 6, 6, 6], [10, 10, 10]],
]

// 1,2,3,4 price
const combinations2 = [
    [[4, 4], [6,],],
    [[4, 4, 4, 4], [6, 6],],
    [[4, 4, 4], [8],],
    [[4, 4, 4, 4], [10],],

    [[6, 6, 6], [8, 8]],
    [[6, 6,], [10]],
    [[6, 6, 6, 6], [10, 10]],

    [[4, 4, 4, 6,], [10, 4]],
    [[4, 4, 6, 6,], [10, 6]],
    [[4, 4, 6, 6,], [8, 8]],

    [[6, 6, 4, 4, 4], [10, 8]],
]

// 3,5,7,9 price
const combinations3 = [
    [[4, 4], [8]],
    [[4, 4, 4], [10]],
    [[4, 4, 4, 6, 6], [10, 10]],
    [[4, 6], [8]],
    [[6, 6], [10]],
    [[4, 4, 6, 6], [8, 10]],
    [[4, 4, 6, 6, 4, 4, 6, 6], [8, 10, 8, 10]],
]

// 4,8,12 set (2,4,6 price)
const combinations4 = [
    [[4, 4, 4], [12]],
    [[4, 4, 4, 4, 4, 4], [12, 12]],
    [[8, 8, 8,], [12, 12,]],
    [[4, 8], [12]],
    [[4, 4, 8, 8], [12, 12]]
]

// set 4,6,8, prices 2,3,4
const combinations5 = [
    [[4, 4, 4], [6, 6],],
    [[4, 4], [8],],
    [[4, 4, 4, 4], [8, 8],],
    [[4, 6, 6,], [8, 8,]],
    [[0], [0]],
    [[4, 6], [8]],
    [[4, 4], [6]],
    [[4, 4], [4, 6]],
    [[4, 4], [6, 6]],
    [[4, 6], [6, 6]],
]

const { battle } = require('./battle')
const { d4d61to3, d4DeathPenalty, d4SuicideBonus, d4plusOne, d6Transfer, d8Move, d8Superiority } = require('./upgrades')

const sideA = [4, 4, 4, 6, 6,]
const sideD = [8, 8, 8]
const sideAUpgrades = []
const sideDUpgrades = []


analyze([6, 6, 6], [10, 10], { side1Upgrades: [d6Transfer] })
analyze([6, 6, 6], [10, 10], { side1Upgrades: [] })

// analyze(sideA, sideD, { side1Upgrades: [], side2Upgrades: [] })
// analyze(sideA, sideD, { side1Upgrades: [], side2Upgrades: [d8Superiority] })
// analyze(sideA, sideD, { side1Upgrades: [d4DeathPenalty], side2Upgrades: [] })
// analyze(sideA, sideD, { side1Upgrades: [d4DeathPenalty], side2Upgrades: [d8Superiority] })
// analyze([4, 4, 6, 6], [8, 8, 4], { side1Upgrades: [], side2Upgrades: [] })
// analyze([4, 4, 6, 6], [8, 8, 4], { side1Upgrades: [d4plusOne], side2Upgrades: [] })
// analyze([4, 4, 6, 6], [8, 8, 4], { side1Upgrades: [], side2Upgrades: [d8Move] })
// analyze([4, 4, 6, 6], [8, 8, 4], { side1Upgrades: [d4plusOne], side2Upgrades: [d8Move] })

// combinations5.forEach(c => {
//     analyze(c[0], c[1])
// })

function analyze(side1, side2, { side1Upgrades = [], side2Upgrades = [], onlyAttack = false, log = false, logPrelim = false } = {}) {
    const winrate = {
        side1: 0,
        side2: 0,
        draw: 0
    }

    const attackWinrate = {
        side1: 0,
        side2: 0,
        draw: 0
    }

    const defenceWinrate = {
        side1: 0,
        side2: 0,
        draw: 0
    }

    for (let i = 0; i < 15000; i++) {
        const res = battle(side1, side2, log, side1Upgrades, side2Upgrades)

        if (!res) attackWinrate.draw++
        else if (res === 'a') attackWinrate.side1++
        else if (res === 'd') attackWinrate.side2++
        else { throw 'wtf' }
    }

    if (logPrelim) {
        logWinrate(side1, side2, attackWinrate, { prefix: ' - ', side1Upgrades, side2Upgrades })
    }

    if (!onlyAttack) {
        for (let i = 0; i < 15000; i++) {
            const res = battle(side2, side1, log, side2Upgrades, side1Upgrades)

            if (!res) defenceWinrate.draw++
            else if (res === 'a') defenceWinrate.side2++
            else if (res === 'd') defenceWinrate.side1++
            else { throw 'wtf' }
        }

        if (logPrelim) {
            logWinrate(side1, side2, defenceWinrate, { prefix: ' - ', switchSides: true, side1Upgrades, side2Upgrades })
        }
    }

    winrate.draw = attackWinrate.draw + defenceWinrate.draw
    winrate.side1 = attackWinrate.side1 + defenceWinrate.side1
    winrate.side2 = attackWinrate.side2 + defenceWinrate.side2

    logWinrate(side1, side2, winrate, { side1Upgrades, side2Upgrades })
}

function logWinrate(side1, side2, winrate, { side1Upgrades = [], side2Upgrades = [], prefix = '', switchSides = false }) {
    const total = winrate.side1 + winrate.side2 + winrate.draw
    const wintotal = winrate.side1 + winrate.side2

    const draws = Math.round(100 * winrate.draw / total)
    let side1Wins = Math.round(100 * winrate.side1 / wintotal)
    let side2Wins = Math.round(100 * winrate.side2 / wintotal)

    let side1Notation = side1.map(d => `[${d}]`).join()
    let side2Notation = side2.map(d => `[${d}]`).join()

    let side1UpgradesNotation = side1Upgrades.map(u => u.name).join(',') || '-'
    let side2UpgradesNotation = side2Upgrades.map(u => u.name).join(',') || '-'

    if (switchSides) {
        [side1Wins, side2Wins] = [side2Wins, side1Wins];
        [side1Notation, side2Notation] = [side2Notation, side1Notation];
        [side1UpgradesNotation, side2UpgradesNotation] = [side2UpgradesNotation, side1UpgradesNotation];
    }

    console.log(`${prefix}${side1Notation} vs ${side2Notation} : ${side1Wins}/${side2Wins} (${draws}% draws) [${side1UpgradesNotation} vs ${side2UpgradesNotation}]`)
}
