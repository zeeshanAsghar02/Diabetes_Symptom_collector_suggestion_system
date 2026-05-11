/**
 * Personal & Medical Information Screen
 * Matches the web app PersonalInformationForm fields exactly.
 * Completion % mirrors the web app 12-field calculation.
 * After saving personal info with required fields, dispatches
 * onboardingCompleted:true to Redux so the layout gate opens.
 */
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity,
  TextInput as RNTextInput, Modal, FlatList,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import {
  useGetPersonalInfoQuery,
  useSavePersonalInfoMutation,
  useGetMedicalInfoQuery,
  useSaveMedicalInfoMutation,
} from '@features/personalized/personalizedApi';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUser, selectUser } from '@features/auth/authSlice';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

/* ── constants ──────────────────────────────────────────── */
const HERO_FROM = '#3B3F6B';
const HERO_TO   = '#2D3154';

const COUNTRIES = [
  'Pakistan','India','United States','United Kingdom',
  'UAE','Saudi Arabia','Bangladesh','Canada','Australia','Other',
];
const COUNTRY_CODES: Record<string,string> = {
  Pakistan:'+92', India:'+91', 'United States':'+1',
  'United Kingdom':'+44', UAE:'+971', 'Saudi Arabia':'+966',
  Bangladesh:'+880', Canada:'+1', Australia:'+61', Other:'',
};
const GENDER_OPTIONS   = ['Male','Female','Other'];
const ACTIVITY_OPTIONS = ['Sedentary','Lightly Active','Moderately Active','Very Active','Extremely Active'];
const DIET_OPTIONS     = ['Vegetarian','Non-Vegetarian','Vegan','Pescatarian','Other'];
const SMOKING_OPTIONS  = ['Never','Former','Current'];
const ALCOHOL_OPTIONS  = ['Never','Occasional','Regular'];
const DIABETES_TYPES   = ['Type 1','Type 2','Gestational','Prediabetes','LADA','MODY'];
const FEET_OPTIONS     = ['3','4','5','6','7','8'];
const INCHES_OPTIONS   = ['0','1','2','3','4','5','6','7','8','9','10','11'];

/* ── helpers ────────────────────────────────────────────── */
const cmToFtIn = (cm: number) => {
  const totalIn = cm / 2.54;
  return { ft: String(Math.floor(totalIn / 12)), inch: String(Math.round(totalIn % 12)) };
};
const ftInToCm = (ft: string, inch: string) =>
  Math.round((parseFloat(ft||'0') * 30.48) + (parseFloat(inch||'0') * 2.54));

/** 12-field completion — mirrors web app calculateCompletion() */
const calcCompletion = (p: PersonalForm) => {
  const fields = [
    p.date_of_birth, p.gender, p.height_ft, p.weight,
    p.activity_level, p.dietary_preference, p.smoking_status,
    p.alcohol_use, p.sleep_hours,
    p.ec_name, p.ec_phone, p.addr_city,
  ];
  const filled = fields.filter(f => f && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
};

/* ── types ──────────────────────────────────────────────── */
interface PersonalForm {
  date_of_birth:string; gender:string; country:string; country_code:string;
  phone_number:string; height_ft:string; height_in:string; weight:string;
  activity_level:string; dietary_preference:string; smoking_status:string;
  alcohol_use:string; sleep_hours:string;
  ec_name:string; ec_phone:string; ec_relationship:string;
  addr_street:string; addr_city:string; addr_state:string;
  addr_zip:string; addr_country:string;
}
interface MedicalForm {
  diabetes_type:string; diagnosis_date:string; last_medical_checkup:string;
  current_medications:string; allergies:string;
}

/* ── sub-components ─────────────────────────────────────── */
function SectionHeader({ icon, title }: { icon:string; title:string }) {
  return (
    <View style={s.secHeader}>
      <MaterialCommunityIcons name={icon as any} size={18} color={HERO_FROM} />
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.secLine} />
    </View>
  );
}

function FieldLabel({ label, required }: { label:string; required?:boolean }) {
  return (
    <Text style={s.label}>
      {label}{required ? <Text style={{ color: colors.error.main }}> *</Text> : null}
    </Text>
  );
}

function TextRow({ label, value, onChange, placeholder, keyboardType, required, multiline }:{
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; keyboardType?:any; required?:boolean; multiline?:boolean;
}) {
  return (
    <View style={s.fieldWrap}>
      <FieldLabel label={label} required={required} />
      <RNTextInput
        style={[s.input, multiline && s.multiInput]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder||''}
        placeholderTextColor={colors.neutral[400]}
        keyboardType={keyboardType||'default'}
        multiline={multiline}
      />
    </View>
  );
}

