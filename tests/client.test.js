const client = require("../src/js/index.js");
const {
  trimString,
  fetchWithResponse,
  generateWeather,
  generateState
} = require('./helpers')


describe("renderLoader()", () => {
  it("Должен вернуть template лоадера", () => {
    const loaderBlock = client.renderLoader()
    expect(loaderBlock).toBe(global.document.querySelector('#loader').innerHTML)
  })
})

describe("renderStats()", () => {
  it("Должен вернуть пустую строку, если в функцию ничего не передано", () => {
    const stateBlock = client.renderStats()
    expect(stateBlock).toHaveLength(0)
  })
  it("Должен вернуть верный template, если аргументы переданы в функцию", () => {
    const stateBlock = client.renderStats([{
      title: "sometitle",
      value: "somevalue"
    }])
    expect(trimString(stateBlock)).toBe(trimString(`
        <li class="weather-data">
          <div class="weather-data_key">sometitle</div>
          <div class="weather-data_value">somevalue</div>
        </li>
      `))
  })
})

describe("renderBlockMain()", () => {
  it("Должен вернуть верный template, если аргументы переданы в функцию", () => {
    const blockMain = client.renderBlockMain()
    expect(trimString(blockMain)).toBe(trimString(`
        <div class="weather-block">
            <div class="current-weather_location__city">
                
            </div>
            <div class="current-weather_location__temperature_container">
                <!--заменить на img-->
                <div class="current-weather_location__temperature_icon"></div>
                <div class="current-weather_location__temperature_value">
                    0°C
                </div>
            </div>
        </div>
        <ul class="weather-block">
            
        <li class="weather-data">
            <div class="weather-data_key">
                
            </div>
            <div class="weather-data_value">
                
            </div>
        </li>
        </ul>
      `))
  })
  it("Должен вернуть верный template, если аргументы переданы в функцию с температурой 16", () => {
    const state = client.wrap(generateState())
    state.current.temp = 16
    client.setState(state)
    const blockMain = client.renderBlockMain()
    expect(trimString(blockMain)).toBe(trimString(`
        <div class="weather-block">
            <div class="current-weather_location__city">
                
            </div>
            <div class="current-weather_location__temperature_container">
                <!--заменить на img-->
                <div class="current-weather_location__temperature_icon"></div>
                <div class="current-weather_location__temperature_value">
                    16°C
                </div>
            </div>
        </div>
        <ul class="weather-block">
            
        <li class="weather-data">
            <div class="weather-data_key">
                
            </div>
            <div class="weather-data_value">
                
            </div>
        </li>
    
        </ul>
      `))
  })
})

describe("renderBlocksExtra()", () => {
  it("should return default HTML if state is not changed", () => {
    const blockExtra = client.renderBlocksExtra()
    expect(blockExtra).toHaveLength(0)
  })
  it("should return default HTML if state is not changed", () => {
    const weather = client.weatherMapper(generateWeather())
    client.setState({
      ...generateState(),
      starred: [weather]
    })
    const blockExtra = client.renderBlocksExtra()
    expect(trimString(blockExtra)).toBe(trimString(`
        <div class="weather-block">
            
            <div class="common-weather_container">
                <div class="common-weather_inner-container">
                    <div class="common-weather_city">
                        Saint Petersburg
                    </div>
                    <div class="common-weather_temperature">
                        NaN°C
                    </div>
                    <!--заменить на img-->
                    <div class="common-weather_icon"></div>
                </div>
                <button type="button" class="close_button" data-id="777">
            </button></div>
            <ul class="common-weather_info-container">
                
        <li class="weather-data">
            <div class="weather-data_key">
                Влажность
            </div>
            <div class="weather-data_value">
                0%
            </div>
        </li>
    
        <li class="weather-data">
            <div class="weather-data_key">
                Давление
            </div>
            <div class="weather-data_value">
                80 гПа
            </div>
        </li>
    
        <li class="weather-data">
            <div class="weather-data_key">
                Ветер м/с
            </div>
            <div class="weather-data_value">
                1 м/с
            </div>
        </li>
    
        <li class="weather-data">
            <div class="weather-data_key">
                Ветер (направление)
            </div>
            <div class="weather-data_value">
                Юго-Восток
            </div>
        </li>
    
        <li class="weather-data">
            <div class="weather-data_key">
                Координаты
            </div>
            <div class="weather-data_value">
                3,4
            </div>
        </li>
    
            </ul>
        </div>
      `))
  })
})

describe("fillTemplate()", () => {
  it("Должен возвращать заполнять template и возвращать правильный HTML", () => {
    const template = `<h1>{title}</h1><h2>{subtitle}</h2>`
    const filledTemplate = client.fillTemplate(template, {title: "TITLE", subtitle: "SUBTITLE"})
    expect(filledTemplate).toBe(`<h1>TITLE</h1><h2>SUBTITLE</h2>`)
  })
})


