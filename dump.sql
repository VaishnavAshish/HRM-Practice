SET TIMEZONE TO 'UTC';
CREATE FUNCTION public.create_account_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'ACC' || lpad(nextval('seq_account_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_expense_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'EXP' || lpad(nextval('seq_expense_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_invoice_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'INV' || lpad(nextval('seq_invoice_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_invoiceline_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'ILI' || lpad(nextval('seq_invoiceline_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_project_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'PRO' || lpad(nextval('seq_project_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_projectassignment_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'PAS' || lpad(nextval('seq_projectassignment_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_task_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'TSK' || lpad(nextval('seq_task_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_taskassignment_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'TAS' || lpad(nextval('seq_taskassignment_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_timesheet_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'TIM' || lpad(nextval('seq_timesheet_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_timesheetline_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'TLI' || lpad(nextval('seq_timesheetline_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.create_users_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.record_id := 'USR' || lpad(nextval('seq_user_' || NEW.company_id)::varchar, 8, '0');
	RETURN NEW;
END;
$$;


CREATE FUNCTION public.make_seq_for_company() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


CREATE SEQUENCE public.account_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_with_oids = false;


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
    zip_code character varying(15),
    record_id character varying NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL
);


CREATE SEQUENCE public.company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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


CREATE SEQUENCE public.expense_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.expense (
    id bigint DEFAULT nextval('public.expense_id_seq'::regclass) NOT NULL,
    tax character varying(256),
    tax_amount character varying(256),
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
    invoice_id bigint,
    total_amount character varying(255),
    user_id bigint NOT NULL,
    record_id character varying NOT NULL
);


CREATE SEQUENCE public.invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.invoice (
    id bigint DEFAULT nextval('public.invoice_id_seq'::regclass) NOT NULL,
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
    total_amount numeric(10,2) DEFAULT 0,
    record_id character varying NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    tax numeric(15,0) DEFAULT 0
);


CREATE SEQUENCE public.invoice_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.invoice_line_item (
    id bigint DEFAULT nextval('public.invoice_item_id_seq'::regclass) NOT NULL,
    type character varying(255),
    created_date timestamp with time zone NOT NULL,
    updated_date timestamp with time zone NOT NULL,
    item_date date,
    archived boolean DEFAULT false,
    hours integer,
    unit_price numeric(50,0),
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
    company_id bigint NOT NULL,
    user_id bigint,
    user_role character varying(255),
    quantity integer,
    record_id character varying NOT NULL,
    currency character varying(15),
    timesheet_row_id character varying[]
);


CREATE SEQUENCE public.project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



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
    isglobal boolean DEFAULT false,
    project_cost character varying(255),
    record_id character varying NOT NULL
);


CREATE SEQUENCE public.project_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.project_assignment (
    id bigint DEFAULT nextval('public.project_assignment_id_seq'::regclass) NOT NULL,
    company_id bigint NOT NULL,
    account_id bigint,
    user_id bigint NOT NULL,
    project_id bigint NOT NULL,
    created_by bigint,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    bill_rate numeric DEFAULT 0.00,
    cost_rate numeric DEFAULT 0.00,
    user_role character varying(255) NOT NULL,
    record_id character varying NOT NULL
);


CREATE TABLE public.role (
    name character varying(256) NOT NULL,
    permissions character varying[]
);


CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


CREATE SEQUENCE public.setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.setting (
    id bigint DEFAULT nextval('public.setting_id_seq'::regclass) NOT NULL,
    expense_category character varying(255)[] DEFAULT ARRAY[]::character varying[] NOT NULL,
    user_role character varying(255)[] DEFAULT ARRAY[]::character varying[] NOT NULL,
    company_address character varying(255),
    invoice_note character varying(5500),
    company_id bigint NOT NULL,
    currency character varying(10),
    timezone character varying(255),
    company_logo bytea,
    street character varying(256),
    city character varying(256),
    state character varying(256),
    country character varying(256),
    zip_code character varying(15),
    contenttype character varying(255)
);


CREATE SEQUENCE public.task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
    assigned_user_id bigint,
    billable_hours integer,
    milestone character varying(256),
    parent_id integer,
    company_id bigint NOT NULL,
    priority character varying(255) DEFAULT 'Low'::character varying,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    archived boolean DEFAULT false,
    project_name character varying(256),
    record_id character varying NOT NULL
);


CREATE SEQUENCE public.task_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
    user_role character varying(255) NOT NULL,
    record_id character varying NOT NULL
);


CREATE SEQUENCE public.timesheet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.timesheet (
    id bigint DEFAULT nextval('public.timesheet_id_seq'::regclass) NOT NULL,
    project_id bigint,
    user_role character varying(256),
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
    invoice_id bigint,
    record_id character varying NOT NULL
);


CREATE SEQUENCE public.timesheet_entry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
    lastruntime time without time zone,
    user_role character varying(255) NOT NULL,
    invoiced boolean DEFAULT false,
    record_id character varying NOT NULL,
    invoice_id bigint
);


CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
    permissions character varying[] DEFAULT '{}'::character varying[],
    role character varying(255) DEFAULT 'Developer'::character varying NOT NULL,
    record_id character varying NOT NULL,
    user_img bytea,
    contenttype character varying(255)
);


ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_domain_key UNIQUE (domain);


ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT invoice_item_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (name);


ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);

ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT task_assignment_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);



CREATE TRIGGER generate_domain_sequences AFTER INSERT ON public.company FOR EACH ROW EXECUTE PROCEDURE public.make_seq_for_company();



CREATE TRIGGER generate_domain_specific_recordid_for_account BEFORE INSERT ON public.account FOR EACH ROW EXECUTE PROCEDURE public.create_account_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_expense BEFORE INSERT ON public.expense FOR EACH ROW EXECUTE PROCEDURE public.create_expense_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_invoice BEFORE INSERT ON public.invoice FOR EACH ROW EXECUTE PROCEDURE public.create_invoice_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_invoiceline BEFORE INSERT ON public.invoice_line_item FOR EACH ROW EXECUTE PROCEDURE public.create_invoiceline_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_project BEFORE INSERT ON public.project FOR EACH ROW EXECUTE PROCEDURE public.create_project_recordid();

CREATE TRIGGER generate_domain_specific_recordid_for_projectassignment BEFORE INSERT ON public.project_assignment FOR EACH ROW EXECUTE PROCEDURE public.create_projectassignment_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_task BEFORE INSERT ON public.task FOR EACH ROW EXECUTE PROCEDURE public.create_task_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_taskassignment BEFORE INSERT ON public.task_assignment FOR EACH ROW EXECUTE PROCEDURE public.create_taskassignment_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_timesheet BEFORE INSERT ON public.timesheet FOR EACH ROW EXECUTE PROCEDURE public.create_timesheet_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_timesheetline BEFORE INSERT ON public.timesheet_line_item FOR EACH ROW EXECUTE PROCEDURE public.create_timesheetline_recordid();



CREATE TRIGGER generate_domain_specific_recordid_for_users BEFORE INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE public.create_users_recordid();



ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.setting
    ADD CONSTRAINT account_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_account_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);



ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);



ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);



ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(id);



ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_expense_id FOREIGN KEY (expense_id) REFERENCES public.expense(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);



ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES public.task(id);



