import type { CatalogService, ServiceCategory } from "./types";

const svc = (
  id: string,
  label: string,
  category: ServiceCategory,
  tfType: string,
  defaults?: CatalogService["defaults"]
): CatalogService => ({ id: `gcp.${id}`, provider: "gcp", label, category, tfType, defaults });

/**
 * Google Cloud service catalog. tfType = canonical resource in the
 * hashicorp/google provider (GA only; no google-beta resources).
 */
export const GCP_CATALOG: CatalogService[] = [
  // Compute
  svc("compute_instance", "Compute Engine VM", "Compute", "google_compute_instance", {
    name: "__NAME__",
    machine_type: "e2-small",
    zone: "us-central1-a",
  }),
  svc("instance_template", "Instance Template", "Compute", "google_compute_instance_template", {
    machine_type: "e2-small",
  }),
  svc("mig", "Managed Instance Group", "Compute", "google_compute_instance_group_manager", {
    name: "__NAME__",
    base_instance_name: "__NAME__",
    zone: "us-central1-a",
  }),
  svc("autoscaler", "Autoscaler", "Compute", "google_compute_autoscaler", {
    name: "__NAME__",
    zone: "us-central1-a",
  }),
  svc("app_engine", "App Engine", "Compute", "google_app_engine_application", {
    location_id: "us-central",
  }),
  svc("compute_disk", "Persistent Disk", "Compute", "google_compute_disk", {
    name: "__NAME__",
    zone: "us-central1-a",
    size: 20,
  }),

  // Containers
  svc("gke", "GKE Cluster", "Containers", "google_container_cluster", {
    name: "__NAME__",
    location: "us-central1",
    initial_node_count: 1,
  }),
  svc("gke_node_pool", "GKE Node Pool", "Containers", "google_container_node_pool", {
    name: "__NAME__",
  }),
  svc("artifact_registry", "Artifact Registry", "Containers", "google_artifact_registry_repository", {
    repository_id: "__NAME__",
    format: "DOCKER",
    location: "us-central1",
  }),

  // Serverless
  svc("cloud_run", "Cloud Run Service", "Serverless", "google_cloud_run_v2_service", {
    name: "__NAME__",
    location: "us-central1",
  }),
  svc("cloud_run_job", "Cloud Run Job", "Serverless", "google_cloud_run_v2_job", {
    name: "__NAME__",
    location: "us-central1",
  }),
  svc("cloud_function", "Cloud Function (2nd gen)", "Serverless", "google_cloudfunctions2_function", {
    name: "__NAME__",
    location: "us-central1",
  }),
  svc("workflows", "Workflows", "Serverless", "google_workflows_workflow", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc("eventarc", "Eventarc Trigger", "Serverless", "google_eventarc_trigger", {
    name: "__NAME__",
    location: "us-central1",
  }),

  // Storage
  svc("gcs", "Cloud Storage Bucket", "Storage", "google_storage_bucket", {
    name: "__NAME__",
    location: "US",
    uniform_bucket_level_access: true,
    public_access_prevention: "enforced",
  }),
  svc("filestore", "Filestore Instance", "Storage", "google_filestore_instance", {
    name: "__NAME__",
    location: "us-central1-a",
    tier: "BASIC_HDD",
  }),

  // Database
  svc("cloud_sql", "Cloud SQL Instance", "Database", "google_sql_database_instance", {
    name: "__NAME__",
    database_version: "POSTGRES_16",
    region: "us-central1",
  }),
  svc("spanner", "Spanner Instance", "Database", "google_spanner_instance", {
    name: "__NAME__",
    config: "regional-us-central1",
    display_name: "__NAME__",
    num_nodes: 1,
  }),
  svc("bigtable", "Bigtable Instance", "Database", "google_bigtable_instance", {
    name: "__NAME__",
  }),
  svc("firestore", "Firestore Database", "Database", "google_firestore_database", {
    name: "__NAME__",
    location_id: "nam5",
    type: "FIRESTORE_NATIVE",
  }),
  svc("memorystore", "Memorystore (Redis)", "Database", "google_redis_instance", {
    name: "__NAME__",
    memory_size_gb: 1,
  }),
  svc("memcache", "Memorystore (Memcached)", "Database", "google_memcache_instance", {
    name: "__NAME__",
  }),
  svc("alloydb", "AlloyDB Cluster", "Database", "google_alloydb_cluster", {
    cluster_id: "__NAME__",
    location: "us-central1",
  }),

  // Networking
  svc("vpc_network", "VPC Network", "Networking", "google_compute_network", {
    name: "__NAME__",
    auto_create_subnetworks: false,
  }),
  svc("subnetwork", "Subnetwork", "Networking", "google_compute_subnetwork", {
    name: "__NAME__",
    ip_cidr_range: "10.0.1.0/24",
    region: "us-central1",
  }),
  svc("firewall", "Firewall Rule", "Networking", "google_compute_firewall", {
    name: "__NAME__",
  }),
  svc("cloud_router", "Cloud Router", "Networking", "google_compute_router", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc("cloud_nat", "Cloud NAT", "Networking", "google_compute_router_nat", {
    name: "__NAME__",
    region: "us-central1",
    nat_ip_allocate_option: "AUTO_ONLY",
    source_subnetwork_ip_ranges_to_nat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
  }),
  svc("lb_backend", "Load Balancer Backend", "Networking", "google_compute_backend_service", {
    name: "__NAME__",
  }),
  svc("forwarding_rule", "Forwarding Rule", "Networking", "google_compute_forwarding_rule", {
    name: "__NAME__",
  }),
  svc("static_ip", "Static IP Address", "Networking", "google_compute_address", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc("cloud_dns", "Cloud DNS Zone", "Networking", "google_dns_managed_zone", {
    name: "__NAME__",
    dns_name: "example.com.",
  }),
  svc("cloud_armor", "Cloud Armor Policy", "Networking", "google_compute_security_policy", {
    name: "__NAME__",
  }),
  svc("ssl_cert", "SSL Certificate", "Networking", "google_compute_ssl_certificate", {
    name: "__NAME__",
  }),
  svc("vpn_gateway", "Cloud VPN Gateway", "Networking", "google_compute_vpn_gateway", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc(
    "interconnect",
    "Interconnect Attachment",
    "Networking",
    "google_compute_interconnect_attachment",
    { name: "__NAME__", region: "us-central1" }
  ),

  // Analytics
  svc("bigquery_dataset", "BigQuery Dataset", "Analytics", "google_bigquery_dataset", {
    dataset_id: "__NAME__",
    location: "US",
  }),
  svc("bigquery_table", "BigQuery Table", "Analytics", "google_bigquery_table", {
    table_id: "__NAME__",
  }),
  svc("dataproc", "Dataproc Cluster", "Analytics", "google_dataproc_cluster", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc("dataflow", "Dataflow Job", "Analytics", "google_dataflow_job", {
    name: "__NAME__",
    temp_gcs_location: "gs://my-bucket/tmp",
    template_gcs_path: "gs://dataflow-templates/latest/Word_Count",
  }),
  svc("composer", "Cloud Composer", "Analytics", "google_composer_environment", {
    name: "__NAME__",
    region: "us-central1",
  }),
  svc("data_fusion", "Data Fusion Instance", "Analytics", "google_data_fusion_instance", {
    name: "__NAME__",
    region: "us-central1",
    type: "BASIC",
  }),

  // Messaging & Integration
  svc("pubsub_topic", "Pub/Sub Topic", "Messaging & Integration", "google_pubsub_topic", {
    name: "__NAME__",
  }),
  svc(
    "pubsub_subscription",
    "Pub/Sub Subscription",
    "Messaging & Integration",
    "google_pubsub_subscription",
    { name: "__NAME__" }
  ),
  svc("cloud_tasks", "Cloud Tasks Queue", "Messaging & Integration", "google_cloud_tasks_queue", {
    name: "__NAME__",
    location: "us-central1",
  }),
  svc("scheduler", "Cloud Scheduler Job", "Messaging & Integration", "google_cloud_scheduler_job", {
    name: "__NAME__",
    schedule: "0 4 * * *",
  }),
  svc("apigee", "Apigee Organization", "Messaging & Integration", "google_apigee_organization"),

  // Security & Identity
  svc("kms_keyring", "KMS Key Ring", "Security & Identity", "google_kms_key_ring", {
    name: "__NAME__",
    location: "us-central1",
  }),
  svc("kms_key", "KMS Crypto Key", "Security & Identity", "google_kms_crypto_key", {
    name: "__NAME__",
  }),
  svc("secret_manager", "Secret Manager Secret", "Security & Identity", "google_secret_manager_secret", {
    secret_id: "__NAME__",
  }),
  svc("service_account", "Service Account", "Security & Identity", "google_service_account", {
    account_id: "__NAME__",
  }),
  svc("iam_custom_role", "IAM Custom Role", "Security & Identity", "google_project_iam_custom_role", {
    role_id: "__NAME__",
    title: "__NAME__",
  }),
  svc(
    "binary_authorization",
    "Binary Authorization",
    "Security & Identity",
    "google_binary_authorization_policy"
  ),
  svc("scc_source", "Security Command Center Source", "Security & Identity", "google_scc_source", {
    display_name: "__NAME__",
  }),

  // Management & Monitoring
  svc("alert_policy", "Monitoring Alert Policy", "Management & Monitoring", "google_monitoring_alert_policy", {
    display_name: "__NAME__",
    combiner: "OR",
  }),
  svc(
    "monitoring_dashboard",
    "Monitoring Dashboard",
    "Management & Monitoring",
    "google_monitoring_dashboard"
  ),
  svc("log_sink", "Logging Sink", "Management & Monitoring", "google_logging_project_sink", {
    name: "__NAME__",
    destination: "storage.googleapis.com/my-bucket",
  }),
  svc("log_metric", "Log-based Metric", "Management & Monitoring", "google_logging_metric", {
    name: "__NAME__",
    filter: "severity>=ERROR",
  }),

  // Developer Tools
  svc("cloud_build", "Cloud Build Trigger", "Developer Tools", "google_cloudbuild_trigger", {
    name: "__NAME__",
  }),
  svc("source_repo", "Source Repository", "Developer Tools", "google_sourcerepo_repository", {
    name: "__NAME__",
  }),
  svc(
    "cloud_deploy",
    "Cloud Deploy Pipeline",
    "Developer Tools",
    "google_clouddeploy_delivery_pipeline",
    { name: "__NAME__", location: "us-central1" }
  ),

  // AI & ML
  svc("vertex_dataset", "Vertex AI Dataset", "AI & ML", "google_vertex_ai_dataset", {
    display_name: "__NAME__",
    region: "us-central1",
  }),
  svc("vertex_endpoint", "Vertex AI Endpoint", "AI & ML", "google_vertex_ai_endpoint", {
    name: "__NAME__",
    display_name: "__NAME__",
    location: "us-central1",
  }),
  svc("notebooks", "Workbench Notebook", "AI & ML", "google_notebooks_instance", {
    name: "__NAME__",
    location: "us-central1-a",
    machine_type: "e2-standard-4",
  }),
  svc("dialogflow", "Dialogflow Agent", "AI & ML", "google_dialogflow_agent", {
    display_name: "__NAME__",
    default_language_code: "en",
    time_zone: "America/New_York",
  }),
  svc("document_ai", "Document AI Processor", "AI & ML", "google_document_ai_processor", {
    display_name: "__NAME__",
    location: "us",
    type: "OCR_PROCESSOR",
  }),
];
