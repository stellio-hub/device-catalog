function batteryScaleFromBatteryLevelPercent(batteryLevel){
    let batteryScale;
    if (batteryLevel >= 0 && batteryLevel < 20) batteryScale = 0;
    else if (batteryLevel >= 20 && batteryLevel < 40) batteryScale = 1;
    else if (batteryLevel >= 40 && batteryLevel < 60) batteryScale = 2;
    else if (batteryLevel >= 60 && batteryLevel < 80) batteryScale = 3;
    else if (batteryLevel >= 80 && batteryLevel <= 100) batteryScale = 4;
    return batteryScale;
};

module.exports = {
    batteryScaleFromBatteryLevelPercent: batteryScaleFromBatteryLevelPercent,
};
