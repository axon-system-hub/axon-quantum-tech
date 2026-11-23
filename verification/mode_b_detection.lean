import Std

/-!
AXON 5-qubit QEC and concatenated Mode B detection verification.

The stabilizers and hard-decision rules mirror src/qec.rs and the
table in rtl/qec_decoder_5qubit_0mul.v. The old and new Mode B rules
mirror src/tiler_100q.rs before and after this fix. This file checks
a mathematical model. It does not compile Rust or drive hardware.
Run from the repository root with Lean 4.19 or later:
    lean verification/mode_b_detection.lean
-/

namespace AxonQec

inductive Pauli where
  | i | x | y | z
  deriving DecidableEq, BEq, Repr

open Pauli

structure Word5 where
  a : Pauli
  b : Pauli
  c : Pauli
  d : Pauli
  e : Pauli
  deriving DecidableEq, BEq, Repr

def positions : List (Fin 5) := [0, 1, 2, 3, 4]

def Word5.ofFn (f : Fin 5 → Pauli) : Word5 :=
  ⟨f 0, f 1, f 2, f 3, f 4⟩

def Word5.get (word : Word5) (position : Fin 5) : Pauli :=
  match position.val with
  | 0 => word.a
  | 1 => word.b
  | 2 => word.c
  | 3 => word.d
  | _ => word.e

def identity : Word5 := ⟨i, i, i, i, i⟩

def generators : List Word5 :=
  [⟨x, z, z, x, i⟩, ⟨i, x, z, z, x⟩, ⟨x, i, x, z, z⟩, ⟨z, x, i, x, z⟩]

def logicalX : Word5 := ⟨x, x, x, x, x⟩
def logicalZ : Word5 := ⟨z, z, z, z, z⟩

def anticommutes (p q : Pauli) : Bool :=
  p != i && q != i && p != q

def wordAnticommutes (left right : Word5) : Bool :=
  positions.foldl (fun parity q => parity != anticommutes (left.get q) (right.get q)) false

def syndrome (word : Word5) : Nat :=
  generators.zipIdx.foldl
    (fun total (generator, k) => total + (if wordAnticommutes word generator then 2^k else 0))
    0

-- Pauli multiplication modulo global phase.
def Pauli.mul (p q : Pauli) : Pauli :=
  match p, q with
  | .i, q => q
  | p, .i => p
  | .x, .y | .y, .x => .z
  | .x, .z | .z, .x => .y
  | .y, .z | .z, .y => .x
  | _, _ => .i

def Word5.mul (left right : Word5) : Word5 :=
  Word5.ofFn (fun q => (left.get q).mul (right.get q))

def nonIdentity : List Pauli := [x, y, z]

def singleWords : List Word5 :=
  positions.flatMap (fun position => nonIdentity.map fun p =>
    Word5.ofFn (fun q => if q == position then p else i))

def twoErrorWords : List Word5 :=
  positions.flatMap fun first =>
    positions.filter (fun second => decide (first.val < second.val)) |>.flatMap fun second =>
      nonIdentity.flatMap fun p => nonIdentity.map fun q =>
        Word5.ofFn (fun position => if position == first then p else if position == second then q else i)

def decode (s : Nat) : Option Word5 :=
  if s == 0 then none else singleWords.find? (fun error => syndrome error == s)

/- Hard-decision case table from rtl/qec_decoder_5qubit_0mul.v. -/
def rtlTable : List (Option (Fin 5 × Pauli)) :=
  [none, some (1, x), some (4, z), some (2, x),
   some (2, z), some (0, z), some (3, x), some (2, y),
   some (0, x), some (3, z), some (1, z), some (1, y),
   some (4, x), some (0, y), some (4, y), some (3, y)]

def rtlDecode (s : Nat) : Option Word5 :=
  (rtlTable[s]?.getD none).map (fun (position, p) =>
    Word5.ofFn (fun q => if q == position then p else i))

def residual (error : Word5) : Word5 :=
  error.mul ((decode (syndrome error)).getD identity)

-- A zero-syndrome operator that anticommutes with either logical generator
-- acts nontrivially on the encoded qubit.
def logicalSignature (word : Word5) : Bool × Bool :=
  (wordAnticommutes word logicalX, wordAnticommutes word logicalZ)

def hasLogicalEffect (word : Word5) : Bool :=
  let signature := logicalSignature word
  syndrome word == 0 && (signature.1 || signature.2)

def innerUncorrectable (s : Nat) : Bool :=
  s != 0 && (decode s).isNone

