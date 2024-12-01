//
// for shelly pro3em - FW: v1.4.4
//
// Kombizähler Script v0.2    
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


// ////////////////// Customizable Variables //////////////////

// Component IDs
let dailyComponentId   = 200;  // ID for daily consumption
let monthlyComponentId = 201;  // ID for monthly consumption
let yearlyComponentId  = 202;  // ID for yearly consumption
let periodComponentId  = 203;  // ID for billing period

// Component update
let updateInterval      = 10;  // Interval for consumption update in seconds

// Log
let log                 = 1;  // Enables/disables console outputs
let logInterval         = 300;  // Interval for console output in seconds

// KVS Key Names for reset
let dailyResetKVSKey    = "Tagesverbrauch_Reset";  // Key for daily reset
let monthlyResetKVSKey  = "Monatsverbrauch_Reset"; // Key for monthly reset
let yearlyResetKVSKey   = "Jahresverbrauch_Reset"; // Key for yearly reset

// Static texts
let scriptStartedText     = "Zähler Script gestartet";  // Script started message
let componentCreatedText  = "Komponente erstellt, ID:"; // Component created message
let componentFoundText    = "Komponente gefunden, ID:"; // Component found message
let componentNotFoundText = "Komponente nicht gefunden, ID:"; // Component not found message
let loadedValueText       = "Geladener Wert";           // Loaded value message
let componentUpdatedText  = "Komponente aktualisiert";  // Component updated message
let dailyResetText        = "Tagesverbrauch zurückgesetzt"; // Daily reset message
let monthlyResetText      = "Monatsverbrauch zurückgesetzt"; // Monthly reset message
let yearlyResetText       = "Jahresverbrauch zurückgesetzt"; // Yearly reset message

//////////////////////////////////////////////////////////////////

let energyConsumedWs = 0.0;
let energyConsumedDailyKWh = 0.0;
let energyConsumedMonthlyKWh = 0.0;
let energyConsumedYearlyKWh = 0.0;
let energyConsumedPeriodKWh = 0.0;

// Konsolenausgabe beim Start des Scripts
if (log > 0) print(scriptStartedText);

// Letzter Zeitpunkt der Konsolenausgabe
let lastLogTime = 0;

// Prüfen, ob die virtuelle Komponente bereits existiert
function checkAndCreateVirtualComponent(componentName, componentId, isField, callback) {
    Shelly.call("Shelly.GetComponents", {
        "dynamic_only": true,
        "include": ["config"]
    }, function(components) {
        let componentExists = false;

        for (let component of components.components) {
            if (component.key === "number:" + componentId) {
                componentExists = true;
                break;
            }
        }

        if (!componentExists) {
            let componentConfig = {
                "type": "number",
                "config": {
                    "name": componentName,
                    "unit": "kWh",
                    "value": 0.0,
                    "persisted": true,
                    "meta": {
                        "ui": {
                            "view": isField ? "field" : "label",  // Wenn isField true, wird das Feld angezeigt
                            "unit": "kWh"
                        }
                    }
                }
            };
            Shelly.call("Virtual.Add", componentConfig, function(result) {
                if (log > 0) print(componentName, componentCreatedText, componentId);
                callback();
            });
        } else {
            if (log > 0) print(componentName, componentFoundText, componentId);
            callback();
        }
    });
}

// Funktion zum Setzen des Werts der virtuellen Komponente
function SetVirtualComponentValue(componentId, value, callback) {
    Shelly.call("Number.Set", {
        "id": componentId,
        "value": value.toFixed(3)
    }, function(result) {
        // Sicherstellen, dass result nicht null oder undefined ist
        if (result && result.error_code !== 0) {
            print("Fehler beim Setzen der virtuellen Komponente ID:", componentId);
        }
        callback();
    });
}

function LoadVirtualComponentValue(componentId, componentName, callback) {
    Shelly.call("Number.GetStatus", {
        "id": componentId
    }, function(result) {
        // Überprüfen, ob result nicht null oder undefined ist
        if (result && result.value !== undefined) {
            if (log > 0) print(loadedValueText, componentName, ":", result.value.toFixed(3), "kWh");
            callback(result.value);
        } else {
            if (log > 0) print(componentNotFoundText, componentId);
            callback(0);
        }
    });
}

