
CREATE SEQUENCE public.account_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.account (
    id bigint DEFAULT nextval('public.account_id_seq'::regclass) NOT NULL,
    name character varying(256) NOT NULL,
    first_name character varying(256),
    last_name character varying(256),
    email character varying(256) NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    created_date date,
    modified_date date,
    company_id bigint NOT NULL,
    street character varying(256),
    city character varying(256),
    state character varying(256),
    country character varying(256),
    zip_code character varying(15)
);




--
-- TOC entry 198 (class 1259 OID 10912607)

--

CREATE SEQUENCE public.company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 199 (class 1259 OID 10912609)

--

CREATE TABLE public.company (
    id bigint DEFAULT nextval('public.company_id_seq'::regclass) NOT NULL,
    name character varying(256) NOT NULL,
    domain character varying(256),
    archived boolean DEFAULT false NOT NULL,
    created_date date,
    modified_date date,
    street character varying(256),
    city character varying(256),
    state character varying(256),
    country character varying(256),
    zip_code character varying(15),
    add_status character varying(256),
    token character varying(256)
);




--
-- TOC entry 200 (class 1259 OID 10912617)

--

CREATE SEQUENCE public.expense_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 201 (class 1259 OID 10912619)

--

CREATE TABLE public.expense (
    id bigint DEFAULT nextval('public.expense_id_seq'::regclass) NOT NULL,
    name character varying(256) NOT NULL,
    tax character varying(256),
    tax_no character varying(256),
    note character varying(256),
    status character varying(256) DEFAULT 'Draft'::character varying,
    category character varying(256),
    amount integer NOT NULL,
    billable boolean,
    archived boolean DEFAULT false NOT NULL,
    created_date date,
    modified_date date,
    company_id bigint NOT NULL,
    account_id bigint NOT NULL,
    project_id bigint NOT NULL,
    expense_date date,
    currency character varying(15),
    invoiced boolean DEFAULT false NOT NULL,
    invoice_id bigint
);




--
-- TOC entry 202 (class 1259 OID 10912629)

--

CREATE SEQUENCE public.invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 203 (class 1259 OID 10912631)

--

CREATE TABLE public.invoice (
    id bigint DEFAULT nextval('public.invoice_id_seq'::regclass) NOT NULL,
    name character varying(255),
    status character varying(255) DEFAULT 'DRAFT'::character varying NOT NULL,
    account_id bigint NOT NULL,
    company_id bigint NOT NULL,
    created_by bigint NOT NULL,
    created_date timestamp with time zone NOT NULL,
    updated_date timestamp with time zone NOT NULL,
    archived boolean DEFAULT false,
    account_name character varying(255) NOT NULL,
    start_date date,
    due_date date,
    description character varying(255),
    project_id bigint,
    project_name character varying(255),
    total_amount integer DEFAULT 0
);




--
-- TOC entry 204 (class 1259 OID 10912641)

--

CREATE SEQUENCE public.invoice_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 205 (class 1259 OID 10912643)

--

CREATE TABLE public.invoice_line_item (
    id bigint DEFAULT nextval('public.invoice_item_id_seq'::regclass) NOT NULL,
    type character varying(255),
    created_date timestamp with time zone NOT NULL,
    updated_date timestamp with time zone NOT NULL,
    item_date date,
    archived boolean DEFAULT false,
    hours integer,
    bill_rate integer,
    cost_rate integer,
    note character varying(255),
    amount integer DEFAULT 0 NOT NULL,
    tax integer DEFAULT 0,
    total_amount integer NOT NULL,
    timesheet_id bigint,
    expense_id bigint,
    project_id bigint NOT NULL,
    account_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    company_id bigint NOT NULL
);




--
-- TOC entry 206 (class 1259 OID 10912653)

--

CREATE SEQUENCE public.project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 207 (class 1259 OID 10912655)

--

