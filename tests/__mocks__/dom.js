const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = `
<div class="page-wrapper">
    <header  class="weather-block_container weather-block_container__header_current">
        <div class="weather-block_header--current">
            <h1 class="current-weather__header_label">
                Погода здесь
            </h1>
            <div type="button" class="current-weather__header_geo_container">
                <button type="button" class="current-weather__header_geo"  onclick="initCurrentPosition()">
                    Обновить геолокацию
                </button>
                <button type="button" class="current-weather__header_geo--mobile" />
            </div>
        </div>
    </header >
    <main>
        <section class="weather-block_container weather-block_container__current">

        </section>
        <div class="weather-block_container weather-block_container__header_favourite">
            <div class="weather-block_header--favourite">
                <h2 class="favourite-weather_label">
                    Избранное
                </h2>
                <form id="form" class="favourite-weather_container">
                    <input placeholder="Добавить новый город" class="favourite-weather_input"/>
                    <button type="submit" class="plus_button"/>
                </form>
            </div>
        </div>
        <section class="weather-block_container weather-block_container__favourite">

        </section>
    </main>
</div>

<template id="loader">
    <div class="loader-container">
        <img class="loader" src="./src/assets/images/loader.gif" alt="loading">
    </div>
</template>

<template id="weather-data-block">
    <li class="weather-data">
        <div class="weather-data_key">
            {title}
        </div>
        <div class="weather-data_value">
            {value}
        </div>
    </li>
</template>

<template id="main-city">
    {loading}
    <div class="weather-block">
        <div class="current-weather_location__city">
            {title}
        </div>
        <div class="current-weather_location__temperature_container">
            <!--заменить на img-->
            <div class="current-weather_location__temperature_icon"></div>
            <div class="current-weather_location__temperature_value">
                {temp}°C
            </div>
        </div>
    </div>
    <ul class="weather-block">
        {stats}
    </ul>
</template>

<template id="fav-city">
    <div class="weather-block">
        {loading}
        <div class="common-weather_container">
            <div class="common-weather_inner-container">
                <div class="common-weather_city">
                    {title}
                </div>
                <div class="common-weather_temperature">
                    {temp}°C
                </div>
                <!--заменить на img-->
                <div class="common-weather_icon"></div>
            </div>
            <button type="button" class="close_button"  data-id="{id}"/>
        </div>
        <ul class="common-weather_info-container">
            {stats}
        </ul>
    </div>
</template>
`
const dom = new JSDOM(html)
const { window } = dom
global["window"] = window
global["document"] = window.document
global["alert"] = (msg) => {
  console.log(`ALERT -> "${msg}"`)
}
global["navigator"] = {
  geolocation:{
    getCurrentPosition: (res, rej, opts) => res({
      coords: {
        latitude: '50',
        longitude: '45',
      }
    }),
  }
}