ALTER TABLE ONLY public.invoice_line_item
    ADD CONSTRAINT fk_timesheet_id FOREIGN KEY (timesheet_id) REFERENCES public.timesheet(id);



ALTER TABLE ONLY public.project_assignment
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.task_assignment
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);



ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.task
    ADD CONSTRAINT parent_task_fkey FOREIGN KEY (parent_id) REFERENCES public.task(id);



ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_account_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);



ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_task_fkey FOREIGN KEY (task_id) REFERENCES public.task(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_timesheet_fkey FOREIGN KEY (timesheet_id) REFERENCES public.timesheet(id);



ALTER TABLE ONLY public.timesheet_line_item
    ADD CONSTRAINT timesheet_entry_user_fkey FOREIGN KEY (resource_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(id);



ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);



ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_user_fkey FOREIGN KEY (resource_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_company_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);



INSERT INTO public.role(name, permissions) VALUES ('SUPER_ADMIN', '{"ALL"}');
INSERT INTO public.role(name, permissions) VALUES ('ADMIN', '{"ACCOUNT","PROJECT","TASK","TIMESHEET","INVOICE","EXPENSE"}');
INSERT INTO public.role(name, permissions) VALUES ('USER', '{"PROJECT","TASK","TIMESHEET"}');

INSERT INTO public.company(id, name, domain, add_status,created_date,modified_date) VALUES (999999999999999, 'Krow Softwares', 'krowsoftware.krow.com', 'Approved',current_timestamp,current_timestamp);
INSERT INTO public.users(id, email, password, username, company_id, user_role,add_status, role,created_date,modified_date) VALUES (9999999999999990, 'admin@krowsoftware.com', 'admin', 'admin@krowsoftware.com', 999999999999999 , '{"SUPER_ADMIN"}', 'Approved', 'SUPER_ADMIN',current_timestamp,current_timestamp);
Insert into public.setting (expense_category,user_role,company_address,invoice_note,currency,timezone,company_id) values(array['Food'],array['Manager','Developer'],'','','USD','America/Los_Angeles',999999999999999)


--created-date 03-04-2019
CREATE OR REPLACE FUNCTION calculate_total_timesheet_hours()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  total_hours_cal INTEGER;
BEGIN

 IF TG_OP = 'DELETE' THEN
	SELECT INTO total_hours_cal SUM(total_work_hours) FROM timesheet_line_item WHERE project_id = OLD.project_id;
	RAISE NOTICE 'total_hours(%)', total_hours_cal;
  IF total_hours_cal IS NULL THEN
	 UPDATE PROJECT SET total_hours = 0 WHERE id = OLD.project_id;
  ELSE
   UPDATE PROJECT SET total_hours = total_hours_cal WHERE id = OLD.project_id;
  END IF;
 ELSE
	SELECT INTO total_hours_cal SUM(total_work_hours) FROM timesheet_line_item WHERE project_id = NEW.project_id;
	RAISE NOTICE 'total_hours(%)', total_hours_cal;
  IF total_hours_cal IS NULL THEN
	 UPDATE PROJECT SET total_hours = 0 WHERE id = NEW.project_id;
  ELSE
   UPDATE PROJECT SET total_hours = total_hours_cal WHERE id = NEW.project_id;
  END IF;
 END IF;

 RETURN NEW;
END;
$BODY$

CREATE TRIGGER update_project_total_hours
    AFTER INSERT OR UPDATE OR DELETE
    ON timesheet_line_item
    FOR EACH ROW
    EXECUTE PROCEDURE calculate_total_timesheet_hours();

--created-date 04-04-2019

CREATE OR REPLACE FUNCTION calculate_total_expense_amount()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  total_expense_cal FLOAT;
BEGIN

 IF TG_OP = 'DELETE' THEN
	SELECT INTO total_expense_cal SUM(total_amount) FROM expense WHERE project_id = OLD.project_id AND archived = false;
	RAISE NOTICE 'total_expense_amount(%)', total_expense_cal;
  IF total_expense_cal IS NULL THEN
    UPDATE PROJECT SET total_expense_amount = 0 WHERE id = OLD.project_id;
  ELSE
    UPDATE PROJECT SET total_expense_amount = total_expense_cal WHERE id = OLD.project_id;
  END IF;
 ELSE
	SELECT INTO total_expense_cal SUM(total_amount) FROM expense WHERE project_id = NEW.project_id AND archived = false;
	RAISE NOTICE 'total_expense_amount(%)', total_expense_cal;
  IF total_expense_cal IS NULL THEN
    UPDATE PROJECT SET total_expense_amount = 0 WHERE id = NEW.project_id;
  ELSE
    UPDATE PROJECT SET total_expense_amount = total_expense_cal WHERE id = NEW.project_id;
  END IF;
 END IF;

 RETURN NEW;
END;
$BODY$

CREATE TRIGGER update_project_total_expense
AFTER INSERT OR UPDATE OR DELETE
ON expense
FOR EACH ROW
EXECUTE PROCEDURE calculate_total_expense_amount();

CREATE OR REPLACE FUNCTION calculate_total_invoice_amount()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  total_amount_cal FLOAT;
BEGIN

 IF TG_OP = 'DELETE' THEN
 	IF OLD.project_id IS NOT NULL THEN
		SELECT INTO total_amount_cal SUM(total_amount) FROM invoice_line_item WHERE project_id = OLD.project_id;
		RAISE NOTICE 'total_amount_cal(%)', total_amount_cal;
		IF total_amount_cal IS NULL THEN
			UPDATE PROJECT SET total_invoice_amount = 0 WHERE id = OLD.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_amount = total_amount_cal WHERE id = OLD.project_id;
		END IF;
	END IF;
 ELSE
 	IF NEW.project_id IS NOT NULL THEN
		SELECT INTO total_amount_cal SUM(total_amount) FROM invoice_line_item WHERE project_id = NEW.project_id;
		RAISE NOTICE 'total_amount_cal(%)', total_amount_cal;
		IF total_amount_cal IS NULL THEN
			UPDATE PROJECT SET total_invoice_amount = 0 WHERE id = NEW.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_amount = total_amount_cal WHERE id = NEW.project_id;
		END IF;
	END IF;
 END IF;

 RETURN NEW;
END;
$BODY$


CREATE TRIGGER update_project_total_invoice_amount
AFTER INSERT OR DELETE
ON invoice_line_item
FOR EACH ROW
EXECUTE PROCEDURE calculate_total_invoice_amount();

CREATE OR REPLACE FUNCTION calculate_total_invoice_data()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  total_hours_cal INTEGER;
  total_expense_invoice FLOAT;
BEGIN

 IF TG_OP = 'DELETE' THEN
 	IF OLD.project_id IS NOT NULL AND OLD.timesheet_id IS NOT NULL THEN
		SELECT INTO total_hours_cal SUM(quantity) FROM invoice_line_item WHERE project_id = OLD.project_id AND timesheet_id IS NOT NULL;
		RAISE NOTICE 'total_hours_cal(%)', total_hours_cal;
		IF total_hours_cal IS NULL THEN
			UPDATE PROJECT SET total_invoice_time = 0 WHERE id = OLD.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_time = total_hours_cal WHERE id = OLD.project_id;
		END IF;
	ELSEIF OLD.project_id IS NOT NULL AND OLD.expense_id IS NOT NULL THEN
		SELECT INTO total_expense_invoice SUM(unit_price) FROM invoice_line_item WHERE project_id = OLD.project_id AND expense_id IS NOT NULL;
		RAISE NOTICE 'total_expense_invoice(%)', total_expense_invoice;
		IF total_expense_invoice IS NULL THEN
			UPDATE PROJECT SET total_invoice_expense = 0 WHERE id = OLD.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_expense = total_expense_invoice WHERE id = OLD.project_id;
		END IF;
	END IF;
 ELSE
 	IF NEW.project_id IS NOT NULL AND NEW.timesheet_id IS NOT NULL THEN
		SELECT INTO total_hours_cal SUM(quantity) FROM invoice_line_item WHERE project_id = NEW.project_id AND timesheet_id IS NOT NULL;
		RAISE NOTICE 'total_hours_cal(%)', total_hours_cal;
		IF total_hours_cal IS NULL THEN
			UPDATE PROJECT SET total_invoice_time = 0 WHERE id = NEW.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_time = total_hours_cal WHERE id = NEW.project_id;
		END IF;
	ELSEIF NEW.project_id IS NOT NULL AND NEW.expense_id IS NOT NULL THEN
		SELECT INTO total_expense_invoice SUM(unit_price) FROM invoice_line_item WHERE project_id = NEW.project_id AND expense_id IS NOT NULL;
		RAISE NOTICE 'total_expense_invoice(%)', total_expense_invoice;
		IF total_expense_invoice IS NULL THEN
			UPDATE PROJECT SET total_invoice_expense = 0 WHERE id = NEW.project_id;
		ELSE
			UPDATE PROJECT SET total_invoice_expense = total_expense_invoice WHERE id = NEW.project_id;
		END IF;
	END IF;
 END IF;

 RETURN NEW;
END;
$BODY$

-- 08-04-2019 --
CREATE TRIGGER update_project_total_invoice_data
  AFTER INSERT OR DELETE
  ON invoice_line_item
  FOR EACH ROW
  EXECUTE PROCEDURE calculate_total_invoice_data();


CREATE OR REPLACE FUNCTION calculate_invoice_final_amount()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  taxable_amount FLOAT;
  final_amount_cal FLOAT;
  tax_per FLOAT;
  total_amount_cal FLOAT;
BEGIN

 IF TG_OP = 'DELETE' THEN
 	IF OLD.invoice_id IS NOT NULL THEN
		SELECT tax INTO tax_per  FROM invoice WHERE id = OLD.invoice_id;
		SELECT total_amount INTO total_amount_cal  FROM invoice WHERE id = OLD.invoice_id;

		IF tax_per>0 THEN
			SELECT INTO taxable_amount SUM(total_amount) FROM invoice_line_item WHERE invoice_id = OLD.invoice_id AND expense_id IS null;
			RAISE NOTICE 'taxable_amount(%)', taxable_amount;
			IF taxable_amount IS NOT NULL THEN
				SELECT INTO final_amount_cal total_amount-OLD.total_amount+(taxable_amount*tax_per/100) FROM invoice WHERE id = OLD.invoice_id;
			ELSE
				SELECT INTO final_amount_cal total_amount-OLD.total_amount FROM invoice WHERE id = OLD.invoice_id;
				RAISE NOTICE 'non_taxable_amount(%)', final_amount_cal;
			END IF;
			RAISE NOTICE 'final_amount_cal(%)', final_amount_cal;
			IF final_amount_cal IS NULL THEN
				UPDATE INVOICE SET final_amount = 0.00 WHERE id = OLD.invoice_id;
			ELSE
				UPDATE INVOICE SET final_amount = final_amount_cal WHERE id = OLD.invoice_id;
			END IF;
		ELSE
			UPDATE INVOICE SET final_amount = total_amount_cal-OLD.total_amount WHERE id = OLD.invoice_id;
		END IF;
	END IF;
 ELSE
 	IF NEW.invoice_id IS NOT NULL THEN
		SELECT tax INTO tax_per  FROM invoice WHERE id = NEW.invoice_id;
		SELECT total_amount INTO total_amount_cal  FROM invoice WHERE id = NEW.invoice_id;
		RAISE NOTICE 'tax_per(%)', tax_per;
		RAISE NOTICE 'total_amount_cal(%)', total_amount_cal;
			IF tax_per>0 THEN

				SELECT INTO taxable_amount SUM(total_amount) FROM invoice_line_item WHERE invoice_id = NEW.invoice_id AND expense_id IS null;
				RAISE NOTICE 'taxable_amount(%)', taxable_amount;
				IF taxable_amount IS NOT NULL THEN
					SELECT INTO final_amount_cal total_amount+NEW.total_amount+(taxable_amount*tax_per/100) FROM invoice WHERE id = NEW.invoice_id;
				ELSE
					SELECT INTO final_amount_cal total_amount+NEW.total_amount FROM invoice WHERE id = NEW.invoice_id;
					RAISE NOTICE 'non_taxable_amount(%)', final_amount_cal;
				END IF;
				RAISE NOTICE 'final_amount_cal(%)', final_amount_cal;
				IF final_amount_cal IS NULL THEN
					UPDATE INVOICE SET final_amount = 0.00 WHERE id = NEW.invoice_id;
				ELSE
					UPDATE INVOICE SET final_amount = final_amount_cal WHERE id = NEW.invoice_id;
				END IF;
			ELSE

				UPDATE INVOICE SET final_amount = total_amount_cal+NEW.total_amount WHERE id = NEW.invoice_id;
			END IF;
	END IF;
 END IF;

 RETURN NEW;
END;
$BODY$


CREATE TRIGGER update_invoice_final_amount
AFTER INSERT OR DELETE
ON invoice_line_item
FOR EACH ROW
EXECUTE PROCEDURE calculate_invoice_final_amount();



CREATE OR REPLACE FUNCTION calculate_invoice_tax_amount()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  taxable_amount FLOAT;
  final_amount_cal FLOAT;
BEGIN
	RAISE NOTICE 'OLD.tax(%)', OLD.tax;
	RAISE NOTICE 'NEW.tax(%)', NEW.tax;
	IF OLD.tax <> NEW.tax THEN

		SELECT INTO taxable_amount SUM(total_amount) FROM invoice_line_item WHERE invoice_id = NEW.id AND expense_id IS null;
    RAISE NOTICE 'taxable_amount(%)', taxable_amount;
		IF taxable_amount IS NOT NULL THEN
        	SELECT INTO final_amount_cal total_amount+(taxable_amount*tax/100) FROM invoice WHERE id = NEW.id;
      	ELSE
          SELECT INTO final_amount_cal total_amount FROM invoice WHERE id = NEW.id;
		END IF;
    RAISE NOTICE 'final_amount_cal(%)', final_amount_cal;
		UPDATE INVOICE SET final_amount = final_amount_cal WHERE id = NEW.id;
  	END IF;
 RETURN NEW;
END;
$BODY$

CREATE TRIGGER update_invoice_tax_amount
AFTER UPDATE
ON invoice
FOR EACH ROW
EXECUTE PROCEDURE calculate_invoice_tax_amount();

--date-07-05-2019

CREATE OR REPLACE FUNCTION change_invoice_sequence_number()
  RETURNS trigger LANGUAGE plpgsql AS
$BODY$
DECLARE
  	invoice_start_number INT;
BEGIN
	IF NEW.invoice_starting_number <> OLD.invoice_starting_number THEN
		RAISE NOTICE 'invoice_starting_number(%)', NEW.invoice_starting_number;
		RAISE NOTICE 'company_id(%)', OLD.company_id;
		SELECT INTO invoice_start_number setval('seq_invoice_'||OLD.company_id, NEW.invoice_starting_number, TRUE);

  	END IF;
 RETURN NEW;
END;
$BODY$

CREATE TRIGGER update_invoice_seq_number
AFTER UPDATE
ON setting
FOR EACH ROW
EXECUTE PROCEDURE change_invoice_sequence_number();

--update project record id for global project
CREATE OR REPLACE FUNCTION public.create_project_recordid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	IF (NEW.isGlobal = TRUE AND NEW.name = 'global project') THEN
		NEW.record_id := rpad('PROGP',11, '9');
	ELSE
		NEW.record_id := 'PRO' || lpad(nextval('seq_project_' || NEW.company_id)::varchar, 8, '0');
	END IF;
	RETURN NEW;
END;
$$;