CREATE TABLE public.project (
    id bigint DEFAULT nextval('public.project_id_seq'::regclass) NOT NULL,
    name character varying(256),
    type character varying(256),
    start_date timestamp(4) with time zone,
    end_date timestamp(4) with time zone,
    total_hours integer,
    billable boolean,
    completion_date date,
    status character varying(256) DEFAULT 'Not Started'::character varying,
    include_weekend boolean,
    description character varying(512),
    percent_completed integer,
    estimated_hours integer,
    global_project boolean,
    completed boolean,
    company_id bigint NOT NULL,
    archived boolean DEFAULT false,
    account_id bigint,
    isglobal boolean DEFAULT false
);




--
-- TOC entry 208 (class 1259 OID 10912664)

--

CREATE SEQUENCE public.project_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 209 (class 1259 OID 10912666)

--

CREATE TABLE public.project_assignment (
    id bigint DEFAULT nextval('public.project_assignment_id_seq'::regclass) NOT NULL,
    company_id bigint NOT NULL,
    account_id bigint NOT NULL,
    user_id bigint NOT NULL,
    project_id bigint NOT NULL,
    created_by bigint,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    bill_rate numeric DEFAULT 0.00,
    cost_rate numeric DEFAULT 0.00,
    user_role character varying(255) NOT NULL
);




--
-- TOC entry 210 (class 1259 OID 10912670)

--

CREATE TABLE public.role (
    name character varying(256) NOT NULL,
    permissions character varying[]
);




--
-- TOC entry 211 (class 1259 OID 10912676)

--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);




--
-- TOC entry 222 (class 1259 OID 12912643)

--

CREATE SEQUENCE public.setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 223 (class 1259 OID 12912645)

--

CREATE TABLE public.setting (
    id bigint DEFAULT nextval('public.setting_id_seq'::regclass) NOT NULL,
    expense_category character varying(255)[] DEFAULT ARRAY[]::character varying[] NOT NULL,
    user_role character varying(255)[] DEFAULT ARRAY[]::character varying[] NOT NULL,
    company_address character varying(255),
    invoice_note character varying(255),
    company_id bigint NOT NULL,
    currency character varying(10)
);




--
-- TOC entry 212 (class 1259 OID 10912682)

--

CREATE SEQUENCE public.task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 213 (class 1259 OID 10912684)

--

CREATE TABLE public.task (
    id bigint DEFAULT nextval('public.task_id_seq'::regclass) NOT NULL,
    project_id bigint,
    name character varying(256),
    type character varying(256),
    start_date date,
    end_date date,
    total_hours integer,
    billable boolean,
    completion_date date,
    status character varying(256) DEFAULT 'Not Started'::character varying,
    include_weekend boolean,
    description character varying(512),
    percent_completed integer,
    estimated_hours integer,
    completed boolean,
    assigned_by_name character varying(255),
    assigned_by_id bigint,
    billable_hours integer,
    milestone character varying(256),
    parent_id integer,
    company_id bigint NOT NULL,
    priority character varying(255) DEFAULT 'Low'::character varying,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    archived boolean DEFAULT false,
    project_name character varying(256)
);




--
-- TOC entry 214 (class 1259 OID 10912694)

--

CREATE SEQUENCE public.task_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 215 (class 1259 OID 10912696)

--

CREATE TABLE public.task_assignment (
    id bigint DEFAULT nextval('public.task_assignment_id_seq'::regclass) NOT NULL,
    company_id bigint NOT NULL,
    project_id bigint,
    user_id bigint,
    created_by bigint,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    account_id bigint,
    task_id bigint NOT NULL,
    user_email character varying(256),
    bill_rate numeric DEFAULT 0.00,
    cost_rate numeric DEFAULT 0.00,
    user_role character varying(255) NOT NULL
);




--
-- TOC entry 216 (class 1259 OID 10912700)

--

CREATE SEQUENCE public.timesheet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 217 (class 1259 OID 10912702)

--

CREATE TABLE public.timesheet (
    id bigint DEFAULT nextval('public.timesheet_id_seq'::regclass) NOT NULL,
    project_id bigint,
    resource_name character varying(256),
    resource_id bigint NOT NULL,
    scheduled_hours integer,
    approval_status boolean,
    total_billable_hours integer,
    total_nonbill_hours integer,
    total_hours integer,
    week_start_date date,
    week_end_date date,
    billable boolean,
    approval_comment character varying(512),
    task_id bigint,
    task_day character varying(64),
    total_timesheet_hours integer,
    total_task_time integer,
    company_id bigint NOT NULL,
    project_name character varying(255),
    task_name character varying(255),
    created_date date,
    last_updated_date date,
    invoiced boolean DEFAULT false NOT NULL,
    status character varying(256) DEFAULT 'SAVED'::character varying NOT NULL,
    invoice_id bigint
);




