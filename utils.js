const moment = require('moment');

function betweenRandom(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
  
}

function smartBulbValuesRelatedToStatus(status,brightLevelRange,startDateTime){
    let brightnessLevel,powerConsumption,current,voltage,energyUsage;
    switch(status){
        case 'off':
            brightnessLevel = 0
            powerConsumption = 0
            current = 0
            voltage = 0
            energyUsage = 0
            break;
        case 'on':
            brightnessLevel = brightLevelRange === "low" ? betweenRandom(0,30): (brightLevelRange==="mid"? betweenRandom(30,70):betweenRandom(70,100))
            powerConsumption = betweenRandom(4,14)
            current = betweenRandom(0.1,0.5)
            voltage = betweenRandom(12,240)
            const currentDateTime = moment()
            const duration = moment.duration(currentDateTime.diff(startDateTime));
            energyUsage = 10 + parseFloat(duration.asHours().toFixed(1));
            break;
        default:
            console.log('in default')
    }
    return {brightnessLevel,powerConsumption,current,voltage,energyUsage}

}
// temprature in kelvin
function colorTemprature(colorType){
    let colorTemperature;
    switch(colorType){
        case "warm_white":
            colorTemperature= betweenRandom(2700,3000)
            break;
        case "soft_white":
            colorTemperature = betweenRandom(3000,3500)
            break;
        case "neutral_white":
            colorTemperature = betweenRandom(3500,4000)
            break;
        case "day_light":
            colorTemperature = betweenRandom(5000,6500)
            break;
        case "cool_white":
            colorTemperature = betweenRandom(4000,5000)
            break;
        default:
            colorTemperature = betweenRandom(2700,3000)
    }
    return colorTemperature

}

module.exports = {colorTemprature,smartBulbValuesRelatedToStatus,betweenRandom}