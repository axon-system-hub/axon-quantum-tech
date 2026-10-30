//! Multi-Qubit Cryogenic Scaling Simulator (100 to 1000 Qubits)
//! Compares Conventional (4K/15mK Dilution Refrigerator + Coaxial Cables + Conventional Multipliers)
//! vs AXON Quantum Tech (77K Liquid Nitrogen + WDM Optical Fiber + 0-MUL Cryo-CMOS Controller).
//!
//! Evidence status: 🟠 ESTIMATED (Physics & thermodynamics analytical model, not silicon receipt).

#[derive(Debug, Clone)]
pub struct SystemMetrics {
    pub qubits: usize,
    pub cable_count: usize,
    pub thermal_leak_watts: f64,
    pub active_chip_power_watts: f64,
    pub total_chamber_heat_watts: f64,
    pub chamber_heat_budget_watts: f64,
    pub thermal_feasible: bool,
    pub wall_clock_power_watts: f64,
    pub qec_feedback_latency_ns: f64,
    pub system_cost_usd: f64,
}

pub struct SimulationConfig {
    pub name: &'static str,
    pub chamber_temp_k: f64,
    pub cooling_efficiency_ratio: f64, // Real Carnot factor: Watts of wall power per Watt of chamber heat
    pub chamber_heat_budget_watts: f64,
    pub cables_per_qubit: usize,
    pub heat_leak_per_cable_mw: f64,
    pub active_power_per_qubit_mw: f64,
    pub propagation_distance_m: f64,
    pub digital_processing_latency_ns: f64,
    pub base_infrastructure_cost_usd: f64,
    pub cost_per_qubit_usd: f64,
}

impl SimulationConfig {
    pub fn conventional_4k() -> Self {
        Self {
            name: "Conventional (4K He / Coax / Multipliers)",
            chamber_temp_k: 4.0,
            cooling_efficiency_ratio: 800.0, // 4K refrigerator COP penalty (approx 800 W wall per 1 W chamber)
            chamber_heat_budget_watts: 1.5,  // Max cooling capacity of standard 4K pulse-tube / dilution 4K plate
            cables_per_qubit: 3,             // Drive, readout-in, readout-out (bias multiplexed)
            heat_leak_per_cable_mw: 0.8,     // Semi-rigid stainless/Nb coaxial cable 300K -> 4K heat leak
            active_power_per_qubit_mw: 18.0, // Conventional AWG/DSP DAC + multiplier logic per channel
            propagation_distance_m: 2.5,     // Cable length from room temperature rack to cold plate
            digital_processing_latency_ns: 120.0, // Room-temp FPGA/DSP decoding latency
            base_infrastructure_cost_usd: 1_800_000.0, // Dilution refrigerator + room-temp microwave rack base
            cost_per_qubit_usd: 6_000.0,
        }
    }

    pub fn axon_77k() -> Self {
        Self {
            name: "AXON Quantum Tech (77K LN2 / Optical / 0-MUL)",
            chamber_temp_k: 77.0,
            cooling_efficiency_ratio: 12.0,  // 77K LN2 COP penalty (approx 12 W wall per 1 W chamber)
            chamber_heat_budget_watts: 150.0, // 77K Dewar chamber allows huge thermal headroom
            cables_per_qubit: 1, // High-density WDM optical fiber (64-128 channels per fiber) -> 1 fiber per 64 qubits (rounded to ~0.02)
            heat_leak_per_cable_mw: 0.005,   // Glass optical fiber thermal conduction is ~1000x lower than copper
            active_power_per_qubit_mw: 0.45, // 0-MUL Sign-Select (no multipliers) + 77K low-Vdd (0.5V)
            propagation_distance_m: 0.05,    // On-chip in-situ controller directly wirebonded to qubits
            digital_processing_latency_ns: 3.5, // 5.8ps MZI + 1-cycle 0-MUL add/sub at 77K high-mobility clock
            base_infrastructure_cost_usd: 45_000.0, // Liquid nitrogen Dewar & vacuum chamber
            cost_per_qubit_usd: 250.0,
        }
    }

    pub fn evaluate(&self, qubits: usize) -> SystemMetrics {
        let (cable_count, heat_leak_watts) = if self.chamber_temp_k < 10.0 {
            let count = qubits * self.cables_per_qubit;
            let leak = (count as f64 * self.heat_leak_per_cable_mw) / 1000.0;
            (count, leak)
        } else {
            let fiber_count = ((qubits as f64) / 64.0).ceil() as usize;
            let leak = (fiber_count as f64 * self.heat_leak_per_cable_mw) / 1000.0;
            (fiber_count, leak)
        };

        let active_chip_heat_watts = (qubits as f64 * self.active_power_per_qubit_mw) / 1000.0;
        let total_chamber_heat = heat_leak_watts + active_chip_heat_watts;
        let feasible = total_chamber_heat <= self.chamber_heat_budget_watts;
        let wall_clock_power = total_chamber_heat * self.cooling_efficiency_ratio;

        let cable_tof_ns = (2.0 * self.propagation_distance_m) * 5.0;
        let qec_latency = cable_tof_ns + self.digital_processing_latency_ns;
        let cost = self.base_infrastructure_cost_usd + (qubits as f64 * self.cost_per_qubit_usd);

        SystemMetrics {
            qubits,
            cable_count,
            thermal_leak_watts: heat_leak_watts,
            active_chip_power_watts: active_chip_heat_watts,
            total_chamber_heat_watts: total_chamber_heat,
            chamber_heat_budget_watts: self.chamber_heat_budget_watts,
            thermal_feasible: feasible,
            wall_clock_power_watts: wall_clock_power,
            qec_feedback_latency_ns: qec_latency,
            system_cost_usd: cost,
        }
    }
}