--
-- TOC entry 218 (class 1259 OID 10912711)

--

CREATE SEQUENCE public.timesheet_entry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 219 (class 1259 OID 10912713)

--

CREATE TABLE public.timesheet_line_item (
    id bigint DEFAULT nextval('public.timesheet_entry_id_seq'::regclass) NOT NULL,
    resource_name character varying(256),
    resource_id bigint NOT NULL,
    project_id bigint,
    task_id bigint NOT NULL,
    created_date date,
    start_time time without time zone,
    end_time time without time zone,
    total_work_hours integer,
    company_id bigint NOT NULL,
    project_name character varying(255),
    task_name character varying(255),
    description text,
    category character varying(255) DEFAULT 'Non Billable'::character varying,
    week_day integer,
    timesheet_id bigint,
    billable boolean DEFAULT false,
    submitted boolean DEFAULT false,
    isrunning boolean DEFAULT false,
    lastruntime time without time zone
);




--
-- TOC entry 220 (class 1259 OID 10912723)

--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- TOC entry 221 (class 1259 OID 10912725)

--

CREATE TABLE public.users (
    id bigint DEFAULT nextval('public.users_id_seq'::regclass) NOT NULL,
    email character varying(256) NOT NULL,
    password character varying(256),
    username character varying(256),
    company_id bigint NOT NULL,
    user_role character varying[] NOT NULL,
    created_date date,
    modified_date date,
    first_name character varying(256),
    last_name character varying(256),
    phone character varying(15),
    mobile character varying(15),
    designation character varying(256),
    archived boolean DEFAULT false NOT NULL,
    password_reset_token character varying(256),
    add_status character varying(256),
    bill_rate numeric DEFAULT 0.00,
    cost_rate numeric DEFAULT 0.00,
    permissions character varying[],
    role character varying(255) DEFAULT 'Developer'::character varying NOT NULL
);

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2606 OID 10912736)

--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_domain_key UNIQUE (domain);


--
-- TOC entry 3700 (class 2606 OID 10912738)

--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- TOC entry 3702 (class 2606 OID 10912740)

--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 10912742)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT invoice_item_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 10912744)

--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 10912746)

--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- TOC entry 3710 (class 2606 OID 10912748)

--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (name);


--
-- TOC entry 3712 (class 2606 OID 10912750)

--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3716 (class 2606 OID 10912752)

--

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT task_assignment_pkey PRIMARY KEY (id);


--
-- TOC entry 3714 (class 2606 OID 10912754)

--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- TOC entry 3720 (class 2606 OID 10912756)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_pkey PRIMARY KEY (id);


--
-- TOC entry 3718 (class 2606 OID 10912758)

--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_pkey PRIMARY KEY (id);


--
-- TOC entry 3722 (class 2606 OID 10912760)

--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 3723 (class 2606 OID 10912761)

--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3760 (class 2606 OID 12913761)

--

ALTER TABLE ONLY public.setting
    ADD CONSTRAINT account_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3727 (class 2606 OID 10912766)

--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_account_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- TOC entry 3726 (class 2606 OID 10912771)

--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3725 (class 2606 OID 10912776)

--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 3724 (class 2606 OID 10912781)

--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3742 (class 2606 OID 10912786)

--

ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- TOC entry 3730 (class 2606 OID 10912791)

--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- TOC entry 3736 (class 2606 OID 10912796)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- TOC entry 3741 (class 2606 OID 10912801)

--

ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3729 (class 2606 OID 10912806)

--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3735 (class 2606 OID 10912811)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3749 (class 2606 OID 10912816)

--

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3734 (class 2606 OID 10912821)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_expense_id FOREIGN KEY (expense_id) REFERENCES public.expense(id);


--
-- TOC entry 3733 (class 2606 OID 10912826)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 3740 (class 2606 OID 10912831)

