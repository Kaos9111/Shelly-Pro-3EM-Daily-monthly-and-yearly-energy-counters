# Daily-, monthly-, and yearly energy counters for Homeassistant



The Script is made for the Shelly Pro 3 EM energy meter with Firmware 1.4.4.

It might also work on other Shelly devices, but I cannot confirm this as I do not own them.


The script continuously measures the energy consumption of a Shelly device and stores the values for daily, monthly, and yearly consumption. 
These consumption values are saved in virtual components that displayed as a sensor in Homeassistant. 

(I know that the functionality can also be implemented in Home Assistant using helpers and scripts, but I prefer to have it directly on the Shelly as it offers some advantages.)

<img width="255" alt="image" src="https://github.com/user-attachments/assets/74f0262f-93f3-4532-b1d8-7617a36c3410">  


# What the script does:

Energy Consumption Measurement:
- Monitors the current energy consumption (in watt-seconds) and converts it to kilowatt-hours (kWh).
- The measured data is divided into daily, monthly, and yearly values.

Saving Values:
- Consumption data is written to the respective virtual components every 10 seconds.
  <img width="1374" alt="image" src="https://github.com/user-attachments/assets/2326cdf4-b8bd-49a6-a248-0e39a6fd4b05">
- The daily, monthly, and yearly values are stored independently and can be accessed directly via the Shelly user interface and Homeassistant.
  

Automatic Resets:
- Daily Reset: The daily counter resets to 0 at midnight.
- Monthly Reset: The monthly counter resets on the 1st of each month.
- Yearly Reset: The yearly counter resets on January 1st.
- These resets are logged in a persistent key-value store (KVS) to prevent duplicate executions in case of a reboot.
  <img width="1401" alt="image" src="https://github.com/user-attachments/assets/58d08d7c-33fb-49ec-a71f-995387e07009">



# How to use it:

Simply copy the script code into the Shelly code editor, give the script a name of your choice, save it, and start it. 
<img width="1391" alt="image" src="https://github.com/user-attachments/assets/71ef8725-e463-44cc-ab15-64d784d55420">

Set it to start automatically on reboot.
<img width="250" alt="image" src="https://github.com/user-attachments/assets/1385ab48-0076-43d0-b457-963026b35612">


The required helpers will be created automatically.

You can easily make some adjustments by modifying the variables.


Important: 
If you have already created components, change the component ID (200) in the script to a different value. The script will create these starting from the first number +1 and +2.


>>>>>>>>>> The script is still in its early stages and currently offers only basic functions. An expansion is planned. <<<<<<<<<<