def legacyModeBFlag (tiles : List Word5) : Bool :=
  decide ((tiles.filter (fun tile => innerUncorrectable (syndrome tile))).length >= 2)

def innerDoubleX : Word5 := ⟨x, x, i, i, i⟩
def collidingSingleZ : Word5 := ⟨i, i, i, z, i⟩
def logicalPauli (residualWord : Word5) : Pauli :=
  match logicalSignature residualWord with
  | (false, false) => i
  | (false, true) => x
  | (true, false) => z
  | (true, true) => y

def outerInducedError : Word5 :=
  let innerLogical := logicalPauli (residual innerDoubleX)
  ⟨innerLogical, innerLogical, i, i, i⟩

set_option maxRecDepth 10000
set_option maxHeartbeats 0

theorem logicalGeneratorsFormPair :
    syndrome logicalX = 0 ∧ syndrome logicalZ = 0 ∧
    wordAnticommutes logicalX logicalZ = true := by decide

theorem singleErrorSyndromesCoverAllNonzero :
    singleWords.length = 15 ∧
    (List.range 16).all (fun s => s == 0 || (decode s).isSome) = true := by decide

theorem rtlHardTableMatchesReference :
    (List.range 16).all (fun s => rtlDecode s == decode s) = true := by decide

theorem correctsIdentityAndEverySingleError :
    (identity :: singleWords).all (fun error => residual error == identity) = true := by decide

theorem noFourBitSyndromeRaisesUncorrectable :
    (List.range 16).all (fun s => !innerUncorrectable s) = true := by decide

theorem verifiesAllNinetyDoubleErrorPatterns :
    twoErrorWords.length = 90 ∧ twoErrorWords.all (fun error =>
      hasLogicalEffect (residual error) && !innerUncorrectable (syndrome error)) = true := by decide

theorem doubleXAndSingleZShareSyndrome :
    syndrome innerDoubleX = 9 ∧ syndrome collidingSingleZ = 9 ∧
    decode (syndrome innerDoubleX) = some collidingSingleZ := by decide

theorem innerCorrectionLeavesLogicalZ :
    residual innerDoubleX = ⟨x, x, i, z, i⟩ ∧
    syndrome (residual innerDoubleX) = 0 ∧
    logicalSignature (residual innerDoubleX) = (true, false) := by decide

theorem legacyModeBMissesFourPhysicalErrors :
    legacyModeBFlag [innerDoubleX, innerDoubleX, identity, identity, identity] = false ∧
    outerInducedError = ⟨z, z, i, i, i⟩ ∧
    syndrome outerInducedError = 15 ∧
    hasLogicalEffect (residual outerInducedError) = true := by decide

def modeBFlag (outerSyndrome : Nat) : Bool :=
  outerSyndrome != 0

def modeBDetects (outerError : Word5) : Bool :=
  modeBFlag (syndrome outerError)

theorem modeBFlagsMeasuredSyndromes :
    modeBFlag 0 = false ∧
    (List.range 15).all (fun s => modeBFlag (s + 1)) = true := by decide

theorem modeBDetectsOneAndTwoInnerLogicalErrors :
    (singleWords ++ twoErrorWords).all modeBDetects = true := by decide

theorem modeBDetectsFourPhysicalErrorCounterexample :
    outerInducedError = ⟨z, z, i, i, i⟩ ∧ syndrome outerInducedError = 15 ∧
    modeBDetects outerInducedError = true := by decide

theorem aZeroOuterSyndromeCanHideALogicalOperator :
    syndrome logicalX = 0 ∧ hasLogicalEffect logicalX = true ∧
    modeBDetects logicalX = false := by decide

#print axioms logicalGeneratorsFormPair
#print axioms singleErrorSyndromesCoverAllNonzero
#print axioms rtlHardTableMatchesReference
#print axioms correctsIdentityAndEverySingleError
#print axioms noFourBitSyndromeRaisesUncorrectable
#print axioms verifiesAllNinetyDoubleErrorPatterns
#print axioms doubleXAndSingleZShareSyndrome
#print axioms innerCorrectionLeavesLogicalZ
#print axioms legacyModeBMissesFourPhysicalErrors
#print axioms modeBFlagsMeasuredSyndromes
#print axioms modeBDetectsOneAndTwoInnerLogicalErrors
#print axioms modeBDetectsFourPhysicalErrorCounterexample
#print axioms aZeroOuterSyndromeCanHideALogicalOperator

end AxonQec
