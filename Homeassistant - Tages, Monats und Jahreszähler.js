//
// for shelly pro3em - FW: v1.4.4
//
// Kombizähler Script v0.1
//            _
//        V__(.)<
//         \_)_)
//
//
// Dieses Skript verwaltet virtuelle Shelly-Komponenten für den täglichen, monatlichen, jährlichen und Abrechnungszeitraum-Verbrauch.
// Es prüft beim Start, ob die Komponenten existieren und erstellt sie bei Bedarf. Der Verbrauch wird regelmäßig basierend auf der
// aktiven Leistung aktualisiert. Es werden auch tägliche, monatliche und jährliche Resets durchgeführt. Konsolenausgaben zeigen
// die aktuellen Verbrauchswerte an und können angepasst werden.
//
// This script manages virtual Shelly components for daily, monthly, yearly, and billing period consumption.
// Upon startup, it checks if the components exist and creates them if necessary. Consumption is updated regularly based on active power.
// Daily, monthly, and yearly resets are performed. Console outputs display current consumption values and can be customized.
//


ursprung:

//
//
// for shelly pro3em v1.4.4 - in progress version 0.1
//
//
//

let energyConsumedWs = 0.0;
let energyConsumedKWh = 0.0;
let energyConsumedMonthlyKWh = 0.0;
let energyConsumedYearlyKWh = 0.0;

let log = 1;  // Aktiviert/Deaktiviert Konsolenausgaben

// Variablen für statische Texte und IDs
let componentName = "Tagesverbrauch";  // Name der virtuellen Komponente
let componentId = 200;  // ID der virtuellen Komponente
let monthlyComponentName = "Monatsverbrauch";
let yearlyComponentName = "Jahresverbrauch";

let logInterval = 60;  // Intervall für Konsolenausgabe in Sekunden

// KVS-Schlüssel für Reset
let resetKVSKey = componentName + "_Reset";
let monthlyResetKVSKey = monthlyComponentName + "_Reset";
let yearlyResetKVSKey = yearlyComponentName + "_Reset";

// Statische Texte
let scriptStartedText = "Zähler Script gestartet";
let componentCreatedText = "Komponente erstellt, ID:";
let componentFoundText = "Komponente gefunden, ID:";
let componentNotFoundText = "Komponente nicht gefunden, ID:";
let loadedValueText = "Geladener wert";
let componentUpdatedText = "Komponente aktualisiert";
let resetText = componentName + " zurückgesetzt";
let monthlyResetText = monthlyComponentName + " zurückgesetzt";
let yearlyResetText = yearlyComponentName + " zurückgesetzt";

// Konsolenausgabe beim Start des Scripts
if (log > 0) print(scriptStartedText);
@@ -43,7 +64,7 @@ if (log > 0) print(scriptStartedText);
let lastLogTime = 0;