--

ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3732 (class 2606 OID 10912836)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3748 (class 2606 OID 10912841)

--

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3747 (class 2606 OID 10912846)

--

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES public.task(id);


--
-- TOC entry 3731 (class 2606 OID 10912851)

--

ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_timesheet_id FOREIGN KEY (timesheet_id) REFERENCES public.timesheet(id);


--
-- TOC entry 3739 (class 2606 OID 10912856)

--

ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3746 (class 2606 OID 10912861)

--

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3728 (class 2606 OID 10912866)

--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3745 (class 2606 OID 10912871)

--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT parent_task_fkey FOREIGN KEY (parent_id) REFERENCES public.task(id);


--
-- TOC entry 3738 (class 2606 OID 10912876)

--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_account_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- TOC entry 3737 (class 2606 OID 10912881)

--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3744 (class 2606 OID 10912886)

--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3743 (class 2606 OID 10912891)

--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3753 (class 2606 OID 10912896)

--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3758 (class 2606 OID 10912901)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- TOC entry 3757 (class 2606 OID 10912906)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3756 (class 2606 OID 10912911)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_task_fkey FOREIGN KEY (task_id) REFERENCES public.task(id);


--
-- TOC entry 3755 (class 2606 OID 10912916)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_timesheet_fkey FOREIGN KEY (timesheet_id) REFERENCES public.timesheet(id);


--
-- TOC entry 3754 (class 2606 OID 10912921)

--

ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_user_fkey FOREIGN KEY (resource_id) REFERENCES public.users(id);


--
-- TOC entry 3752 (class 2606 OID 10912926)

--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);


--
-- TOC entry 3751 (class 2606 OID 10912931)

--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- TOC entry 3750 (class 2606 OID 10912936)

--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_user_fkey FOREIGN KEY (resource_id) REFERENCES public.users(id);


--
-- TOC entry 3759 (class 2606 OID 10912941)

--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



INSERT INTO public.role(name, permissions) VALUES ('SUPER_ADMIN', '{"ALL"}');
INSERT INTO public.role(name, permissions) VALUES ('ADMIN', '{"ACCOUNT","PROJECT","TASK","TIMESHEET","INVOICE","EXPENSE"}');
INSERT INTO public.role(name, permissions) VALUES ('USER', '{"PROJECT","TASK","TIMESHEET"}');

INSERT INTO public.company(id, name, domain, add_status,created_date,modified_date) VALUES (999999999999999, 'Krow Softwares', 'krowsoftware.krow.com', 'Approved',current_timestamp,current_timestamp);
INSERT INTO public.users(id, email, password, username, company_id, user_role,add_status, role,created_date,modified_date) VALUES (9999999999999990, 'admin@krowsoftware.com', 'admin', 'admin@krowsoftware.com', 999999999999999 , '{"SUPER_ADMIN"}', 'Approved', 'SUPER_ADMIN',current_timestamp,current_timestamp);
Insert into public.setting (expense_category,user_role,company_address,invoice_note,currency,timezone,company_id) values(array['Food'],array['Manager','Developer'],'','','USD','America/Los_Angeles',999999999999999)


--12-09-2018
ALTER TABLE setting ADD COLUMN timezone CHARACTER VARYING(255);
ALTER TABLE timesheet RENAME COLUMN resource_name TO user_role;

--13-09-2018
ALTER TABLE expense ADD COLUMN total_amount CHARACTER VARYING(255);
ALTER TABLE expense RENAME COLUMN tax_no TO tax_amount;
ALTER TABLE invoice_line_item RENAME COLUMN total_hours TO quantity;
ALTER TABLE invoice_line_item RENAME COLUMN bill_rate TO unit_price;
ALTER TABLE expense ADD COLUMN user_id bigint Not NULL;
ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE project ADD COLUMN project_cost CHARACTER VARYING(255);

ALTER TABLE setting alter column invoice_note type character varying(5500);
ALTER TABLE account ADD COLUMN currency CHARACTER VARYING(15) NOT NULL DEFAULT 'USD';
ALTER TABLE invoice ADD COLUMN currency CHARACTER VARYING(15) NOT NULL DEFAULT 'USD';

