
import { NextResponse } from 'next/server';

// Helper to generate consistent responses
const MISRA_HEADER = `
/**
 * @file service.cpp
 * @brief Implementation of Service Oriented Architecture Application
 * @compliance MISRA C++:2008
 * @safety ASIL-B
 */
`;

function getBatteryResponse() {
    return {
        requirements: [
            "REQ-BMS-001: The system shall monitor the State of Charge (SoC) at 100ms intervals.",
            "REQ-BMS-002: The system shall trigger a 'Critical Battery' alert if SoC < 10%.",
            "REQ-BMS-003: The system shall estimate remaining range based on current power consumption.",
            "REQ-BMS-004: Battery temperature monitoring shall be active during charging.",
            "REQ-CMP-001: Source code must adhere to MISRA C++:2008 guidelines.",
            "REQ-TST-001: All safety-critical paths must have 100% branch coverage."
        ],
        design: {
            service: "BatteryHealthService",
            methods: [
                { name: "GetSoC", returnType: "uint8", description: "Returns current battery percentage" },
                { name: "GetRange", returnType: "uint16", description: "Returns estimated range in km" },
                { name: "GetTemperature", returnType: "float", description: "Returns pack temperature in Celsius" }
            ],
            events: [
                { name: "LowBatteryWarning", payload: "{ level: uint8, remaining_km: uint16 }" }
            ]
        },
        code: `${MISRA_HEADER}
#include <someip/service.h>
#include <vehicle/bms_types.h>

// MISRA Rule 3-1-1: Class defined in data abstraction
class BatteryHealthService : public someip::Service {
private:
    const uint16_t BATTERY_CAPACITY_KWH = 75; // CONSTANT

public:
    BatteryHealthService() : someip::Service("BatteryHealthService", 0x1234) {}

    /**
     * @brief Retrieve State of Charge
     * @return uint8_t 0-100%
     */
    uint8_t GetSoC() const {
        // MISRA Rule: No side effects in getter
        return HAL::Battery::ReadSoC();
    }

    uint16_t GetRange() const {
        float consumption = this->GetAverageConsumption();
        uint8_t soc = this->GetSoC();
        if (consumption <= 0.0f) {
            return 0; // Prevent division by zero
        }
        return static_cast<uint16_t>((soc * BATTERY_CAPACITY_KWH) / consumption);
    }

    void MonitorLoop() {
        while(true) {
            if (this->GetSoC() < 10) {
                // Critical Section
                this->BroadcastEvent("LowBatteryWarning", { .level = this->GetSoC() });
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
};
`,
        test_cases: `
/**
 * @file test_battery_service.cpp
 * @brief GoogleTest Suite for Battery Service
 */
#include <gtest/gtest.h>
#include "BatteryHealthService.h"

class BatteryServiceTest : public ::testing::Test {
protected:
    BatteryHealthService* service;
    void SetUp() override { service = new BatteryHealthService(); }
    void TearDown() override { delete service; }
};

TEST_F(BatteryServiceTest, TestCriticalBelow10) {
    // Arrange
    HAL::MockBattery(9); // Set 9%
    
    // Act & Assert
    EXPECT_TRUE(service->IsCritical());
}

TEST_F(BatteryServiceTest, TestNoDivisionByZero) {
    // Arrange
    HAL::MockConsumption(0.0f);
    
    // Act
    uint16_t range = service->GetRange();
    
    // Assert
    EXPECT_EQ(range, 0); // Safety check
}
`
    };
}

function getTireResponse() {
    return {
        requirements: [
            "REQ-TPMS-001: Monitor pressure of all 4 tires independently.",
            "REQ-TPMS-002: Alert driver if pressure drops below 30 PSI.",
            "REQ-TPMS-003: Transmit pressure data to Telematics unit every 1 minute.",
            "REQ-CMP-001: Rust code must ensure memory safety without 'unsafe' blocks."
        ],
        design: {
            service: "TirePressureService",
            methods: [
                { name: "GetPressure", returnType: "float[]", description: "Returns array of 4 pressures" },
                { name: "SetThreshold", returnType: "void", args: ["min_psi: float"] }
            ],
            events: [
                { name: "PressureDropAlert", payload: "{ tire_index: uint8, pressure: float }" }
            ]
        },
        code: `
// Generated RUST Service Skeleton for TirePressureService
// Guidelines: Safe Rust Only
use someip::prelude::*;

struct TirePressureService {
    threshold: f32,
    sensors: [Sensor; 4],
}

impl Service for TirePressureService {
    fn new() -> Self {
        TirePressureService { 
            threshold: 30.0, 
            sensors: HAL::get_sensors() 
        }
    }

    fn check_pressure(&self) -> Vec<f32> {
        self.sensors.iter().map(|s| s.read()).collect()
    }

    fn monitor(&self) {
        loop {
            // Safety Check: Valid Sensor Range
            for (i, sensor) in self.sensors.iter().enumerate() {
                let reading = sensor.read();
                if reading < 0.0 || reading > 100.0 {
                    log::error("Sensor Failure on Tire {}", i);
                    continue; 
                }

                if reading < self.threshold {
                    Event::emit("PressureDropAlert", Alert { 
                        tire_index: i as u8, 
                        pressure: reading 
                    });
                }
            }
            thread::sleep(Duration::from_sec(60));
        }
    }
}
`,
        test_cases: `
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pressure_alert_threshold() {
        let mut service = TirePressureService::new();
        service.threshold = 32.0;
        
        // Mock sensor reading 30.0
        assert!(service.should_alert(30.0));
    }

    #[test]
    fn test_valid_sensor_range() {
        let service = TirePressureService::new();
        // Ensure outliers are filtered
        assert_eq!(service.validate_reading(150.0), false);
    }
}
`
    };
}

export async function POST(request: Request) {
    const { prompt } = await request.json();

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let response;

    if (prompt.toLowerCase().includes('battery')) {
        response = getBatteryResponse();
    } else if (prompt.toLowerCase().includes('tire')) {
        response = getTireResponse();
    } else {
        response = {
            requirements: [
                "REQ-GEN-001: The service shall provide health status heartbeat.",
                "REQ-GEN-002: Data throughput must be optimized for CAN bus limitations."
            ],
            design: {
                service: "GenericService",
                methods: ["Ping()"],
                events: ["Error"]
            },
            code: "// Generic Stub",
            test_cases: "// No test cases generated for generic prompt."
        };
    }

    return NextResponse.json(response);
}
