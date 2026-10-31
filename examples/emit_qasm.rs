fn main() {
    // The same program `tests/qec_expansion_tests.rs::test_openqasm_bridge_compiler`
    // compiles, which asserts it yields exactly 7 T-ASM instructions.
    let src = concat!(
        "OPENQASM 3.0;\n",
        "include \"stdgates.inc\";\n",
        "qubit[5] q;\n",
        "bit[4] c;\n",
        "reset q[0];\n",
        "h q[0];\n",
        "cx q[0], q[1];\n",
        "s q[2];\n",
        "qec_5q 0, 0;\n",
        "measure q[0] -> c[0];\n",
    );
    let mut c = axon_quantum_tech::qasm_bridge::QasmToTasmCompiler::new();
    c.compile_str(src).unwrap();
    println!("{}", c.emit_assembly());
}