fn main() {
    let qubit_steps = [100, 200, 300, 400, 500, 1000];
    let cfg_conv = SimulationConfig::conventional_4k();
    let cfg_axon = SimulationConfig::axon_77k();

    println!("==========================================================================================");
    println!("  AXON QUANTUM TECH: MULTI-QUBIT CRYOGENIC SCALING SIMULATION (100 to 1000 QUBITS)");
    println!("  Model: Conventional (4K/15mK, Coax, Multipliers) vs AXON (77K LN2, Optical, 0-MUL)");
    println!("  Evidence Tier: ESTIMATED (Thermodynamic & Transport Physics Simulation)");
    println!("==========================================================================================\n");

    println!("------------------------------------------------------------------------------------------");
    println!(" Qubits | Architecture    | Cables/Fibers | Chamber Heat | Budget (Margin) | Feasible? | Latency");
    println!("------------------------------------------------------------------------------------------");

    for &q in &qubit_steps {
        let m_conv = cfg_conv.evaluate(q);
        let m_axon = cfg_axon.evaluate(q);

        println!(
            "{:>7} | Conventional 4K | {:>13} | {:>10.2}W | {:>5.1}W ({:+6.2}W) | {:>9} | {:>5.1} ns",
            q,
            m_conv.cable_count,
            m_conv.total_chamber_heat_watts,
            m_conv.chamber_heat_budget_watts,
            m_conv.chamber_heat_budget_watts - m_conv.total_chamber_heat_watts,
            if m_conv.thermal_feasible { "PASS" } else { "FAIL (OOM)" },
            m_conv.qec_feedback_latency_ns
        );

        println!(
            "{:>7} | AXON 77K 0-MUL  | {:>13} | {:>10.3}W | {:>5.1}W ({:+6.2}W) | {:>9} | {:>5.1} ns",
            q,
            format!("{} fibers", m_axon.cable_count),
            m_axon.total_chamber_heat_watts,
            m_axon.chamber_heat_budget_watts,
            m_axon.chamber_heat_budget_watts - m_axon.total_chamber_heat_watts,
            if m_axon.thermal_feasible { "PASS" } else { "FAIL" },
            m_axon.qec_feedback_latency_ns
        );
        println!("------------------------------------------------------------------------------------------");
    }

    println!("\n==========================================================================================");
    println!("  SYSTEM-LEVEL COMPARISON SUMMARY AT 1,000 QUBITS");
    println!("==========================================================================================");
    let c1000 = cfg_conv.evaluate(1000);
    let a1000 = cfg_axon.evaluate(1000);

    println!("Metric                          | Conventional (4K/15mK)     | AXON 77K Quantum Tech      | Advantage");
    println!("--------------------------------|----------------------------|----------------------------|-------------------");
    println!("Chamber Interface               | {:>5} Semi-rigid Coax lines| {:>5} Silica Optical Fibers| 187x Fewer lines", c1000.cable_count, a1000.cable_count);
    println!("Total Heat Load in Chamber      | {:>10.2} W (FATAL OVERLOAD) | {:>10.2} W               | 45x Lower heat", c1000.total_chamber_heat_watts, a1000.total_chamber_heat_watts);
    println!("Chamber Cooling Budget          | {:>10.2} W                | {:>10.2} W                 | 100x Headroom", c1000.chamber_heat_budget_watts, a1000.chamber_heat_budget_watts);
    println!("Thermal Feasibility             | IMPOSSIBLE (Exceeds 13.6x) | FULLY VIABLE (0.3% Budget) | Bottleneck Broken");
    println!("Total Wall-Clock Power          | {:>10.2} kW               | {:>10.3} kW (5.4 Watts)    | ~3,000x Less power", c1000.wall_clock_power_watts / 1000.0, a1000.wall_clock_power_watts / 1000.0);
    println!("QEC Closed-Loop Latency         | {:>10.1} ns               | {:>10.1} ns                | 36x Faster QEC", c1000.qec_feedback_latency_ns, a1000.qec_feedback_latency_ns);
    println!("Estimated System Cost           | ${:>9.2}M USD             | ${:>9.2}M USD ($295K)      | ~26x Cost reduction", c1000.system_cost_usd / 1e6, a1000.system_cost_usd / 1e6);
    println!("==========================================================================================");
}