-- 15-09-2018(Ajay)
-- need to truncate the data
TRUNCATE TABLE public.invoice_line_item;
TRUNCATE TABLE public.invoice CASCADE;
TRUNCATE TABLE public.timesheet_line_item;
TRUNCATE TABLE public.timesheet CASCADE;
TRUNCATE TABLE public.expense CASCADE;
TRUNCATE TABLE public.task CASCADE;
TRUNCATE TABLE public.task_assignment;
TRUNCATE TABLE public.project CASCADE;
TRUNCATE TABLE public.project_assignment;
TRUNCATE TABLE public.account CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.company CASCADE;
TRUNCATE TABLE public.setting;
TRUNCATE TABLE public.session;
-- delete name columns from invoice and expense
ALTER TABLE expense DROP COLUMN IF EXISTS name;
ALTER TABLE invoice DROP COLUMN IF EXISTS name;

-- add record_id columns
ALTER TABLE invoice_line_item ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE invoice ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE timesheet_line_item ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE timesheet ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE expense ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE task ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE task_assignment ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE project ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE project_assignment ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE users ADD COLUMN record_id VARCHAR NOT NULL;
ALTER TABLE account ADD COLUMN record_id VARCHAR NOT NULL;


--- ---------------------------------
CREATE OR REPLACE FUNCTION make_seq_for_company() RETURNS TRIGGER AS $generate_domain_sequences$
DECLARE
	sql1 varchar := 'CREATE SEQUENCE seq_account_' || NEW.id;
	sql2 varchar := 'CREATE SEQUENCE seq_expense_' || NEW.id;
	sql3 varchar := 'CREATE SEQUENCE seq_invoice_' || NEW.id;
	sql4 varchar := 'CREATE SEQUENCE seq_invoiceline_' || NEW.id;
	sql5 varchar := 'CREATE SEQUENCE seq_project_' || NEW.id;
	sql6 varchar := 'CREATE SEQUENCE seq_projectassignment_' || NEW.id;
	sql7 varchar := 'CREATE SEQUENCE seq_task_' || NEW.id;
	sql8 varchar := 'CREATE SEQUENCE seq_taskassignment_' || NEW.id;
	sql9 varchar := 'CREATE SEQUENCE seq_timesheet_' || NEW.id;
	sql10 varchar := 'CREATE SEQUENCE seq_timesheetline_' || NEW.id;
	sql11 varchar := 'CREATE SEQUENCE seq_user_' || NEW.id;

BEGIN
	EXECUTE sql1;
	EXECUTE sql2;
	EXECUTE sql3;
	EXECUTE sql4;
	EXECUTE sql5;
	EXECUTE sql6;
	EXECUTE sql7;
	EXECUTE sql8;
	EXECUTE sql9;
	EXECUTE sql10;
	EXECUTE sql11;
	return NEW;
END;
$generate_domain_sequences$ LANGUAGE plpgsql;


CREATE TRIGGER generate_domain_sequences
AFTER INSERT
ON company
FOR EACH ROW
EXECUTE PROCEDURE make_seq_for_company();

-------------------------------------------

