--
-- PostgreSQL database dump
--

\restrict wzAJDHwnJiVCM6iP77mrGRQ0eF2p7AhPye655z2jSXAsEH3Co7TBnGHHjCTcsTx

-- Dumped from database version 15.17 (Homebrew)
-- Dumped by pg_dump version 15.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: amazon_orders; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.amazon_orders (
    id integer NOT NULL,
    order_tag text DEFAULT ''::text NOT NULL,
    asin text DEFAULT ''::text NOT NULL,
    product_title text DEFAULT ''::text NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    seller_name text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'ordered'::text NOT NULL,
    ordered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.amazon_orders OWNER TO david;

--
-- Name: amazon_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.amazon_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.amazon_orders_id_seq OWNER TO david;

--
-- Name: amazon_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.amazon_orders_id_seq OWNED BY public.amazon_orders.id;


--
-- Name: amazon_products; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.amazon_products (
    id integer NOT NULL,
    asin text,
    title text DEFAULT ''::text NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    model_number text DEFAULT ''::text NOT NULL,
    part_number text DEFAULT ''::text NOT NULL,
    ppu numeric(10,2) DEFAULT 0 NOT NULL,
    seller_name text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    product_url text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.amazon_products OWNER TO david;

--
-- Name: amazon_products_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.amazon_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.amazon_products_id_seq OWNER TO david;

--
-- Name: amazon_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.amazon_products_id_seq OWNED BY public.amazon_products.id;


--
-- Name: blocked; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.blocked (
    id integer NOT NULL,
    date text NOT NULL,
    "time" text NOT NULL,
    reason text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.blocked OWNER TO david;

--
-- Name: blocked_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.blocked_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blocked_id_seq OWNER TO david;

--
-- Name: blocked_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.blocked_id_seq OWNED BY public.blocked.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    date text NOT NULL,
    "time" text NOT NULL,
    duration integer DEFAULT 1 NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    service text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    price text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    customer_id integer
);


ALTER TABLE public.bookings OWNER TO david;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bookings_id_seq OWNER TO david;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    referral_source text DEFAULT ''::text NOT NULL,
    email_list boolean DEFAULT false NOT NULL
);


ALTER TABLE public.customers OWNER TO david;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO david;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discounts; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.discounts (
    id integer NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    percent integer NOT NULL,
    auto_apply boolean DEFAULT false NOT NULL,
    min_services integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.discounts OWNER TO david;

--
-- Name: discounts_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.discounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.discounts_id_seq OWNER TO david;

--
-- Name: discounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.discounts_id_seq OWNED BY public.discounts.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    date date NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.expenses OWNER TO david;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expenses_id_seq OWNER TO david;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.gallery_items (
    id integer NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'house'::text NOT NULL,
    before_image text DEFAULT ''::text NOT NULL,
    after_image text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    before_url text DEFAULT ''::text NOT NULL,
    after_url text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.gallery_items OWNER TO david;

--
-- Name: gallery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.gallery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gallery_items_id_seq OWNER TO david;

--
-- Name: gallery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.gallery_items_id_seq OWNED BY public.gallery_items.id;


--
-- Name: pricing_schedule; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.pricing_schedule (
    id integer NOT NULL,
    service_id integer,
    discount_id integer,
    field text NOT NULL,
    new_value text NOT NULL,
    effective_date date NOT NULL,
    applied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pricing_schedule OWNER TO david;

--
-- Name: pricing_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.pricing_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pricing_schedule_id_seq OWNER TO david;

--
-- Name: pricing_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.pricing_schedule_id_seq OWNED BY public.pricing_schedule.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number text DEFAULT ''::text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    vendor text DEFAULT ''::text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    expense_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    vendor_email text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.purchase_orders OWNER TO david;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_orders_id_seq OWNER TO david;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    customer_address text,
    service text NOT NULL,
    price text NOT NULL,
    notes text,
    status text DEFAULT 'sent'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_until date
);


ALTER TABLE public.quotes OWNER TO david;

--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quotes_id_seq OWNER TO david;

--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.recurring_expenses (
    id integer NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    amount numeric(10,2) DEFAULT 0 NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    day_of_month integer DEFAULT 1 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_generated date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recurring_expenses OWNER TO david;

--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.recurring_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recurring_expenses_id_seq OWNER TO david;

--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.recurring_expenses_id_seq OWNED BY public.recurring_expenses.id;


--
-- Name: recurring_services; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.recurring_services (
    id integer NOT NULL,
    customer_id integer,
    service text DEFAULT ''::text NOT NULL,
    "interval" text DEFAULT 'quarterly'::text NOT NULL,
    last_service_date date,
    next_due_date date,
    notes text DEFAULT ''::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recurring_services OWNER TO david;

--
-- Name: recurring_services_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.recurring_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recurring_services_id_seq OWNER TO david;

--
-- Name: recurring_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.recurring_services_id_seq OWNED BY public.recurring_services.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    customer_name text NOT NULL,
    star_rating integer NOT NULL,
    review_text text NOT NULL,
    service_type text,
    status text DEFAULT 'pending'::text NOT NULL,
    source text DEFAULT 'public'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    admin_response text,
    CONSTRAINT reviews_star_rating_check CHECK (((star_rating >= 1) AND (star_rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO david;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO david;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: scholarships; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.scholarships (
    id integer NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    amount text DEFAULT 'See website'::text NOT NULL,
    deadline text DEFAULT 'See website'::text NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    color_class text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.scholarships OWNER TO david;

--
-- Name: scholarships_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.scholarships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scholarships_id_seq OWNER TO david;

--
-- Name: scholarships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.scholarships_id_seq OWNED BY public.scholarships.id;


--
-- Name: service_cards; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.service_cards (
    id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    list_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.service_cards OWNER TO david;

--
-- Name: service_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.service_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.service_cards_id_seq OWNER TO david;

--
-- Name: service_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.service_cards_id_seq OWNED BY public.service_cards.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.services (
    id integer NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    category text NOT NULL,
    parent_key text,
    price integer NOT NULL,
    duration real DEFAULT 1 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    bookable_group text,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.services OWNER TO david;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.services_id_seq OWNER TO david;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.settings OWNER TO david;

--
-- Name: work_order_photos; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.work_order_photos (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    url text NOT NULL,
    label text DEFAULT 'before'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.work_order_photos OWNER TO david;

--
-- Name: work_order_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.work_order_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_order_photos_id_seq OWNER TO david;

--
-- Name: work_order_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.work_order_photos_id_seq OWNED BY public.work_order_photos.id;


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: david
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    booking_id integer,
    customer_id integer,
    status_job_complete boolean DEFAULT false NOT NULL,
    status_invoiced boolean DEFAULT false NOT NULL,
    status_invoice_paid boolean DEFAULT false NOT NULL,
    status_paid boolean DEFAULT false NOT NULL,
    admin_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    service text DEFAULT ''::text NOT NULL,
    price text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    payment_method text DEFAULT ''::text NOT NULL,
    completion_notes text DEFAULT ''::text NOT NULL,
    mileage real DEFAULT 0 NOT NULL,
    paid_at timestamp with time zone,
    actual_start text DEFAULT ''::text NOT NULL,
    actual_end text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.work_orders OWNER TO david;

--
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: david
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_orders_id_seq OWNER TO david;

--
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: david
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- Name: amazon_orders id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.amazon_orders ALTER COLUMN id SET DEFAULT nextval('public.amazon_orders_id_seq'::regclass);


--
-- Name: amazon_products id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.amazon_products ALTER COLUMN id SET DEFAULT nextval('public.amazon_products_id_seq'::regclass);


--
-- Name: blocked id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.blocked ALTER COLUMN id SET DEFAULT nextval('public.blocked_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discounts id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.discounts ALTER COLUMN id SET DEFAULT nextval('public.discounts_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: gallery_items id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.gallery_items ALTER COLUMN id SET DEFAULT nextval('public.gallery_items_id_seq'::regclass);


--
-- Name: pricing_schedule id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.pricing_schedule ALTER COLUMN id SET DEFAULT nextval('public.pricing_schedule_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: recurring_expenses id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.recurring_expenses ALTER COLUMN id SET DEFAULT nextval('public.recurring_expenses_id_seq'::regclass);


--
-- Name: recurring_services id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.recurring_services ALTER COLUMN id SET DEFAULT nextval('public.recurring_services_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: scholarships id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.scholarships ALTER COLUMN id SET DEFAULT nextval('public.scholarships_id_seq'::regclass);


--
-- Name: service_cards id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.service_cards ALTER COLUMN id SET DEFAULT nextval('public.service_cards_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: work_order_photos id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_order_photos ALTER COLUMN id SET DEFAULT nextval('public.work_order_photos_id_seq'::regclass);


--
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- Data for Name: amazon_orders; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.amazon_orders (id, order_tag, asin, product_title, qty, unit_price, total_price, seller_name, notes, status, ordered_at, created_at) FROM stdin;
10	ORD-1774573939191		Aquashine Hydrophobic Rinse Coating	1	74.17	74.17	Autosmart of America	Shipping $11.67	ordered	2026-03-26 20:00:00-04	2026-03-26 21:12:19.19247-04
11	ORD-1774574366190	B00PZQI6I2	Mothers 87538 Concentrated Professional Degreaser Formula	1	14.33	14.33	Kleen-Rite Corp		ordered	2026-03-26 20:00:00-04	2026-03-26 21:19:26.190556-04
14	ORD-1774915720153		Softwash Technologies Stainless Steel Hose Clamps	10	1.00	10.00	Softwash Technologies		ordered	2026-03-30 20:00:00-04	2026-03-30 20:08:40.153984-04
\.


--
-- Data for Name: amazon_products; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.amazon_products (id, asin, title, category, model_number, part_number, ppu, seller_name, notes, created_at, updated_at, product_url) FROM stdin;
1	B07T3J9ZFZ	Happybuy 1 Gallon Stainless Steel Pump Sprayer, 12" Wand & 3FT Reinforced Hose, Pressure Gauge, Safety Valve & Adjustable Nozzle, Garden Weed Sprayer for Lawn, Gardening, Sanitizing	Lawn & Patio	1Gal Stainless Steel Sprayer	1Gal Stainless Steel Sprayer	65.84	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
2	B07XBDG2ZL	iMailer - 100 Count - 14" x 20" Large Clear Reclosable 2 Mil Zipper Bags - 2 Gallon Zip Bags for Clothing, T-Shirts, Pants	Home Improvement	BAG-ZIP-1420-100	BAG-ZIP-1420-100	22.76	imailer		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
3	B07JLQ616L	FresKaro 25kN Climbing Carabiners Double Locking Carabiner Clips, Heavy Duty Carabiner for Rock Climbing, Rappelling, Hunting, or Survival Gear kit, Gym Equipment, Cerfified UIAA Carabiner Black	Sports	FK-1272TN	FK-1272TN	23.74	FresKaro.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
4	B0BXXHNWX8	FresKaro Wiregate Carabiner Clip, 15kN Wire Gate Caribeener Heavy Duty, Caribeaner Spring Snap Hook, Strong, Lightweight, 5Pack for one of Each Color,Keychain, Key, Gym, Dog Collar, Outdoor Camping	Sports		FK-2017U	14.20	FresKaro.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
5	B0G4ZTG594	HOTOR Tactical Car Trunk Organizer - Foldable Trunk Organizer for SUV with Front MOLLE Pocket & Reflective Strips, Essential Car Accessories for Tools & Outdoor Storage, 15.0" x 23.6" x 11.0", Black	Home Improvement	US553	US553	24.99	HOTOR		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
6	B0D761N28X	KEEPER Standard Trunk Organizer, 48L, Multi-Compartment Collapsible Car Organizers and Storage, Non-Slip Bottom, Suitable for SUV, Minivan, and Cars	Home Improvement	30032		33.59	OmniGuard Innovations		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
7	B0B3G8P6XK	Encased DuraClip for Kyocera DuraXV Extreme/DuraXE Epic Belt Clip Case, Slim Fit Cover with Holster (Black)	Wireless	B0B3G8P6XK_CA NARF	B0B3G8P6XK_CA NARF	14.47	Encased		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
8	B0DLCQ189H	Husky Liners Aeroskin II Hood Protector | Fits 2019-2026 Chevrolet Silverado 1500, 2022-2026 Silverado 1500 LTD (Exclusions) | Low Profile Deflector/Bug Shield - 1 pc., Textured Black | 2830168	Automotive Parts and Accessories	2830168	2830168	123.24	Shop Eddies 🏁✳️🚚		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
9	B08JPWR6T6	BOJACK 80 Amp 32 VDC ANL Blade Fuse for car Audio and Video System(Pack of 3)	Business, Industrial, & Scientific Supplies Basic	BJ-BLF-80A	BJ-BLF-80A	6.89	BOJACK ELECTRON		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
10	B0CL218RZX	BOJACK 50 Amp 32 VDC ANL Blade Fuse for car Audio and Video System (Pack of 3)	Business, Industrial, & Scientific Supplies Basic	BJ-BLF-50A	BJ-BLF-50A	6.89	BOJACK ELECTRON		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
11	B0F6YJ6VCS	Orion Motor Tech Adjustable Trailer Hitch, Heavy Duty Drop Hitch 2 inch Receiver, 6" Drop & Rise Hitch with 2" & 2-5/16" Balls, 360° Dual-Ball Mount with 12500 lb. Towing Capacity for Class III & IV	Home Improvement	TPA-6N02-AB		99.99	Orion Motor Tech Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
12	B0F6YP65Z7	Orion Motor Tech Adjustable Trailer Hitch, Heavy Duty 2.5 inch Receiver Hitch, 6" Drop Hitch with 2" & 2-5/16" Balls, 360° Dual-Ball Mount with 18500lb Towing Capacity for Class IV & V, Blue	Home Improvement	TPA-B256-AB		129.99	Orion Motor Tech Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
13	B08MSZMYSW	KwikSafety Positioning Lanyard - 4' to 6' Adjustable, No Shock Absorber, ANSI/OSHA Rated for Tree Climbing, Roof Work, Safety Harnesses - Copperhead	Automotive Parts and Accessories	KS7707-YEL-1PC	KS7707-YEL-1PC	35.33	KwikSafety		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
14	B0DPQVCWG7	VFKENA 18MM Nylon Climbing Sling Runner 23KN CE2008/EN566 Rock Climbing Webbing Straps for Rock Climbing, Rappelling, Swing, Yoga Hammock etc (60cm/ 24inch |Pack of 6)	Apparel			26.39	VFKENA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
15	B081N5XQC9	WILDKEN Climbing Ascender Fall Protection Belay Device Climbing Rope Grab for Rock Climbing Mountaineering Tree Arborist Expedition Caving Rescue Aerial Work (Blue)	Sports		1-123	23.98	Ubaymax		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
16	B01HDC236Q	APC Back-UPS 425VA / 255W UPS Battery Backup Surge Protector, 6 Outlets, Small UPS for Router, Modem & Home Office, BE425M	CE	BE425M	BE425M	61.97	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
17	B082FZZVN2	PIG Water Absorbing Kit - 10-Gallon Absorbency per kit - Blue - PM50491	Business, Industrial, & Scientific Supplies Basic	PM50491	PM50491	46.99	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
18	B0CWG7SQBH	SNUTUYA 3/4" GHT Male to 3/4" NPT Male Connector，304 Stainless steel Garden Hose Adapter, Lead-free,3/4 male to male hose adapter, Garden Hose to Pipe Fittings Connect (2 Pack)...	Lawn & Patio	3/4ght to 3/4npt	3/4ght-01	9.79	Garden girl		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
19	B096G22VCH	IEC 320 C14 to C13 Heavy Duty Short Power Cord with On-Off Switch,Standard Computer Power Extension Cord, 3Pin Male -Female Extension Cord with Inline Cord Switch, 42CM, Black	CE	778957664926		12.34	FILSHU		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
20	B00429N192	CyberPower CP1000PFCLCD PFC Sinewave UPS Battery Backup and Surge Protector, 1000VA/600W, 10 Outlets, AVR, Mini-Tower; UL Certified	Speakers	CP1000PFCLCDA	CP1000PFCLCDA	170.95	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
21	B00BX0YKX4	Fosmon Mini Bluetooth Keyboard (QWERTY Keypad), Wireless Portable with Touchpad, Compatible with Apple TV, Amazon Fire Stick, PS4, PS4 Pro, PS5, HTPC/IPTV, VR Glasses, Smartphones	Personal Computer	23022KB	23022KB	29.69	SF Planet		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
22	B00OJ3UJ2S	SABRENT 2.5 Inch SATA to USB 3.0 Tool Free External Hard Drive Enclosure [Optimized for SSD, Support UASP SATA III] Black (EC-UASP)	Personal Computer	EC-UASP	EC-UASP	11.89	Store4PC		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
23	B0C9HQNYDY	Fikwot FS810 4TB SSD, 2.5" SSD SATA III 6Gb/s, Solid State Drives, Up to 560MB/s, 3D NAND TLC Flash, Internal SSD for Desktops and Laptops(Black)	Personal Computer	FS810-4TB	FS810	329.99	Fikwot		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
24	B0B5L93R9M	RED WOLF 50A Amp Circuit Breaker for Boat Trolling Motor Marine ATV Vehicles Stereo Audio Battery Solar System Inline Fuse with Manual Reset Switcher DC 12V-48V	Automotive Parts and Accessories	BXS-D50	BXS-D50	16.55	RED WOLF		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
25	B0BLRR73GD	LiTime 24V 20A LiFePO4 Battery Charger, 29.2V Smart Charger with 0V Activation Function, AC-DC Lithium Charger with Anderson Connector & LED Indicator for RVs, Off-Grid, Homes, and Solar Systems	CE			161.49	Li Time US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
26	B0D88NHSP3	ATACLETE 3mm Neoprene Dive Boots XL- 11 (US Mens)	Sports	BLK-BOOT-S07		45.95	A-TAC Fitness LLC		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
27	B072JH69KJ	USHTH Black Waterproof Rain Boot Shoe Cover with Reflector (1 Pair) X-Large	Apparel	8542055277	waterproof boot covers-01	19.99	USHTH		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
28	B0D9YFKCTN	BAMBOO COOL Men's Athletic Ankle Socks Moisture Wicking, Breathable Running Mesh Socks Cushioned Arch Support, 8 Pack	Apparel			29.99	BAMBOO COOL PRO		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
29	B07M7F2PQD	ANKG 10Pcs 50 Amp 600V Connector Kit, Grey for Outdoor RV Power, Batteries, 4x4 Off-Road Winch	Automotive Parts and Accessories	SJ50	SJ50	12.79	anaptora		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
30	B0DY4DD6JQ	NexusLab Heavy Duty Smart Fingerprint Padlock with Key, IP67 Waterproof Bluetooth Outdoor Gate Lock, Anti-Theft App Control & Log Record, High Security Gym, Fence, Shed, Pool & Storage Unit Locks	Home Improvement	NexusLab-Padlock	LOCK	43.92	NexusLaB		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
31	B07SG9G4Z3	LENKRAD 90 Amp Marine Circuit Breaker Resettable 90A with Manual Reset Switch Button for Boat, Trolling, RV, Yacht, 12V - 48V DC, Waterproof, Surface Mount(90 Amp Boat Circuit Breaker)	Business, Industrial, & Scientific Supplies Basic	C5057	C5057	24.99	Ocean River Technology		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
32	B0C2YMB7F8	ZINZ Ultra Thick & Breathable Universal Shoulder Pad Cushion for Bag, Long & Comfort, Black-Wine	Sports			11.95	ZINZ		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
33	B0BL6QHS91	OELFFOW Waterproof On Off Toggle Switch with Green Light Rocker Button Inline Cord Switch DPST AC/DC 20A-125V,16A-250V,30A-24V,35A-12V, IP66	Business, Industrial, & Scientific Supplies Basic		LBT-FST-11-G	12.99	Minyu Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
34	B0DLBTPDCS	Apple 2024 Mac mini Desktop Computer with M4 chip with 10‑core CPU and 10‑core GPU: Built for Apple Intelligence, 16GB Unified Memory, 256GB SSD Storage, Gigabit Ethernet. Works with iPhone/iPad	Premium Consumer Electronics Brands	MU9D3LL/A	MU9D3LL/A	569.00	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
35	B005WGFYQC	1" x 1" x 3/4" Insert PVC Reducing Tee	Business, Industrial, & Scientific Supplies Basic		1401-131	9.17	CMSColorado 🚚 ⭐⭐⭐⭐⭐		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
36	B08LHDND4Q	Quickun 3/4" Hose Barb Fitting Equal Barbed Y Shaped 3 Way Plastic Joint Splicer Mender Adapter Union for Air Line Tubing Pipe (Pack of 4)	Home Improvement	1-0843-y-barb-4	1-0843-y-barb-4	8.98	Quickun		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
37	B0G25G961Y	IVANKY 13-in-1 Mac mini M4 Dock, Ultra Docking Station Stand with M.2 NVMe SSD Enclosure, 4K@120Hz HDMI Hub for Mac mini M4 &M4 Pro (2024), 10 Gbps USB, SD/TE, Audio Ports *2, 20W PD Power Adapter *1	CE	VCD21	VCD21	75.99	NEVE NA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
38	B0DHLFWBQ1	Samsung 990 EVO Plus SSD 1TB, PCIe Gen 4x4, Gen 5x2 M.2 2280, Speeds Up-to 7,150 MB/s, Upgrade Storage for PC/Laptops, HMB Technology and Intelligent Turbowrite 2.0, (MZ-V9S1T0B/AM)	Personal Computer	MZ-V9S1T0B/AM	MZ-V9S1T0B/AM	118.57	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
39	B09FK6CV1Y	Brass Hose Barb Ball Valve Kit-1pcs 3/4'' Heater Hose Shut Off Valve with Stainless Steel Clamps-High Temperature Resistance Shut off PEX Ball Valve for Water, Oil, Gas, Fuel line Fittings	Home Improvement	AH43		9.39	Boltigen		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
40	B0CP388L73	SNUTUYA 304 Stainless Steel Garden Hose Drinking-safe Adapter - 3/4" GHT Female x 3/4" NPT Male Heavy Duty Forge Garden Hose to Pipe Fitting Connectors,2 PCS...	Lawn & Patio	3/4female-3/4male	GHP003	10.99	Garden girl		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
41	B0CCPTMY48	Sutter ST-510 Chemical Spray Gun 18 GPM 1/2" NPT 362 PSI 200510500	Lawn & Patio	200510500	200510500	24.75	American Pressure Inc.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
42	B01MUEU2HZ	SEAFLO Flex Mount Bilge Air Blower 320CFM Boat Ventilation Marine 12V 4"	Sports	SFBB1-320-02	SFBB1-320-02	66.49	SEAFLO Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
43	B0CLPCBZKK	WD 2TB My Passport Portable Hard Drive, Works with USB-C and USB-A, Windows PC, Mac, Chromebook, Gaming Consoles, and Mobile Devices, Backup Software and Password Protection - WDBWML0020BGY-WESN	Personal Computer	WDBWML0020BGY-WESN	WDBWML0020BGY-WESN	89.99	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
44	B09QKRS4Q7	20FT A Frame Telescoping Ladder, Portable Type-A Collapsible Extension Ladder w. Double Balance Bars, Securing Straps, Wheels & Tools Bag, EN131 Certified Step Ladder (8+8Foot Step) (2026 Upgraded)	Kitchen	aluminum ladder	nuladder	279.99	Nuvending		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
45	B09XGQN2NS	TKDMR 160Pcs Copper Wire Lugs AWG2 4 6 8 10 12 with Heat Shrink Set, 80Pcs Battery Cable Ends Ring Terminals Connectors Tubing Assortment Kit	Business, Industrial, & Scientific Supplies Basic	TKDMR	TDKM1321165489	12.88	TKDMR Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
46	B0CDLN1R23	Shirbly 2 Gauge Battery Cable, 10FT Red + 10FT Black 2 AWG Pure Copper Wire Welding Cable, for Automotive, Battery, Solar and Generator, Standard USA OFC Wire	Business, Industrial, & Scientific Supplies Basic		CA-Welding Cable-2AWG-B&R-10FT	63.99	Shirbly		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
47	B09NW7954L	Wirefy Heat Shrink Tubing Kit 190 PCS - 4:1 Ratio Adhesive Lined, Wire Shrink Wrap Tubing - Industrial Heat-Shrink Tubing - Black & Red - Shrink Wrap Tubing | UL Listed	Business, Industrial, & Scientific Supplies Basic	Wirefy-DW41-190-B-R	Wirefy-DW41-190-B-R	18.61	Tough Outfitters		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
48	B0FW411V1Z	BOJACK 0/2/4 Gauge AWG in-Line ANL fuse Holder with 50 Amp No Wire Terminals Needed Inline Fuse Holder with Insulating Cover, Automotive 4, 2, 0 Gauge Fuse Block	Automotive Parts and Accessories	BJ- XFH-50A	BJ- XFH-50A	13.89	BOJACK ELECTRON		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
49	B0CZJNCY3X	SVAAR Butt Connectors Kit 132PCS 4/6/8/12-10 Gauge Crimp Butt Splice Wire Connectors Non Insulated Butt Splice Connectors Bare Pure Copper 66 PCS Uninsulated Butt Terminals & 66 PCS 3:1 Heat Shrink	Business, Industrial, & Scientific Supplies Basic	12-4 AWG Kit - 132PCS Bare Pure Copper	BN132P-B	34.99	SVAAR Online Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
50	B0DX74HMBB	NAOEVO 6 Gauge Marine Wire, 6 AWG Tinned Copper PVC Marine Grade Wire, IP68 Waterproof/Corrosion-Resistant Electrical Cable for Boat, RV, Automotive, Solar, Trolling Motor (50 ft Black + 50 ft Red)	Business, Industrial, & Scientific Supplies Basic		BECRB2W-6A50FT	109.64	SIMDEVANMA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
51	B0CQD4MSSG	Brileine 10 Tons Hydraulic Crimping Tool with 9 Dies - Battery Cable Crimper Tool & Wire Rope Crimping Tool for 12 to 2/0 AWG, 1/16" 1/8" 3/16" Stainless Steel Cable Railing Tool	Home Improvement	10T-U		39.99	Brileine-US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
52	B0CYH3KVNQ	MLUUHK Rain Shoe Covers, Reusable Waterproof Rain Cover for Shoes, Non-Slip PVC Snow Boot Covers for Men and Women (Black, L)	Sports			20.99	MLUUHK		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
53	B0BLFF7SND	Inspire Heavy Duty Orange Nitrile Gloves Disposable Latex Free | ULTRA 8 Mil Diamond Textured Grip Disposable Cleaning Gloves | Industrial Mechanic Food Large, 100 Count	Apparel		INSSSONG-L	19.97	Soho Living		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
54	B0D1C9HWDJ	XHF 10PCS 2 AWG-3/8 Heavy Duty Battery Lugs with 3:1 Heat Shrink Tubing, Ring Terminals Battery Cable Ends Copper Eyelets Electrical Battery Connectors	Business, Industrial, & Scientific Supplies Basic	2awg-3/8"-10pcs	2awg_3/8"_10pcs	7.79	XHF2018		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
55	B07TJT7BVH	NewDoar Climbing Rope 8(5/16in),10mm (3/8in), High Strength Accessory Cord Rope with 2 Steel Hooks, for Outdoor Rescue Rappelling Rope Down Cliffs ledges Safety Escape Tow Strap Equipment(red)	Sports	Model number:φ10	staticropes2hooks-red/30M	34.64	Meituo		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
56	B0796NN5YY	sprookber Stainless Steel Spring Snap Hook Carabiner - 304 Stainless Steel Caribeener Clips, Set of 6	Sports	M - 07	M - 07	8.99	Sprookber		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
57	B0BPTJQMJY	Jamiikury 6PCS M10 Hook & Hook Turnbuckle 304 Stainless Steel Turnbuckle Wire Rope Tension Heavy Duty Turnbuckles for Cable Railing Wire Rope Hardware Kit (M10, Hook & Hook)	Business, Industrial, & Scientific Supplies Basic	JMMH220704229T	JMMH220704229T	25.99	Jamiikury		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
58	B0CRHKFYX5	TRSMIMA Safety Harness Fall Protection - Men Construction Full Body Harness Kit for Work with Shock Absorbing Lanyard Tongue Buckle ANSI	Apparel	AQD-JYK-JULAN		39.99	Trsmima		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
59	B09VP5KPYN	GM CLIMBING Pack of 3 16mm Nylon Sling Runner 60cm / 24inch (Green Sling)	Sports	GM16013greenUS	GM16013greenUS	17.95	GM CLIMBING Co.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
60	B0C8CNS29Y	TRSMIMA Rope Harness Safety Lanyard：100ft Vertical Roofing Rope with Grab Snap Hooks Shock Absorber - Fall Protection Tree Climbing Line Kit Heavy Duty Roof Safety Equipment ANSI CE	Automotive Parts and Accessories	100ft	25ft	75.99	Trsmima		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
61	B07KLMD7Q4	XSTRAP STANDARD Cam Buckle Straps 6PK 8FT Powersports Tie-Downs 1-Inch Blue Lashing Straps with Carry Bag, Ideal for Securing Cargo, Luggage, Motorcycles	Automotive Parts and Accessories	XS16006	XS16006-Blue	13.82	SMK Factory		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
62	B0895DRN36	GM CLIMBING Pack of 3 16mm Nylon Sling Runner 30cm / 12inch (Green)	Sports	GM1605	GM16053green	16.95	GM CLIMBING Co.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
63	B09JRY19CB	BITOTU 2PCS Camlock Fittings Poly NPT A-75 3/4" Type A Standard Couplings Cam lock Fittings Polypropylene Cam Groove Fitting Male Camlock with Female Threads (0.75 inch, Type A)	Home Improvement			14.00	BITOTU Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
64	B0767NGBP8	DEWALT Mechanics Tool Set, 1/4" & 3/8" & 1/2" Drive, SAE/Metric, 205-piece (DWMT81534)	Home Improvement	DWMT81534	DWMT81534	168.34	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
65	B09ZXMTN3R	BITOTU 2PCS Camlock Fittings Poly E-75 3/4" Type E Standard Couplings Cam lock Fittings Polypropylene Cam Groove Fitting Male Camlock with a Hose Shank (0.75 inch, Type E)	Home Improvement			13.99	BITOTU Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
66	B09ZY3SZ9S	BITOTU 2PCS Camlock Fittings Poly NPT D-75 3/4" Type D Standard Couplings Cam lock Fittings Polypropylene Cam Groove Fitting Female Camlock with Female Threads (0.75 inch, Type D)	Home Improvement			14.99	BITOTU Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
67	B07G9X19G1	Coquimbo Mens Valentines Day Tool Gifts for Him Boyfriend Husband, Rechargeable LED Work Light BBQ Grill with Magnetic Base Hook, 360° Rotate Mechanic Flashlight Dad Birthday Gifts (2 Pack Black)	Home Improvement	GZD-001	LF-GZD-B01	14.24	xianghaodianzi		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
68	B09JS4XVB2	BITOTU 2PCS Camlock Fittings C-75 3/4" Type C Poly Standard Couplings Cam lock Fittings Polypropylene Cam Groove Fitting Female Camlock with a Hose Shank (0.75 inch, Type C)	Home Improvement			14.00	BITOTU Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
69	B09ZXPF7SY	BITOTU 2PCS Camlock Fittings Poly NPT F-75 3/4" Type F Standard Couplings Cam lock Fittings Polypropylene Cam Groove Fitting Male Camlock with Male Threads (0.75 inch, Type F)	Home Improvement			14.24	BITOTU Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
70	B08CRZDJYM	PIG Super Absorbent Sock for Water | 6 Pack | ext. dia. 3" x 4' L | Absorbs Up to 1.75 Gallons per Sock | PM50635	Amazon Basics	PM50635	PM50635	35.99	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
71	B0BL37TN96	RESTMO Water Flow Meter with Brass Inlet Metal Thread, Measure Gallon/Liter Consumption and Flow Rate for Outdoor Garden Hose Watering, RV Water Tank Filling, Lawn Sprinkler and Nozzle Sprayer	Business, Industrial, & Scientific Supplies Basic	O-WM-2-GN	O-WM-2-GN	19.98	Restmo		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
72	B086VW47QG	Victron Energy Orion IP67 12/24-Volt 50 amp DC-DC Converter, Non-Isolated	Sports	ORI122421226	NT-1207	337.51	Inverters-R-US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
73	B06ZZ3GGJ4	Two Ply 2" x 5' Eye-to-Eye Nylon Type 3 Sling | EE2-802 | 10" Eye Length | 6,400 Lb. Vertical Capacity | Hanes Supply (HSI) Heavy Duty Equipment for Lifting and Towing	Business, Industrial, & Scientific Supplies Basic		EE2-802-05	31.79	Hanes Supply Inc.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
74	B0B8HKG1LG	PAMAZY 4PCS Heavy Duty Steel D Rings Tie Down Anchors, Ultra Durable 3500 Pound Breaking Strength Surface Mount Hooks Securing Cargo for Trailer, Truck Bed, with Screws & Bolts	Automotive Parts and Accessories	TDA	TDA	14.99	P.Z.T.G LLC		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
75	B09TKLS8LS	FresKaro Carabiner Clip, Wire Gate Caribeener Heavy Duty, Caribeaner Hook, Strong, Lightweight, 15kN 4Pack for Keychain, Key, Gym, Golf Bag, Dog Collar, Hammock, Outdoor Camping, Medium Size, Blue	Sports		FK-2017U	12.30	FresKaro.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
76	B0CZPHWTBR	Novawinch - PT1100 Portable Electric Winch Hoist - Brushless Motor for Efficient Lifting and Pulling - 1100 lbs Capacity with Dynamic Dual Brake and 360° Rotatable Hook - Heavy Duty AC System	Automotive Parts and Accessories	701009007012	701009007012	250.00	Novawinch		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
77	B0BPJH36Y6	MAACFLOW MAACFLOW Stainless Steel 3/4" Male NPT to 5/8" Hose ID Barb Barbed Hose Fitting Adaptor Connector (Pack of 1)	Home Improvement	SA508B304M-1	SA508B304M-1	9.95	MAAC Solves USA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
78	B09Y17B832	Beduan Pressure Washer Fitting Stainless Steel 1/4" NPT Male Quick Connector Coupler Socket Adapter with a QC Plug, 5000 PSI	Home Improvement	1zf-08900-pwa	1zf-08900-pwa	11.98	Beduan		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
79	B0F227GSZR	2pcs 1/4" Male X 1/4" Male Pipe Hex Nipple, 304 Stainless Steel 1/4 inch NPT Male Threaded Short Equal Nipple Connector, Heavy Duty Straight Male Pipe Fitting Adapter (1/4", 2pcs)	Home Improvement	Drinsalys adapter		6.64	Fhhsp86		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
80	B07VC6GHR3	2 Sets Hotop NPT 3/8 Inch Stainless Steel Male and Female Quick Connector Kit Pressure Washer Adapters (Internal Thread)	Lawn & Patio			12.99	Ripeng		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
81	B0DGH131MK	1/4 Quick Connect Pressure Washer Fittings Set,Stainless Steel Pressure Washer Adapter Set with 1/4 Inch Female and Male NPT	Home Improvement	1/4	no	12.59	LZDICITARU		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
82	B0CZN2W8K8	Soft Wash depot Davis Shooter Aluminum 2 Tip Nozzle Holder, Silver, 45.0005	Home Improvement	45.0005		34.99	Soft Wash Depot		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
83	B0DDTYW92S	Veloci Performance AJH Soft Wash Nozzle Stainless Steel, Compatible with Downstream Units, Adjustable Pressure Washer Tips, 7 to 12 GPM Commercial Grade	Home Improvement	810013922257	16.3006	73.14	Veloci Performance Products, Inc.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
84	B0DDTZWMNH	Veloci Performance HydroJet Soft Wash Nozzle Shooter Tip, Stainless Steel Pressure Washer Tips, ER 180 Large Orifice 7 to 12 GPM	Home Improvement		16.0402	28.49	Veloci Performance Products, Inc.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
85	B00G04UEEW	Giant 36in. Stainless Steel Power Pressure Washer Wand with 12in. Adjustable Grip	Lawn & Patio	21721A	21721A	56.25	Craig's Affordable Tools		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
86	B0D8WP345B	Suttner ST-510 SprayGun With Stainless Steel Fittings Chemical Spray Gun 18 GPM 1/2" NPT 362 PSI 200510500 For 5/8" Hose	Home Improvement	ST510-fittings	3826-SS-58	43.00	American Airless		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
87	B0FMRHGGQM	120A-600V Battery Quick Connect/Disconnect with 2/4/6 AWG, 2 PCS Jumper Cable Plug Connector, Compatible with Anderson Connector for Rescue Winch, Motor Recovery, Winch Trailer, Traction System(Gray)	Automotive Parts and Accessories	OXDFK	OXDFK-179-50	9.99	OXDFK US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
88	B0CJ6ZFCPC	BOJACK 0/2/4 Gauge AWG in-Line ANL Fuse Holder with 80 Amp Fuse No Wire Terminals Needed Inline Fuse Holder with Insulating Cover, Automotive 4, 2, 0 Gauge Fuse Block	Automotive Parts and Accessories	BJ- XFH-80A	BJ- XFH-80A	13.89	BOJACK ELECTRON		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
89	B0CTK6ZDR9	LiTime 80-Amp Lithium Battery Charger,12V LiFePO4 Battery Charger AC-DC Smart Charger with Cooling Fan, Anderson Connector LED for 14.6V LiFePO4 Lithium Batteries, 80A Fast Charging	CE		L12V80A-BCHA-Y-FBA	235.99	Li Time US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
90	B07T288VN8	Nilight - 90015A Battery Switch 12-48V Waterproof Heavy Duty Battery Power Cut Master Switch Disconnect Isolator for Car Vehicle RV and Marine Boat (On/Off),2 Years Warranty	Automotive Parts and Accessories	90015A	90015A	13.49	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
91	B0D2NDXQHN	DAIERTEK Bus Bar 12V 150A Mini Power Distribution Block Max 48V DC/300V AC with Cover 4 x 5/16" Posts for Marine Automotive Solar Systems -Negative+Positive	CE	BB100-T4M8-C-RB		19.99	DaierTek		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
92	B08YYV5PMZ	Glarks 6Pcs 17-19mm T-Bolt Hose Clamps 304 Stainless Steel Heavy Duty Ear Clamp Tube Clamp Adjustable Pipe Clamps for 0.7''-0.75'' Dia Range Hose (17-19mm)	Home Improvement	G-1675	G-1675	11.99	Connectors & Wire & Tools		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
93	B09ZDL43MG	Goupchn Solar Panel Connectors to SAE Adapter Cable 10AWG Solar to SAE PV Extension Wire with 2PCS Polarity Reverse Adapters for RV, Caravan, Battery Charger Kit	Business, Industrial, & Scientific Supplies Basic			8.99	Goupchn Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
94	B0DY7PW39C	Pjerjzn Solar Panel Disconnect Switch 1000V DC/AC 25A PV Disconnect Switch Outdoor Miniature Circuit Breaker IP65 More Space Quick Installation for Solar PV Array Homes Battery (1000V 25 Amp)	Business, Industrial, & Scientific Supplies Basic	PDB63HT3-1000-25Amp	PDB63HT3-1000-25Amp	26.59	Pjerjzn LLC		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
95	B0DLGG6KNW	Solar Cable Entry Gland with 10AWG Solar Extension Cable,MC4 Connectors for Solar Junction Box Fit for RV, Boat, Camper & Van Lnstallations, Tinned Copper Wire (3FT)	CE	solar waterproof cable pass through	JH0029F	22.96	Maigoo-us		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
96	B0CYFZ3DWH	Predimeza 10FT 10AWG Solar Extension Cable with Female and Male Connector with Extra Free Pair of Solar Y Connector Adaptor Kit for Home, Ship and RV Solar Panels	CE	SC-002	SC-002	17.81	XYDZ DIRECT		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
97	B0DPL95H3J	Camlock Fittings 1 Inch Type C & E Polypropylene Cam and Groove Hose Fitting Kit with 1" Female & Male Camlock x 1" Hose Shank (Hose Barb), Cam and Groove Hose Couplings (2 Sets/ 4 Pcs)	Home Improvement	TLG1204	TLG1204	18.99	TALEGEN		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
98	B0F2RQN2L4	SEKSUALA 16Pack 1" T Bolt Hose Clamps - 304 Stainless Steel Turbo Intake Clamp for Turbo Tubes, Intercooler Pipes, Heavy Duty Radiator Hose Clamps Adjustable Range 34mm-40mm for 1" Hose ID	Home Improvement			24.49	Peromi		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
99	B0F2S58DXY	SEKSUALA 16Pack 1.25" T Bolt Hose Clamps - 304 Stainless Steel Turbo Intake Clamp for Turbo Tubes, Intercooler Pipes, Heavy Duty Radiator Hose Clamps Adjustable Range 40mm-46mm for 1.25" Hose ID	Home Improvement			24.49	Peromi		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
100	B0C7MLF9TV	M MINGLE Garden Hose Quick Connect Fittings, 3/4 Inch GHT Stainless Steel, Quick Connector Set, 2-Pack	Lawn & Patio	PW13-1		13.99	MINGLE Tool		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
101	B0CPJ4TCKK	BooYu 8-pcs Sync Feature LED Emergency Strobe Lights Ultra Slim Grille Surface Mount Flashing Warning Hazard Light Bar w/Controller for Construction, Firefighter, Trucks, Vehicles, Car (Amber/White)	Automotive Parts and Accessories	Y017-WY	Y017	35.99	BooYu-US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
102	B0B5L9ZF5F	XTAUTO 10pcs LED Emergency Strobe Light, Red White 6-LED Ultra Slim Surface Mount Flashing Warning Beacon Hazard Construction Caution Grille Light Bar for Truck Car Off Road Vehicles	Automotive Parts and Accessories		XT00326x10	19.99	XT-AUTO		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
103	B0DPM91T9Z	42Pcs Single Ear Hose Clamps 20.3mm-23.5mm (3/4") 304 Stainless Steel Hose Crimp Clamps Ear Stepless Hose Clamp Pinch Clamps Perfect for Automotive, Home Appliance Line and Plumbing	Home Improvement		MRO241125A-0004-FBA	8.95	MroMax®		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
104	B09NHS3QJ3	Hourleey Garden Hose Adapter, 3/4 Inch Solid Brass Hose Connectors, 2 Pack Hose Connector with 2 Extra Washers (Female to Female)	Lawn & Patio	Garden Hose Adapter	Garden Hose Adapter	5.00	Xiny Shop		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
105	B0079JT2SQ	Banjo RN100-075 Polypropylene Pipe Fitting, Reducing Nipple, Schedule 80, 1" NPT Male x 3/4" Length	Business, Industrial, & Scientific Supplies Basic	RN100-075	RN100-075	4.63	SpraySmarter		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
106	B0079JXSTK	Banjo NIP100-SH Polypropylene Pipe Fitting, Short Nipple, Schedule 80, 1" NPT Male, 2" Length	Business, Industrial, & Scientific Supplies Basic	NIP100-SH	NIP100-SH	7.95	Direct Sales Inc		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
107	B099RHZQ85	sprookber 3" Aluminum Carabiner D Ring, Caribeener Clips, Spring Snap Hook for Keychain Clip, Set of 10 (Green)	Sports	8CM	M - 8D	9.89	Sprookber		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
108	B07HJDWD7Z	PowerTye MFG Lashing Straps with Cam Buckle - 1 inch x 8ft Tie-Down Straps with Protective Rubber Pad - Made in USA - For Motorcycles, Truck beds, Coolers and Small Cargo - 200 lb. WLL, Black (2-pack)	Automotive Parts and Accessories		45092-2p	11.00	POWERTYE MFG.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
109	B0CZLJ3YSR	18W Aquarium UV Light for 100-1000 Gallon, UV Pond Water Clarifier for Koi Pond, Swimming Pool, Spa, Large Fish Tank, Cold Plunge UV Light for Pond Algae Control	Lawn & Patio	FTL-18W	FTL18-40W	59.00	Sunshine 100		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
110	B09HN1C1YJ	Coleman Triton 2-Burner Propane Stove, Portable Camping Cooktop with 2 Adjustable Burners & Wind Guards, 22,000 BTUs of Power for Camping, Tailgating, Grilling, BBQ, & More	Sports	2157352	2157352	84.99	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
111	B0CCKXXRJC	Purewell 2.25G Gravity Water Filter System with Water Level Window, 3-Stage 0.01μm Ultra-Filtration Stainless Steel Countertop System with 2 Filters and Stand, Reduce 99% Chlorine, PW-KS	Business, Industrial, & Scientific Supplies Basic	Purewell-2.25G	K8772B	118.99	Purewell		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
112	B07QKPBZX1	[ETL Listed] Cable Matters 3-Pack Grounded Outlet Switch with On Off, Plug Switch On Off, Single Outlet Adapter, Black	Business, Industrial, & Scientific Supplies Basic	400077-BLKx3	400077-BLKx3	9.95	Cable Matters		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
113	B097JGGJTW	CRST 6 Outlet Metal Heavy Duty Power Strip with Individual Switches, 6FT Wall Mount Garage Power Strip, Surge Protector (1200 Joules), 15amp/1875W, 14AWG SJT Power Cord	CE	JUG002	JUG002	28.99	Mahmood Tech		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
114	B0B296BHW8	Amazon Basics Vacuum Compression Space Saving Storage Bags with Hand Pump for Travel, Multiple Sizes for Clothes and Blankets, Clear, 20 Pack (5 Small, 5 Medium, 5 Large & 5 Jumbo)	Home	DS-CBM20	DS-CBM20	17.49	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
115	B0FR4WX8HR	Garvee Black Steel Truck Bed Tool Box, Trailer Tongue Box, Truck Storage Organizer Tool Chest For Truck Bed, RV, Trailer (60 in x 18 in x 18 in-NEW)	Automotive Parts and Accessories	oareQZjbg9wcYl4ZfXoQgAcV	UvxFRyjij2VB8enrjA5tLg	299.99	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
116	B087ZZPS2D	BERLAT SAE Connector SAE to SAE Polarity Reverse Quick Disconnect Cable Plug Adapter for Solar Panel Battery Power Charger - 5Pack	CE	001	JNV-DZO-ELS887	6.64	Sprint gadgets		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
117	B00NEX3YMG	Workman TP-8 CB Radio Power Polarized Quick Disconnect 2 pin 24" 8 Gauge Wire	CE	TP8	TP8	14.32	Audiovideodirect		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
118	B0C8XY3DHR	GEARit 4 Gauge Wire, CCA Electrical Wire Extension Cord for Automotive Power/Ground, Battery Cable, Car Audio, RV, Amp Wiring Kit, (25 feet Each- Black/Red Translucent)	Automotive Parts and Accessories	GI-GRD-4G-CC-25F-BR	GI-GRD-4G-CC-25F-BR	34.53	PC Micro Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
119	B00AB5WCF0	Banjo HB075-90 Polypropylene Hose Fitting, 90 Degree Elbow, 3/4" NPT Male x 3/4" Barbed	Business, Industrial, & Scientific Supplies Basic	HB075-90	HB075-90	3.75	SpraySmarter		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
120	B008HQ5M4I	Spears 1436 Series PVC Tube Fitting, Adapter, Schedule 40, Gray, 1/2" Barbed x NPT Male	Business, Industrial, & Scientific Supplies Basic	1436-005	1436-005	5.07	Cain13		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
121	B00AB5WAR0	Banjo HB075/100-90 Polypropylene Hose Fitting, 90 Degree Elbow, 3/4" NPT Male x 1" Barbed	Business, Industrial, & Scientific Supplies Basic	HB075/100-90	HB075/100-90	7.18	Cain13		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
122	B00AB5WH4G	Banjo HB100-90 Polypropylene Hose Fitting, 90 Degree Elbow, 1" NPT Male x 1" Barbed	Business, Industrial, & Scientific Supplies Basic	HB100-90	HB100-90	6.79	Cain13		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
123	B0CR461714	10pc Drip Irrigation Adapter 1/2"X1/2" 90-Degree Elbow NPT Male Pipe Fitting (1/2 male to 1/2 tubing)	Home Improvement	NFAMRZCAR	NFAMRZCAR	8.48	NFAMRZCAR Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
124	B0CZH28L9D	20 pcs 3/4" Barb x 3/4" NPT Male Connector, Plastic Hose Barb Fitting, Adapter, Industrial Hose Barb to Pipe Fittings Connect	Home Improvement	JSH021	JSH021	22.99	Joe's Home		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
125	B0FDP76CG5	LYXMYGS 10 PCS Long Head Deep Hole Marker Pens,20mm Long Nib Marker, Longs Nose Markers, Waterproof Construction Markers Marking Tool,Permanent Markers Carpenter Ink marker Pens,Metal marking Pens	Office Product		LYCTB20MM001	5.99	LYXMYGS		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
126	B0BJVH4J6Q	haisstronica 6PCS Crimping Tool Set - Ratchet Wire Crimping Tool for Heat Shrink,Insulated Nylon,Non-Insulated,Ferrule Wire End,Open Barrel Terminals,Solar Connectors	Home Improvement	HX1586	HX1586	39.97	HAISSTRONICA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
127	B0912Y24VN	Libraton PVC Pipe Cutter, Up to 2-1/2", Ratchet Pipe Cutter Heavy-Duty, Pex Cutting Tool for Cutting PEX, PVC, PPR Plastic Hoses and Plumbing Pipe	Home Improvement	900920	900920	22.09	Libraton Tools		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
128	B09XQ9HKYN	DURATECH 4 Way Sillcock Key Set, Utility Key, Multi-functional Water Key, 2-Pack, for Valve, Faucet, and Spigots	Home Improvement			10.99	DuraTech Tools		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
129	B00BC39YFQ	Klein Tools 11063W Wire Cutter/Stripper, Heavy Duty Automatic Tool for 8-20 AWG Solid and 10-22 AWG Stranded Electrical Wire	Home Improvement	11063MET	11063W	30.97	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
130	B0FRDLYV9S	FGRHY Telescopic Grabber Reacher Tool, 5-Level Adjustable Length [23'' to 41''] - Trash Claw Gripper is an ideal gift for seniors, Short Litter Picker, Mobility Aid, Trash Pickup Stick, yard work must	Health and Beauty	F02-Blue-1	F02-Blue-1	9.99	MEIBOYA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
131	B0CX1XW5XF	ChillWaves PVC Bulkhead Fitting 3/4" Double Thread Connector Adapter for Water Tank, Aquariums, Rain barrels(8-PACK)	Home Improvement	CWJX280	CWJX280	14.69	CHILLWAVES		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
132	B009F3N69K	Spears 1429 Series PVC Tube Fitting, Coupling, Schedule 40, Gray, 1" x 3/4" Barbed	Business, Industrial, & Scientific Supplies Basic	1429-131	1429-131	6.00	E&W Logistics		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
133	B000CQFWXC	WirthCo Funnel King 144 oz. Extra Heavy Duty Polyethylene Funnel - Chemical Resistant, Anti-Splash, with Removable Filter (90190)	Automotive Parts and Accessories	90190	90190	16.85	Crimp Supply Inc		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
134	B0079JT272	Banjo RN100-050 Polypropylene Pipe Fitting, Reducing Nipple, Schedule 80, 1" NPT Male x 1/2" Length	Business, Industrial, & Scientific Supplies Basic	RN100-050	RN100-050	3.00	SpraySmarter		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
135	B0F1KG3N5Q	Plastic Measuring Cup with Handle, Pool Chemical Measuring Cup, Plastic Measuring Pitcher for Liquid Mixing, Pouring, Lawn Care, Pet Food, Motor Oil, Laboratory and More (32, Fluid Ounces, 1000ml)	Kitchen	CUPS-US		10.99	MiziDo		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
136	B0BPN6LWRB	Dinkle Assembly Kit DK10N White/Black 10 Gang Box Connector DIN Rail Terminal Blocks, 6-20 AWG, 60 Amp, 600 Volt 8 Jumpers Included	Business, Industrial, & Scientific Supplies Basic	DK10N	Assembly Kit DK10N White/Black 10 Gang	36.39	DIN Rail Terminal Blocks		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
137	B0CJ4RZ9M1	APIOLO 1200PCS Wire Ferrules Terminals Kit(0.08-16mm²/AWG28-5) Terminal Connector, Wire Insulated Cord Pin Ends Terminals for Electric, Industrial, Power Control System, etc	Business, Industrial, & Scientific Supplies Basic	AP-Butt-1200PCS-1	AP-Butt-1200PCS	7.99	APIOLO		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
138	B09ND1LTM5	GEARit 8 Gauge Wire, for Automotive Power/Ground, Battery Cable, Car Audio, RV, Amp, CCA, Automotive Wire, Amp Kit, Battery Cables, Wiring Kit, (25 feet Each- Black/Red)	Automotive Parts and Accessories	GI-GRD-8G-CC-25F-BR	GI-GRD-8G-CC-25F-BR	21.84	PC Micro Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
139	B0DHRX79YB	NAOEVO 10 Gauge Wire 100FT, 2 Conductors Electrical Wire Red Black Cable, Flexible/Low Voltage/PVC 10 AWG Copper Clad Aluminum Extension Cord for Speaker, LED Strips, Automotive 12V/24V DC	Business, Industrial, & Scientific Supplies Basic		10A100FT	31.19	NAOEVO		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
140	B09X6W7JC1	FLAPRV 5 Pack 12" 10 Gauge 2 Pin Quick Disconnect Audiopipe Polarized Wire Harness, Heavy Duty SAE Connector Bullet Lead Cable	Automotive Parts and Accessories	SAE10--5	SAE10--5	12.49	Holder US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
141	B0CY8KMM24	mankk 284PCS Non Insulated Butt Connectors Kit 26-6 Gauge Tinned Red Copper Butt Connector Uninsulated Butt Connector Wire Crimp Connectors for Electrical Appliances Cars Boats etc	Business, Industrial, & Scientific Supplies Basic	M-130-284PCS	M-130-284PCS	19.99	yifengmiao		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
142	B0C58M8J4M	SPECILITE Garden Water Hose 200 ft x 5/8 in Heavy Duty, Flexible and Lightweight, Burst 600 psi, Kink-less Hybrid Rubber Pipe for Backyard, 3/4'' Brass Fittings, Orange	Home Improvement	SP-RH-200S		99.99	EMARTUS		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
143	B0D1C5J26G	MOFEEZ Power Distribution Block Bus Bar, 6 x 3/8" Posts, 10 x #8 Screws Terminals, Max 48V 250A (Pair, Red & Black)	Business, Industrial, & Scientific Supplies Basic	98MF18044-1	98MF18044-1	25.59	mofeez		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
144	B0BVVMCY86	Eventronic 400 Pcs Heat Shrink Tubing Kit-3:1 Ratio Adhesive Lined,Marine Grade Shrink Wrap - Industrial Heat-Shrink Tubing - Black	Business, Industrial, & Scientific Supplies Basic	HST-400	HST-400	11.88	Ayhh-official		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
145	B0D98N52HS	Klein Tools 34055 Ferrule Crimping Tool, Square Crimper Pliers for 10 to 22 AWG Wire Terminals, Built-In Adjustable Ratchet, for Electrical Work	Home Improvement	34055	34055	24.99	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
146	B0BYMS14TN	Battery Cable Lug Crimping Tool, Wire Crimper Tool with Cable Cutter for AWG 10-1/0 Electrical Lug Crimper, Heavy Duty Wire Lugs, Battery Terminal, Copper Lugs	Home Improvement	2pcs Crimping Tools		23.99	Mdvora		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
147	B0D1KJ5V1D	Beduan Stainless Steel Garden Hose Repair Connector Fitting 3/4" Barb to 3/4 Garden hose Male and Female GHT Threaded Hose Fittings	Home Improvement		1zf-10930-hbt	20.35	Beduan		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
148	B071R43FTG	GM CLIMBING Pack of 3 16mm Nylon Sling Runner 120cm / 48inch (Fluorescent Orange)	Sports		GM16023	27.95	GM CLIMBING		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
149	B07MPSWWPD	GM CLIMBING Pack of 3 16mm Nylon Sling Runner 30cm / 12inch (Fluorescent Orange)	Sports	GM16053	GM16053	16.95	GM CLIMBING		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
150	B0CC8WQZJK	LMioEtool Junction Box, IP65 Waterproof Dustproof ABS Plastic Enclosure, Outdoor and Indoor Project Box Hinged Clear Cover with Mounting Plate Wall Brackets, Outer Dimension 11.8"x 7.9" x 7.1", Grey	Business, Industrial, & Scientific Supplies Basic	LMUS-302018-TM	LMUS-302018-TM	46.98	Le Meng		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
151	B0DZ661Z82	Garden Hose Repair Kits, 3 Sets Aluminum Alloy Water Hose Connector, Fit 3/4" and 5/8" Garden Hose, Male and Female Hose End Repair Fittings Replacement, Hose Mender Kit	Lawn & Patio	3/4" GHT Garden Hose Adapter	3/4" or 5/8" barb x 3/4" GHT	9.99	JTBL		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
152	B09ZVJ8DSN	VELCRO Brand Cut to Length Straps Heavy Duty | 45 Ft x 3/4 in | ONE-WRAP Self-Gripping Double Sided Roll | Bundling Ties Fasten to Themselves for Secure Hold, VEL-30834-AMS, Black	Home Improvement	VEL-30834-AMS	VEL-30834-AMS	13.80	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
153	B0CC8XRP1P	LMioEtool Electrical Box IP65 Waterproof ABS Plastic Enclosure Outdoor and Indoor Project Box Hinged Clear Cover with Mounting Plate Wall Brackets, Outer Dimension 15.7"x 11.8" x 7.1", Grey	Business, Industrial, & Scientific Supplies Basic	LMUS-403018-TM	LMUS-403018-TM	76.98	Le Meng		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
154	B0F64D7118	FastRack 5 Gallon Water Jug (Pack of 4) | BPA-Free, Food-Grade, and Leak-Proof | White Water Container | Ideal for Brewing, Fermentation, or Storage	Business, Industrial, & Scientific Supplies Basic	4pkhed	4pkhed	57.14	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
155	B0F65HZL47	Pro Edge 20pcs Carbide Hole Saw Kit for Hard Metal, TCT 1/2"-2-1/4" Hole Cutter Set for Stainless Steel, Iron, Alloy, Aluminum, with Two Extra Titanium Plated Pilot Center Drill and Two L-Wrench	Business, Industrial, & Scientific Supplies Basic		YTA0020	49.49	PRO PRECISION CUTTING TOOLS, LLC		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
156	B0F6YG1GSW	Fsehyue 42x18x17 Inch Aluminum Truck Tool Box Heavy Duty Pickup Storage Box Underbody Truck Box Diamond Plate Toolboxes with Lock and Keys Suitable for Truck Bed Pickup RV Trailer Black	Home Improvement	Universal		172.45	NCM RACING		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
157	B0D594J93K	Seagtigau Keyboard Case for iPad Pro 9.7 inch 6th Generation (2018)/5th Gen(2017), 360° Rotatable iPad Air 2&Air 1 Wireless Keyboard Case with Multi-Touch Trackpad,7 Color Backlit (Black)	PC Accessory			51.99	Dexinhe		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
158	B082QRGCHB	typecase Touch iPad 9th Generation Case with Keyboard (10.2", 2021), Multi-Touch Trackpad, 10 Color Backlight, 360° Rotatable, Thin & Light for iPad 8th Gen, 7th Gen, Air 3, Pro 10.5 (Space Gray)	Personal Computer	KB201T10.2	SB01NT-10.2-Spacegry-bk	69.59	TYPECASE		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
159	B0DWMS2VRH	OHOVIV Portable Charger Power Bank 50000mAh Battery Pack, 22.5W Fast Charging PowerBank with Built in Cables,Travel Camping Essential USB-C Portable Phone Charger for iPhone Samsung Pixel Android iPad	Wireless	N10		33.99	Brookoa		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
160	B00EFZQ53W	Pulsar 1,200W Carrying Handle, PG1202SA Gas-Powered Portable Generator, 1200W, Black/White	Home Improvement	PG1202SA	PG1202S	176.00	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
161	B0C89R8T9D	RIDGE WASHER 20'' Pressure Washer Surface Cleaner, Surface Cleaner Dual Handle, Power Washer Surface Cleaner with 4 Wheels for Cleaning Driveways, Sidewalks, Patios, Decks, 4500 PSI	Lawn & Patio	RM	PLU-45-1	179.99	RIDGE WASHER		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
162	B0046HABAW	Homewerks VBV-P80-E3B Ball Valve, PVC Schedule 80, x Solvent, 1/2-Inch, No Size, No Color	Home Improvement	VBV-P80-E3B	VBVP80E3B	5.35	MaxWarehouse		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
163	B009F3MSXU	Spears 1435 Series PVC Tube Fitting, Adapter, Schedule 40, Gray, 3/4" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic	1435-007	1435-007	8.98	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
164	B0DK6LTSWQ	20FT 1" ID x 1.25" OD Steel Wire Suction Hose PVC Reinforced Tubing High Pressure Flexible Vinyl Hose Heavy Duty Clear Vacuum Suction Tube for Dust Collection Drain Fuel	Home Improvement			34.19	Gerguirry-Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
165	B009F3MSFI	Spears 1435 Series PVC Tube Fitting, Adapter, Schedule 40, Gray, 1/2" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic	1435-005	1435-005	8.75	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
166	B0079JVI24	Banjo V100SL Polypropylene Side Load Ball Valve, Three Piece, Three Way, Full Port, 1" NPT Female	Business, Industrial, & Scientific Supplies Basic	V100SL	V100SL	48.40	Process Products		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
167	B0CN1MB48Y	BILAL Brass Rain Barrel Spigot Kit. 55 Gallon Water Tank Faucet, Bulkhead Valve for Outdoor Plastic Bucket rainwater Drum gal Container downspout Collector in Garden, 1 inch O.D. Inlet GHT3/4 Outlet	Home Improvement	Rain Barrel Spigot	B-RBS	11.99	BILAL Shop		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
168	B07V4482W1	Camco Double Battery Box - Safely Stores RV, Automotive, and Marine Batteries - Features a Heavy-Duty Corrosion-Resilient Polymer Construction and Measures Inside 21-1/2" x 7-3/8" x 11-3/16" (55375)	Automotive Parts and Accessories	55375	55375	35.99	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
169	B098DF2GPF	ISPINNER 12pcs 1/2 Inch PVC Pipe Straps, 2 Holes Plastic Conduit Strap for PVC pipes, conduit and cables, UL Listed	Home Improvement	PVC-STRAPS	PVC-STRAPS	7.99	ISPINNER		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
170	B0BYHXGGK3	Coshar 1-Inch NPT Plugs Water Heater Drain Plug Male Thread PVC Drain End Caps White Pipe Fittings Coupling Adapter (White)	Home Improvement	GD1829	GD1829	9.01	Gudao Technology		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
171	B094R1VNQX	12v LED Interior Light Bar，CT CAPETRONIX 120LEDs 1500LM 8W DC 12 Volt led Strip Lights with ON/Off Switch，for Enclosed Cargo Trailer, Car RV Van Truck Lorry Camper Boat Caravan Motorhome (4Pack)	Automotive Parts and Accessories		new-Led Light Bar-1	18.04	Capetronix US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
172	B0FHQ2C9CQ	12-Pack 3/4" PVC Pipe Mounting Straps - Plastic Conduit Clamps for Electrical Cables & Plumbing Pipes (2-Hole Design)	Home Improvement	LH250716001		8.99	JUYICHENG		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
173	B0FDFJVC9L	Bzgnl RGB 12 Gang Switch Panel,12-24V Bluetooth APP 230FT 433M Long Range, Auxiliary Backlit Off Toggle Flash Multifunction Toggle Switch Momentary Circuit Control Relay System Box Universal for Car	Business, Industrial, & Scientific Supplies Basic	MIC-APPSP12-458	MIC-APPSP12-458	129.99	Bzgnl-US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
174	B0046HAB6G	Homewerks VBV-P80-B5B Ball Valve, PVC Schedule 80, Female Thread x Female Thread, 1-Inch	Home Improvement	VBV-P80-B5B	VBVP80B5B	9.00	Jamlyn-Supply		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
204	B07ST4GB5M	Dura PVC Reducing Nipple - NPT Size : 1 1/2" x 1"	Business, Industrial, & Scientific Supplies Basic		8503-211	8.64	Drip Depot, Inc		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
175	B09MQ9FX32	𝟮𝟬𝟬𝗣𝗮𝗰𝗸 𝟭𝟭 𝗦𝗶𝘇𝗲𝗱 𝗦𝗶𝗻𝗴𝗹𝗲 𝗘𝗮𝗿 𝗛𝗼𝘀𝗲 𝗖𝗹𝗮𝗺𝗽𝘀 304 Stainless Steel, 6-33.1mm Stepless Cinch Rings Crimp Assortment Kit with Ear Clamp Pincer for Securing Pipe Hose By Hydencamm	Business, Industrial, & Scientific Supplies Basic	HY-120 PCS CLAMPS	HY-120 PCS CLAMPS	26.59	Hydencamm LLC USA		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
176	B0FF9MK26M	ZJGMGD Waterproof Electrical Junction Box Outdoor IP67 Plastic Junction Box Outdoor for Electronic Pump Controller WiFi Router Off-White, Clear (13.8" x 9.8" x 5.9")	Business, Industrial, & Scientific Supplies Basic	GM-D2	GM-DQH02	54.99	GUANMN		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
177	B09C2CLBYP	Quafwia 2 pcs Polypropylene Camlock Fittings (1" Type C) Cam lock Hose Fittings Standard Female Coupler x Hose End With Camlock Gasket Inside Camlock Fittings Poly (1")	Home Improvement			9.95	quafwia		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
178	B09NXCYL2Y	ISPINNER 12pcs 1 Inch PVC Pipe Straps, 2 Holes Plastic Conduit Strap for PVC Pipes, Conduit and Cables, UL Listed	Home Improvement	ISPINNER-1INCH-PVC-STRAPS	PVC-STRAPS	9.99	ISPINNER		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
179	B08B3MR572	WELLUCK 15 Amp Flanged Inlet 125V, NEMA 5-15 RV Shore Power Inlet Plug w/Waterproof and Back Cover, 2 Pole 3-Wire AC Port Plug, Generator Male Receptacle for Marine Boat RV Shed Electrical Extension	Automotive Parts and Accessories	PL0003	PL0003	16.95	WELLUCK		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
180	B0BC7ZWFPY	DERPIPE Soft Braided PVC Tubing - 3/4" ID x 1" OD High Pressure Clear Flexible PVC Tube Reinforced Vinyl Hose for Water, Oil with 2pcs Hose Clamps (10Ft)	Home Improvement			13.99	derpipe		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
181	B009F3MKLK	Spears 1407 Series PVC Tube Fitting, 90 Degree Elbow, Schedule 40, Gray, 3/4" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic		1407-007	7.00	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
182	B0FP1TBZND	20 PCS Hose Ear Clamps 304 Stainless Steel Single Ear Hose Clamp Clip,Hose Fitting for Securing Pipe Hose 29.6mm	Home Improvement	ECSS20		9.99	ANDILIKE		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
183	B0CDBX1TRJ	Plastic Hose Barb Fitting, 3/4" x 3/4" Pipe Connectors, Barbed Splicer Mender Joint Adapter Union Fitting, 6 Pcs	Home Improvement			8.98	BUSY-CORNER		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
184	B0FPFYBC3J	12V Marine Washdown Pump (80PSI 7.5 GPM) - Self-Priming Fresh Water Pump with Strainer & Pressure Switch, Suitable for Boats, Yachts, RVs, Campers, Travel Trailers & Sprayers	Home Improvement	Washdown Pump	Washdown Pump	80.74	henanyushi		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
185	B0C99H8Y56	QILIPSU UL94-V0 Outdoor Electrical Box 24.2"x16.4"x9.1" Waterproof Junction Box Weatherproof PC/ABS Alloy Plastic IP66 Project Electric Enclosure Clear Hinged Door	Business, Industrial, & Scientific Supplies Basic	QL-634323NC	QILIPSU-634323C	179.99	QILIPSU		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
186	B0BNVKWHNX	50 Pack 3/4" PEX Cinch Clamps, Stainless Steel Single Ear Hose Clamps	Home Improvement	RUBY.Q		9.99	RUBY.Q		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
187	B0F3W9MRSL	Yejesiy 210PCS Rubber Grommet kit, Premium 7 Sizes Rubber Grommets for Wiring, Automotive, Home Improvement, Closed Wire Grommet for Wire Electrical Appliance Plumbing	Business, Industrial, & Scientific Supplies Basic	huxianquan	rubber grommets	6.99	AIMIAI		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
188	B08NC5SZ6C	Quickun Plastic Hose Barb Fitting, 1" x 1" Barbed Splicer Mender Joint Adapter Union Fitting (Pack of 5)	Business, Industrial, & Scientific Supplies Basic	1-0196-5pcs	1-0196-5pcs	8.12	Quickun		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
189	B01MG5UXV4	Nilight RGB LED Rock Lights Kit, 4 pods Underglow Multicolor Neon Light Pod with Bluetooth App Control Flashing Music Mode Wheel Well Light for Truck ATV UTV RZR SUV	Automotive Parts and Accessories	RGB-RL	RGB-RL	33.71	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
190	B0DLH12184	AUXBC 6Pcs 1/2" x 1/2" Plastic Hose Barb Fittings, Barbed Splicer Mender Joint Adapter Union Connectors for Aquarium, Household, Fuel, Gas, Liquid, Air Hose Repair	Home Improvement			5.99	jiateng more		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
191	B0CD22Y9LL	Taiss 270PCS Cable Clamps Assortment Kit,304 Stainless Steel Rubber Cushion Insulated Wire Pipe Clamps,10 Sizes 1/4" 5/16" 3/8" 1/2" 5/8" 3/4" 1" 1-1/4" 1-1/2" 1-3/4" Loop Clamps With screws	Home Improvement	TAISS-CCK-001	F-087-110PCS	28.99	SEA-GULL		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
192	B008HOV8ES	Spears 805 Series PVC Pipe Fitting, Tee, Schedule 80, 1" NPT Female	Business, Industrial, & Scientific Supplies Basic	805-010	805-010	13.56	Process Products		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
193	B009F3MTKM	Spears 1435 Series PVC Tube Fitting, Adapter, Schedule 40, Gray, 1" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic	1435-010	1435-010	9.70	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
194	B0F7WPWRN6	Hose Ear Clamps 304 Stainless Steel,15mm-17.5mm (1/2 Inch) Single Ear Hose Clamp Clip,Hose Fitting for Securing Pipe Hose 58 Pcs	Home Improvement	ECSS60		9.99	ANDILIKE		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
195	B0FKMN8G2K	3 Pcs Bestgle Integrated Internal & External Pipe Threading Tool, Dual-Function Pipe Thread Cutting Tool for 1/2" & 3/4"& 1" PVC/Plastic Pipes, Electric Drill Compatible Pipe Threader Kit	Home Improvement	20250731C		17.99	Bestgle		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
196	B0D3DWB8D3	RV Outlet 15 Amp Flanged AC Port Plug Female with 120-125 Volt 2 Pole-3 Wire NEMA 5-15 Waterproof Cover for Commercial and Industrial Grade Truck Bed Exterior Outlet Electrical Receptacle	Business, Industrial, & Scientific Supplies Basic	hurricanemanspt	hurricanemanspt016	14.24	Hurricanemanspt-Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
197	B0DFMC2M5Y	DaisyInner 500w Car Heater 12 Volt Camping Heaters Windshield Heater Kit Window Defogger Defroster for Winter Automobile Windscreen Car Camper (12v)	Automotive Parts and Accessories	MAD-DaisyInner-0078	MAD-DaisyInner-0078	38.99	Madsyyy		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
198	B07SFG7GN9	Nilight LED Light Bar 2PCS 60W 4 Inch Flood Spot Combo LED Work Light Pods Triple Row Work Driving Lamp with 12 ft Wiring Harness kit - 2 Leads	Automotive Parts and Accessories	ZH302	ZH302	21.06	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
199	B0D1C74W83	Romeda 9 Pack Coloured Electrical Tape, Electrical Tape Colours Water, Sun, and Oil Resistant, Suitable for Most Domestic, Commercial, and Industrial environments.	Business, Industrial, & Scientific Supplies Basic	1	14DGJD0001	6.99	SZLPD		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
200	B07W3QT226	NOCO GENIUS10: 10A 6V/12V Smart Battery Charger - Automatic Maintainer, Trickle Charger & Desulfator with Overcharge Protection & Temperature Compensation - For Lead-Acid & Lithium Batteries	Automotive Parts and Accessories	GENIUS10	GENIUS10	98.23	Amazon		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
201	B009F3ML8C	Spears 1407 Series PVC Tube Fitting, 90 Degree Elbow, Schedule 40, Gray, 1" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic	1407-010	1407-010	7.99	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
202	B0046HABBG	Homewerks VBV-P80-E4B Ball Valve, PVC Schedule 80, x Solvent, 3/4-Inch, 0.75 Inch, No Color	Home Improvement	VBV-P80-E4B	VBVP80E4B	9.99	Friend of Brand		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
203	B009F3MK2Y	Spears 1407 Series PVC Tube Fitting, 90 Degree Elbow, Schedule 40, Gray, 1/2" Barbed x NPT Female	Business, Industrial, & Scientific Supplies Basic	1407-005	1407-005	5.97	Shark Supply Co		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
205	B00LX6M2HE	Duda Energy HPpvc050-100ft 100' x 1/2" ID High Pressure Braided Clear Flexible PVC Tubing Heavy Duty UV Chemical Resistant Vinyl Hose Water Oil	Home Improvement	HPpvc050-100ft	HPpvc050-100ft	52.36	Duda Energy		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
206	B09GL3L4F6	Manufacturer Direct PVC Pipe Schedule 80 Industrial Grade Grey 1/2 Inch (.5) Grey/PVC - 3FT	Home Improvement		PI000-43-08-0530-001	9.25	Ready Pipe Solutions		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
207	B01MS4VOUY	VENTRAL PVC Pipe Schedule 80 Grey 3/4 Inch (.75) Grey/PVC 5FT Feet	Home Improvement	PVC80-PIPE-0750-2X5FT	PVC80-PIPE-0750-5FT	20.66	Ready Pipe Solutions		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
208	B0F2WZC387	VENTRAL PVC Pipe Schedule 80 Industrial Grade Grey 1 Inch (1.0) 8FT Feet	Home Improvement	PI000-43-08-1080-001	PI000-43-08-1080-001	32.29	Ready Pipe Solutions		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
209	B00WE47FVM	Nilight - 60005C-A 20Inch 126W Spot Flood Combo Led Light Bar Off Road Lights Boat Lighting Fog Light Driving Lights LED Work Light for Trucks, 2 Years Warranty	Automotive Parts and Accessories	60005C-A	60005C-A	26.23	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
210	B07YM4351J	MTM Hydro Garden Hose Adapter 6 Piece 3/4" Quick Connect Fittings Kit, Stainless Steel High Pressure Couplings and Connectors for Pressure Washers and Car Detailing, 3x3	Lawn & Patio		24.501	44.99	Veloci Performance Products, Inc.		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
211	B0891SPCRL	Water Float Valve, Water Level Control Water Tank Traditional Float Valve Upgrade 2 PCS(3/4", side inlet)	Home Improvement	SBFV012	SBFV012	17.99	EVTIME Direct		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
212	B07S185GXF	Cllena DC/DC 12V to 24V Boost Converter 50A 1200W Step Up Voltage Regulator Power Supply Voltage Transformer (Input 10V-16V)	CE	0c9073ee-9bfc-4931-8ec8-087979304ab8	DC1224-50	179.99	Cllena		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
213	B0DXZNP1C9	Custom Logo Quick Dry Baseball Cap Snapback Hats Mesh Trucker Hat for Men Women Water-Resistant Outdoor Golf Hat Ball Cap Grey	Apparel	Trucker Hat	GINPAI	22.98	hojem		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
214	B0DSM47XMY	Custom Dry Fit T-Shirts - Moisture-Wicking Short Sleeve Performance Shirt for Men & Women, Quick-Dry Gym Tee for Running, Workout, Sports, Training, Cycling, Fitness (X-Large, 1 Pack - Grey)	Apparel			14.98	Lightfire Printing		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
215	B0C29GRRCZ	Square Reader for contactless and chip (2nd Generation)	CE			51.00	Amazon.com		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
216	B07XJTT9WG	Super Fast Car Charger USB Car Charger Adapter 45W All Metal Lighter AINOPE Android USB Quick Charge for iPhone 17 Pro Max 16e 16 15 14 13 12 11pro x 8 Samsung S25 S24 S23 S22 Car Charger	Wireless	AV829	AV829	9.71	AINOPE US		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
217	B0CDH2LBTN	Wireless Car Charger, MOKPR Auto-Clamping Car Mount 15W/10W/7.5W Fast Charging CD Slot Air Vent Car Phone Mount Fit for iPhone 16 15/14/13/13 Pro/12 Pro Max/12 pro/12/11 Series, Samsung Galaxy Series	CE	CA001		29.99	Star maps		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
218	B07TK6MPNB	USB Wall Charger, LUOATIP 3-Pack 2.1A 5V Dual Port Cube Power Adapter Plug Block Charging Box Brick for iPhone 14 13 12 11 Pro Max SE XS XR X 8 7 6 6S Plus, Galaxy, LG, Moto, Android Phones	Wireless	XT5549	1234753431	8.98	LUOATIP		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
219	B0CCTPXPR9	48W USB C Car Charger, All Metal 12V USB Outlet PD & QC 3.0 Fast Charge iPhone Car Charger Adapter Type C Flush Fit Car Plug for iPhone 17 16e 16 15 14 13 12 11 Pro Max SE XR,Samsung S25 S24 S23 A17	CE	BC09-PD+QC	BC09-PD+QC	7.99	AndHot		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
220	B07K9X6SJ1	TopMost Aluminum Wallet, Card Case Wallet, Metal RFID Credit Card Holder for Men & Women, 6 Cotton Slots for 12 Cards And Bills, Rfd Protective (Black)	Apparel	TP-001	TP001	16.99	TopMost		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
221	B0CMCLZNXY	Sooez Toughest Clipboard with Storage, Internal Pen Pouch Included, Letter/ A4 Size, Shockproof Heavy Duty Plastic Clip Boards 8.5x11", High Capacity Clipboards Box Case for Contractor Trucker Driver	Office Product			25.98	Sooez Official		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
222	B07ZCZ4HRT	Ailun Screen Protector for iPad 9th 8th 7th Generation (10.2 Inch, iPad 9/8/7, 2021&2020&2019) Tempered Glass/Apple Pencil Compatible [2 Pack]	Wireless	iPad 9/8/7thGen 2021/2020/2019	Ailun_GlassSP_iPad10.2Inch_2P	6.96	AilunUS		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
223	B09HV3D2SX	Apple 2021 iPad 10.2-inch, Wi-Fi, 64GB, Silver (Renewed)	Personal Computer	MK2L3LL/A-cr	MK2L3LL/A-cr	168.87	WirelessSource		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
224	B0FKLR4K9B	Custom 5.5" x 8.5" Invoices Receipts Carbonless Books in 2-Part Duplicate Personalized Company Address Name Phone Number 100 Sets	Office Product		wzn123	39.98	Wulinli Store		2026-03-25 21:14:07.875461-04	2026-03-25 21:14:07.875461-04	
226	\N	Preserver Pro Hydrophobic UV Protector	Chemicals			144.00	Outdoor Cleaning Store	UV Protectant | Application: Prop | Size: 4 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://www.outdoorcleaningstore.com/products/preserver-pro-hydrophobic-uv-protector-1-gallon
227	\N	After Wash Conditioner Rejuvenating Bleach Neutralizer Super Concentrated	Chemicals			112.00	Outdoor Cleaning Store	Neutralizer | Application: Prop | Size: 4 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://www.outdoorcleaningstore.com/products/after-wash-conditioner-rejuvenating-bleach-neutralizer-super-concentrated
229	\N	Elemonator Surfactant	Chemicals			129.15	Pressure Tek	Surfactant | Application: Prop | Size: 5 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://pressuretek.com/elemonator/
230	\N	F-18 Max Wood Sealer Stripper Cleaner	Chemicals	F-18		39.44	Pressure Tek	Wood and Concrete | Application: Pump | Size: 4 Pack 32oz	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://pressuretek.com/f-18-max-wood-sealer-stripper-cleaner/
231	\N	F-10 Percarbonate Cleaner	Chemicals	F-10		36.92	Pressure Tek	Pre-Carbonate | Application: Pump | Size: 4 Pack 32oz	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://pressuretek.com/f-10-percarbonate-cleaner/
232	\N	Fast Cherry Off Road Wash Heavy Equipment Cleaner	Chemicals			18.92	Pressure Tek	Heavy Equipment Cleaner | Application: Down Stream Hot Water | Size: 32oz	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://pressuretek.com/fast-cherry-off-road-wash/
233	\N	F-13 Gutter Grenade Anti-Oxidizer	Chemicals	F-13		93.65	Pressure Tek	Anti-Oxidizer for Non-Organic Stains | Application: Prop | Size: 5 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://pressuretek.com/f-13-gutter-grenade/
234	\N	Aquashine Hydrophobic Rinse Coating	Chemicals			62.50	Autosmart of America	Window Cleaning | Application: Pump | Size: 1 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://autosmartofamerica.com/products/aquashine-hydrophobic-rinse-coating
228	B00PZQI6I2	Mothers 87538 Concentrated Professional Degreaser Formula	Chemicals	87538		14.33	Kleen-Rite Corp	De-greaser | Application: Pump | Size: 1 GAL	2026-03-26 00:27:33.268762-04	2026-03-26 00:27:33.268762-04	https://www.kleen-ritecorp.com/p-61512-mothers-87538-concentrated-professional-degreaser-formula-1-gallon-jug.aspx
239	\N	SESW Super 16  16GPM 24V Pump $999.97	Pump	Super 16		999.97	SESW		2026-03-26 18:24:07.286747-04	2026-03-26 18:30:44.102905-04	https://southeastsoftwash.com/products/super-pump
240	\N	SESW Super 8 8GPM 24V Pump $599.00	Pump	Super 8		599.00	SESW		2026-03-26 18:32:15.515366-04	2026-03-26 18:32:15.515366-04	https://southeastsoftwash.com/products/super8-softwash-pump
241	\N	SESW Super 16 16GPM Pump Rebuild Kit	Pump	Super 16		299.00	SESW		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://southeastsoftwash.com/products/sweet16-softwash-pump-rebuild-kit
242	\N	SESW Super 8 8GPM Pump Rebuild Kit	Pump	Super 8		199.00	SESW		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://southeastsoftwash.com/products/super-8-softwash-pump-rebuild-kit
243	\N	SESW Super 16 16GPM Wiring Kit	Pump	Super 16		70.00	SESW		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://southeastsoftwash.com/products/sweet-16-super-pump-24v-wiring-upgrade-kit
244	\N	SESW Softwash Pump Wiring Kit	Pump			39.99	SESW		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://southeastsoftwash.com/products/soft-wash-pump-wiring-harness-2-pin-quick-connect-power-socket-port-connector
245	\N	Softwash Technologies SH Metering Valve	Softwash Supplies			87.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/soft-wash-metering-valve
246	\N	Softwash Technologies Male Check Valve	Softwash Supplies			31.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/soft-wash-check-valve
247	\N	Softwash Technologies Swivel	Softwash Supplies			32.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/waterboss-gun-ss-swivel
248	\N	Softwash Technologies Female Check Valve	Softwash Supplies			15.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/female-check-valve
249	\N	Softwash Technologies Stainless Steel Hose Clamps	Softwash Supplies			1.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/stainless-steel-hose-clamps
250	\N	Softwash Technologies Stainless Steel Adjustable Nozzle	Softwash Supplies			70.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/ajh-stainless-steel-adjustable-nozzle
251	\N	Softwash Technologies Stainless Steel Hose Barb	Softwash Supplies			12.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/stainless-steel-hose-barb
252	\N	Softwash Technologies Stainless Steel Bushing	Softwash Supplies			6.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/stainless-steel-bushing
253	\N	Softwash Technologies Remco Pump HBxQA Elbow	Softwash Supplies			4.00	Softwash Technologies	Size selection on page	2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-hb-x-qa-elbow
254	\N	Softwash Technologies Black SGS35 Spray Gun	Softwash Supplies	SGS35		80.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/black-sgs35-spray-gun
255	\N	Softwash Technologies Remco PSW-FB-80-R Pressure Switch Relay	Softwash Supplies	PSW-FB-80-R		40.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-psw-fb-80-r-pressure-switch-and-relay
256	\N	Softwash Technologies PF225 Foamer Kit	Softwash Supplies	PF225		100.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/pf22-foamer-kit
257	\N	Softwash Technologies Remco PSW-5100-80 Pressure Switch	Softwash Supplies	PSW-5100-80		32.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-psw-5100r-80-pressure-switch
258	\N	Softwash Technologies Respirator	Softwash Supplies			16.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/soft-wash-respirator
259	\N	Softwash Technologies Turbo Nozzle	Softwash Supplies			54.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/turbo-nozzle
260	\N	Softwash Technologies Remco 12V 5.3GPM Pump	Pump	5.3GPM		267.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-12v-soft-wash-pump-5-3-gpm-at-100-psi
261	\N	Softwash Technologies Remco 12V 7GPM Pump	Pump	7GPM		386.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-12v-soft-wash-pump-7-gpm-at-100-psi
262	\N	Softwash Technologies Remco 24V Zeus SmoothFlo 14GPM Pump	Pump	14GPM		1088.00	Softwash Technologies		2026-03-26 19:01:56.387874-04	2026-03-26 19:01:56.387874-04	https://softwashtechnologies.com/products/remco-zeus-smoothflo-24v-soft-wash-pump-14-gpm-at-150-psi
\.


--
-- Data for Name: blocked; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.blocked (id, date, "time", reason) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.bookings (id, date, "time", duration, name, email, phone, service, created_at, address, price, notes, customer_id) FROM stdin;
72	2026-05-02	14:00	4	Renee		757-604-1589		2026-05-02 12:30:45.305174-04	111 Dawson Dr. Seaford	275.00	Dans Friend	84
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.customers (id, name, email, phone, address, notes, created_at, referral_source, email_list) FROM stdin;
62	David Bemish	dbemish82@yahoo.com	2814131332	313 Test		2026-04-12 21:34:18.793424-04		f
84	Renee		757-604-1589	111 Dawson Dr. Seaford		2026-05-02 12:30:45.304535-04		f
\.


--
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.discounts (id, key, label, percent, auto_apply, min_services, active) FROM stdin;
2	return-customer	Return Customer	5	f	0	t
1243	lets-make-it-right-1774661799194	Lets Make it Right	10	f	0	t
1	cash	Cash Payment	10	f	0	t
337	email-list	Email List (1st Service)	10	f	0	t
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.expenses (id, date, category, amount, notes, created_at) FROM stdin;
22	2026-03-06	AMEX Prime	100.00		2026-03-06 11:47:24.964417-05
23	2026-03-06	AMEX Blue	35.00		2026-03-06 11:48:46.238035-05
24	2026-03-16	SoFi	1309.16	Sofi Personal Loan (auto)	2026-03-21 20:01:47.927166-04
35	2026-04-01	Capital One Spark	12.18		2026-04-01 18:32:42.684065-04
36	2026-04-01	Chase Ink	45.00		2026-04-01 18:33:39.40936-04
37	2026-04-01	AMEX Blue	50.00		2026-04-01 18:38:29.309291-04
38	2026-04-01	AMEX Prime	150.00		2026-04-01 18:39:05.346198-04
39	2026-04-03	Equipment	100.00	Verizon Business Phones (auto)	2026-04-03 08:44:29.965817-04
40	2026-04-03	Other	249.00	Onstar	2026-04-03 08:44:57.295408-04
41	2026-04-16	SoFi	1309.16	Sofi Personal Loan (auto)	2026-04-16 23:06:44.836528-04
42	2026-04-09	Supplies	175.90	PO from Amazon	2026-04-25 10:02:11.344569-04
43	2026-04-25	AMEX Prime	92.00		2026-04-25 10:02:33.330411-04
44	2026-03-31	Supplies	17.45	PO from Softwash Technologies	2026-04-25 10:02:55.643331-04
45	2026-03-27	Supplies	43.77	PO from Kleen-Rite Corp	2026-04-25 10:03:03.186302-04
46	2026-03-27	Supplies	74.17	PO from Autosmart of America	2026-04-25 10:03:13.139645-04
47	2026-03-27	Supplies	512.00	PO from Outdoor Cleaning Store	2026-04-25 10:03:19.919881-04
48	2026-03-27	Supplies	566.58	PO from Pressure Tek	2026-04-25 10:03:29.287496-04
49	2026-04-27	Marketing	840.00	TGD Wraps	2026-04-27 13:50:51.068932-04
50	2026-04-27	Marketing	230.00	ML Apparel	2026-04-27 14:29:29.747349-04
51	2026-04-27	Equipment	775.00	Linex Bed Liner	2026-04-27 14:30:01.780984-04
52	2026-05-01	Capital One Spark	20.00		2026-05-01 11:03:03.669367-04
53	2026-05-01	Chase Ink	45.00		2026-05-01 11:04:12.312868-04
54	2026-05-01	AMEX Blue	46.00		2026-05-01 11:05:39.942882-04
55	2026-05-01	AMEX Prime	182.00		2026-05-01 11:06:18.118188-04
56	2026-05-03	Equipment	100.00	Verizon Business Phones (auto)	2026-05-03 10:46:53.076725-04
\.


--
-- Data for Name: gallery_items; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.gallery_items (id, title, description, category, before_image, after_image, sort_order, created_at, before_url, after_url) FROM stdin;
\.


--
-- Data for Name: pricing_schedule; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.pricing_schedule (id, service_id, discount_id, field, new_value, effective_date, applied, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.purchase_orders (id, po_number, date, vendor, items, total, status, notes, expense_id, created_at, vendor_email) FROM stdin;
9	PO-2026-003	2026-03-27	Autosmart of America	[{"qty": 1, "desc": "Aquashine Hydrophobic Rinse Coating", "unit_price": 62.5}, {"qty": 1, "desc": "Shipping", "unit_price": 11.67}]	74.17	received	Reorder — ASIN:  | ORD-1774573939191	46	2026-03-26 21:12:19.467547-04	sales@autosmartofamerica
8	PO-2026-002	2026-03-27	Outdoor Cleaning Store	[{"qty": 2, "desc": "Preserve Pro Hydrophobic UV Protect", "unit_price": 144}, {"qty": 2, "desc": "After Wash Neutralizer ", "unit_price": 112}]	512.00	received		47	2026-03-26 21:07:24.072215-04	kelly@outdoorcleaningstore.com
7	PO-2026-001	2026-03-27	Pressure Tek	[{"qty": 2, "desc": "Eliminator 5 gallon", "unit_price": 129.15}, {"qty": 1, "desc": "F10 Precarb 32oz", "unit_price": 36.92}, {"qty": 1, "desc": "F13 Gutter Oxidation 5 gallon", "unit_price": 93.65}, {"qty": 1, "desc": "F18 Wood Sealler Stripper 32oz", "unit_price": 39.44}, {"qty": 1, "desc": "Fast Cherry Heavy Equipment 32oz ", "unit_price": 18.92}, {"qty": 1, "desc": "UPS Shipping", "unit_price": 92.5}, {"qty": 1, "desc": "State Tax", "unit_price": 26.85}]	566.58	received		48	2026-03-26 20:54:47.128592-04	sales@pressuretek.com
16	PO-2026-006	2026-04-09	Amazon	[{"qty": 1, "desc": "Pewter 27 Inch monitor", "unit_price": 99.97}, {"qty": 1, "desc": "Ergo Focus Long arm Monttor wall mount ", "unit_price": 39.98}, {"qty": 1, "desc": "NODOCA Side Desk Laptop holder ", "unit_price": 25.99}, {"qty": 1, "desc": "Tax", "unit_price": 9.96}]	175.90	received	27 inch monitor, monitor mount and laptop desk holder.	42	2026-04-08 20:54:27.602709-04	Amazon
15	PO-2026-005	2026-03-31	Softwash Technologies	[{"qty": 10, "desc": "Softwash Technologies Stainless Steel Hose Clamps", "unit_price": 1}, {"qty": 1, "desc": "Shipping ", "unit_price": 7.45}]	17.45	received	Reorder — ASIN:  | ORD-1774915720153	44	2026-03-30 20:08:40.387381-04	
10	PO-2026-004	2026-03-27	Kleen-Rite Corp	[{"qty": 1, "desc": "Mothers 87538 Concentrated Professional Degreaser Formula", "unit_price": 14.33}, {"qty": 1, "desc": "Shipping", "unit_price": 29.44}]	43.77	received	Reorder — ASIN: B00PZQI6I2 | ORD-1774574366190	45	2026-03-26 21:19:26.603784-04	
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.quotes (id, customer_name, customer_email, customer_phone, customer_address, service, price, notes, status, created_at, valid_until) FROM stdin;
3	Greene Turtle	sehlers@thegreeneturtle.com	(757)838-3854	3610 Von Schilling Dr, Hampton, VA 23666	Soft wash awnings and hot wash sidewalks	$1500.00	Soft wash awnings and hot wash sidewalks: $1500\nTotal: $1500.00	sent	2026-04-15 20:05:31.281415-04	2026-05-16
\.


--
-- Data for Name: recurring_expenses; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.recurring_expenses (id, description, amount, category, day_of_month, active, last_generated, created_at) FROM stdin;
5	Chevy Silverado Loan at NAE	716.57	Equipment	12	f	2026-03-12	2026-03-26 19:15:42.782282-04
4	Sofi Personal Loan	1309.16	SoFi	16	t	2026-04-16	2026-03-06 11:16:15.26427-05
7	Verizon Business Phones	100.00	Equipment	3	t	2026-05-03	2026-04-01 18:52:44.77292-04
\.


--
-- Data for Name: recurring_services; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.recurring_services (id, customer_id, service, "interval", last_service_date, next_due_date, notes, active, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.reviews (id, customer_name, star_rating, review_text, service_type, status, source, created_at, admin_response) FROM stdin;
\.


--
-- Data for Name: scholarships; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.scholarships (id, title, description, amount, deadline, url, category, color_class, sort_order, active, created_at) FROM stdin;
1	Post-9/11 GI Bill (Chapter 33) — Transferred Benefit	Covers 100% of in-state tuition & fees at any Virginia public university (ODU, VCU, JMU, UVA, Tech, etc.). Also includes a monthly housing stipend (BAH at E-5 w/ dependents) and $1,000/yr book allowance.	100% in-state tuition + housing + $1,000/yr books	Use within 15 yrs of discharge	https://www.va.gov/education/about-gi-bill-benefits/post-9-11/	gi-bill	gold	1	t	2026-02-26 19:26:48.002703-05
2	Yellow Ribbon Program	If you choose a private school or out-of-state university, the Yellow Ribbon Program can cover the gap above the in-state rate. The school and VA split the difference — can cover full tuition at participating schools.	Covers tuition gap	See website	https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program/	gi-bill	gold	2	t	2026-02-26 19:26:48.017687-05
3	Apply for GI Bill Benefits — VA.gov	Submit VA Form 22-1990e (Application for Transfer of Entitlement) to officially claim the transferred benefit. Do this early — processing can take several weeks before school starts.	See website	Apply before enrollment	https://www.va.gov/education/apply-for-education-benefits/application/1990E/	gi-bill	gold	3	t	2026-02-26 19:26:48.032001-05
4	Virginia Academic Scholarship (VAS)	Merit-based award for high-achieving Virginia public school graduates. Applied through your high school counselor — not a separate application. Up to $3,000/year stackable on top of GI Bill.	Up to $3,000/yr	Via high school counselor	https://www.schev.edu/students/financial-aid/scholarships-and-grants	state	blue	1	t	2026-02-26 19:26:48.047283-05
5	Virginia Guaranteed Assistance Program (VGAP)	Need-based grant for Virginia residents at participating public colleges. Apply via FAFSA — the school awards it automatically if eligible. Covers remaining costs after other aid.	Varies by school	Apply via FAFSA	https://www.schev.edu/students/financial-aid/grants/vgap	state	blue	2	t	2026-02-26 19:26:48.061082-05
6	SCHEV — All Virginia Scholarships & Grants	State Council of Higher Education for Virginia — the official hub for all VA state financial aid programs including teaching scholarships, STEM awards, and need-based grants.	See website	See website	https://www.schev.edu/students/financial-aid/scholarships-and-grants	state	blue	3	t	2026-02-26 19:26:48.078922-05
7	Survivors' & Dependents' Educational Assistance (DEA / Ch. 35)	Alternative to transferred GI Bill — pays up to ~$1,471/month for full-time enrollment. Can sometimes be better depending on the school. Check both benefits before choosing.	~$1,471/month full-time	VA Form 22-5490	https://www.va.gov/education/survivor-dependent-benefits/dependents-education-assistance/	military	purple	1	t	2026-02-26 19:26:48.093703-05
8	Military Child Education Coalition (MCEC) Scholarships	Scholarships specifically for children of military members, including multiple awards for dependents of active duty, veterans, and National Guard. Hampton Roads students eligible.	Multiple awards	See website	https://www.militarychild.org/programs/scholarships/	military	purple	2	t	2026-02-26 19:26:48.107424-05
9	Pat Tillman Foundation Scholarship	Prestigious scholarship for military veterans and dependents — up to $25,000/yr. Highly competitive but well worth applying. Strong essay component.	Up to $25,000/yr	See website	https://pattillmanfoundation.org/apply-to-be-a-scholar/	military	purple	3	t	2026-02-26 19:26:48.121014-05
10	AMVETS National Scholarship	Open to children and grandchildren of veterans, active duty, National Guard, and Reserve. Multiple scholarship tiers from $1,000–$4,000. Virginia residents eligible.	$1,000–$4,000	Deadline varies — check site	https://amvets.org/scholarships/	military	purple	4	t	2026-02-26 19:26:48.134898-05
11	Hampton Roads Community Foundation	Local foundation offering dozens of scholarships for Hampton Roads students — many are need and merit based, with several specifically for military families.	See website	See website	https://hamptonroadscf.org/scholarships/	local	teal	1	t	2026-02-26 19:26:48.155805-05
12	Ivy Foundation of Hampton, Inc.	Scholarships for Hampton-area students. Check the website for current application cycles and eligibility requirements — deadlines change yearly.	See website	See website	https://ivyfoundationofhamptoninc.org/scholarships-2/	local	teal	2	t	2026-02-26 19:26:48.202643-05
13	Navy-Marine Corps Relief Society Education Assistance	Financial assistance and scholarships for dependents of Navy and Marine Corps members — highly relevant for Hampton Roads families near NAS Oceana and Norfolk Naval Station.	Varies	See website	https://www.nmcrs.org/education	local	teal	3	t	2026-02-26 19:26:48.227685-05
14	Fastweb — Free Scholarship Matching	Create a free profile and Fastweb matches you to scholarships you qualify for — including military, Virginia-specific, and academic awards. One of the largest scholarship databases.	See website	See website	https://www.fastweb.com	tools	orange	1	t	2026-02-26 19:26:48.247791-05
15	Scholarships.com — Military Dependent Search	Filter scholarships by military affiliation, state (Virginia), and school year. Good for finding awards that stack on top of GI Bill benefits.	See website	See website	https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory/military-affiliation/child-of-veteran	tools	orange	2	t	2026-02-26 19:26:48.2619-05
16	FAFSA — Free Application for Federal Student Aid	File FAFSA even if you have GI Bill benefits — it unlocks additional grants (Pell, VGAP) that can be stacked on top. File as early as possible each year (opens October 1).	See website	Opens October 1 each year	https://studentaid.gov/h/apply-for-aid/fafsa	tools	orange	3	t	2026-02-26 19:26:48.275766-05
\.


--
-- Data for Name: service_cards; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.service_cards (id, title, description, image_url, list_items, sort_order, active, created_at) FROM stdin;
1	House Wash — Rancher / Single Story	Our soft wash house cleaning service safely removes all organic growth, dirt, mold, mildew, and algae. All packages include SH Neutralizer for plant and surface protection.	https://media.istockphoto.com/id/576935936/photo/simple-one-story-house-exterior-with-blue-and-red-trim.jpg?s=612x612&w=0&k=20&c=qGkVJ7cVIr56sNRNV8PSJoa7b_Z_pFbNuSqnb435YoM=	[{"text": "House Wash", "strong": true, "price_key": "house-rancher"}, {"text": "Add Roof Wash", "prefix": "+", "price_key": "house-addon-roof-rancher"}, {"text": "Add Driveway Hot Wash", "prefix": "+", "price_key": "house-addon-driveway-hot-rancher"}, {"text": "Add Driveway Heavy Stain (Peroxide/Degreaser)", "prefix": "+", "price_key": "house-addon-driveway-stain-rancher"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "house-addon-uv-rancher"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "house-addon-windows-rancher"}]	10	t	2026-03-27 20:34:30.739053-04
2	House Wash — Single Family (Two Story)		https://media.istockphoto.com/id/1276724606/photo/two-story-home-near-in-suburb-of-chicago.jpg?s=612x612&w=0&k=20&c=dziv8kRmV2ysgfYWz3CWczmU1BD51P9iCny-OQcuDSE=	[{"text": "House Wash", "strong": true, "price_key": "house-single"}, {"text": "Add Roof Wash", "prefix": "+", "price_key": "house-addon-roof-single"}, {"text": "Add Driveway Hot Wash", "prefix": "+", "price_key": "house-addon-driveway-hot-single"}, {"text": "Add Driveway Heavy Stain (Peroxide/Degreaser)", "prefix": "+", "price_key": "house-addon-driveway-stain-single"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "house-addon-uv-single"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "house-addon-windows-single"}]	20	t	2026-03-27 20:34:30.739472-04
3	House Wash — Plus+ Single Family (Large/Multi-Story)		https://media.istockphoto.com/id/1256427095/photo/perfectly-sized-two-story-home-with-lots-of-charm.jpg?s=612x612&w=0&k=20&c=mSsAsKcmj73jLQ3ctA_vSm_KrHLFNlyEIVYSbhVnNn8=	[{"text": "House Wash", "strong": true, "price_key": "house-plus"}, {"text": "Add Roof Wash", "prefix": "+", "price_key": "house-addon-roof-plus"}, {"text": "Add Driveway Hot Wash", "prefix": "+", "price_key": "house-addon-driveway-hot-plus"}, {"text": "Add Driveway Heavy Stain (Peroxide/Degreaser)", "prefix": "+", "price_key": "house-addon-driveway-stain-plus"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "house-addon-uv-plus"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "house-addon-windows-plus"}]	30	t	2026-03-27 20:34:30.739703-04
4	Deck Soft Washing	Gentle cleaning for wood, composite, and vinyl decks. Our soft wash process removes grime without damaging your deck surface.	https://media.istockphoto.com/id/155015001/photo/large-wooden-deck-of-home.jpg?s=612x612&w=0&k=20&c=-qzyKf8Lie_a65q_Q7L86OafgaZVOJVpU5qrDsNFHv0=	[{"text": "Little Deck (up to 100 sq ft)", "strong": true, "price_key": "deck-little"}, {"text": "Medium Deck (100–200 sq ft)", "strong": true, "price_key": "deck-medium"}, {"text": "Large Deck (200–350 sq ft)", "strong": true, "price_key": "deck-large"}, {"text": "Big Deck (350–500 sq ft)", "strong": true, "price_key": "deck-big"}, {"call": true, "text": "Over 500 sq ft: Call for Estimate"}]	40	t	2026-03-27 20:34:30.739919-04
5	Fence Soft Washing	Wood, vinyl, and composite fences cleaned safely with our soft wash process.	https://media.istockphoto.com/id/2173103845/photo/big-new-wooden-fence-around-the-house-and-trees-street-photo-fencing-and-gates-canadian.jpg?s=612x612&w=0&k=20&c=WxiA4MYVzh60ZU3K5vOJWc-ux1GpvMgaiaNDdtCqm1s=	[{"text": "Standard (1/4 Acre Lot)", "strong": true, "price_key": "fence-standard"}, {"text": "Large (Up to 1/2 Acre Lot)", "strong": true, "price_key": "fence-large"}, {"call": true, "text": "Extra Large (1/2 Acre+): Call for Estimate"}]	50	t	2026-03-27 20:34:30.740116-04
6	RV Washing — Short Bus	Your RV is a major investment. We remove road grime, oxidation, and black streaks to keep your rig looking great.	https://media.istockphoto.com/id/1532640417/photo/a-forest-river-travel-trailer-rvr-pod-camper-trailer-rv-parked.jpg?s=612x612&w=0&k=20&c=IluPa1qu4qa8r5EjeA28DGHGk5GFsAu8zA6ZVKkTcrE=	[{"text": "RV Wash", "strong": true, "price_key": "rv-short"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "rv-addon-uv-short"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "rv-addon-windows-short"}]	60	t	2026-03-27 20:34:30.74031-04
7	RV Washing — Medium Bumper Pull		https://media.istockphoto.com/id/1504461085/photo/a-travel-camper-in-tidioute-pennsylvania-usa.jpg?s=612x612&w=0&k=20&c=rOV7oWTRVqBkCRCKsLKHG6Gw1dZ7mv8PLemAbwdRL7w=	[{"text": "RV Wash", "strong": true, "price_key": "rv-medium"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "rv-addon-uv-medium"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "rv-addon-windows-medium"}]	70	t	2026-03-27 20:34:30.740512-04
8	RV Washing — Big Boy 5th Wheel		https://media.istockphoto.com/id/1144351011/photo/fifth-wheel-camper.jpg?s=612x612&w=0&k=20&c=HKHZHvO-9qkbfjYrj9zn8rnwKcEtki7CnLAE9437v3E=	[{"text": "RV Wash", "strong": true, "price_key": "rv-large"}, {"text": "Add UV Protectant", "prefix": "+", "price_key": "rv-addon-uv-large"}, {"text": "Add Streak-Free Window Cleaning", "prefix": "+", "price_key": "rv-addon-windows-large"}]	80	t	2026-03-27 20:34:30.740729-04
9	Boat Cleaning	Keep your boat looking showroom-ready. We safely remove algae, water stains, and oxidation from hull and deck.	https://media.istockphoto.com/id/978292440/photo/a-pleasure-boat-lining-the-pier-of-the-marina.jpg?s=612x612&w=0&k=20&c=hELPb00z5THvQCEzXLan47Uf6TZsQpzjAHNc-Uhx61Q=	[{"text": "20ft or Less Fishing or Pleasure Boat", "strong": true, "price_key": "boat-small"}, {"text": "21ft to 26ft Fishing or Pleasure Boat", "strong": true, "price_key": "boat-medium"}, {"call": true, "text": "26ft or Greater (Any Kind): Call for Estimate"}]	90	t	2026-03-27 20:34:30.740939-04
10	Heavy Equipment Cleaning	Peroxide/Degreaser hot wash for construction, agricultural, and industrial equipment. Dirty equipment can hide maintenance issues and project a poor image.\n\nWe clean:	https://media.istockphoto.com/id/1131943250/vector/a-large-set-of-construction-equipment-in-yellow-special-machines-for-the-building-work.jpg?s=612x612&w=0&k=20&c=ciInTjlUgDXvssbrD2oYXVCbPpPgjPQSEKXf5em41_I=	[{"text": "Excavators and backhoes"}, {"text": "Tractors and farm equipment"}, {"text": "Skid steers and loaders"}, {"text": "Dump trucks and trailers"}, {"text": "Forklifts"}, {"text": "Fleet vehicles"}, {"call": true, "text": "Call for Estimate"}]	100	t	2026-03-27 20:34:30.741153-04
11	Commercial Soft Washing	First impressions matter for your business. Keep your commercial property looking professional.\n\nWe service:	https://media.istockphoto.com/id/135877652/photo/new-shopping-center.jpg?s=612x612&w=0&k=20&c=rmPt1VBDUhPI_nqvtOL7xgKUtk1n-HjLZi--njdgBPc=	[{"text": "Storefronts"}, {"text": "Office buildings"}, {"text": "Restaurants"}, {"text": "Apartment complexes"}, {"text": "HOA communities"}, {"call": true, "text": "Call for Estimate"}]	110	t	2026-03-27 20:34:30.741348-04
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.services (id, key, label, category, parent_key, price, duration, sort_order, bookable_group, active) FROM stdin;
1	house-rancher	Rancher/Single Story	house	\N	350	2	1	house	t
2	house-single	Single Family (Two Story)	house	\N	575	3	2	house	t
3	house-plus	Plus+ (Large/Multi-Story)	house	\N	805	4	3	house	t
11	house-addon-driveway-stain-single	Driveway Heavy Stain (Peroxide/Degreaser)	house-addon	house-single	125	2	3	\N	t
30	rv-addon-windows-medium	Streak-Free Window Cleaning	rv-addon	rv-medium	45	0.25	2	\N	t
5350	deck-big	Big Deck (350–500 sq ft)	deck	\N	275	3.25	4	\N	t
12	house-addon-uv-single	UV Protectant	house-addon	house-single	115	1.5	4	\N	t
6	house-addon-driveway-stain-rancher	Driveway Heavy Stain (Peroxide/Degreaser)	house-addon	house-rancher	135	2	3	\N	t
32	rv-addon-windows-large	Streak-Free Window Cleaning	rv-addon	rv-large	65	0.5	2	\N	t
21	deck-large	Large/Big Deck	deck	\N	200	2.75	3	\N	t
13	house-addon-windows-single	Streak-Free Window Cleaning	house-addon	house-single	75	1	5	\N	t
8	house-addon-windows-rancher	Streak-Free Window Cleaning	house-addon	house-rancher	40	0.75	5	\N	t
10	house-addon-driveway-hot-single	Driveway Hot Wash	house-addon	house-single	125	1.5	2	\N	t
28	rv-addon-windows-short	Streak-Free Window Cleaning	rv-addon	rv-short	35	0.25	2	\N	t
20	deck-medium	Medium Deck	deck	\N	165	2.5	2	\N	t
31	rv-addon-uv-large	UV Protectant	rv-addon	rv-large	85	0.75	1	\N	t
19	deck-little	Little Deck	deck	\N	135	2	1	\N	t
27	rv-addon-uv-short	UV Protectant	rv-addon	rv-short	45	0.5	1	\N	t
23	fence-large	Large (Up to 1/2 Acre)	fence	\N	265	3	2	\N	t
18	house-addon-windows-plus	Streak-Free Window Cleaning	house-addon	house-plus	100	1	5	\N	t
34	boat-medium	21ft to 26ft	boat	\N	150	2	2	boat	t
5	house-addon-driveway-hot-rancher	Driveway Hot Wash	house-addon	house-rancher	100	1.5	2	\N	t
33	boat-small	20ft or Less	boat	\N	100	1	1	boat	t
17	house-addon-uv-plus	UV Protectant	house-addon	house-plus	150	2	4	\N	t
22	fence-standard	Standard (1/4 Acre Lot)	fence	\N	175	2	1	\N	t
16	house-addon-driveway-stain-plus	Driveway Heavy Stain (Peroxide/Degreaser)	house-addon	house-plus	195	2.5	3	\N	t
10789	commercial	Commercial (Custom Quote)	commercial	\N	0	1	1	\N	t
10790	heavy-equipment	Heavy Equipment (Custom Quote)	heavy-equipment	\N	0	1	1	\N	t
24	rv-short	Short Bus RV	rv	\N	75	1	1	rv	t
15	house-addon-driveway-hot-plus	Driveway Hot Wash	house-addon	house-plus	150	2	2	\N	t
7	house-addon-uv-rancher	UV Protectant	house-addon	house-rancher	85	2	4	\N	t
4	house-addon-roof-rancher	Roof Wash	house-addon	house-rancher	125	2	1	\N	t
14	house-addon-roof-plus	Roof Wash	house-addon	house-plus	400	3	1	\N	t
25	rv-medium	Medium Bumper Pull	rv	\N	125	1.5	2	rv	t
9	house-addon-roof-single	Roof Wash	house-addon	house-single	225	2.5	1	\N	t
26	rv-large	Big Boy 5th Wheel	rv	\N	200	1.75	3	rv	t
29	rv-addon-uv-medium	UV Protectant	rv-addon	rv-medium	65	0.5	1	\N	t
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.settings (key, value) FROM stdin;
build_cost	25000.00
available_balance	13770.22
loc_chase_ink_owed	5402.658
loc_cap_one_owed	249.00
loc_amex_prime_owed	5003.12
loc_amex_blue_owed	7465.71
loc_sofi_owed	69029.64
loc_checking_balance	13770.22
\.


--
-- Data for Name: work_order_photos; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.work_order_photos (id, work_order_id, url, label, created_at) FROM stdin;
\.


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: david
--

COPY public.work_orders (id, booking_id, customer_id, status_job_complete, status_invoiced, status_invoice_paid, status_paid, admin_notes, created_at, service, price, notes, payment_method, completion_notes, mileage, paid_at, actual_start, actual_end) FROM stdin;
20	72	84	t	f	f	f		2026-05-02 12:30:45.305657-04						38	\N	14:00	16:45
\.


--
-- Name: amazon_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.amazon_orders_id_seq', 14, true);


--
-- Name: amazon_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.amazon_products_id_seq', 264, true);


--
-- Name: blocked_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.blocked_id_seq', 2, true);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.bookings_id_seq', 74, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.customers_id_seq', 86, true);


--
-- Name: discounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.discounts_id_seq', 1475, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.expenses_id_seq', 56, true);


--
-- Name: gallery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.gallery_items_id_seq', 17, true);


--
-- Name: pricing_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.pricing_schedule_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 16, true);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.quotes_id_seq', 3, true);


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.recurring_expenses_id_seq', 7, true);


--
-- Name: recurring_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.recurring_services_id_seq', 6, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.reviews_id_seq', 5, true);


--
-- Name: scholarships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.scholarships_id_seq', 33, true);


--
-- Name: service_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.service_cards_id_seq', 11, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.services_id_seq', 11863, true);


--
-- Name: work_order_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.work_order_photos_id_seq', 1, false);


--
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: david
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 22, true);


--
-- Name: amazon_orders amazon_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.amazon_orders
    ADD CONSTRAINT amazon_orders_pkey PRIMARY KEY (id);


--
-- Name: amazon_products amazon_products_asin_key; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.amazon_products
    ADD CONSTRAINT amazon_products_asin_key UNIQUE (asin);


--
-- Name: amazon_products amazon_products_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.amazon_products
    ADD CONSTRAINT amazon_products_pkey PRIMARY KEY (id);


--
-- Name: blocked blocked_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.blocked
    ADD CONSTRAINT blocked_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discounts discounts_key_key; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_key_key UNIQUE (key);


--
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: pricing_schedule pricing_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.pricing_schedule
    ADD CONSTRAINT pricing_schedule_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: recurring_services recurring_services_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.recurring_services
    ADD CONSTRAINT recurring_services_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: scholarships scholarships_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.scholarships
    ADD CONSTRAINT scholarships_pkey PRIMARY KEY (id);


--
-- Name: scholarships scholarships_title_url_key; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.scholarships
    ADD CONSTRAINT scholarships_title_url_key UNIQUE (title, url);


--
-- Name: service_cards service_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.service_cards
    ADD CONSTRAINT service_cards_pkey PRIMARY KEY (id);


--
-- Name: services services_key_key; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_key_key UNIQUE (key);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: work_order_photos work_order_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_order_photos
    ADD CONSTRAINT work_order_photos_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: pricing_schedule pricing_schedule_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.pricing_schedule
    ADD CONSTRAINT pricing_schedule_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id);


--
-- Name: pricing_schedule pricing_schedule_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.pricing_schedule
    ADD CONSTRAINT pricing_schedule_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: purchase_orders purchase_orders_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE SET NULL;


--
-- Name: recurring_services recurring_services_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.recurring_services
    ADD CONSTRAINT recurring_services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: work_order_photos work_order_photos_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_order_photos
    ADD CONSTRAINT work_order_photos_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: david
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- PostgreSQL database dump complete
--

\unrestrict wzAJDHwnJiVCM6iP77mrGRQ0eF2p7AhPye655z2jSXAsEH3Co7TBnGHHjCTcsTx