const api = new client.Api()
describe("Api()", () => {
  beforeAll(() => {
    global.fetch = (url, options) => new Promise(
      resolve => resolve({json: () => new Promise(resolve2 => resolve2({url, options}))})
    )
  })
  it("Должен иметь эндпоинт http://localhost:3000", () => {
    expect(api).toHaveProperty("endpoint", "http://localhost:3000")
  })
  it("Должен возвращать погоду по строке", async () => {
    const city = "moscow"
    const {url} = await api.weatherByString(city)
    expect(url).toBe(`http://localhost:3000/weather/city?q=${city}`)
  })
  it("Должен возвращать погоду по id", async () => {
    const id = 123456
    const {url} = await api.weatherById(id)
    expect(url).toBe(`http://localhost:3000/weather/city?id=${id}`)
  })
  it("Должен возвращать строку по долготе/широте", async () => {
    const obj = {latitude: 1, longitude: 2}
    const {url} = await api.weatherByLatLon(obj)
    expect(url).toBe(`http://localhost:3000/weather/coordinates?lat=${obj.latitude}&lon=${obj.longitude}`)
  })
  it("Должен сохранять в избранное", async () => {
    const id = 777
    const {url, options} = await api.saveFavorite(id)
    expect(url).toBe(`http://localhost:3000/favorites`)
    expect(options).toHaveProperty('method', 'POST')
    expect(options).toHaveProperty('headers')
    expect(options.headers).toHaveProperty('Accept', 'application/json')
    expect(options.headers).toHaveProperty('Content-Type', 'application/json')
    expect(options).toHaveProperty('body', JSON.stringify({id}))
  })
  it("Должен принимать избранное", async () => {
    const {url} = await api.getFavorites()
    expect(url).toBe(`http://localhost:3000/favorites`)
  })
  it("Должен удалять из избранного", async () => {
    const id = 888
    const {url, options} = await api.removeFavorite(id)
    expect(url).toBe(`http://localhost:3000/favorites`)
    expect(options).toHaveProperty('method', 'DELETE')
    expect(options).toHaveProperty('headers')
    expect(options.headers).toHaveProperty('Accept', 'application/json')
    expect(options.headers).toHaveProperty('Content-Type', 'application/json')
    expect(options).toHaveProperty('body', JSON.stringify({id}))
  })
})

describe('getCoordinates()', () => {
  it('180deg это Юг', () => {
    expect(client.getCoordinates(180)).toBe('Юг');
  });

  it('350deg это Северо-запад', () => {
    expect(client.getCoordinates(350)).toBe('Северо-Запад');
  });

  it('75deg это Восток', () => {
    expect(client.getCoordinates(75)).toBe('Восток');
  });

  it('10deg это Север', () => {
    expect(client.getCoordinates(10)).toBe('Север');
  });
});

describe("param()", () => {
  it("Возвращаемое значение должно быть объектом", () => {
    const paramObject = client.param("title", "value")
    expect(paramObject).toBeInstanceOf(Object)
  })
  it("Возвращаемый объект должен соответствовать заданным значениям и полям", () => {
    const paramObject = client.param("HELLO", "WORLD")
    expect(paramObject).toHaveProperty("title", "HELLO")
    expect(paramObject).toHaveProperty("value", "WORLD")
  })
})

describe('getCurrentPositionAsync()', () => {
  it('Возвращается объект с нужными полями', async () => {
    const pos = await client.getCurrentPositionAsync()
    expect(pos.coords).toHaveProperty('latitude', '50');
    expect(pos.coords).toHaveProperty('longitude', '45');
  });
});

describe("addListener()", () => {

  it("addListener для current должен срабатывать, как только меняется current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("current", handler)
    state.current = "testvalue"
    expect(handler).toBeCalled()
  })

  it("addListener для starred должен срабатывать, как только меняется current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("starred", handler)
    state.starred = "testvalue2"
    expect(handler).toBeCalled()
  })

  it("addListener для starred не должен срабатывать при изменении current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("starred", handler)
    state.current = "testvalue2"
    expect(handler).not.toBeCalled()
  })
})

describe("Button Clicks", () => {
  describe("onBtnAddClick()", () => {
    it("Должен делать preventDefault()", () => {
      const prevent = jest.fn()
      client.onBtnAddClick({preventDefault: prevent})
      expect(prevent).toBeCalledTimes(1)
    })
    it("Не должен менять state, если в ответ пришло 404", () => {
      global.fetch = fetchWithResponse({cod: "404"})
      const stateBeforeClick = client.getState()
      client.onBtnAddClick({preventDefault: jest.fn()})
      expect(stateBeforeClick).toBe(client.getState())
    })
  })
  describe("onRemoveClick()", () => {
    it("Должен удалять элемент из starred", () => {
      client.setState({...generateState(), starred: [{id: 1}]})
      expect(client.getState().starred).toHaveLength(1)
      global.fetch = fetchWithResponse({})
      client.onRemoveClick(1)
      expect(client.getState().starred).toHaveLength(0)
    })
  })
})

