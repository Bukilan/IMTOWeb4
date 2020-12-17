
const blockMain = document.querySelector('.weather-block_container__current')
const blockExtraWrapper = document.querySelector('.weather-block_container__favourite')
const inputAdd = document.querySelector('.favourite-weather_input')

const cityFavTemplate = document.querySelector('#fav-city')
const cityMainTemplate = document.querySelector('#main-city')
const dataBlockTemplate = document.querySelector('#weather-data-block')
const loaderTemplate = document.querySelector('#loader')


const getCoordinates = angle => {
    const degreePerDirection = 360 / 8;

    const offsetAngle = angle + degreePerDirection / 2;

    return (offsetAngle >= 0 * degreePerDirection && offsetAngle < 1 * degreePerDirection) ? "Север"
        : (offsetAngle >= 1 * degreePerDirection && offsetAngle < 2 * degreePerDirection) ? "Северо-Восток"
            : (offsetAngle >= 2 * degreePerDirection && offsetAngle < 3 * degreePerDirection) ? "Восток"
                : (offsetAngle >= 3 * degreePerDirection && offsetAngle < 4 * degreePerDirection) ? "Юго-Восток"
                    : (offsetAngle >= 4 * degreePerDirection && offsetAngle < 5 * degreePerDirection) ? "Юг"
                        : (offsetAngle >= 5 * degreePerDirection && offsetAngle < 6 * degreePerDirection) ? "Юго-Запад"
                            : (offsetAngle >= 6 * degreePerDirection && offsetAngle < 7 * degreePerDirection) ? "Запад"
                                : "Северо-Запад";
}

class Api {
    constructor() {
        this.endpoint = 'http://localhost:3000'
    }

    weatherByString(str) {
        return fetch(`${this.endpoint}/weather/city?q=${encodeURIComponent(str)}`).then(res => res.json())
    }

    weatherById(id) {
        return fetch(`${this.endpoint}/weather/city?id=${encodeURIComponent(id)}`).then(res => res.json())
    }

    weatherByLatLon({latitude, longitude}) {
        return fetch(`${this.endpoint}/weather/coordinates?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`).then(res => res.json())
    }

    saveFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        }).then(res => res.json())
    }

    getFavorites() {
        return fetch(`${this.endpoint}/favorites`).then(res => res.json())
    }

    removeFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        }).then(res => res.json())
    }
}


const getCurrentPositionAsync =
    () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true
    }))

const wrap = obj => {
    return new Proxy(obj, {
        get(target, propKey) {
            return target[propKey]
        },
        set(target, prop, value) {
            console.log(value)
            target[prop] = value
            updateHandler(prop)
        }
    })
}

let __state__ = {
    current: {
        loading: false,
        title: "",
        temp: 0,
        params: [
            {title: '', value: ''}
        ]
    },
    starred: []
}

let state = wrap(__state__)

let updateListeners = {}

const updateHandler = prop => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].forEach(handler => handler())
}

const addListener = (prop, handler) => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].push(handler)
    else
        updateListeners[prop] = [handler]
}

const param = (title, value) => {
    return {title, value}
}

const api = new Api()

const weatherMapper = (obj) => {
    const {main, name, wind, coord, id} = obj

    return {
        id,
        title: name,
        temp: Math.round(main.temp),
        params: [
            param('Влажность', main.humidity + '%'),
            param('Давление', main.pressure + ' гПа'),
            param('Ветер м/с', wind.speed + ' м/с'),
            param('Ветер (направление)', getCoordinates(wind.angle)),
            param('Координаты', Object.values(coord).join(',')),
        ],
    }
}

function fillTemplate(template, values) {
    return template.replace(/{([^{}]*)}/g, function (a, b) {
        return values[b];
    });
}

const renderLoader = () => {
    return loaderTemplate.innerHTML
}