function ChipRow({ label, options, value, onChange, required }:{
  label:string; options:string[]; value:string; onChange:(v:string)=>void; required?:boolean;
}) {
  return (
    <View style={s.fieldWrap}>
      {!!label && <FieldLabel label={label} required={required} />}
      <View style={s.chipRow}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <TouchableOpacity key={opt} style={[s.chip, active && s.chipActive]}
              onPress={() => onChange(opt)} activeOpacity={0.7}>
              <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PickerRow({ label, options, value, onChange, required }:{
  label:string; options:string[]; value:string; onChange:(v:string)=>void; required?:boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.fieldWrap}>
      {!!label && <FieldLabel label={label} required={required} />}
      <TouchableOpacity style={s.pickerBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={value ? s.pickerBtnText : s.pickerBtnPlaceholder}>{value||'Select...'}</Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.neutral[500]} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={s.pickerModal}>
          <Text style={s.pickerModalTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.pickerItem, item===value && s.pickerItemActive]}
                onPress={() => { onChange(item); setOpen(false); }}>
                <Text style={[s.pickerItemText, item===value && s.pickerItemTextActive]}>{item}</Text>
                {item===value && <MaterialCommunityIcons name="check" size={16} color={HERO_FROM} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ── main screen ────────────────────────────────────────── */
export default function PersonalMedicalInfoScreen() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);

  const { data:pData, isLoading:pL, isError:pE, refetch:rP } = useGetPersonalInfoQuery();
  const { data:mData, isLoading:mL, isError:mE, refetch:rM } = useGetMedicalInfoQuery();
  const [savePersonal, { isLoading:savingP }] = useSavePersonalInfoMutation();
  const [saveMedical,  { isLoading:savingM }] = useSaveMedicalInfoMutation();

  const [pf, setPf] = useState<PersonalForm>({
    date_of_birth:'', gender:'', country:'', country_code:'',
    phone_number:'', height_ft:'', height_in:'0', weight:'',
    activity_level:'', dietary_preference:'', smoking_status:'',
    alcohol_use:'', sleep_hours:'',
    ec_name:'', ec_phone:'', ec_relationship:'',
    addr_street:'', addr_city:'', addr_state:'', addr_zip:'', addr_country:'',
  });
  const [mf, setMf] = useState<MedicalForm>({
    diabetes_type:'', diagnosis_date:'', last_medical_checkup:'',
    current_medications:'', allergies:'',
  });

  const up = (field: keyof PersonalForm) => (v: string) => setPf(p => ({ ...p, [field]: v }));
  const um = (field: keyof MedicalForm)  => (v: string) => setMf(p => ({ ...p, [field]: v }));

  useEffect(() => {
    if (!pData?.data) return;
    const d: any = pData.data;
    const { ft, inch } = d.height ? cmToFtIn(Number(d.height)) : { ft:'', inch:'0' };
    setPf({
      date_of_birth:    d.date_of_birth ? String(d.date_of_birth).split('T')[0] : '',
      gender:           d.gender || '',
      country:          d.country || '',
      country_code:     d.country_code || '',
      phone_number:     d.phone_number || '',
      height_ft:        ft,
      height_in:        inch,
      weight:           d.weight ? String(d.weight) : '',
      activity_level:   d.activity_level || '',
      dietary_preference: d.dietary_preference || '',
      smoking_status:   d.smoking_status || '',
      alcohol_use:      d.alcohol_use || '',
      sleep_hours:      d.sleep_hours ? String(d.sleep_hours) : '',
      ec_name:          d.emergency_contact?.name || '',
      ec_phone:         d.emergency_contact?.phone || '',
      ec_relationship:  d.emergency_contact?.relationship || '',
      addr_street:      d.address?.street || '',
      addr_city:        d.address?.city || '',
      addr_state:       d.address?.state || '',
      addr_zip:         d.address?.zip_code || '',
      addr_country:     d.address?.country || '',
    });
  }, [pData]);

  useEffect(() => {
    if (!mData?.data) return;
    const d: any = mData.data;
    setMf({
      diabetes_type:        d.diabetes_type || '',
      diagnosis_date:       d.diagnosis_date ? String(d.diagnosis_date).split('T')[0] : '',
      last_medical_checkup: d.last_medical_checkup ? String(d.last_medical_checkup).split('T')[0] : '',
      current_medications:  d.current_medications?.map((m:any)=>m.medication_name).filter(Boolean).join(', ')||'',
      allergies:            d.allergies?.map((a:any)=>a.allergen).filter(Boolean).join(', ')||'',
    });
  }, [mData]);

  if (pL || mL) return <FullScreenLoader />;
  if (pE || mE) return <ErrorState onRetry={() => { rP(); rM(); }} error="Failed to load your information." />;

  const completion = calcCompletion(pf);

  const unlockPersonalized = () => {
    if (currentUser) {
      dispatch(setUser({ ...currentUser, onboardingCompleted: true }));
    }
  };

  const handleSavePersonal = async () => {
    if (!pf.date_of_birth || !pf.gender || !pf.height_ft || !pf.weight) {
      Alert.alert('Missing Fields', 'Date of birth, gender, height, and weight are required.');
      return;
    }
    const heightCm = ftInToCm(pf.height_ft, pf.height_in);
    const payload = {
      date_of_birth:      pf.date_of_birth,
      gender:             pf.gender,
      country:            pf.country,
      country_code:       pf.country_code,
      phone_number:       pf.phone_number,
      height:             heightCm,
      weight:             parseFloat(pf.weight),
      activity_level:     pf.activity_level || undefined,
      dietary_preference: pf.dietary_preference || undefined,
      smoking_status:     pf.smoking_status || undefined,
      alcohol_use:        pf.alcohol_use || undefined,
      sleep_hours:        pf.sleep_hours ? parseFloat(pf.sleep_hours) : undefined,
      emergency_contact:  { name:pf.ec_name, phone:pf.ec_phone, relationship:pf.ec_relationship },
      address:            { street:pf.addr_street, city:pf.addr_city, state:pf.addr_state, zip_code:pf.addr_zip, country:pf.addr_country },
    };
    try {
      await savePersonal(payload).unwrap();
      rP();
      // Required fields are present — mark as onboarded so layout gate opens
      unlockPersonalized();
      Alert.alert('Saved', 'Personal information updated successfully.');
    } catch (err:any) {
      Alert.alert('Error', err?.data?.message || 'Failed to save personal information.');
    }
  };

  const handleSaveMedical = async () => {
    if (!mf.diabetes_type) {
      Alert.alert('Missing Fields', 'Diabetes type is required.');
      return;
    }
    const payload = {
      diabetes_type:        mf.diabetes_type,
      diagnosis_date:       mf.diagnosis_date || undefined,
      last_medical_checkup: mf.last_medical_checkup || undefined,
      current_medications:  mf.current_medications
        ? mf.current_medications.split(',').map(n=>({ medication_name:n.trim() })).filter(m=>m.medication_name)
        : [],
      allergies: mf.allergies
        ? mf.allergies.split(',').map(n=>({ allergen:n.trim() })).filter(a=>a.allergen)
        : [],
    };
    try {
      await saveMedical(payload).unwrap();
      rM();
      Alert.alert('Saved', 'Medical information updated successfully.');
    } catch (err:any) {
      Alert.alert('Error', err?.data?.message || 'Failed to save medical information.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hero + completion bar */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{x:0,y:0}} end={{x:1,y:1}} style={s.hero}>
          <View style={s.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.heroIconWrap}>
              <MaterialCommunityIcons name="account-edit-outline" size={24} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Personal & Medical Info</Text>
          <Text style={s.heroSub}>Complete your profile for personalized health suggestions</Text>
          <View style={s.progressWrap}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>Profile Completion</Text>
              <Text style={s.progressPct}>{completion}%</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${completion}%` as any }]} />
            </View>
            {completion === 100 && (
              <Text style={s.completeText}>Profile complete — personalized suggestions unlocked!</Text>
            )}
          </View>
        </LinearGradient>

        {/* Section 1: Basic Info */}
        <View style={s.card}>
          <SectionHeader icon="account-outline" title="Basic Information" />
          <TextRow label="Date of Birth" value={pf.date_of_birth} onChange={up('date_of_birth')}
            placeholder="YYYY-MM-DD" required />
          <ChipRow label="Gender" options={GENDER_OPTIONS} value={pf.gender} onChange={up('gender')} required />
          <PickerRow label="Country / Region" options={COUNTRIES} value={pf.country}
            onChange={v => setPf(p => ({ ...p, country:v, country_code: COUNTRY_CODES[v]||'' }))} required />
          <View style={s.fieldWrap}>
            <FieldLabel label="Phone Number" required />
            <View style={s.phoneRow}>
              {!!pf.country_code && (
                <View style={s.countryCode}>
                  <Text style={s.countryCodeText}>{pf.country_code}</Text>
                </View>
              )}
              <RNTextInput style={[s.input, s.phoneInput]} value={pf.phone_number}
                onChangeText={up('phone_number')} placeholder="Phone number"
                placeholderTextColor={colors.neutral[400]} keyboardType="phone-pad" />
            </View>
          </View>
        </View>

        {/* Section 2: Body Metrics */}
        <View style={s.card}>
          <SectionHeader icon="human-male-height" title="Body Metrics" />
          <View style={s.fieldWrap}>
            <FieldLabel label="Height" required />
            <View style={s.rowHalf}>
              <View style={{ flex:1 }}>
                <PickerRow label="" options={FEET_OPTIONS} value={pf.height_ft} onChange={up('height_ft')} />
                <Text style={s.unitLabel}>feet</Text>
              </View>
              <View style={{ flex:1 }}>
                <PickerRow label="" options={INCHES_OPTIONS} value={pf.height_in} onChange={up('height_in')} />
                <Text style={s.unitLabel}>inches</Text>
              </View>
            </View>
          </View>
          <TextRow label="Weight (kg)" value={pf.weight} onChange={up('weight')}
            placeholder="e.g. 72" keyboardType="numeric" required />
          <TextRow label="Average Sleep Hours" value={pf.sleep_hours} onChange={up('sleep_hours')}
            placeholder="e.g. 7" keyboardType="numeric" />
        </View>

        {/* Section 3: Lifestyle */}
        <View style={s.card}>
          <SectionHeader icon="run" title="Lifestyle & Habits" />
          <ChipRow label="Activity Level"      options={ACTIVITY_OPTIONS} value={pf.activity_level}      onChange={up('activity_level')} />
          <ChipRow label="Dietary Preference"  options={DIET_OPTIONS}     value={pf.dietary_preference}  onChange={up('dietary_preference')} />
          <ChipRow label="Smoking Status"      options={SMOKING_OPTIONS}  value={pf.smoking_status}      onChange={up('smoking_status')} />
          <ChipRow label="Alcohol Use"         options={ALCOHOL_OPTIONS}  value={pf.alcohol_use}         onChange={up('alcohol_use')} />
        </View>

        {/* Section 4: Emergency Contact */}
        <View style={s.card}>
          <SectionHeader icon="phone-alert-outline" title="Emergency Contact" />
          <TextRow label="Contact Name"     value={pf.ec_name}         onChange={up('ec_name')}         placeholder="Full name" />
          <TextRow label="Contact Phone"    value={pf.ec_phone}        onChange={up('ec_phone')}        placeholder="Phone number" keyboardType="phone-pad" />
          <TextRow label="Relationship"     value={pf.ec_relationship} onChange={up('ec_relationship')} placeholder="e.g. Parent, Spouse, Sibling" />
        </View>

        {/* Section 5: Address */}
        <View style={s.card}>
          <SectionHeader icon="home-outline" title="Address Information" />
          <TextRow label="Street Address"    value={pf.addr_street}  onChange={up('addr_street')}  placeholder="Street" />
          <TextRow label="City"              value={pf.addr_city}    onChange={up('addr_city')}    placeholder="City" />
          <TextRow label="State / Province"  value={pf.addr_state}   onChange={up('addr_state')}   placeholder="State" />
          <TextRow label="Zip / Postal Code" value={pf.addr_zip}     onChange={up('addr_zip')}     placeholder="Zip" />
          <TextRow label="Country"           value={pf.addr_country} onChange={up('addr_country')} placeholder="Country" />
        </View>

        {/* Save Personal */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSavePersonal} disabled={savingP} activeOpacity={0.85}>
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.saveBtnGrad}>
            {savingP
              ? <ActivityIndicator color="#FFF" size={18} />
              : <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{savingP ? 'Saving...' : 'Save Personal Information'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Section 6: Medical */}
        <View style={[s.card, { marginTop: spacing[4] }]}>
          <SectionHeader icon="medical-bag" title="Medical Information" />
          <ChipRow label="Diabetes Type" options={DIABETES_TYPES} value={mf.diabetes_type} onChange={um('diabetes_type')} required />
          <TextRow label="Diagnosis Date"       value={mf.diagnosis_date}       onChange={um('diagnosis_date')}       placeholder="YYYY-MM-DD" />
          <TextRow label="Last Medical Checkup" value={mf.last_medical_checkup} onChange={um('last_medical_checkup')} placeholder="YYYY-MM-DD" />
          <TextRow label="Current Medications"  value={mf.current_medications}  onChange={um('current_medications')}  placeholder="Comma-separated (e.g. Metformin, Insulin)" multiline />
          <TextRow label="Allergies"            value={mf.allergies}            onChange={um('allergies')}            placeholder="Comma-separated (e.g. Penicillin, Pollen)" multiline />
        </View>

        {/* Save Medical */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSaveMedical} disabled={savingM} activeOpacity={0.85}>
          <LinearGradient colors={['#3D7A68','#2D5A4E']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.saveBtnGrad}>
            {savingM
              ? <ActivityIndicator color="#FFF" size={18} />
              : <MaterialCommunityIcons name="heart-pulse" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{savingM ? 'Saving...' : 'Save Medical Information'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4] },

  hero:       { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[4], ...shadows.md },
  heroTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: spacing[3] },
  backBtn:    { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.18)', justifyContent:'center', alignItems:'center' },
  heroIconWrap: { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.15)', justifyContent:'center', alignItems:'center' },
  heroTitle:  { fontSize:22, fontWeight:'700', color:'#FFF', letterSpacing:-0.3 },
  heroSub:    { fontSize:13, color:'rgba(255,255,255,0.75)', fontWeight:'500', marginTop:2, marginBottom: spacing[4] },

  progressWrap:  { marginTop: spacing[2] },
  progressRow:   { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  progressLabel: { fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:'600' },
  progressPct:   { fontSize:13, color:'#FFF', fontWeight:'700' },
  progressTrack: { width:'100%', height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.2)', overflow:'hidden' },
  progressFill:  { height:'100%', backgroundColor:'#FFF', borderRadius:3 },
  completeText:  { fontSize:12, color:'rgba(255,255,255,0.9)', marginTop:6, fontWeight:'600' },

  card: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], marginBottom: spacing[3], borderWidth:1, borderColor: colors.neutral[100], ...shadows.xs },

  secHeader: { flexDirection:'row', alignItems:'center', gap: spacing[2], marginBottom: spacing[4] },
  secTitle:  { fontSize:15, fontWeight:'700', color: colors.neutral[800] },
  secLine:   { flex:1, height:1, backgroundColor: colors.neutral[100] },

  fieldWrap: { marginBottom: spacing[3] },
  label:     { fontSize:12, fontWeight:'600', color: colors.neutral[600], marginBottom:6 },
  input:     { backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm, borderWidth:1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize:14, color: colors.neutral[900] },
  multiInput:{ minHeight:64, textAlignVertical:'top' },

  phoneRow:       { flexDirection:'row', alignItems:'center', gap: spacing[2] },
  countryCode:    { paddingHorizontal: spacing[3], paddingVertical: spacing[3], backgroundColor: colors.neutral[100], borderRadius: borderRadius.sm, borderWidth:1, borderColor: colors.neutral[200] },
  countryCodeText:{ fontSize:13, fontWeight:'700', color: colors.neutral[700] },
  phoneInput:     { flex:1 },

  rowHalf:   { flexDirection:'row', gap: spacing[3] },
  unitLabel: { fontSize:11, color: colors.neutral[500], marginTop:2, textAlign:'center' },

  chipRow:         { flexDirection:'row', flexWrap:'wrap', gap: spacing[2] },
  chip:            { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, backgroundColor: colors.neutral[100], borderWidth:1, borderColor: colors.neutral[200] },
  chipActive:      { backgroundColor: HERO_FROM+'14', borderColor: HERO_FROM },
  chipText:        { fontSize:12, color: colors.neutral[600], fontWeight:'500' },
  chipTextActive:  { color: HERO_FROM, fontWeight:'700' },

  pickerBtn:             { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm, borderWidth:1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3] },
  pickerBtnText:         { fontSize:14, color: colors.neutral[900] },
  pickerBtnPlaceholder:  { fontSize:14, color: colors.neutral[400] },
  modalOverlay:          { flex:0.4, backgroundColor:'rgba(0,0,0,0.4)' },
  pickerModal:           { backgroundColor:'#FFF', borderTopLeftRadius:20, borderTopRightRadius:20, padding: spacing[4], maxHeight:'60%', flex:0.6 },
  pickerModalTitle:      { fontSize:16, fontWeight:'700', color: colors.neutral[900], marginBottom: spacing[3] },
  pickerItem:            { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical: spacing[3], borderBottomWidth:1, borderBottomColor: colors.neutral[50] },
  pickerItemActive:      { backgroundColor: HERO_FROM+'08' },
  pickerItemText:        { fontSize:15, color: colors.neutral[700] },
  pickerItemTextActive:  { color: HERO_FROM, fontWeight:'700' },

  saveBtn:     { marginTop: spacing[2], marginBottom: spacing[2] },
  saveBtnGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap: spacing[2], paddingVertical: spacing[3]+2, borderRadius: borderRadius.md },
  saveBtnText: { fontSize:15, fontWeight:'700', color:'#FFF' },
});
