table_name	column_name	data_type	is_nullable	column_default
admissions	id	uuid	NO	uuid_generate_v4()
admissions	admission_number	character varying	NO	null
admissions	patient_id	uuid	NO	null
admissions	visit_id	uuid	YES	null
admissions	ward_id	uuid	NO	null
admissions	bed_id	uuid	YES	null
admissions	attending_doctor_id	uuid	NO	null
admissions	assigned_nurse_id	uuid	YES	null
admissions	admission_type	character varying	YES	null
admissions	admission_reason	text	NO	null
admissions	diagnosis	text	YES	null
admissions	treatment_plan	text	YES	null
admissions	admission_status	character varying	YES	'active'::character varying
admissions	admission_date	date	YES	CURRENT_DATE
admissions	admission_time	timestamp with time zone	YES	now()
admissions	expected_discharge_date	date	YES	null
admissions	actual_discharge_date	date	YES	null
admissions	discharge_summary	text	YES	null
admissions	discharge_instructions	text	YES	null
admissions	follow_up_required	boolean	YES	FALSE
admissions	follow_up_date	date	YES	null
admissions	total_bill_amount	numeric	YES	null
admissions	requested_by	uuid	YES	null
admissions	approved_by	uuid	YES	null
admissions	created_at	timestamp with time zone	YES	now()
admissions	updated_at	timestamp with time zone	YES	now()
admissions	assigned_doctor	uuid	YES	null
admissions	receiving_notes	text	YES	null
admissions	general_examination	text	YES	null
admissions	expert_opinion_requested	boolean	YES	FALSE
audit_logs	id	uuid	NO	uuid_generate_v4()
audit_logs	user_id	uuid	YES	null
audit_logs	action	character varying	NO	null
audit_logs	entity_type	character varying	NO	null
audit_logs	entity_id	uuid	YES	null
audit_logs	old_values	jsonb	YES	null
audit_logs	new_values	jsonb	YES	null
audit_logs	ip_address	inet	YES	null
audit_logs	user_agent	text	YES	null
audit_logs	session_id	character varying	YES	null
audit_logs	success	boolean	YES	TRUE
audit_logs	error_message	text	YES	null
audit_logs	created_at	timestamp with time zone	YES	now()
beds	id	uuid	NO	uuid_generate_v4()
beds	bed_number	character varying	NO	null
beds	ward_id	uuid	YES	null
beds	bed_type	character varying	YES	null
beds	status	character varying	YES	'available'::character varying
beds	current_patient_id	uuid	YES	null
beds	room_number	character varying	YES	null
beds	has_oxygen	boolean	YES	FALSE
beds	has_suction	boolean	YES	FALSE
beds	has_monitor	boolean	YES	FALSE
beds	daily_rate	numeric	YES	null
beds	notes	text	YES	null
beds	created_at	timestamp with time zone	YES	now()
beds	updated_at	timestamp with time zone	YES	now()
departments	id	uuid	NO	uuid_generate_v4()
departments	name	character varying	NO	null
departments	code	character varying	NO	null
departments	description	text	YES	null
departments	head_user_id	uuid	YES	null
departments	location	character varying	YES	null
departments	phone	character varying	YES	null
departments	is_active	boolean	YES	TRUE
departments	created_at	timestamp with time zone	YES	now()
departments	updated_at	timestamp with time zone	YES	now()
lab_order_tests	id	uuid	NO	uuid_generate_v4()
lab_order_tests	lab_order_id	uuid	NO	null
lab_order_tests	lab_test_id	uuid	NO	null
lab_order_tests	test_status	character varying	YES	'pending'::character varying
lab_order_tests	result_value	text	YES	null
lab_order_tests	result_unit	character varying	YES	null
lab_order_tests	reference_range	text	YES	null
lab_order_tests	abnormal_flag	character varying	YES	null
lab_order_tests	critical_flag	boolean	YES	FALSE
lab_order_tests	result_comment	text	YES	null
lab_order_tests	performed_by	uuid	YES	null
lab_order_tests	verified_by	uuid	YES	null
lab_order_tests	result_date	timestamp with time zone	YES	null
lab_order_tests	created_at	timestamp with time zone	YES	now()
lab_orders	id	uuid	NO	uuid_generate_v4()
lab_orders	order_number	character varying	NO	null
lab_orders	patient_id	uuid	NO	null
lab_orders	visit_id	uuid	YES	null
lab_orders	admission_id	uuid	YES	null
lab_orders	ordered_by	uuid	NO	null
lab_orders	order_status	character varying	YES	'pending'::character varying
lab_orders	priority	character varying	YES	'routine'::character varying
lab_orders	clinical_info	text	YES	null
lab_orders	fasting_required	boolean	YES	FALSE
lab_orders	specimen_collected_at	timestamp with time zone	YES	null
lab_orders	collected_by	uuid	YES	null
lab_orders	processed_by	uuid	YES	null
lab_orders	verified_by	uuid	YES	null
lab_orders	reported_at	timestamp with time zone	YES	null
lab_orders	total_cost	numeric	YES	null
lab_orders	created_at	timestamp with time zone	YES	now()
lab_orders	updated_at	timestamp with time zone	YES	now()
lab_tests	id	uuid	NO	uuid_generate_v4()
lab_tests	test_code	character varying	NO	null
lab_tests	test_name	character varying	NO	null
lab_tests	test_category	character varying	YES	null
lab_tests	specimen_type	character varying	YES	null
lab_tests	specimen_volume	character varying	YES	null
lab_tests	container_type	character varying	YES	null
lab_tests	test_method	character varying	YES	null
lab_tests	reference_range_male	text	YES	null
lab_tests	reference_range_female	text	YES	null
lab_tests	reference_range_pediatric	text	YES	null
lab_tests	critical_values	text	YES	null
lab_tests	turnaround_time	integer	YES	null
lab_tests	cost	numeric	YES	null
lab_tests	department	character varying	YES	null
lab_tests	is_active	boolean	YES	TRUE
lab_tests	created_at	timestamp with time zone	YES	now()
lab_tests	updated_at	timestamp with time zone	YES	now()
medication_administration	id	uuid	NO	uuid_generate_v4()
medication_administration	medication_order_id	uuid	NO	null
medication_administration	patient_id	uuid	NO	null
medication_administration	administered_by	uuid	NO	null
medication_administration	administered_at	timestamp with time zone	YES	now()
medication_administration	dosage_given	character varying	YES	null
medication_administration	route_used	character varying	YES	null
medication_administration	administration_status	character varying	YES	'given'::character varying
medication_administration	patient_response	text	YES	null
medication_administration	side_effects_observed	text	YES	null
medication_administration	notes	text	YES	null
medication_administration	witnessed_by	uuid	YES	null
medication_administration	created_at	timestamp with time zone	YES	now()
medication_orders	id	uuid	NO	uuid_generate_v4()
medication_orders	order_number	character varying	NO	null
medication_orders	patient_id	uuid	NO	null
medication_orders	visit_id	uuid	YES	null
medication_orders	admission_id	uuid	YES	null
medication_orders	medication_id	uuid	NO	null
medication_orders	prescribed_by	uuid	NO	null
medication_orders	dosage	character varying	NO	null
medication_orders	frequency	character varying	NO	null
medication_orders	route	character varying	YES	null
medication_orders	duration_days	integer	YES	null
medication_orders	quantity_prescribed	integer	YES	null
medication_orders	instructions	text	YES	null
medication_orders	indication	text	YES	null
medication_orders	order_status	character varying	YES	'pending'::character varying
medication_orders	is_stat	boolean	YES	FALSE
medication_orders	is_prn	boolean	YES	FALSE
medication_orders	start_date	date	YES	CURRENT_DATE
medication_orders	end_date	date	YES	null
medication_orders	verified_by	uuid	YES	null
medication_orders	verified_at	timestamp with time zone	YES	null
medication_orders	dispensed_by	uuid	YES	null
medication_orders	dispensed_at	timestamp with time zone	YES	null
medication_orders	created_at	timestamp with time zone	YES	now()
medication_orders	updated_at	timestamp with time zone	YES	now()
medications	id	uuid	NO	uuid_generate_v4()
medications	name	character varying	NO	null
medications	generic_name	character varying	YES	null
medications	brand_name	character varying	YES	null
medications	dosage_form	character varying	YES	null
medications	strength	character varying	YES	null
medications	unit	character varying	YES	null
medications	manufacturer	character varying	YES	null
medications	drug_class	character varying	YES	null
medications	therapeutic_class	character varying	YES	null
medications	contraindications	text	YES	null
medications	side_effects	text	YES	null
medications	interactions	text	YES	null
medications	storage_requirements	text	YES	null
medications	price_per_unit	numeric	YES	null
medications	stock_quantity	integer	YES	0
medications	minimum_stock_level	integer	YES	10
medications	expiry_date	date	YES	null
medications	is_controlled_substance	boolean	YES	FALSE
medications	requires_prescription	boolean	YES	TRUE
medications	is_active	boolean	YES	TRUE
medications	created_at	timestamp with time zone	YES	now()
medications	updated_at	timestamp with time zone	YES	now()
notifications	id	uuid	NO	uuid_generate_v4()
notifications	recipient_id	uuid	NO	null
notifications	sender_id	uuid	YES	null
notifications	title	character varying	NO	null
notifications	message	text	NO	null
notifications	notification_type	character varying	NO	null
notifications	priority	character varying	YES	'normal'::character varying
notifications	status	character varying	YES	'unread'::character varying
notifications	patient_id	uuid	YES	null
notifications	related_entity_type	character varying	YES	null
notifications	related_entity_id	uuid	YES	null
notifications	action_url	text	YES	null
notifications	read_at	timestamp with time zone	YES	null
notifications	expires_at	timestamp with time zone	YES	null
notifications	created_at	timestamp with time zone	YES	now()
patient_staff_assignments	id	uuid	NO	uuid_generate_v4()
patient_staff_assignments	patient_id	uuid	NO	null
patient_staff_assignments	admission_id	uuid	YES	null
patient_staff_assignments	staff_id	uuid	NO	null
patient_staff_assignments	staff_role	character varying	NO	null
patient_staff_assignments	assignment_type	character varying	YES	'primary'::character varying
patient_staff_assignments	assigned_by	uuid	NO	null
patient_staff_assignments	assigned_at	timestamp with time zone	YES	now()
patient_staff_assignments	unassigned_at	timestamp with time zone	YES	null
patient_staff_assignments	shift_start	time without time zone	YES	null
patient_staff_assignments	shift_end	time without time zone	YES	null
patient_staff_assignments	is_active	boolean	YES	TRUE
patient_staff_assignments	notes	text	YES	null
patient_staff_assignments	created_at	timestamp with time zone	YES	now()
patient_staff_assignments	updated_at	timestamp with time zone	YES	now()
patient_staff_assignments	ward_id	uuid	YES	null
patient_vitals	id	uuid	NO	uuid_generate_v4()
patient_vitals	patient_id	uuid	NO	null
patient_vitals	visit_id	uuid	YES	null
patient_vitals	admission_id	uuid	YES	null
patient_vitals	recorded_by	uuid	NO	null
patient_vitals	systolic_bp	integer	YES	null
patient_vitals	diastolic_bp	integer	YES	null
patient_vitals	heart_rate	integer	YES	null
patient_vitals	temperature	numeric	YES	null
patient_vitals	respiratory_rate	integer	YES	null
patient_vitals	oxygen_saturation	integer	YES	null
patient_vitals	weight	numeric	YES	null
patient_vitals	height	numeric	YES	null
patient_vitals	bmi	numeric	YES	null
patient_vitals	blood_glucose	integer	YES	null
patient_vitals	pain_scale	integer	YES	null
patient_vitals	notes	text	YES	null
patient_vitals	recorded_at	timestamp with time zone	YES	now()
patient_vitals	created_at	timestamp with time zone	YES	now()
patients	id	uuid	NO	uuid_generate_v4()
patients	patient_number	character varying	NO	null
patients	first_name	character varying	NO	null
patients	last_name	character varying	NO	null
patients	father_name	character varying	YES	null
patients	date_of_birth	date	YES	null
patients	age	integer	YES	null
patients	gender	character varying	NO	null
patients	cnic	character varying	YES	null
patients	phone	character varying	YES	null
patients	emergency_contact	character varying	YES	null
patients	address	text	YES	null
patients	city	character varying	YES	null
patients	blood_group	character varying	YES	null
patients	marital_status	character varying	YES	null
patients	occupation	character varying	YES	null
patients	insurance_provider	character varying	YES	null
patients	insurance_number	character varying	YES	null
patients	allergies	text	YES	null
patients	medical_history	text	YES	null
patients	is_active	boolean	YES	TRUE
patients	created_at	timestamp with time zone	YES	now()
patients	updated_at	timestamp with time zone	YES	now()
patients	email	text	YES	null
pending_supply_requests	id	uuid	YES	null
pending_supply_requests	ward_id	uuid	YES	null
pending_supply_requests	ward_name	character varying	YES	null
pending_supply_requests	supply_name	character varying	YES	null
pending_supply_requests	quantity_requested	integer	YES	null
pending_supply_requests	urgency	character varying	YES	null
pending_supply_requests	request_reason	text	YES	null
pending_supply_requests	request_status	character varying	YES	null
pending_supply_requests	created_at	timestamp with time zone	YES	null
pending_supply_requests	requested_by_name	text	YES	null
pending_supply_requests	pharmacy_supply_id	uuid	YES	null
pending_supply_requests	pharmacy_stock	integer	YES	null
pending_supply_requests	unit	character varying	YES	null
pending_supply_requests	availability_status	text	YES	null
pharmacy_low_stock	id	uuid	YES	null
pharmacy_low_stock	supply_name	character varying	YES	null
pharmacy_low_stock	supply_category	character varying	YES	null
pharmacy_low_stock	current_stock	integer	YES	null
pharmacy_low_stock	minimum_stock_level	integer	YES	null
pharmacy_low_stock	unit	character varying	YES	null
pharmacy_low_stock	shortage_quantity	integer	YES	null
pharmacy_low_stock	alert_level	text	YES	null
pharmacy_stock	id	uuid	NO	uuid_generate_v4()
pharmacy_stock	supply_name	character varying	NO	null
pharmacy_stock	supply_category	character varying	YES	null
pharmacy_stock	current_stock	integer	YES	0
pharmacy_stock	minimum_stock_level	integer	YES	10
pharmacy_stock	maximum_stock_level	integer	YES	1000
pharmacy_stock	unit	character varying	YES	null
pharmacy_stock	cost_per_unit	numeric	YES	0
pharmacy_stock	supplier	character varying	YES	null
pharmacy_stock	last_restocked_date	date	YES	null
pharmacy_stock	expiry_date	date	YES	null
pharmacy_stock	batch_number	character varying	YES	null
pharmacy_stock	notes	text	YES	null
pharmacy_stock	is_active	boolean	YES	TRUE
pharmacy_stock	created_at	timestamp with time zone	YES	now()
pharmacy_stock	updated_at	timestamp with time zone	YES	now()
pharmacy_transactions	id	uuid	NO	uuid_generate_v4()
pharmacy_transactions	transaction_type	character varying	NO	null
pharmacy_transactions	pharmacy_supply_id	uuid	YES	null
pharmacy_transactions	ward_supply_id	uuid	YES	null
pharmacy_transactions	supply_request_id	uuid	YES	null
pharmacy_transactions	quantity	integer	NO	null
pharmacy_transactions	previous_stock	integer	NO	null
pharmacy_transactions	new_stock	integer	NO	null
pharmacy_transactions	performed_by	uuid	YES	null
pharmacy_transactions	ward_id	uuid	YES	null
pharmacy_transactions	notes	text	YES	null
pharmacy_transactions	created_at	timestamp with time zone	YES	now()
radiology_orders	id	uuid	NO	uuid_generate_v4()
radiology_orders	order_number	character varying	NO	null
radiology_orders	patient_id	uuid	NO	null
radiology_orders	visit_id	uuid	YES	null
radiology_orders	admission_id	uuid	YES	null
radiology_orders	ordered_by	uuid	NO	null
radiology_orders	study_type	character varying	NO	null
radiology_orders	body_part	character varying	YES	null
radiology_orders	study_description	text	YES	null
radiology_orders	clinical_indication	text	YES	null
radiology_orders	contrast_required	boolean	YES	FALSE
radiology_orders	pregnancy_status	character varying	YES	null
radiology_orders	order_status	character varying	YES	'scheduled'::character varying
radiology_orders	priority	character varying	YES	'routine'::character varying
radiology_orders	scheduled_datetime	timestamp with time zone	YES	null
radiology_orders	performed_datetime	timestamp with time zone	YES	null
radiology_orders	performed_by	uuid	YES	null
radiology_orders	radiologist_id	uuid	YES	null
radiology_orders	cost	numeric	YES	null
radiology_orders	created_at	timestamp with time zone	YES	now()
radiology_orders	updated_at	timestamp with time zone	YES	now()
radiology_reports	id	uuid	NO	uuid_generate_v4()
radiology_reports	radiology_order_id	uuid	NO	null
radiology_reports	patient_id	uuid	NO	null
radiology_reports	study_date	date	NO	null
radiology_reports	technique	text	YES	null
radiology_reports	findings	text	NO	null
radiology_reports	impression	text	NO	null
radiology_reports	recommendations	text	YES	null
radiology_reports	report_status	character varying	YES	'draft'::character varying
radiology_reports	dictated_by	uuid	YES	null
radiology_reports	transcribed_by	uuid	YES	null
radiology_reports	verified_by	uuid	YES	null
radiology_reports	dictated_at	timestamp with time zone	YES	null
radiology_reports	transcribed_at	timestamp with time zone	YES	null
radiology_reports	verified_at	timestamp with time zone	YES	null
radiology_reports	image_count	integer	YES	0
radiology_reports	critical_findings	boolean	YES	FALSE
radiology_reports	addendum	text	YES	null
radiology_reports	created_at	timestamp with time zone	YES	now()
radiology_reports	updated_at	timestamp with time zone	YES	now()
supply_requests	id	uuid	NO	uuid_generate_v4()
supply_requests	ward_id	uuid	NO	null
supply_requests	supply_id	uuid	NO	null
supply_requests	requested_by	uuid	NO	null
supply_requests	quantity_requested	integer	NO	null
supply_requests	urgency	character varying	YES	'normal'::character varying
supply_requests	request_reason	text	YES	null
supply_requests	request_status	character varying	YES	'pending'::character varying
supply_requests	approved_by	uuid	YES	null
supply_requests	delivered_quantity	integer	YES	null
supply_requests	delivered_date	date	YES	null
supply_requests	notes	text	YES	null
supply_requests	created_at	timestamp with time zone	YES	now()
supply_requests	updated_at	timestamp with time zone	YES	now()
supply_requests	supply_name	character varying	YES	null
supply_requests	pharmacy_supply_id	uuid	YES	null
tasks	id	uuid	NO	uuid_generate_v4()
tasks	task_number	character varying	NO	null
tasks	title	character varying	NO	null
tasks	description	text	YES	null
tasks	task_type	character varying	NO	null
tasks	priority	character varying	YES	'normal'::character varying
tasks	status	character varying	YES	'pending'::character varying
tasks	assigned_to	uuid	NO	null
tasks	assigned_by	uuid	NO	null
tasks	patient_id	uuid	YES	null
tasks	visit_id	uuid	YES	null
tasks	admission_id	uuid	YES	null
tasks	department_id	uuid	YES	null
tasks	related_entity_type	character varying	YES	null
tasks	related_entity_id	uuid	YES	null
tasks	due_datetime	timestamp with time zone	YES	null
tasks	started_at	timestamp with time zone	YES	null
tasks	completed_at	timestamp with time zone	YES	null
tasks	estimated_duration	integer	YES	null
tasks	completion_notes	text	YES	null
tasks	created_at	timestamp with time zone	YES	now()
tasks	updated_at	timestamp with time zone	YES	now()
tokens	id	uuid	NO	uuid_generate_v4()
tokens	token_number	integer	NO	null
tokens	visit_id	uuid	NO	null
tokens	department_id	uuid	NO	null
tokens	assigned_doctor_id	uuid	YES	null
tokens	patient_id	uuid	NO	null
tokens	token_status	character varying	YES	'waiting'::character varying
tokens	issue_time	timestamp with time zone	YES	now()
tokens	issue_date	date	YES	CURRENT_DATE
tokens	called_time	timestamp with time zone	YES	null
tokens	consultation_start_time	timestamp with time zone	YES	null
tokens	estimated_wait_time	integer	YES	null
tokens	created_at	timestamp with time zone	YES	now()
tokens	updated_at	timestamp with time zone	YES	now()
tokens	status	text	YES	null
user_profiles	id	uuid	NO	null
user_profiles	employee_id	character varying	YES	null
user_profiles	first_name	character varying	NO	null
user_profiles	last_name	character varying	NO	null
user_profiles	email	character varying	NO	null
user_profiles	phone	character varying	YES	null
user_profiles	cnic	character varying	YES	null
user_profiles	role	character varying	NO	null
user_profiles	department_id	uuid	YES	null
user_profiles	specialization	character varying	YES	null
user_profiles	license_number	character varying	YES	null
user_profiles	hire_date	date	YES	null
user_profiles	is_active	boolean	YES	TRUE
user_profiles	shift_start	time without time zone	YES	null
user_profiles	shift_end	time without time zone	YES	null
user_profiles	emergency_contact	character varying	YES	null
user_profiles	address	text	YES	null
user_profiles	date_of_birth	date	YES	null
user_profiles	gender	character varying	YES	null
user_profiles	profile_image_url	text	YES	null
user_profiles	created_at	timestamp with time zone	YES	now()
user_profiles	updated_at	timestamp with time zone	YES	now()
user_profiles	doctor_type	character varying	YES	'opd'::character varying
visits	id	uuid	NO	uuid_generate_v4()
visits	visit_number	character varying	NO	null
visits	patient_id	uuid	NO	null
visits	department_id	uuid	NO	null
visits	assigned_doctor_id	uuid	YES	null
visits	visit_type	character varying	YES	'opd'::character varying
visits	chief_complaint	text	YES	null
visits	symptoms	text	YES	null
visits	examination_notes	text	YES	null
visits	diagnosis	text	YES	null
visits	treatment_plan	text	YES	null
visits	follow_up_instructions	text	YES	null
visits	visit_status	character varying	YES	'waiting'::character varying
visits	priority	character varying	YES	'normal'::character varying
visits	visit_date	date	YES	CURRENT_DATE
visits	appointment_time	time without time zone	YES	null
visits	checkin_time	timestamp with time zone	YES	null
visits	consultation_start_time	timestamp with time zone	YES	null
visits	consultation_end_time	timestamp with time zone	YES	null
visits	requires_admission	boolean	YES	FALSE
visits	consultation_fee	numeric	YES	null
visits	created_by	uuid	YES	null
visits	created_at	timestamp with time zone	YES	now()
visits	updated_at	timestamp with time zone	YES	now()
ward_doctor_assignments	id	uuid	NO	uuid_generate_v4()
ward_doctor_assignments	doctor_id	uuid	NO	null
ward_doctor_assignments	ward_id	uuid	NO	null
ward_doctor_assignments	assigned_by	uuid	NO	null
ward_doctor_assignments	assignment_type	character varying	YES	'primary'::character varying
ward_doctor_assignments	shift_start	time without time zone	YES	null
ward_doctor_assignments	shift_end	time without time zone	YES	null
ward_doctor_assignments	is_active	boolean	YES	TRUE
ward_doctor_assignments	assigned_at	timestamp with time zone	YES	now()
ward_doctor_assignments	unassigned_at	timestamp with time zone	YES	null
ward_doctor_assignments	created_at	timestamp with time zone	YES	now()
ward_doctor_assignments	updated_at	timestamp with time zone	YES	now()
ward_doctor_treatment_history	id	uuid	NO	uuid_generate_v4()
ward_doctor_treatment_history	admission_id	uuid	NO	null
ward_doctor_treatment_history	doctor_id	uuid	NO	null
ward_doctor_treatment_history	diagnosis	text	NO	null
ward_doctor_treatment_history	treatment_plan	text	NO	null
ward_doctor_treatment_history	created_at	timestamp with time zone	YES	now()
ward_supplies	id	uuid	NO	uuid_generate_v4()
ward_supplies	ward_id	uuid	NO	null
ward_supplies	supply_name	character varying	NO	null
ward_supplies	supply_category	character varying	YES	null
ward_supplies	current_stock	integer	YES	0
ward_supplies	minimum_stock_level	integer	YES	10
ward_supplies	unit	character varying	YES	null
ward_supplies	cost_per_unit	numeric	YES	0
ward_supplies	supplier	character varying	YES	null
ward_supplies	last_restocked_date	date	YES	null
ward_supplies	expiry_date	date	YES	null
ward_supplies	notes	text	YES	null
ward_supplies	created_at	timestamp with time zone	YES	now()
ward_supplies	updated_at	timestamp with time zone	YES	now()
wards	id	uuid	NO	uuid_generate_v4()
wards	name	character varying	NO	null
wards	code	character varying	NO	null
wards	department_id	uuid	YES	null
wards	ward_type	character varying	YES	null
wards	total_beds	integer	YES	0
wards	available_beds	integer	YES	0
wards	floor_number	integer	YES	null
wards	wing	character varying	YES	null
wards	head_nurse_id	uuid	YES	null
wards	is_active	boolean	YES	TRUE
wards	created_at	timestamp with time zone	YES	now()
wards	updated_at	timestamp with time zone	YES	now()
wards	ward_admin_id	uuid	YES	null
