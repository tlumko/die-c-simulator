const { copy } = require('./utils')

const d4plusOne = (arena, side) => {
    const dd4 = arena
        .filter(d => d.side === side)
        .filter(d => d.type === 4)
        .filter(d => d.value !== 4)
        .sort((d1, d2) => d2.value - d1.value)

    for (let i = 0; i < 2; i++) {
        if (dd4[i]) dd4[i].value += 1
    }

    return arena
}
d4plusOne.type = 'afterRoll'

const d4d61to3 = (arena, side) => {
    arena
        .filter(d => d.side === side)
        .filter(d => d.type === 4 || d.type === 6)
        .filter(d => d.value === 1 || d.value === 2)
        .forEach(d => d.value = 3)

    return arena
}
d4d61to3.type = 'afterRoll'


const d4DeathPenalty = (attacker, victim, side) => {
    if (victim.side !== side) {
        return [attacker, victim]
    }

    if (victim.type !== 4) {
        return [attacker, victim]
    }

    attacker.value -= 1

    return [attacker, victim]
}
d4DeathPenalty.type = 'afterAttack'

const d4SuicideBonus = (attacker, victim, side) => {
    if (attacker.side !== side) {
        return [attacker, victim]
    }

    if (attacker.type !== 4) {
        return [attacker, victim]
    }

    victim.value -= 1

    return [attacker, victim]

}
d4SuicideBonus.type = 'afterAttack'

const d6Transfer = (arena, side, attackSide) => {
    const targetDices = arena.filter(d => d.side === side).filter(d => d.type === 6)

    if (targetDices.length < 2) { return null }

    const arenas = []

    for (let i = 0; i < targetDices.length; i++) {
        for (let j = i + 1; j < targetDices.length; j++) {
            const dice1readyToTransfer = targetDices[i].value - 1
            const dice2readyToAccept = targetDices[j].type - targetDices[j].value

            let toTransfer = dice1readyToTransfer < dice2readyToAccept ? dice1readyToTransfer : dice2readyToAccept

            let newArena = copy(arena)
            newArena[targetDices[i].position].value -= toTransfer
            newArena[targetDices[j].position].value += toTransfer

            arenas.push(newArena)

            const dice2readyToTransfer = targetDices[j].value - 1
            const dice1readyToAccept = targetDices[i].type - targetDices[i].value

            toTransfer = dice2readyToTransfer < dice1readyToAccept ? dice2readyToTransfer : dice1readyToAccept

            newArena = copy(arena)
            newArena[targetDices[i].position].value += toTransfer
            newArena[targetDices[j].position].value -= toTransfer

            arenas.push(newArena)
        }
    }

    return arenas.map(arena => ({ arena, side: attackSide }))
}
d6Transfer.type = 'variation'
d6Transfer.subType = 'afterRoll'

const d8Move = (variation, arena, attacker, victim) => {
    if (attacker.side !== variation.side) { return variation }

    if (attacker.type !== 8) { return variation }

    if (attacker.value < 1) { return variation }

    arena = copy(arena)
    attacker = arena[attacker.position]
    arena = arena.filter(d => d.value > 0)
    arena.forEach((dice, index) => { dice.position = index })
    for (let targetPosition = 0; targetPosition < arena.length; targetPosition++) {
        let newArena = copy(arena)

        if (targetPosition === attacker.position) {
            continue
        }

        if (targetPosition < attacker.position) {
            for (let i = attacker.position; i > targetPosition; i--) {
                newArena[i] = newArena[i - 1]
            }
        } else if (targetPosition > attacker.position) {
            for (let i = attacker.position; i < targetPosition; i++) {
                newArena[i] = newArena[i + 1]
            }
        } else {
            throw 'nonsense'
        }

        newArena[targetPosition] = attacker

        variation.battles.push({
            arena: newArena,
            side: victim.side
        })
    }

    return variation
}
d8Move.type = 'variation'
d8Move.subType = 'afterAttack'

const d8Superiority = (attacker, victim, side) => {
    if (attacker.side !== side) { return [attacker, victim] }

    if (attacker.type !== 8) { return [attacker, victim] }

    if (attacker.value === 0 && victim.value === 0) {
        attacker.value = attacker.previousValue - 1
    }

    return [attacker, victim]
}
d8Superiority.type = 'afterAttack'

module.exports = {
    d4plusOne,
    d4d61to3,
    d4DeathPenalty,
    d4SuicideBonus,
    d6Transfer,
    d8Move,
    d8Superiority,
}