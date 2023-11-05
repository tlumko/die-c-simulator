
const { copy } = require('./utils')

const attackPenatly = 1
const suicidePenatly = 2

const random = (x) => Math.floor(Math.random() * x + 1)

function roll(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

const calculatePositions = (arena) => {
    return arena.map((d, i) => ({ ...d, position: i }))
}

const log = (arena) => console.log(arena.map(d => `[${d.side}${d.value}]`).join())

const findNearestEnemies = (arena, dice) => {
    let leftEnemy
    let rightEnemy
    let index = dice.position - 1

    while (!leftEnemy && index >= 0) {
        const left = arena[index]

        if (left && left.side !== dice.side) {
            leftEnemy = left
        }

        index--
    }

    index = dice.position + 1
    while (!rightEnemy && index < arena.length) {
        const right = arena[index]

        if (right && right.side !== dice.side) {
            rightEnemy = right
        }

        index++
    }

    return [leftEnemy, rightEnemy].filter(d => !!d)
}

const getPowerOrder = (arena, strong) => {
    if (strong) {
        return arena.sort((d1, d2) => d2.value - d1.value)
    } else {
        return arena.sort((d1, d2) => d1.value - d2.value)
    }
}

const attack = (arena, sideOrder) => {
    let victim
    let attacker

    //try kill
    let index = 0
    while (!victim && index < sideOrder.length) {
        attacker = sideOrder[index]
        const enemies = findNearestEnemies(arena, attacker)
        const enemyPowerOrder = getPowerOrder(enemies)

        const [weakEnemy, strongEnemy] = enemyPowerOrder

        if (strongEnemy && attacker.value > strongEnemy.value) {
            victim = strongEnemy
        } else if (attacker.value > weakEnemy.value) {
            victim = weakEnemy
        }

        index++
    }

    if (victim) {
        return { attacker, victim }
    }

    //try suicide
    index = 0
    while (!victim && index < sideOrder.length) {
        attacker = sideOrder[index]
        const enemies = findNearestEnemies(arena, attacker)
        const enemyPowerOrder = getPowerOrder(enemies)

        if (attacker.value === enemyPowerOrder[0].value) {
            victim = enemyPowerOrder[0]
        }

        index++
    }

    if (victim) {
        return { attacker, victim }
    }

    //suicide
    attacker = sideOrder[0]
    const enemies = findNearestEnemies(arena, attacker)
    const enemyPowerOrder = getPowerOrder(enemies)
    const [weakEnemy, strongEnemy] = enemyPowerOrder

    return { attacker, victim: strongEnemy || weakEnemy }
}

const switchSides = side => side === 'a' ? 'd' : 'a'

const applyAfterRollUpgrades = (arena, toLog, attackerUpgrades, defenderUpgrades) => {
    attackerUpgrades.filter(p => p.type === 'afterRoll').forEach(patch => {
        arena = patch(arena, 'a')

        if (toLog) log(arena)
    })

    defenderUpgrades.filter(p => p.type === 'afterRoll').forEach(patch => {
        arena = patch(arena, 'd')

        if (toLog) log(arena)
    })

    return arena
}

const applyAfterAttackUpgrades = (attacker, victim, attackerUpgrades, defenderUpgrades) => {
    attackerUpgrades.filter(p => p.type === 'afterAttack').forEach(patch => {
        [attacker, victim] = patch(attacker, victim, 'a')
    })

    defenderUpgrades.filter(p => p.type === 'afterAttack').forEach(patch => {
        [attacker, victim] = patch(attacker, victim, 'd')
    })

    return [attacker, victim]
}

const prepareVariation = (attackerUpgrades, defenderUpgrades) => {
    const variationUpgrades = [
        ...attackerUpgrades.filter(upgrade => upgrade.type === 'variation').map(upgrade => ({ side: 'a', upgrade })),
        ...defenderUpgrades.filter(upgrade => upgrade.type === 'variation').map(upgrade => ({ side: 'd', upgrade }))
    ]

    if (variationUpgrades.length > 1) {
        throw 'only 1 variation upgrade per simulation'
    }

    let variation

    if (variationUpgrades[0]) {
        variation = {
            battles: [],
            side: variationUpgrades[0].side,
            upgrade: variationUpgrades[0].upgrade,
            subType: variationUpgrades[0].upgrade.subType
        }
    }

    return variation
}

const prepareBattle = (sideA, sideD, toLog, attackerUpgrades, defenderUpgrades, variation) => {
    const aDices = sideA.map(d => ({ side: 'a', type: d, value: random(d) }))
    const dDices = sideD.map(d => ({ side: 'd', type: d, value: random(d) }))

    let arena = [...dDices, ...aDices,]
    arena = calculatePositions(arena)

    if (toLog) log(arena)

    arena = applyAfterRollUpgrades(arena, toLog, attackerUpgrades, defenderUpgrades)

    let side = 'a'

    if (variation && variation.subType === 'afterRoll') {
        variation.battles = variation.upgrade(arena, variation.side, side)
    }

    return {
        arena, side, variation
    }
}

const runBattle = (arena, side, toLog, attackerUpgrades, defenderUpgrades, variation) => {
    while (true) {
        const sideDices = arena.filter(d => d.side === side)
        const sideOrder = getPowerOrder(sideDices)

        let { attacker, victim } = attack(arena, sideOrder)

        attacker.previousValue = attacker.value
        victim.previousValue = victim.value

        if (attacker.value > victim.value) {
            attacker.value -= attackPenatly
            victim.value = 0
        } else if (attacker.value === victim.value) {
            attacker.value = 0
            victim.value = 0
        } else if (attacker.value < victim.value) {
            attacker.value = 0
            victim.value -= suicidePenatly
        } else {
            throw 'wtf'
        }

        [attacker, victim] = applyAfterAttackUpgrades(attacker, victim, attackerUpgrades, defenderUpgrades)

        if (variation && variation.subType === 'afterAttack') {
            variation = variation.upgrade(variation, arena, attacker, victim)
        }

        arena = arena.filter(d => d.value > 0)

        arena = calculatePositions(arena)
        if (toLog) log(arena)

        if (!arena.length) { return { winner: null, variation } }

        let sideAlive = arena.find(d => d.side === side)
        if (!sideAlive) {
            return {
                winner: switchSides(side),
                variation
            }
        }

        side = switchSides(side)

        sideAlive = arena.find(d => d.side === side)
        if (!sideAlive) {
            return {
                winner: switchSides(side),
                variation
            }
        }
    }
}

const battle = (sideA, sideD, toLog = false, attackerUpgrades = [], defenderUpgrades = []) => {
    const initialVariation = prepareVariation(attackerUpgrades, defenderUpgrades)

    let { arena, side, variation } = prepareBattle(sideA, sideD, toLog, attackerUpgrades, defenderUpgrades, initialVariation)

    const result = runBattle(arena, side, toLog, attackerUpgrades, defenderUpgrades, variation)

    if (variation) {
        if (result.winner === variation.side) { return result.winner }

        if (!variation.battles.length) { return result.winner }

        let victory = false
        let draw = false

        variation.battles.some(({ arena, side }) => {
            if (toLog) log(arena)

            arena = calculatePositions(arena)
            const r = runBattle(arena, side, toLog, attackerUpgrades, defenderUpgrades)

            if (r.winner === variation.side) { victory = true; return true }
            if (!r) { draw = true }
        })

        if (victory) { return variation.side }
        if (draw) { return null }
    }

    return result.winner
}

const { d4d61to3, d4DeathPenalty, d4SuicideBonus, d4plusOne, d6Transfer, d8Move } = require('./upgrades')

const sideA = [4, 8, 8]
const sideD = [4, 6, 6]
const sideAUpgrades = [d8Move]
const sideDUpgrades = []

// console.log(battle(sideA, sideD, true, sideAUpgrades, sideDUpgrades))

module.exports = {
    battle
}