// Prüfen, ob die virtuelle Komponente bereits existiert
function checkAndCreateVirtualComponent(componentName, componentId, callback) {
    Shelly.call("Shelly.GetComponents", {
        "dynamic_only": true,
        "include": ["config"]
@@ -58,7 +79,7 @@ function checkAndCreateVirtualComponent(componentName, componentId, callback) {
        }

        if (!componentExists) {
            Shelly.call("Virtual.Add", {
                "type": "number",
                "config": {
                    "name": componentName,
@@ -67,12 +88,13 @@ function checkAndCreateVirtualComponent(componentName, componentId, callback) {
                    "persisted": true,
                    "meta": {
                        "ui": {
                            "view": "label",
                            "unit": "kWh"
                        }
                    }
                }
            }, function(result) {
                if (log > 0) print(componentName, componentCreatedText, componentId);
                callback();
            });
@@ -89,142 +111,95 @@ function SetVirtualComponentValue(componentId, value, callback) {
        "id": componentId,
        "value": value.toFixed(3)
    }, function(result) {
        callback();
    });
}

// Funktion zum Laden des Werts der virtuellen Komponente
function LoadVirtualComponentValue(componentId, callback) {
    Shelly.call("Number.GetStatus", {
        "id": componentId
    }, function(result) {
        if (result && result.value !== undefined) {
            callback(result.value);
        } else {
            if (log > 0) print(componentName, componentNotFoundText, componentId);
            callback(0);
        }
    });
}

// Funktion zum Zurücksetzen des Zählers
function resetCounterIfMidnight() {
    Shelly.call("Sys.GetStatus", {}, function(status) {
        let currentUnixTime = status.unixtime;
        let currentDate = new Date(currentUnixTime * 1000);
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth() + 1;  // Monate sind von 0 bis 11
        let currentDay = currentDate.getDate();
        // Prüfen, ob der Zähler heute schon zurückgesetzt wurde
        Shelly.call("KVS.Get", { key: resetKVSKey }, function(result, error_code) {
            let lastResetDate = (error_code === 0) ? result.value : null;
            if (lastResetDate !== currentDay) {
                // Zähler zurücksetzen
                energyConsumedKWh = 0.0;
                SetVirtualComponentValue(componentId, energyConsumedKWh, function() {
                    // Datum des Resets speichern (nur den aktuellen Tag)
                    Shelly.call("KVS.Set", { key: resetKVSKey, value: currentDay }, function(result) {
                        if (log > 0) print(componentName, resetText);
                    });
                });
            }
        });
        // Monatsreset
        Shelly.call("KVS.Get", { key: monthlyResetKVSKey }, function(result, error_code) {
            let lastResetMonth = (error_code === 0) ? result.value : null;
            if (lastResetMonth !== currentMonth) {
                // Monatsverbrauch zurücksetzen
                energyConsumedMonthlyKWh = 0.0;
                SetVirtualComponentValue(componentId + 1, energyConsumedMonthlyKWh, function() {
                    // Monat des Resets speichern
                    Shelly.call("KVS.Set", { key: monthlyResetKVSKey, value: currentMonth }, function(result) {
                        if (log > 0) print(monthlyComponentName, monthlyResetText);
                    });
                });
            }
        });
        // Jahresreset
        Shelly.call("KVS.Get", { key: yearlyResetKVSKey }, function(result, error_code) {
            let lastResetYear = (error_code === 0) ? result.value : null;
            if (lastResetYear !== currentYear) {
                // Jahresverbrauch zurücksetzen
                energyConsumedYearlyKWh = 0.0;
                SetVirtualComponentValue(componentId + 2, energyConsumedYearlyKWh, function() {
                    // Jahr des Resets speichern
                    Shelly.call("KVS.Set", { key: yearlyResetKVSKey, value: currentYear }, function(result) {
                        if (log > 0) print(yearlyComponentName, yearlyResetText);
                    });
                });
            }
        });
    });
}
// Funktion zur regelmäßigen Konsolenausgabe basierend auf der Uptime
function logBasedOnUptime() {
    Shelly.call("Sys.GetStatus", {}, function(status) {
        let currentUptime = status.uptime;

        if (currentUptime - lastLogTime >= logInterval) {
            lastLogTime = currentUptime;
            if (log > 0) print(componentName, componentUpdatedText, energyConsumedKWh.toFixed(3), " KWh");
            if (log > 0) print(monthlyComponentName, componentUpdatedText, energyConsumedMonthlyKWh.toFixed(3), " KWh");
            if (log > 0) print(yearlyComponentName, componentUpdatedText, energyConsumedYearlyKWh.toFixed(3), " KWh");
        }
    });
}

// Timer-Handler für Messung und Speichern
function timerHandler(user_data) {
    let em = Shelly.getComponentStatus("em", 0);
    if (typeof em.total_act_power !== 'undefined') {
        let power = em.total_act_power;

        if (power >= 0) {
            energyConsumedWs = energyConsumedWs + power * 0.5;
        }

        let fullWh = Math.floor((energyConsumedWs / 3600));
        if (fullWh > 0) {
            energyConsumedKWh += fullWh / 1000;
            energyConsumedMonthlyKWh += fullWh / 1000;
            energyConsumedYearlyKWh += fullWh / 1000;
            energyConsumedWs -= fullWh * 3600;
        }

        // Speichere den Wert alle 10 Sekunden
        if (user_data.counter10++ >= 20) {
            user_data.counter10 = 0;
            SetVirtualComponentValue(componentId, energyConsumedKWh, function() {});
            SetVirtualComponentValue(componentId + 1, energyConsumedMonthlyKWh, function() {});
            SetVirtualComponentValue(componentId + 2, energyConsumedYearlyKWh, function() {});
        }
    }
    // Konsolenausgabe und Zurücksetzen
    logBasedOnUptime();
    resetCounterIfMidnight();
}

// Lade den Wert und starte den Timer
checkAndCreateVirtualComponent(componentName, componentId, function() {
    checkAndCreateVirtualComponent(monthlyComponentName, componentId + 1, function() {
        checkAndCreateVirtualComponent(yearlyComponentName, componentId + 2, function() {
            LoadVirtualComponentValue(componentId, function(value) {
                energyConsumedKWh = value;
                LoadVirtualComponentValue(componentId + 1, function(value) {
                    energyConsumedMonthlyKWh = value;
                    LoadVirtualComponentValue(componentId + 2, function(value) {
                        energyConsumedYearlyKWh = value;
                        let user_data = { counter10: 0 };
                        Timer.set(1000, true, timerHandler, user_data);
                    });
                });
            });
