# 🚨 Clinix AI Triage System - WHO Compliant Parameters & Levels

## 📊 **WHO Standard Triage Levels (5-Point Scale)**

### **🔴 Level 1 - RESUSCITATION (WHO Code: RED)**

- **WHO Classification:** `IMMEDIATE`
- **Priority:** `immediate`
- **Wait Time:** `0 minutes`
- **WHO Criteria:** Life-threatening, requiring immediate resuscitation
- **Examples:** Cardiac arrest, severe shock, major trauma with hemodynamic instability

### **🟠 Level 2 - EMERGENCY (WHO Code: ORANGE)**

- **WHO Classification:** `URGENT`
- **Priority:** `urgent`
- **Wait Time:** `10 minutes maximum`
- **WHO Criteria:** Imminently life-threatening, rapid deterioration likely
- **Examples:** Chest pain, severe breathing difficulty, stroke symptoms

### **🟡 Level 3 - URGENT (WHO Code: YELLOW)**

- **WHO Classification:** `URGENT`
- **Priority:** `semi-urgent`
- **Wait Time:** `30 minutes maximum`
- **WHO Criteria:** Potentially serious, requires timely intervention
- **Examples:** Moderate trauma, severe pain, infectious disease with complications

### **🟢 Level 4 - SEMI-URGENT (WHO Code: GREEN)**

- **WHO Classification:** `SEMI-URGENT`
- **Priority:** `less-urgent`
- **Wait Time:** `60 minutes maximum`
- **WHO Criteria:** Less urgent, stable condition
- **Examples:** Minor injuries, stable chronic conditions, routine procedures

### **🔵 Level 5 - NON-URGENT (WHO Code: BLUE)**

- **WHO Classification:** `NON-URGENT`
- **Priority:** `non-urgent`
- **Wait Time:** `120 minutes or refer to primary care`
- **WHO Criteria:** Non-urgent, could be managed in primary care setting
- **Examples:** Minor ailments, administrative requests, prescription refills

---

## 🧠 **WHO-Compliant AI Triage Parameters**

### **1. WHO Primary Assessment Criteria**

#### **🚩 Airway & Breathing (Priority 1):**

- **Airway obstruction** → Level 1 (RED)
- **Severe respiratory distress** → Level 2 (ORANGE)
- **Moderate breathing difficulty** → Level 3 (YELLOW)
- **Respiratory rate:** <12 or >25/min → Level 2-3

#### **💓 Circulation (Priority 2):**

- **No pulse/cardiac arrest** → Level 1 (RED)
- **Severe shock (SBP <90)** → Level 1-2 (RED/ORANGE)
- **Moderate hypotension** → Level 3 (YELLOW)
- **Heart rate:** <50 or >120 bpm → Level 2-3

#### **🧠 Disability/Neurological (Priority 3):**

- **Unconscious (GCS <9)** → Level 1 (RED)
- **Altered consciousness** → Level 2 (ORANGE)
- **Neurological deficits** → Level 2-3 (ORANGE/YELLOW)
- **Glasgow Coma Scale assessment**

#### **🌡️ Exposure/Environment (Priority 4):**

- **Severe hypothermia/hyperthermia** → Level 2 (ORANGE)
- **Fever >39°C with complications** → Level 3 (YELLOW)
- **Environmental hazards**

### **2. WHO Vital Signs Thresholds**

#### **� Critical Vital Signs (Auto-escalation):**

- **Blood Pressure:**
  - SBP <90 or >180 mmHg → Level 2 (ORANGE)
  - SBP <70 mmHg → Level 1 (RED)
- **Heart Rate:**
  - <50 or >150 bpm → Level 2 (ORANGE)
  - <40 or >180 bpm → Level 1 (RED)
- **Temperature:**
  - <35°C or >40°C → Level 1 (RED)
  - <36°C or >39°C → Level 2-3 (ORANGE/YELLOW)
- **Respiratory Rate:**
  - <10 or >30/min → Level 2 (ORANGE)
  - <8 or >35/min → Level 1 (RED)
- **Oxygen Saturation:**
  - <90% → Level 2 (ORANGE)
  - <85% → Level 1 (RED)

### **3. WHO Pain Assessment Scale**

- **Pain 9-10/10 + vital sign changes** → Level 2 (ORANGE)
- **Pain 7-8/10** → Level 3 (YELLOW)
- **Pain 4-6/10** → Level 4 (GREEN)
- **Pain 1-3/10** → Level 5 (BLUE)