// Funktion zur regelmäßigen Konsolenausgabe basierend auf der Uptime
function logBasedOnUptime() {
    Shelly.call("Sys.GetStatus", {}, function(status) {
        let currentUptime = status.uptime;

        // Überprüfen, ob die Differenz zur letzten Konsolenausgabe das Log-Intervall überschreitet
        if (currentUptime - lastLogTime >= logInterval) {
            lastLogTime = currentUptime;
            if (log > 0) {
                print("Tagesverbrauch", componentUpdatedText, energyConsumedDailyKWh.toFixed(3), "KWh");
                print("Monatsverbrauch", componentUpdatedText, energyConsumedMonthlyKWh.toFixed(3), "KWh");
                print("Jahresverbrauch", componentUpdatedText, energyConsumedYearlyKWh.toFixed(3), "KWh");
                print("Abrechnungszeitraum", componentUpdatedText, energyConsumedPeriodKWh.toFixed(3), "KWh");  // Neue Ausgabe
            }
        }
    });
}

// Funktion zum regelmäßigen Verbrauchsupdate basierend auf der Leistung
function updateConsumption() {
    let em = Shelly.getComponentStatus("em", 0);
    if (typeof em.total_act_power !== 'undefined') {
        let power = em.total_act_power;

        if (power >= 0) {
            energyConsumedWs = energyConsumedWs + power * (updateInterval / 2);  // Update alle 'updateInterval' Sekunden
        }

        let fullWh = Math.floor((energyConsumedWs / 3600));
        if (fullWh > 0) {
            energyConsumedDailyKWh += fullWh / 1000;
            energyConsumedMonthlyKWh += fullWh / 1000;
            energyConsumedYearlyKWh += fullWh / 1000;
            energyConsumedPeriodKWh += fullWh / 1000;  // In den Abrechnungszeitraum einfließen
            energyConsumedWs -= fullWh * 3600;
        }

        // Speichern der Werte
        SetVirtualComponentValue(dailyComponentId, energyConsumedDailyKWh, function() {});
        SetVirtualComponentValue(monthlyComponentId, energyConsumedMonthlyKWh, function() {});
        SetVirtualComponentValue(yearlyComponentId, energyConsumedYearlyKWh, function() {});
        SetVirtualComponentValue(periodComponentId, energyConsumedPeriodKWh, function() {});  // Abrechnungszeitraum speichern
    }
}

// Lade den Wert und starte die Timer
checkAndCreateVirtualComponent("Tagesverbrauch", dailyComponentId, false, function() {
    checkAndCreateVirtualComponent("Monatsverbrauch", monthlyComponentId, false, function() {
        checkAndCreateVirtualComponent("Jahresverbrauch", yearlyComponentId, false, function() {
            checkAndCreateVirtualComponent("Abrechnungszeitraum", periodComponentId, true, function() {  // Setze isField auf true
                LoadVirtualComponentValue(dailyComponentId, "Tagesverbrauch", function(value) {
                    energyConsumedDailyKWh = value;
                    LoadVirtualComponentValue(monthlyComponentId, "Monatsverbrauch", function(value) {
                        energyConsumedMonthlyKWh = value;
                        LoadVirtualComponentValue(yearlyComponentId, "Jahresverbrauch", function(value) {
                            energyConsumedYearlyKWh = value;
                            LoadVirtualComponentValue(periodComponentId, "Abrechnungszeitraum", function(value) {
                                energyConsumedPeriodKWh = value;

                                // Start Timer für Konsolenausgabe
                                Timer.set(logInterval * 1000, true, logBasedOnUptime);

                                // Start Timer für Verbrauchsaktualisierung
                                Timer.set(updateInterval * 1000, true, updateConsumption);
                            });
                        });
                    });
                });
            });
        });
    });
});
