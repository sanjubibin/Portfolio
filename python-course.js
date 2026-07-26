/* =========================================================================
   PYTHON COURSE CONTENT
   The 8-chapter "Python from Scratch" database for the in-page reader.
   Loaded ON DEMAND (see LazySurface in app.js) the first time the
   reader opens — visitors who never open the course never download it.
   ========================================================================= */
'use strict';

window.PYTHON_CHAPTERS = [
    {
      title: "1. Syntax & Indentation",
      subtitle: "Aligning the System",
      category: "Syntax & Indentation",
      content: `
        <p>In most programming languages, curly brackets <code>{}</code> are used to group blocks of code. Python does not use brackets; instead, it relies entirely on <strong>whitespace indentation</strong> (usually 4 spaces) to define execution hierarchy.</p>
        <h2>The Alignment Analogy</h2>
        <p>Think of indentation in Python like aligning keyways on a rotational shaft. If a keyway is misaligned by even half a millimeter, the assembly binds, and the machine crashes. Similarly, if your indentation is off in Python, the interpreter raises an <code>IndentationError</code> and halts execution.</p>
        <pre># CORRECT: The block sits inside the check
if pressure > 100:
    print("Release relief valve!") # Indented 4 spaces

# INCORRECT: This raises an IndentationError!
if pressure > 100:
print("Release relief valve!") # No indentation!</pre>
        <p>Indentations tell Python which lines belong to a specific conditional branch, loop cycle, or functional block. Maintain correct alignment to keep your software engine running smoothly!</p>
      `
    },
    {
      title: "2. Variables & Casting",
      subtitle: "Data Storage Tanks & Converters",
      category: "Variables & Casting",
      content: `
        <p>Variables in Python are created dynamically when you assign a value to them using the assignment operator <code>=</code>. Unlike statically typed languages, you do not need to pre-declare their data capacity.</p>
        <h2>The Storage Tank Analogy</h2>
        <p>Think of a variable as a <strong>storage tank</strong>. By typing <code>pressure = 120</code>, you create a tank named <code>pressure</code> and fill it with the value <code>120</code>. You can change this fluid at any point in the cycle: <code>pressure = "Decompressed"</code>.</p>
        <h2>Data Casting (Modifying Flow Types)</h2>
        <p>Sometimes you need to convert data from one state to another (casting). This is like running a fluid through a converter valve:
        <ul>
          <li><code>int(x)</code> - Converts a value to a solid whole number.</li>
          <li><code>float(x)</code> - Converts a value to a precise decimal measurement.</li>
          <li><code>str(x)</code> - Converts a value to text format.</li>
        </ul>
        </p>
        <pre>temp_sensor = "98.6" # Text string
numeric_temp = float(temp_sensor) # Casts to 98.6 (decimal float)</pre>
        <h2>Variable Scope (Local vs. Global)</h2>
        <p>Variables declared inside a function are <strong>local</strong> (only accessible within that local subsystem). Variables declared in the main script are <strong>global</strong> (accessible by any subsystem across the main application). Use the <code>global</code> keyword to modify a global variable from inside a local subsystem.</p>
      `
    },
    {
      title: "3. Data Types & Booleans",
      subtitle: "Materials & Binary Switches",
      category: "Data Types & Booleans",
      content: `
        <p>Every variable holds a specific data type. Understanding your data types is like selecting the correct engineering materials for a mechanical structure.</p>
        <h2>Core Python Materials</h2>
        <ul>
          <li><strong>Int / Float (Integers / Decimals):</strong> Used for dimensions, sensor readings, and math operations.</li>
          <li><strong>Str (Strings / Text):</strong> Text characters wrapped in quotes, used for log messages or serial commands.</li>
          <li><strong>Bool (Booleans / Binary Switches):</strong> Holds either <code>True</code> or <code>False</code>.</li>
        </ul>
        <h2>The Boolean Analogy</h2>
        <p>Booleans are simple binary toggles. Think of them like a limit switch on a linear actuator: either the actuator has hit the limit switch (<code>True</code>) or it hasn't (<code>False</code>). There is no middle ground.</p>
        <pre>actuator_active = True
safety_tripped = False</pre>
        <h2>String Slicing & Formatting</h2>
        <p>You can extract segments of a text string (slicing) using index ranges <code>[start:end]</code>, or format strings dynamically using f-strings (prefixed with <code>f</code>) to inject variables directly into messages:</p>
        <pre>serial_code = "ERR_OVERTEMP_95C"
err_type = serial_code[0:3] # Extracts "ERR"
curr_temp = 98.2
status_log = f"System Report: {curr_temp}°C" # Injects curr_temp</pre>
      `
    },
    {
      title: "4. Operators & Logical Gears",
      subtitle: "Mathematical & Relational Interactions",
      category: "Operators",
      content: `
        <p>Operators are the symbols used to perform calculations, comparison gates, and logical routing checks in your system.</p>
        <h2>Mathematical Operators (Gears & Accelerators)</h2>
        <p>Standard math operators perform calculations on variables:
        <ul>
          <li><code>+</code>, <code>-</code>, <code>*</code>, <code>/</code> - Addition, subtraction, multiplication, division.</li>
          <li><code>%</code> (Modulus) - Returns the remainder of division (useful for repeating cycles).</li>
          <li><code>**</code> (Exponentiation) - Raises a number to a power.</li>
        </ul>
        </p>
        <h2>Comparison Gates (Check Valves)</h2>
        <p>Comparison operators return a Boolean (<code>True</code> or <code>False</code>) by comparing values:
        <ul>
          <li><code>==</code> (Equal to), <code>!=</code> (Not equal to)</li>
          <li><code>></code> (Greater than), <code><</code> (Less than)</li>
          <li><code>>=</code>, <code><=</code> (Greater than or equal to, Less than or equal to)</li>
        </ul>
        </p>
        <h2>Logical Operators (Compound Valves)</h2>
        <p>Combine multiple checks to route logic flows:
        <ul>
          <li><code>and</code> - Returns <code>True</code> if both pathways are active.</li>
          <li><code>or</code> - Returns <code>True</code> if at least one pathway is active.</li>
          <li><code>not</code> - Reverses the input signal (inverts <code>True</code> to <code>False</code>).</li>
        </ul>
        <pre># True only if temperature is safe AND pressure is stable
system_safe = (temp < 100) and (pressure <= 120)</pre>
      `
    },
    {
      title: "5. Lists & Collections",
      subtitle: "Conveyor Belts & Catalog Indexes",
      category: "Collections",
      content: `
        <p>Python offers four built-in collection types to store lists of variables in a single database. Selecting the correct collection is like choosing the appropriate material handling system.</p>
        <h2>The Four Collection Mechanisms</h2>
        <ul>
          <li><strong>List (Conveyor Belt):</strong> Ordered, changeable, and indexable. It can hold duplicates. You can append, remove, or sort items on the fly.</li>
          <li><strong>Tuple (Fixed Bracket):</strong> Ordered but immutable (cannot be altered after creation). Useful for coordinate sets or fixed configuration constants.</li>
          <li><strong>Set (Sorting Bin):</strong> Unordered and unindexed. No duplicate entries allowed. Perfect for filtering out duplicate serial codes.</li>
          <li><strong>Dictionary (Part Catalog):</strong> Unordered, changeable, and indexed using key-value pairs. You look up a specific item using its unique label instead of an index number.</li>
        </ul>
        <h2>The Dictionary Analogy</h2>
        <p>Think of a Dictionary like a parts catalog drawer. Instead of searching by shelf number (index), you search by the part name (key) to get its specifications (value).</p>
        <pre># Creating a dictionary of parts
part_catalog = {
    "sku_120": "Rotary Gear 40mm",
    "sku_155": "Stainless Steel Bolt",
    "sku_210": "Hydraulic Seal"
}

# Accessing a value by its key
selected_part = part_catalog["sku_155"] # Returns "Stainless Steel Bolt"</pre>
      `
    },
    {
      title: "6. Conditionals (If...Else)",
      subtitle: "Directional Routing Valves",
      category: "Conditionals",
      content: `
        <p>Conditional statements allow your software system to make choices and branch its execution pathway based on logical gates.</p>
        <h2>The Fluid Gate Analogy</h2>
        <p>Think of conditional statements like a fluid distribution manifold with safety valves. If pressure exceeds the threshold, the manifold closes flow-gate A and routes the fluid down safety pathway B. If not, it executes path C.</p>
        <pre>pressure = 115

if pressure > 120:
    print("ALERT: Safety valve tripped!")
elif pressure > 100:
    print("WARNING: Pressure is rising, monitor closely.")
else:
    print("Report: System pressures stable.")</pre>
        <h2>Logical Shorthand</h2>
        <p>For simple routing decisions, you can use Python's ternary shorthand to keep code compact:
        <pre>status = "Alert" if pressure > 120 else "Normal"</pre>
        </p>
      `
    },
    {
      title: "7. Loops (While & For)",
      subtitle: "Rotational Cycles & RPMs",
      category: "Loops",
      content: `
        <p>Loops instruct the computer to execute a block of code repeatedly. Managing loops is like configuring the RPM cycle of an engine.</p>
        <h2>While Loops (Continuous Operation)</h2>
        <p>A <code>while</code> loop runs indefinitely as long as a conditional check remains <code>True</code>. If you forget to modify the checking condition, you trigger an infinite loop, causing your program engine to lock up!</p>
        <pre>rpm = 0
while rpm < 3000:
    rpm += 500 # Accelerates cycle
    print(f"RPM speed: {rpm}")</pre>
        <h2>For Loops (Iterating Conveyor Belts)</h2>
        <p>A <code>for</code> loop iterates over a collection (like a list, tuple, or dictionary) or a range of numbers. It is used to run a specific action on every item on a conveyor belt in sequence.</p>
        <pre>critical_valves = ["valve_A", "valve_B", "valve_C"]
for valve in critical_valves:
    print(f"Auditing actuator status for: {valve}")</pre>
        <h2>Interrupt Commands (Break & Continue)</h2>
        <ul>
          <li><code>break</code> - Instantly terminates the loop cycle and exits.</li>
          <li><code>continue</code> - Skips the current iteration and jumps directly to the start of the next cycle.</li>
        </ul>
      `
    },
    {
      title: "8. Functions & OOP Classes",
      subtitle: "Modular Assemblies & Blueprint Blueprints",
      category: "Functions & OOP",
      content: `
        <p>As applications scale, writing unstructured scripts becomes unmanageable. Functions and Object-Oriented Programming (OOP) allow you to modularize your code into reusable subsystems and structural blueprints.</p>
        <h2>Functions (Subsystems / Valves)</h2>
        <p>A function is a block of code which only runs when it is called. You can pass inputs (arguments <code>*args</code> or keyword arguments <code>**kwargs</code>) and return outputs.</p>
        <pre>def calculate_torque(force, radius=0.2):
    return force * radius # Torque = F * r</pre>
        <h2>Classes & OOP (Engine Blueprints)</h2>
        <p>A Class is an extensible program code template for creating objects, providing initial values for state (properties) and implementations of behavior (methods).</p>
        <h2>The Blueprint Analogy</h2>
        <p>Think of a **Class** like a mechanical blueprint of an engine. The blueprint itself is not a machine—it is just the documentation of dimensions and actions. 
        When you construct a physical engine from that blueprint, you are creating an **Object** (instantiation). You can build multiple independent engines (objects) from the same blueprint (class).</p>
        <pre># The Blueprint (Class)
class Engine:
    def __init__(self, cylinders, horse_power):
        self.cylinders = cylinders # Property
        self.horse_power = horse_power # Property
        self.active = False # Property

    def start_ignition(self): # Method (Action)
        self.active = True
        return "Vroom! System active."

# Creating objects (instantiation)
engine_A = Engine(4, 150)
engine_B = Engine(8, 450)

# Running methods on objects
print(engine_A.start_ignition()) # Returns "Vroom! System active."
print(engine_A.active) # Returns True
print(engine_B.active) # Returns False (independent instances!)</pre>
      `
    }
];
