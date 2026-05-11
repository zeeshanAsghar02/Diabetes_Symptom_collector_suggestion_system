import encryptionService from '../../services/encryptionService.js';

/**
 * UserMedicalInfo Model Encryption Middleware
 * Handles encryption/decryption of sensitive medical data
 */

/**
 * Pre-save hook for UserMedicalInfo model
 */
export function encryptMedicalData(next) {
  try {
    // Encrypt diabetes type
    if (this.diabetes_type && !encryptionService.isEncrypted(this.diabetes_type)) {
      this.diabetes_type = encryptionService.encrypt(this.diabetes_type);
    }

    // Encrypt diagnosis date
    if (this.diagnosis_date && !encryptionService.isEncrypted(this.diagnosis_date)) {
      const dateStr = this.diagnosis_date instanceof Date
        ? this.diagnosis_date.toISOString()
        : this.diagnosis_date;
      this.diagnosis_date = encryptionService.encrypt(dateStr);
    }

    // Encrypt medications
    if (this.current_medications && Array.isArray(this.current_medications)) {
      this.current_medications = this.current_medications.map((med) => {
        const medObj = med.toObject ? med.toObject() : med;
        return {
          ...medObj,
          medication_name: medObj.medication_name && !encryptionService.isEncrypted(medObj.medication_name)
            ? encryptionService.encrypt(medObj.medication_name)
            : medObj.medication_name,
          dosage: medObj.dosage && !encryptionService.isEncrypted(medObj.dosage)
            ? encryptionService.encrypt(medObj.dosage)
            : medObj.dosage,
          frequency: medObj.frequency && !encryptionService.isEncrypted(medObj.frequency)
            ? encryptionService.encrypt(medObj.frequency)
            : medObj.frequency,
        };
      });
    }

    // Encrypt allergies
    if (this.allergies && Array.isArray(this.allergies)) {
      this.allergies = this.allergies.map((allergy) => {
        const allergyObj = allergy.toObject ? allergy.toObject() : allergy;
        return {
          ...allergyObj,
          allergen: allergyObj.allergen && !encryptionService.isEncrypted(allergyObj.allergen)
            ? encryptionService.encrypt(allergyObj.allergen)
            : allergyObj.allergen,
          reaction: allergyObj.reaction && !encryptionService.isEncrypted(allergyObj.reaction)
            ? encryptionService.encrypt(allergyObj.reaction)
            : allergyObj.reaction,
        };
      });
    }

    // Encrypt chronic conditions
    if (this.chronic_conditions && Array.isArray(this.chronic_conditions)) {
      this.chronic_conditions = this.chronic_conditions.map((condition) => {
        const condObj = condition.toObject ? condition.toObject() : condition;
        const diagnosedDate = condObj.diagnosed_date instanceof Date
          ? condObj.diagnosed_date.toISOString()
          : condObj.diagnosed_date;
        return {
          ...condObj,
          condition_name: condObj.condition_name && !encryptionService.isEncrypted(condObj.condition_name)
            ? encryptionService.encrypt(condObj.condition_name)
            : condObj.condition_name,
          diagnosed_date: condObj.diagnosed_date && !encryptionService.isEncrypted(diagnosedDate)
            ? encryptionService.encrypt(diagnosedDate)
            : condObj.diagnosed_date,
        };
      });
    }

    // Encrypt family history
    if (this.family_history && Array.isArray(this.family_history)) {
      this.family_history = this.family_history.map((history) => {
        const histObj = history.toObject ? history.toObject() : history;
        return {
          ...histObj,
          relation: histObj.relation && !encryptionService.isEncrypted(histObj.relation)
            ? encryptionService.encrypt(histObj.relation)
            : histObj.relation,
          condition: histObj.condition && !encryptionService.isEncrypted(histObj.condition)
            ? encryptionService.encrypt(histObj.condition)
            : histObj.condition,
        };
      });
    }

    // Encrypt lab results
    if (this.recent_lab_results) {
      if (this.recent_lab_results.hba1c) {
        const hba1c = this.recent_lab_results.hba1c;
        if (hba1c.value && !encryptionService.isEncrypted(String(hba1c.value))) {
          hba1c.value = encryptionService.encrypt(String(hba1c.value));
        }
        if (hba1c.date) {
          const dateStr = hba1c.date instanceof Date ? hba1c.date.toISOString() : hba1c.date;
          if (!encryptionService.isEncrypted(dateStr)) {
            hba1c.date = encryptionService.encrypt(dateStr);
          }
        }
        if (hba1c.unit && !encryptionService.isEncrypted(hba1c.unit)) {
          hba1c.unit = encryptionService.encrypt(hba1c.unit);
        }
      }

      if (this.recent_lab_results.fasting_glucose) {
        const fg = this.recent_lab_results.fasting_glucose;
        if (fg.value && !encryptionService.isEncrypted(String(fg.value))) {
          fg.value = encryptionService.encrypt(String(fg.value));
        }
        if (fg.date) {
          const dateStr = fg.date instanceof Date ? fg.date.toISOString() : fg.date;
          if (!encryptionService.isEncrypted(dateStr)) {
            fg.date = encryptionService.encrypt(dateStr);
          }
        }
        if (fg.unit && !encryptionService.isEncrypted(fg.unit)) {
          fg.unit = encryptionService.encrypt(fg.unit);
        }
      }

      if (this.recent_lab_results.cholesterol) {
        const chol = this.recent_lab_results.cholesterol;
        if (chol.total && !encryptionService.isEncrypted(String(chol.total))) {
          chol.total = encryptionService.encrypt(String(chol.total));
        }
        if (chol.ldl && !encryptionService.isEncrypted(String(chol.ldl))) {
          chol.ldl = encryptionService.encrypt(String(chol.ldl));
        }
        if (chol.hdl && !encryptionService.isEncrypted(String(chol.hdl))) {
          chol.hdl = encryptionService.encrypt(String(chol.hdl));
        }
        if (chol.date) {
          const dateStr = chol.date instanceof Date ? chol.date.toISOString() : chol.date;
          if (!encryptionService.isEncrypted(dateStr)) {
            chol.date = encryptionService.encrypt(dateStr);
          }
        }
        if (chol.unit && !encryptionService.isEncrypted(chol.unit)) {
          chol.unit = encryptionService.encrypt(chol.unit);
        }
      }
    }

    // Encrypt blood pressure
    if (this.blood_pressure) {
      if (this.blood_pressure.systolic && !encryptionService.isEncrypted(String(this.blood_pressure.systolic))) {
        this.blood_pressure.systolic = encryptionService.encrypt(String(this.blood_pressure.systolic));
      }
      if (this.blood_pressure.diastolic && !encryptionService.isEncrypted(String(this.blood_pressure.diastolic))) {
        this.blood_pressure.diastolic = encryptionService.encrypt(String(this.blood_pressure.diastolic));
      }
      if (this.blood_pressure.last_recorded) {
        const dateStr = this.blood_pressure.last_recorded instanceof Date
          ? this.blood_pressure.last_recorded.toISOString()
          : this.blood_pressure.last_recorded;
        if (!encryptionService.isEncrypted(dateStr)) {
          this.blood_pressure.last_recorded = encryptionService.encrypt(dateStr);
        }
      }
    }

    // Encrypt last medical checkup
    if (this.last_medical_checkup) {
      const dateStr = this.last_medical_checkup instanceof Date
        ? this.last_medical_checkup.toISOString()
        : this.last_medical_checkup;
      if (!encryptionService.isEncrypted(dateStr)) {
        this.last_medical_checkup = encryptionService.encrypt(dateStr);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Decryption function for UserMedicalInfo model
 */
export function decryptMedicalData(doc) {
  if (!doc) return;

  try {
    // Decrypt diabetes type
    if (doc.diabetes_type && encryptionService.isEncrypted(doc.diabetes_type)) {
      doc.diabetes_type = encryptionService.decrypt(doc.diabetes_type);
    }

    // Decrypt diagnosis date
    if (doc.diagnosis_date && encryptionService.isEncrypted(doc.diagnosis_date)) {
      doc.diagnosis_date = new Date(encryptionService.decrypt(doc.diagnosis_date));
    }

    // Decrypt medications
    if (doc.current_medications && Array.isArray(doc.current_medications)) {
      doc.current_medications = doc.current_medications.map((med) => ({
        ...med,
        medication_name: med.medication_name && encryptionService.isEncrypted(med.medication_name)
          ? encryptionService.decrypt(med.medication_name)
          : med.medication_name,
        dosage: med.dosage && encryptionService.isEncrypted(med.dosage)
          ? encryptionService.decrypt(med.dosage)
          : med.dosage,
        frequency: med.frequency && encryptionService.isEncrypted(med.frequency)
          ? encryptionService.decrypt(med.frequency)
          : med.frequency,
      }));
    }

    // Decrypt allergies
    if (doc.allergies && Array.isArray(doc.allergies)) {
      doc.allergies = doc.allergies.map((allergy) => ({
        ...allergy,
        allergen: allergy.allergen && encryptionService.isEncrypted(allergy.allergen)
          ? encryptionService.decrypt(allergy.allergen)
          : allergy.allergen,
        reaction: allergy.reaction && encryptionService.isEncrypted(allergy.reaction)
          ? encryptionService.decrypt(allergy.reaction)
          : allergy.reaction,
      }));
    }

    // Decrypt chronic conditions
    if (doc.chronic_conditions && Array.isArray(doc.chronic_conditions)) {
      doc.chronic_conditions = doc.chronic_conditions.map((condition) => ({
        ...condition,
        condition_name: condition.condition_name && encryptionService.isEncrypted(condition.condition_name)
          ? encryptionService.decrypt(condition.condition_name)
          : condition.condition_name,
        diagnosed_date: condition.diagnosed_date && encryptionService.isEncrypted(condition.diagnosed_date)
          ? new Date(encryptionService.decrypt(condition.diagnosed_date))
          : condition.diagnosed_date,
      }));
    }

    // Decrypt family history
    if (doc.family_history && Array.isArray(doc.family_history)) {
      doc.family_history = doc.family_history.map((history) => ({
        ...history,
        relation: history.relation && encryptionService.isEncrypted(history.relation)
          ? encryptionService.decrypt(history.relation)
          : history.relation,
        condition: history.condition && encryptionService.isEncrypted(history.condition)
          ? encryptionService.decrypt(history.condition)
          : history.condition,
      }));
    }

    // Decrypt lab results
    if (doc.recent_lab_results) {
      if (doc.recent_lab_results.hba1c) {
        const hba1c = doc.recent_lab_results.hba1c;
        if (hba1c.value && encryptionService.isEncrypted(String(hba1c.value))) {
          hba1c.value = parseFloat(encryptionService.decrypt(hba1c.value));
        }
        if (hba1c.date && encryptionService.isEncrypted(String(hba1c.date))) {
          hba1c.date = new Date(encryptionService.decrypt(hba1c.date));
        }
        if (hba1c.unit && encryptionService.isEncrypted(hba1c.unit)) {
          hba1c.unit = encryptionService.decrypt(hba1c.unit);
        }
      }

      if (doc.recent_lab_results.fasting_glucose) {
        const fg = doc.recent_lab_results.fasting_glucose;
        if (fg.value && encryptionService.isEncrypted(String(fg.value))) {
          fg.value = parseFloat(encryptionService.decrypt(fg.value));
        }
        if (fg.date && encryptionService.isEncrypted(String(fg.date))) {
          fg.date = new Date(encryptionService.decrypt(fg.date));
        }
        if (fg.unit && encryptionService.isEncrypted(fg.unit)) {
          fg.unit = encryptionService.decrypt(fg.unit);
        }
      }

      if (doc.recent_lab_results.cholesterol) {
        const chol = doc.recent_lab_results.cholesterol;
        if (chol.total && encryptionService.isEncrypted(String(chol.total))) {
          chol.total = parseFloat(encryptionService.decrypt(chol.total));
        }
        if (chol.ldl && encryptionService.isEncrypted(String(chol.ldl))) {
          chol.ldl = parseFloat(encryptionService.decrypt(chol.ldl));
        }
        if (chol.hdl && encryptionService.isEncrypted(String(chol.hdl))) {
          chol.hdl = parseFloat(encryptionService.decrypt(chol.hdl));
        }
        if (chol.date && encryptionService.isEncrypted(String(chol.date))) {
          chol.date = new Date(encryptionService.decrypt(chol.date));
        }
        if (chol.unit && encryptionService.isEncrypted(chol.unit)) {
          chol.unit = encryptionService.decrypt(chol.unit);
        }
      }
    }

    // Decrypt blood pressure
    if (doc.blood_pressure) {
      if (doc.blood_pressure.systolic && encryptionService.isEncrypted(String(doc.blood_pressure.systolic))) {
        doc.blood_pressure.systolic = parseFloat(encryptionService.decrypt(doc.blood_pressure.systolic));
      }
      if (doc.blood_pressure.diastolic && encryptionService.isEncrypted(String(doc.blood_pressure.diastolic))) {
        doc.blood_pressure.diastolic = parseFloat(encryptionService.decrypt(doc.blood_pressure.diastolic));
      }
      if (doc.blood_pressure.last_recorded && encryptionService.isEncrypted(String(doc.blood_pressure.last_recorded))) {
        doc.blood_pressure.last_recorded = new Date(encryptionService.decrypt(doc.blood_pressure.last_recorded));
      }
    }

    // Decrypt last medical checkup
    if (doc.last_medical_checkup && encryptionService.isEncrypted(doc.last_medical_checkup)) {
      doc.last_medical_checkup = new Date(encryptionService.decrypt(doc.last_medical_checkup));
    }
  } catch (error) {
    console.error('Medical info decryption error:', error.message);
  }
}

/**
 * Post-find hook for array decryption
 */
export function decryptMedicalArrayData(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptMedicalData);
  }
}