CREATE OR REPLACE FUNCTION create_account_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_account$
BEGIN
	NEW.record_id := 'ACC' || lpad(nextval('seq_account_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_account$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_account
    BEFORE INSERT
    ON account
    FOR EACH ROW
    EXECUTE PROCEDURE create_account_recordid();

-----------------------------------------------

CREATE OR REPLACE FUNCTION create_expense_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_expense$
BEGIN
	NEW.record_id := 'EXP' || lpad(nextval('seq_expense_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_expense$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_expense
    BEFORE INSERT
    ON expense
    FOR EACH ROW
    EXECUTE PROCEDURE create_expense_recordid();


-----------------------------------------------

CREATE OR REPLACE FUNCTION create_invoice_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_invoice$
BEGIN
	NEW.record_id := 'INV' || lpad(nextval('seq_invoice_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_invoice$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_invoice
    BEFORE INSERT
    ON invoice
    FOR EACH ROW
    EXECUTE PROCEDURE create_invoice_recordid();

-----------------------------------------------


CREATE OR REPLACE FUNCTION create_invoiceline_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_invoiceline$
BEGIN
	NEW.record_id := 'ILI' || lpad(nextval('seq_invoiceline_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_invoiceline$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_invoiceline
    BEFORE INSERT
    ON invoice_line_item
    FOR EACH ROW
    EXECUTE PROCEDURE create_invoiceline_recordid();

-----------------------------------------------

CREATE OR REPLACE FUNCTION create_project_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_project$
BEGIN
	NEW.record_id := 'PRO' || lpad(nextval('seq_project_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_project$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_project
    BEFORE INSERT
    ON project
    FOR EACH ROW
    EXECUTE PROCEDURE create_project_recordid();

-----------------------------------------------


CREATE OR REPLACE FUNCTION create_projectassignment_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_projectassignment$
BEGIN
	NEW.record_id := 'PAS' || lpad(nextval('seq_projectassignment_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_projectassignment$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_projectassignment
    BEFORE INSERT
    ON project_assignment
    FOR EACH ROW
    EXECUTE PROCEDURE create_projectassignment_recordid();

-----------------------------------------------


CREATE OR REPLACE FUNCTION create_task_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_task$
BEGIN
	NEW.record_id := 'TSK' || lpad(nextval('seq_task_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_task$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_task
    BEFORE INSERT
    ON task
    FOR EACH ROW
    EXECUTE PROCEDURE create_task_recordid();
-----------------------------------------------


CREATE OR REPLACE FUNCTION create_taskassignment_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_taskassignment$
BEGIN
	NEW.record_id := 'TAS' || lpad(nextval('seq_taskassignment_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_taskassignment$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_taskassignment
    BEFORE INSERT
    ON task_assignment
    FOR EACH ROW
    EXECUTE PROCEDURE create_taskassignment_recordid();


-----------------------------------------------


CREATE OR REPLACE FUNCTION create_timesheet_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_timesheet$
BEGIN
	NEW.record_id := 'TIM' || lpad(nextval('seq_timesheet_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_timesheet$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_timesheet
    BEFORE INSERT
    ON timesheet
    FOR EACH ROW
    EXECUTE PROCEDURE create_timesheet_recordid();

-----------------------------------------------


CREATE OR REPLACE FUNCTION create_timesheetline_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_timesheetline$
BEGIN
	NEW.record_id := 'TLI' || lpad(nextval('seq_timesheetline_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_timesheetline$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_timesheetline
    BEFORE INSERT
    ON timesheet_line_item
    FOR EACH ROW
    EXECUTE PROCEDURE create_timesheetline_recordid();

-----------------------------------------------

CREATE OR REPLACE FUNCTION create_users_recordid()
	RETURNS TRIGGER AS $generate_domain_specific_recordid_for_users$
BEGIN
	NEW.record_id := 'USR' || lpad(nextval('seq_user_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$generate_domain_specific_recordid_for_users$ LANGUAGE plpgsql;

CREATE TRIGGER generate_domain_specific_recordid_for_users
    BEFORE INSERT
    ON users
    FOR EACH ROW
    EXECUTE PROCEDURE create_users_recordid();
-----------------------------------------------


-----16-09-2018
alter table setting add column company_logo bytea;

-- 18-09-2018
alter table invoice add column tax numeric DEFAULT 0;

---19-09-2018
alter table invoice_line_item add column currency character varying(15);
alter table setting add column street character varying(256),
    add column city character varying(256),
    add column state character varying(256),
    add column country character varying(256),
    add column zip_code character varying(15);
ALTER TABLE task RENAME COLUMN assigned_by_id TO assigned_user_id;

--20-09-2018
alter table invoice alter column total_amount type Numeric(10,2)
ALTER TABLE invoice_line_item ADD COLUMN timesheet_row_id character varying[];

---24-09-2018
alter table setting add column contenttype character varying(255)
alter table users add column user_img bytea;
alter table users add column contenttype character varying(255)

-- 25-08-2018
alter table timesheet_line_item add column invoice_id bigint;
ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);
alter table invoice alter column tax set default 0;
alter table project_assignment alter column account_id drop Not null;