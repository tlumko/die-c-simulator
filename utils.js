
const copy = (o) => {
    if (Array.isArray(o)) {
        return o.map(oo => ({ ...oo }))
    }

    if (typeof o === 'object') {
        return { ...o }
    }
}

module.exports = {
    copy
}