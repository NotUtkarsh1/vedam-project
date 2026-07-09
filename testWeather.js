const key = 'AQ.Ab8RN6KRllEY8IihYgaFYQBFXwnUBGkaZ-OFpLHL9oEf5LQpkQ';

async function testAPIs() {
    try {
        let res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`);
        console.log('OpenWeatherMap:', res.status);
    } catch(e) {}
    try {
        let res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${key}&q=London`);
        console.log('WeatherAPI:', res.status);
    } catch(e) {}
    try {
        let res = await fetch(`https://wttr.in/London?format=3`);
        console.log('wttr.in:', await res.text());
    } catch(e) {}
}
testAPIs();
