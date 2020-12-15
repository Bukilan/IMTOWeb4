
const blockMain = document.querySelector('.weather-block_container__current')
const blockExtraWrapper = document.querySelector('.weather-block_container__favourite')
const btnAdd = document.querySelector('.plus_button')
const inputAdd = document.querySelector('.favourite-weather_input')

const cityFavTemplate = document.querySelector('#fav-city')
const cityMainTemplate = document.querySelector('#main-city')
const dataBlockTemplate = document.querySelector('#weather-data-block')
const loaderTemplate = document.querySelector('#loader')

const apikey = 'ff37c2586fdf7285c6c3f9aefe1c3860'

// забираем данные с api
const fetchWeatherGet = url => fetch(`${url}&appid=${apikey}`).then(res => res.json())

// костыльный способ узнать направление на openweathermap
const getCardinal = angle => {
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

// Класс апишки с эндпоинтами
class Api {
    constructor() {
        this.endpoint = 'https://api.openweathermap.org/data/2.5'
    }

    weatherByString(str) {
        return fetchWeatherGet(`${this.endpoint}/weather?q=${encodeURIComponent(str)}&units=metric`)
    }

    weatherById(id) {
        return fetchWeatherGet(`${this.endpoint}/weather?id=${encodeURIComponent(id)}&units=metric`)
    }

    weatherByLatLon({latitude, longitude}) {
        return fetchWeatherGet(`${this.endpoint}/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&units=metric`)
    }
}

// Ассинхронно берем из навигатора долготу и широту
const getCurrentPositionAsync =
    () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true
    }))

// Враппер с помощью proxy. Помогает нам при изменении state триггерить нужную функцию отрисовки
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

// Данные
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

// Оборачиваем данные в прокси
const state = wrap(__state__)

// список хэндлеров, которые нужно вызвать чтобы отрисовать какой-то элемент
let updateListeners = {}

// обновляем хэндлеры
const updateHandler = prop => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].forEach(handler => handler())
}

// добавляем хэндлеры
const addListener = (prop, handler) => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].push(handler)
    else
        updateListeners[prop] = [handler]
}

// просто хэлпер формирующий объект для отображения
const param = (title, value) => {
    return {title, value}
}

const api = new Api()

const saveCityToLS = (id) => {
    let data = JSON.parse(localStorage.getItem('cities') || '[]')
    data.push(id)
    localStorage.setItem('cities', JSON.stringify(data))
}

const removeCityFromLS = (id) => {
    let data = JSON.parse(localStorage.getItem('cities') || '[]')
    localStorage.setItem('cities', JSON.stringify(data.filter(_=>parseInt(_, 10) !== parseInt(id, 10))))
}

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
            param('Ветер (направление)', getCardinal(wind.angle)),
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
    return stats.map(({title, value}) =>fillTemplate(dataBlockTemplate.innerHTML, {title, value})).join('')
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

    const lsData = await initFromLs()

    state.current = {
        ...state.current,
        ...weatherMapper(data),
        loading: false
    }
    state.starred = [
        ...state.starred,
        ...lsData,
    ]

    console.log(state)
}

async function initFromLs() {
    let citiesLs = []
    const lsData = JSON.parse(localStorage.getItem('cities'))
    if (!lsData) return []
    for (let item of lsData) {
        if (item) {
            const data = await api.weatherById(item)
            citiesLs.push(weatherMapper(data))
        }
    }
    return citiesLs
}

async function onBtnAddClick() {
    const val = inputAdd.value
    inputAdd.disabled = true
    inputAdd.value = 'Загрузка...'
    try {
        state.starred = [...state.starred, {loading:true}]
        const data = await api.weatherByString(val)
        state.starred.pop()
        if(state.starred.map(_=>_.id).includes(data.id)) {
            inputAdd.disabled = false
            inputAdd.value = ''
            state.starred = [...state.starred]
            return alert('Такой город уже есть!')
        }
        saveCityToLS(data.id)
        state.starred = [...state.starred, weatherMapper(data)]
    } catch(err) {
        alert('У нас определенно что-то сломалось(')
        state.starred = [...state.starred]
        console.error(err)
    }
    inputAdd.disabled = false
    inputAdd.value = ''
}
function onRemoveClick(id) {
    state.starred = state.starred.filter(_=>_.id !== parseInt(id, 10))
    removeCityFromLS(id)
}

function mainFunc() {
    btnAdd.addEventListener('click', onBtnAddClick)
    addListener('current', renderBlockMain)
    addListener('starred', renderBlocksExtra)
    initCurrentPosition()
}

mainFunc()