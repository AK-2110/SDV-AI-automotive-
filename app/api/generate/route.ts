
import { NextResponse } from 'next/server';

// Helper to generate consistent responses
const MISRA_HEADER = `
/**
 * @file service.cpp
 * @brief Implementation of Service Oriented Architecture Application
 * @compliance MISRA C++:2008
 * @safety ASIL-B
 * @generated_by SDV_GenAI_Studio
 */
`;

function parsePrompt(prompt: string) {
    const p = prompt.toLowerCase();
    let serviceName = "GenericService";
    let dataPoints = ["Status"];
    let unit = "";

    if (p.includes("battery")) { serviceName = "BatteryHealthService"; dataPoints = ["SoC", "Range", "Temperature"]; unit = "%"; }
    else if (p.includes("tire")) { serviceName = "TirePressureService"; dataPoints = ["Pressure_FL", "Pressure_FR", "Pressure_RL", "Pressure_RR"]; unit = "PSI"; }
    else if (p.includes("engine") || p.includes("oil")) { serviceName = "EngineMonitorService"; dataPoints = ["OilPressure", "OilTemp", "RPM"]; unit = "Bar"; }
    else if (p.includes("door") || p.includes("lock")) { serviceName = "BodyControlService"; dataPoints = ["DoorStatus", "LockState"]; unit = "Bool"; }
    else if (p.includes("ac") || p.includes("climate")) { serviceName = "ClimateControlService"; dataPoints = ["CabinTemp", "FanSpeed", "CompressorState"]; unit = "C"; }
    else if (p.includes("speed")) { serviceName = "SpeedLimitService"; dataPoints = ["CurrentSpeed", "Limit", "Zone"]; unit = "km/h"; }

    // Extract generic nouns if still generic
    if (serviceName === "GenericService") {
        const words = prompt.split(" ");
        const nouns = words.filter(w => w.length > 4 && !w.includes("monitor"));
        if (nouns.length > 0) {
            serviceName = nouns[0].charAt(0).toUpperCase() + nouns[0].slice(1) + "Service";
            dataPoints = ["State", "Health", "Diagnostics"];
        }
    }

    return { serviceName, dataPoints, unit };
}

function generateDynamicResponse(prompt: string) {
    const { serviceName, dataPoints, unit } = parsePrompt(prompt);

    // Dynamic C++ Template
    const methods = dataPoints.map(dp => `    virtual float Get${dp}() = 0;`).join("\n");
    const implementation = dataPoints.map(dp => `
    float Get${dp}() override {
        // Read from HAL
        return HAL::ReadSensor("${dp}");
    }`).join("\n");

    const code = `${MISRA_HEADER}
#include <someip/service.h>
#include <vehicle/hal.h>

class I${serviceName} {
public:
${methods}
    virtual ~I${serviceName}() = default;
};

class ${serviceName} : public someip::Service, public I${serviceName} {
public:
    ${serviceName}() : someip::Service("${serviceName}", 0x1000) {}

    void Init() override {
        LOG_INFO("Initializing ${serviceName}");
    }

${implementation}

    void MonitorLoop() {
        while(true) {
            // Safety Critical Check
            ${dataPoints.map(dp => `
            float val_${dp} = this->Get${dp}();
            if (val_${dp} > HAL::GetLimits("${dp}").max) {
                 this->BroadcastEvent("Alert", { "${dp}", val_${dp} });
            }`).join("")}
            
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
};`;

    // Dynamic Test Template
    const testCases = `
/**
 * @file test_${serviceName.toLowerCase()}.cpp
 * @brief GoogleTest Suite for ${serviceName}
 */
#include <gtest/gtest.h>
#include "${serviceName}.h"

class ${serviceName}Test : public ::testing::Test {
protected:
    ${serviceName}* service;
    void SetUp() override { service = new ${serviceName}(); }
    void TearDown() override { delete service; }
};

${dataPoints.map(dp => `
TEST_F(${serviceName}Test, Test${dp}Range) {
    // Arrange
    HAL::MockSensor("${dp}", 100.0f); // Max Value
    
    // Act
    float val = service->Get${dp}();
    
    // Assert
    EXPECT_FLOAT_EQ(val, 100.0f);
}`).join("\n")}

TEST_F(${serviceName}Test, TestSafetyCompliance) {
    // Ensure ASIL-B timeout requirements
    EXPECT_TRUE(service->CheckTimingConstraints());
}
`;

    // Dynamic Requirements
    const requirements = [
        `REQ-SYS-001: The ${serviceName} shall monitor ${dataPoints.join(", ")}.`,
        `REQ-SYS-002: Data shall be reported in ${unit || "SI units"}.`,
        `REQ-SAF-001: Critical alerts must be broadcast within 20ms using SOME/IP.`,
        `REQ-CMP-001: Implementation must strictly adhere to MISRA C++:2008.`,
        `REQ-TST-001: 100% Code Coverage required for ASIL-B certification.`
    ];

    return {
        requirements,
        design: {
            service: serviceName,
            methods: dataPoints.map(dp => `Get${dp}()`),
            events: ["Alert", "Diagnostics"]
        },
        code,
        test_cases: testCases
    };
}

export async function POST(request: Request) {
    const { prompt } = await request.json();

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = generateDynamicResponse(prompt);
    return NextResponse.json(response);
}