### **4. WHO Special Populations Criteria**

#### **👶 Pediatric Adjustments:**

- **Age-specific vital sign ranges**
- **Different pain assessment tools**
- **Lower threshold for escalation**

#### **👵 Geriatric Considerations:**

- **Atypical presentations**
- **Medication interactions**
- **Frailty assessment**

#### **🤰 Pregnancy Modifications:**

- **Gestational age considerations**
- **Fetal monitoring requirements**
- **Modified vital sign ranges**

---

## 🤖 **AI Decision-Making Process**

### **Step 1: Emergency Keyword Scan (0.1 seconds)**

```typescript
emergencyKeywords = ['chest pain', 'difficulty breathing', 'unconscious',
                    'severe bleeding', 'stroke', 'heart attack', 'suicide', 'overdose']

if (symptoms.includes(emergencyKeyword)) {
  return Level 1 - IMMEDIATE
}
```

### **Step 2: WHO-Compliant AI Analysis (2-5 seconds)**

**AI Prompt follows WHO Emergency Triage Assessment & Treatment (ETAT) Guidelines:**

```
WHO-Compliant Medical Triage Assessment:
- Applies ABCD approach (Airway, Breathing, Circulation, Disability)
- Uses WHO vital sign thresholds
- Considers age-specific criteria
- Applies WHO triage level classifications

Output Format:
WHO_LEVEL:[1-5]
WHO_CODE:[RED/ORANGE/YELLOW/GREEN/BLUE]
PRIORITY:[immediate/urgent/semi-urgent/less-urgent/non-urgent]
WAIT:[minutes]
FLAGS:[WHO clinical warnings]
```

### **Step 3: WHO Response Parsing & Validation**

**AI extracts WHO-compliant data:**

- **WHO Level:** 1-5 numeric score (WHO standard)
- **WHO Code:** Color-coded classification (RED/ORANGE/YELLOW/GREEN/BLUE)
- **Priority Category:** WHO priority classification
- **Wait Time:** WHO maximum wait time guidelines
- **Clinical Flags:** WHO-based warning indicators

### **Step 4: WHO Safety Fallbacks**

**If AI fails:**

- **Default:** WHO Level 3 (YELLOW - Urgent)
- **Wait Time:** 30 minutes (WHO guideline)
- **Flag:** "Manual WHO ETAT assessment required"

---

## 📋 **Clinical Scenarios Examples**

### **🔴 Level 1 Examples:**

- Chest pain with shortness of breath
- Unconscious patient
- Severe bleeding/trauma
- Signs of stroke (FAST protocol)
- Anaphylactic reaction

### **🟠 Level 2 Examples:**

- Moderate chest pain
- High fever with altered mental status
- Severe abdominal pain
- Difficulty breathing (mild-moderate)
- Severe headache with neurological signs

### **🟡 Level 3 Examples:**

- Moderate pain conditions
- Fever without complications
- Minor trauma requiring X-rays
- Medication side effects
- Stable chronic disease exacerbation

### **🟢 Level 4-5 Examples:**

- Minor cuts requiring sutures
- Mild infections
- Prescription refills
- Routine follow-ups
- Minor sprains/strains

---

## 🔧 **System Safety Features**

### **1. Dual Assessment:**

- **Keyword Detection** (instant emergency flagging)
- **AI Analysis** (comprehensive evaluation)

### **2. Fallback Mechanisms:**

- If AI unavailable → Default to Level 3
- If unclear symptoms → Flag for manual review
- If vital signs critical → Auto-escalate

### **3. Warning Flag System:**

- **Red Flags:** Immediate medical attention
- **Yellow Flags:** Additional monitoring needed
- **Blue Flags:** Special considerations (allergies, etc.)

### **4. Override Capability:**

- Medical staff can always override AI assessment
- AI provides recommendations, not final decisions
- Clear documentation of decision rationale

---

## 📊 **Performance Metrics**

### **Accuracy Targets:**

- **Emergency Detection:** 95%+ sensitivity
- **Overall Triage Accuracy:** 85%+ agreement with expert nurses
- **Processing Time:** <5 seconds per assessment

### **Safety Metrics:**

- **Zero missed emergencies** (Level 1 conditions)
- **<2% over-triage** rate (unnecessary Level 1/2)
- **System uptime:** 99.9%

---

**🎯 The system prioritizes patient safety over efficiency - when in doubt, it escalates to higher urgency levels rather than risk under-triaging serious conditions.**