const renderStats = stats => {
    if(!stats) return ''
    return stats.map(({title, value}) => fillTemplate(dataBlockTemplate.innerHTML, {title, value})).join('')
}

const renderBlockMain = () => {
    blockMain.innerHTML = ``
    const values = {
        loading: state.current.loading ? renderLoader() : '',
        title: state.current.title,
        temp: state.current.temp,
        stats: renderStats(state.current.params)
    }
    const node = cityMainTemplate.cloneNode(true)
    node.innerHTML = fillTemplate(node.innerHTML, values)
    const nodeImported = document.importNode(node.content, true)
    blockMain.appendChild(nodeImported)
    return blockMain.innerHTML
}

const renderBlocksExtra = () => {
    blockExtraWrapper.innerHTML = "";
    state.starred.forEach(loc => {
        const values = {
            loading: loc.loading ? renderLoader() : '',
            title: loc.title,
            temp: loc.temp,
            id: loc.id,
            stats: renderStats(loc.params)
        }
        const node = cityFavTemplate.cloneNode(true)
        node.innerHTML = fillTemplate(node.innerHTML, values)
        const nodeImported = document.importNode(node.content, true)
        blockExtraWrapper.appendChild(nodeImported)
    });
    [...document.querySelectorAll('.close_button')].forEach(it => {
        it.addEventListener('click', () => {
            const id = it.getAttribute('data-id')
            if(!id) return
            onRemoveClick(id)
        })
    })
    return blockExtraWrapper.innerHTML
}

async function initCurrentPosition() {
    state.current = {
        ...state.current,
        loading: true
    }
    let data = null
    try {
        const pos = await getCurrentPositionAsync()
        const {coords} = pos
        data = await api.weatherByLatLon({
            latitude: coords.latitude,
            longitude: coords.longitude
        })
    } catch (err) {
        const spbid = 498817
        data = await api.weatherById(spbid)
    }

    state.current = {
        ...state.current,
        ...weatherMapper(data),
        loading: false
    }
}

async function loadFavorites() {
    const {list} = await api.getFavorites()
    state.starred = [...state.starred, ...list.map(_ => weatherMapper(_))]
}

async function onBtnAddClick(e) {
    e.preventDefault()
    const val = inputAdd.value
    inputAdd.disabled = true
    inputAdd.value = 'Загрузка...'
    try {
        state.starred = [...state.starred, {loading:true}]
        const data = await api.weatherByString(val)
        if (data.cod === '404')
            throw new Error('not found')
        state.starred.pop()
        if(state.starred.map(_=>_.id).includes(data.id)) {
            inputAdd.disabled = false
            inputAdd.value = ''
            state.starred = [...state.starred]
            return alert('Такой город уже есть!')
        }
        await api.saveFavorite(data.id)
        state.starred = [...state.starred, weatherMapper(data)]
    } catch(err) {
        state.starred.pop()
        state.starred = [...state.starred]
        alert('У нас определенно что-то сломалось(')
    }
    inputAdd.disabled = false
    inputAdd.value = ''
}
async function onRemoveClick(id) {
    state.starred = state.starred.filter(_=>_.id !== parseInt(id, 10))
    await api.removeFavorite(id)
}

function setState(someNewState) {
    state = someNewState
}

function getState() {
    return state
}

function mainFunc() {
    document.querySelector('#form').addEventListener('submit', onBtnAddClick)
    addListener('current', renderBlockMain)
    addListener('starred', renderBlocksExtra)
    initCurrentPosition()
    loadFavorites()
}

module.exports = {
    loadFavorites,
    initCurrentPosition,
    renderBlockMain,
    renderBlocksExtra,
    renderStats,
    renderLoader,
    weatherMapper,
    Api,
    getCoordinates,
    fillTemplate,
    getCurrentPositionAsync,
    wrap,
    addListener,
    updateHandler,
    setState,
    param,
    getState,
    onBtnAddClick,
    onRemoveClick,
}