describe("weatherMapper()", () => {
  it("Должен возвращать объект", () => {
    const weatherObject = client.weatherMapper(generateWeather())
    expect(weatherObject).toBeInstanceOf(Object)
  })
  it("Должен возвращать объект с валидными ключами", () => {
    const weatherObject = client.weatherMapper(generateWeather())
    expect(weatherObject).toHaveProperty("id")
    expect(weatherObject).toHaveProperty("title")
    expect(weatherObject).toHaveProperty("temp")
    expect(weatherObject).toHaveProperty("params")
  })
})

describe("loadFavorites()", () => {
  beforeEach(() => {
    client.setState(generateState())
  })
  it("Должен возвращать state с пустым starred", async () => {
    global.fetch = fetchWithResponse({"cnt": 0, "list": []})
    await client.loadFavorites()
    const state = client.getState()
    expect(state.starred).toHaveLength(0)
  })
  it("Должен возвращать state с 1 элементом в starred", async () => {
    global.fetch = fetchWithResponse({
      "cnt": 1,
      "list": [{
        "coord": {"lon": 37.62, "lat": 55.75},
        "weather": [{"id": 601, "main": "Snow", "description": "snow", "icon": "13n"}],
        "base": "stations",
        "main": {"temp": 1.38, "feels_like": -3.35, "temp_min": 1.11, "temp_max": 2, "pressure": 1019, "humidity": 93},
        "visibility": 10000,
        "wind": {"speed": 4, "deg": 260},
        "snow": {"1h": 0.75},
        "clouds": {"all": 90},
        "dt": 1608222278,
        "sys": {"type": 1, "id": 9029, "country": "RU", "sunrise": 1608184508, "sunset": 1608209786},
        "timezone": 10800,
        "id": 524901,
        "name": "Moscow",
        "cod": 200
      }]
    })
    await client.loadFavorites()
    const state = client.getState()
    expect(state.starred).toHaveLength(1)
  })
})

describe("initCurrentPosition()", () => {
  beforeEach(() => {
    client.setState(generateState())
  })
  it("Должен возвращать правильный state, если передана позиция", async () => {
    global.fetch = fetchWithResponse({
      "coord":{
        "lon":30.25,
        "lat":60
      },
      "weather":[
        {
          "id":600,
          "main":"Snow",
          "description":"light snow",
          "icon":"13n"
        }
      ],
      "base":"stations",
      "main":{
        "temp":-1.28,
        "feels_like":-4.21,
        "temp_min":-1.67,
        "temp_max":-1.11,
        "pressure":1019,
        "humidity":92
      },
      "visibility":144,
      "wind":{
        "speed":0.89,
        "deg":187,
        "gust":5.36
      },
      "snow":{
        "1h":0.28
      },
      "clouds":{
        "all":100
      },
      "dt":1608271078,
      "sys":{
        "type":3,
        "id":197864,
        "country":"RU",
        "sunrise":1608274756,
        "sunset":1608295934
      },
      "timezone":10800,
      "id":535729,
      "name":"Komendantsky aerodrom",
      "cod":200
    })
    await client.initCurrentPosition()
    const currentState = client.getState()
    expect(currentState.current).toHaveProperty("title", "Komendantsky aerodrom")
    expect(currentState.current).toHaveProperty("id", 535729)
  })
  it("Должен возвращать корректный state, если позиция не передана", async () => {
    global.fetch = fetchWithResponse({
      "coord": {"lon": 37.62, "lat": 55.75},
      "weather": [{"id": 601, "main": "Snow", "description": "snow", "icon": "13n"}],
      "base": "stations",
      "main": {"temp": 1.38, "feels_like": -3.35, "temp_min": 1.11, "temp_max": 2, "pressure": 1019, "humidity": 93},
      "visibility": 10000,
      "wind": {"speed": 4, "deg": 260},
      "snow": {"1h": 0.75},
      "clouds": {"all": 90},
      "dt": 1608222278,
      "sys": {"type": 1, "id": 9029, "country": "RU", "sunrise": 1608184508, "sunset": 1608209786},
      "timezone": 10800,
      "id": 524901,
      "name": "Moscow",
      "cod": 200
    })
    global["navigator"] = {
      geolocation: {
        getCurrentPosition: (res, rej, opts) => rej(),
      }
    }
    await client.initCurrentPosition()
    const currentState = client.getState()
    expect(currentState.current).toHaveProperty("title", "Moscow")
    expect(currentState.current).toHaveProperty("id", 524901)
  })
})


