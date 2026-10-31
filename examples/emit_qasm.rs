fn main() {
    let src = "h q[0];\ncx q[0], q[1];\nqec_tile q[0..4];\nmeasure q[0] -> c[0];\n";
    let mut c = axon_quantum_tech::qasm_bridge::QasmToTasmCompiler::new();
    c.compile_str(src).unwrap();
    println!("{}", c.emit_assembly());
}
