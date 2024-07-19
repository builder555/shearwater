### This is very much a work in progress. Some of these notes may be completely wrong.

### Notes

The decoders work only with log version 14 for now.

### Findings so far:

* Shearwater uses [UDS protocol](https://en.wikipedia.org/wiki/Unified_Diagnostic_Services)
* A received message is always prepended with one of: 
    * 0x01 0x00 
    * 0x02 0x00
    * 0x02 0x01
* Sent data is encapsulated with 0xFF 0x01 XX 0x00 ZZ
    * XX is the message length + 1 
    * ZZ is the message
* Received data is encapsulated with 0x01 0xFF XX 0x00 ZZ
    * XX is the message length + 1
    * ZZ is the message
* stop bluetooth communication: 0x2E 0x90 0x20 0x00

Examples:

```shell
RDBI 8021: 
Request: 01 00 FF 01 04 00 22 80 21 C0
Response: 010001ff0d00628021018000000000020080c0
# 01 00 
# 01 ff 0d 00 <- response contains 13 byes (12 + 1 end of message)
# 62  <- indicates successful 8021 response
# 8021
# 01 80 00 00 00 <- format is "Petrel Native"
# 00 02 00 80
# c0
```

```shell
Get manifest:
Request:  01 00 ff 01 08 00 35 00 34 e0 00 00 00 c0
Response: 010001ff0400751082c0
Request:  01 00 ff 01 03 00 36 01 c0
Response: 020001ff83007601a5c4001a665314ce66531a470000057e0089001b0007a5000007bf4000020602a5c40019665314056653143b0000003b0024001a00079e200007a32000020602a5c4001865
Response: 020145033b6545104a00000d140084001900075020000788dbdc00020602a5c400176544f35c6544f8d700000580008700180007300000074a8000020602c0
# Keep sending 01 00 ff 01 03 00 36 XX c0 where XX is subsequent blocks (02, 03, etc.) until you reach block 12 (0x0C)
# at this point send 01 00 ff 01 02 00 37 c0 to complete the transfer
```

```shell
Get dive log:
Request:  01 00 ff 01 08 00 35 10 34 80 07 9e 20 c0
Response: 010001ff0400751092c0
Request:  01 00 ff 01 03 00 36 01 c0
Response: 030001ff93007601887fdbdc319945568ffd00c380566a9c520a01a360b272005c07fe018cca2ab47fe8061d1500daaa73ca840f3d2c9a6e770098d40c131500c300328aac0fa7aed2663558cd
Response: 03010ca3400281806791a80c320703f456803089a42269089a7ffffff00c2c030380c4b19a194680050300cf003078540e077ead62a1314854d211bfffddfe10e00c06040882dbdc4050189c12
Response: 03027196c0
# Keep sending  01 00 ff 01 03 00 36 XX c0 where XX is subsequent blocks (02, 03, etc.)
# until you get something like:
# Response: 0301dbdc0e79958143a178428800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
# Response: 03020000c0
```

### Basic UI

![ui](/assets/screenshot.png)

### TODO


- [x] remove dark square from background
- [x] add proper header:
    - When Connected:
        - [x] display device name
        - [x] number of available dives
    - When not connected:
        - [x] Button to connect
    - When BT not available:
        - [x] message to enable web bluetooth
- [x] activate the "connect" button
- [x] add downloader/reader log classes to JS
- [x] find a charting library

- [ ] display charts for a dive:
    - [x] depth
    - [ ] next_stop_depth
    - [ ] tts
    - [x] avg_ppo2
    - [ ] o2_percent
    - [ ] he_percent
    - [ ] next_stop_or_ndl_time
    - [ ] battery_percent_remaining
    - [ ] statuses
    - [ ] o2_sensor_1_mv
    - [x] water_temp
    - [ ] o2_sensor_2_mv
    - [ ] o2_sensor_3_mv
    - [ ] battery_voltage_x100
    - [ ] ppo2_setpoint
    - [x] ai_t2_data
    - [ ] gtr
    - [ ] cns
    - [ ] deco_ceiling
    - [ ] gf99
    - [ ] at_plus_5
    - [x] ai_t1_data
    - [x] sac

- [ ] display data for a dive:
    - [ ] opening record:
        - [ ] dive_number
        - [ ] gf_low
        - [ ] gf_high
        - [ ] tts
        - [ ] depth_units
        - [ ] battery_voltage_x10
        - [ ] cns
        - [ ] dive_start
        - [ ] o2_status
        - [ ] ppo2_low_x100
        - [ ] ppo2_high_x100
        - [ ] firmware_version
        - [ ] gas_0_oc_o2
        - [ ] gas_1_oc_o2
        - [ ] gas_2_oc_o2
        - [ ] gas_3_oc_o2
        - [ ] gas_4_oc_o2
        - [ ] gas_0_cc_o2
        - [ ] gas_1_cc_o2
        - [ ] gas_2_cc_o2
        - [ ] gas_3_cc_o2
        - [ ] gas_4_cc_o2
        - [ ] gas_0_oc_he
        - [ ] gas_1_oc_he
        - [ ] gas_2_oc_he
        - [ ] gas_3_oc_he
        - [ ] gas_4_oc_he
        - [ ] gas_0_cc_he
        - [ ] gas_1_cc_he
        - [ ] gas_2_cc_he
        - [ ] gas_3_cc_he
        - [ ] gas_4_cc_he
        - [ ] ccr_auto_sp_switch_up_lo_hi
        - [ ] ccr_auto_sp_switch_up_depth
        - [ ] ccr_auto_sp_switch_up_hi_lo
        - [ ] ccr_auto_sp_switch_down_depth
        - [ ] is_single_ppo2_sensor
        - [ ] gf_low
        - [ ] gf_high
        - [ ] surface_pressure_mbars
        - [ ] serial_number
        - [ ] error_flags_0
        - [ ] error_flags_1
        - [ ] error_acks_0
        - [ ] error_acks_1
        - [ ] deco_model
        - [ ] vpm_b_conservatism
        - [ ] solenoid_depth_compensation
        - [ ] oc_min_ppo2_x100
        - [ ] oc_max_ppo2_x100
        - [ ] oc_deco_ppo2_x100
        - [ ] cc_min_ppo2_x100
        - [ ] cc_max_ppo2_x100
        - [ ] sensor_display
        - [ ] last_stop_depth
        - [ ] end_dive_delay
        - [ ] clock_format
        - [ ] title_color
        - [ ] show_ppo2_in_oc_mode
        - [ ] salinity
        - [ ] gfs_value
        - [ ] calibration_status
        - [ ] sensor_1_calibration
        - [ ] sensor_2_calibration
        - [ ] sensor_3_calibration
        - [ ] sensor_1_adc_offset
        - [ ] sensor_2_adc_offset
        - [ ] sensor_3_adc_offset
        - [ ] rMS_temp_sticks_enabled
        - [ ] rMS
        - [ ] rMS_ready_flags
        - [ ] rMS_scrubber_rate
        - [ ] current_RCT
        - [ ] current_RST
        - [ ] computer_mode
        - [ ] revo2_co2_temp_gender
        - [ ] co2_temp_weight
        - [ ] battery_voltage_x100
        - [ ] battery_gauge_available
        - [ ] battery_percent_remain
        - [ ] battery_type
        - [ ] battery_setting
        - [ ] battery_warning_level_x100
        - [ ] battery_critical_level_x100
        - [ ] log_version
        - [ ] gas_states
        - [ ] temp_units
        - [ ] error_flags_2
        - [ ] error_acks_2
        - [ ] ai_mode
        - [ ] gtr_mode
        - [ ] ai_units
        - [ ] ai_t1_serial
        - [ ] ai_t1_max_psi
        - [ ] ai_t1_reserve_psi
        - [ ] ai_t2_serial
        - [ ] ai_t2_max_psi
        - [ ] ai_t2_reserve_psi
        - [ ] log_sample_rate_ms
        - [ ] expected_log_sample_format
        - [ ] timezone_offset
        - [ ] dst
        - [ ] language
        - [ ] total_stack_time
        - [ ] remaining_stack_time
        - [ ] sub_mode_oc_rec
        - [ ] total_on_time
        - [ ] depth_alert
        - [ ] time_alert
        - [ ] low_ndl_alert
        - [ ] ai_t1_on
        - [ ] ai_t1_name
        - [ ] ai_t2_on
        - [ ] ai_t2_name
        - [ ] ai_t3_serial
        - [ ] ai_t3_max_psi
        - [ ] ai_t3_reserve_psi
        - [ ] ai_t3_on
        - [ ] ai_t3_name
        - [ ] ai_t4_serial
        - [ ] ai_t4_max_psi
        - [ ] ai_t4_reserve_psi
        - [ ] ai_t4_on
        - [ ] ai_t4_name
        - [ ] ai_sidemount_switch_psi
        - [ ] error_flags_3
        - [ ] error_acks_3
        - [ ] extended_dive_samples_in_log
    - [ ] closing record:
        - [ ] dive_number
        - [ ] battery_voltage_x10
        - [ ] cns
        - [ ] o2_status
        - [ ] ppo2_low_x100
        - [ ] ppo2_high_x100
        - [ ] firmware_version
        - [ ] gas_0_oc_o2
        - [ ] gas_1_oc_o2
        - [ ] gas_2_oc_o2
        - [ ] gas_3_oc_o2
        - [ ] gas_4_oc_o2
        - [ ] gas_0_cc_o2
        - [ ] gas_1_cc_o2
        - [ ] gas_2_cc_o2
        - [ ] gas_3_cc_o2
        - [ ] gas_4_cc_o2
        - [ ] gas_0_oc_he
        - [ ] gas_1_oc_he
        - [ ] max_depth_x10
        - [ ] dive_length
        - [ ] dive_end
        - [ ] gas_2_oc_he
        - [ ] gas_3_oc_he
        - [ ] gas_4_oc_he
        - [ ] gas_0_cc_he
        - [ ] gas_1_cc_he
        - [ ] gas_2_cc_he
        - [ ] gas_3_cc_he
        - [ ] gas_4_cc_he
        - [ ] ccr_auto_sp_switch_up_lo_hi
        - [ ] ccr_auto_sp_switch_up_depth
        - [ ] ccr_auto_sp_switch_up_hi_lo
        - [ ] ccr_auto_sp_switch_down_depth
        - [ ] is_single_ppo2_sensor
        - [ ] gf_low
        - [ ] gf_high
        - [ ] surface_pressure_mbars
        - [ ] serial_number
        - [ ] max_descent_rate
        - [ ] avg_descent_rate
        - [ ] max_ascent_rate
        - [ ] avg_ascent_rate
        - [ ] error_flags_0
        - [ ] error_flags_1
        - [ ] error_acks_0
        - [ ] error_acks_1
        - [ ] deco_model
        - [ ] vpm_b_conservatism
        - [ ] solenoid_depth_compensation
        - [ ] oc_min_ppo2_x100
        - [ ] oc_max_ppo2_x100
        - [ ] oc_deco_ppo2_x100
        - [ ] cc_min_ppo2_x100
        - [ ] cc_max_ppo2_x100
        - [ ] sensor_display
        - [ ] last_stop_depth
        - [ ] end_dive_delay
        - [ ] clock_format
        - [ ] title_color
        - [ ] show_ppo2_in_oc_mode
        - [ ] salinity
        - [ ] gfs_value
        - [ ] calibration_status
        - [ ] sensor_1_calibration
        - [ ] sensor_2_calibration
        - [ ] sensor_3_calibration
        - [ ] sensor_1_adc_offset
        - [ ] sensor_2_adc_offset
        - [ ] sensor_3_adc_offset
        - [ ] rMS_temp_sticks_enabled
        - [ ] rMS
        - [ ] rMS_ready_flags
        - [ ] rMS_scrubber_rate
        - [ ] current_RCT
        - [ ] current_RST
        - [ ] min_rct
        - [ ] dive_time_with_min_rct
        - [ ] min_rst
        - [ ] dive_time_with_min_rst
        - [ ] computer_mode
        - [ ] revo2_co2_temp_gender
        - [ ] co2_temp_weight
        - [ ] battery_voltage_x100
        - [ ] battery_gauge_available
        - [ ] battery_percent_remain
        - [ ] battery_type
        - [ ] battery_setting
        - [ ] battery_warning_level_x100
        - [ ] battery_critical_level_x100
        - [ ] log_version
        - [ ] gas_states
        - [ ] temp_units
        - [ ] error_flags_2
        - [ ] error_acks_2
        - [ ] ai_mode
        - [ ] gtr_mode
        - [ ] ai_units
        - [ ] ai_t1_serial
        - [ ] ai_t1_max_psi
        - [ ] ai_t1_reserve_psi
        - [ ] ai_t2_serial
        - [ ] ai_t2_max_psi
        - [ ] ai_t2_reserve_psi
        - [ ] log_sample_rate_ms
        - [ ] expected_log_sample_format
        - [ ] timezone_offset
        - [ ] dst
        - [ ] language
        - [ ] last_avg_sac_x100
    - [ ] final record:
            - [ ] serial_number
            - [ ] checksum
            - [ ] firmware_version
            - [ ] log_version
            - [ ] product

- [x] add ability to download selected dives
- [ ] ensure proper UX:
    - [ ] display spinner when connecting to dive computer
    - [ ] display progress bar when downloading logs
    - [ ] display a message when no dives are stored
    - [ ] compact view for log manifest
    - [ ] use color to indicate computer connected or not
    - [ ] automatically show when computer is disconnected
- [ ] add hint how to enable web bluetooth
- [ ] store logs locally: store undownloaded manifest by computer ID
- [ ] able to manually add logs
- [ ] able to edit logs
- [ ] able to export dive logs to csv/json/DL7
- [ ] add settings:
    - [ ] select depth units (m/ft)
    - [ ] select temperature units (C/F)
    - [ ] select pressure units (psi/bar)