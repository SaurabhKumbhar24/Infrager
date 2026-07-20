import type { CatalogService, ServiceCategory } from "./types";

const svc = (
  id: string,
  label: string,
  category: ServiceCategory,
  tfType: string,
  defaults?: CatalogService["defaults"]
): CatalogService => ({ id: `aws.${id}`, provider: "aws", label, category, tfType, defaults });

/**
 * AWS service catalog (beyond the 8 rich core types, which live in the IR).
 * tfType = canonical resource in the hashicorp/aws provider.
 */
export const AWS_CATALOG: CatalogService[] = [
  // Compute
  svc("launch_template", "Launch Template", "Compute", "aws_launch_template", { name: "__NAME__" }),
  svc("autoscaling_group", "Auto Scaling Group", "Compute", "aws_autoscaling_group", {
    max_size: 3,
    min_size: 1,
  }),
  svc("lightsail", "Lightsail Instance", "Compute", "aws_lightsail_instance", {
    name: "__NAME__",
    availability_zone: "us-east-1a",
    blueprint_id: "amazon_linux_2023",
    bundle_id: "nano_3_0",
  }),
  svc("beanstalk", "Elastic Beanstalk App", "Compute", "aws_elastic_beanstalk_application", {
    name: "__NAME__",
  }),
  svc("batch", "Batch Compute Environment", "Compute", "aws_batch_compute_environment"),
  svc("apprunner", "App Runner Service", "Compute", "aws_apprunner_service", {
    service_name: "__NAME__",
  }),
  svc("ebs", "EBS Volume", "Compute", "aws_ebs_volume", {
    availability_zone: "us-east-1a",
    size: 20,
    encrypted: true,
  }),

  // Containers
  svc("ecs_cluster", "ECS Cluster", "Containers", "aws_ecs_cluster", { name: "__NAME__" }),
  svc("ecs_service", "ECS Service", "Containers", "aws_ecs_service", { name: "__NAME__" }),
  svc("ecs_task", "ECS Task Definition", "Containers", "aws_ecs_task_definition", {
    family: "__NAME__",
  }),
  svc("eks_cluster", "EKS Cluster", "Containers", "aws_eks_cluster", { name: "__NAME__" }),
  svc("eks_node_group", "EKS Node Group", "Containers", "aws_eks_node_group"),
  svc("ecr", "ECR Repository", "Containers", "aws_ecr_repository", { name: "__NAME__" }),

  // Serverless
  svc("lambda", "Lambda Function", "Serverless", "aws_lambda_function", {
    function_name: "__NAME__",
    runtime: "nodejs20.x",
    handler: "index.handler",
  }),
  svc("lambda_layer", "Lambda Layer", "Serverless", "aws_lambda_layer_version", {
    layer_name: "__NAME__",
  }),
  svc("step_functions", "Step Functions State Machine", "Serverless", "aws_sfn_state_machine", {
    name: "__NAME__",
  }),
  svc("api_gateway_http", "API Gateway (HTTP)", "Serverless", "aws_apigatewayv2_api", {
    name: "__NAME__",
    protocol_type: "HTTP",
  }),
  svc("api_gateway_rest", "API Gateway (REST)", "Serverless", "aws_api_gateway_rest_api", {
    name: "__NAME__",
  }),
  svc("appsync", "AppSync GraphQL API", "Serverless", "aws_appsync_graphql_api", {
    name: "__NAME__",
    authentication_type: "API_KEY",
  }),

  // Storage
  svc("efs", "EFS File System", "Storage", "aws_efs_file_system", { encrypted: true }),
  svc("fsx", "FSx for Lustre", "Storage", "aws_fsx_lustre_file_system", {
    storage_capacity: 1200,
  }),
  svc("glacier", "S3 Glacier Vault", "Storage", "aws_glacier_vault", { name: "__NAME__" }),
  svc("backup_vault", "Backup Vault", "Storage", "aws_backup_vault", { name: "__NAME__" }),
  svc("backup_plan", "Backup Plan", "Storage", "aws_backup_plan", { name: "__NAME__" }),
  svc("storage_gateway", "Storage Gateway", "Storage", "aws_storagegateway_gateway"),
  svc("transfer_family", "Transfer Family Server", "Storage", "aws_transfer_server"),

  // Database
  svc("dynamodb", "DynamoDB Table", "Database", "aws_dynamodb_table", {
    name: "__NAME__",
    billing_mode: "PAY_PER_REQUEST",
    hash_key: "id",
  }),
  svc("aurora", "Aurora Cluster", "Database", "aws_rds_cluster", {
    engine: "aurora-postgresql",
    storage_encrypted: true,
  }),
  svc("elasticache", "ElastiCache Cluster", "Database", "aws_elasticache_cluster", {
    cluster_id: "__NAME__",
    engine: "redis",
    node_type: "cache.t3.micro",
    num_cache_nodes: 1,
  }),
  svc("memorydb", "MemoryDB Cluster", "Database", "aws_memorydb_cluster", {
    name: "__NAME__",
    node_type: "db.t4g.small",
  }),
  svc("redshift", "Redshift Cluster", "Database", "aws_redshift_cluster", {
    cluster_identifier: "__NAME__",
    node_type: "ra3.xlplus",
    encrypted: true,
  }),
  svc("neptune", "Neptune Cluster", "Database", "aws_neptune_cluster", {
    storage_encrypted: true,
  }),
  svc("docdb", "DocumentDB Cluster", "Database", "aws_docdb_cluster", {
    storage_encrypted: true,
  }),
  svc("keyspaces", "Keyspaces (Cassandra)", "Database", "aws_keyspaces_keyspace", {
    name: "__NAME__",
  }),
  svc("timestream", "Timestream Database", "Database", "aws_timestreamwrite_database", {
    database_name: "__NAME__",
  }),
  svc("qldb", "QLDB Ledger", "Database", "aws_qldb_ledger", { name: "__NAME__" }),
  svc("opensearch", "OpenSearch Domain", "Database", "aws_opensearch_domain", {
    domain_name: "__NAME__",
  }),

  // Networking
  svc("igw", "Internet Gateway", "Networking", "aws_internet_gateway"),
  svc("nat", "NAT Gateway", "Networking", "aws_nat_gateway"),
  svc("eip", "Elastic IP", "Networking", "aws_eip", { domain: "vpc" }),
  svc("route_table", "Route Table", "Networking", "aws_route_table"),
  svc("nacl", "Network ACL", "Networking", "aws_network_acl"),
  svc("vpc_peering", "VPC Peering", "Networking", "aws_vpc_peering_connection"),
  svc("vpc_endpoint", "VPC Endpoint", "Networking", "aws_vpc_endpoint"),
  svc("transit_gateway", "Transit Gateway", "Networking", "aws_ec2_transit_gateway"),
  svc("vpn_gateway", "VPN Gateway", "Networking", "aws_vpn_gateway"),
  svc("customer_gateway", "Customer Gateway", "Networking", "aws_customer_gateway"),
  svc("direct_connect", "Direct Connect", "Networking", "aws_dx_connection", {
    name: "__NAME__",
    bandwidth: "1Gbps",
    location: "EqDC2",
  }),
  svc("route53_zone", "Route 53 Zone", "Networking", "aws_route53_zone", {
    name: "example.com",
  }),
  svc("route53_record", "Route 53 Record", "Networking", "aws_route53_record"),
  svc("cloudfront", "CloudFront Distribution", "Networking", "aws_cloudfront_distribution", {
    enabled: true,
  }),
  svc(
    "global_accelerator",
    "Global Accelerator",
    "Networking",
    "aws_globalaccelerator_accelerator",
    { name: "__NAME__" }
  ),
  svc(
    "cloud_map",
    "Cloud Map Namespace",
    "Networking",
    "aws_service_discovery_private_dns_namespace",
    { name: "__NAME__" }
  ),
  svc("app_mesh", "App Mesh", "Networking", "aws_appmesh_mesh", { name: "__NAME__" }),

  // Analytics
  svc("athena", "Athena Workgroup", "Analytics", "aws_athena_workgroup", { name: "__NAME__" }),
  svc("glue_job", "Glue Job", "Analytics", "aws_glue_job", { name: "__NAME__" }),
  svc("glue_database", "Glue Catalog Database", "Analytics", "aws_glue_catalog_database", {
    name: "__NAME__",
  }),
  svc("emr", "EMR Cluster", "Analytics", "aws_emr_cluster", {
    name: "__NAME__",
    release_label: "emr-7.1.0",
    service_role: "EMR_DefaultRole",
  }),
  svc("kinesis", "Kinesis Data Stream", "Analytics", "aws_kinesis_stream", {
    name: "__NAME__",
    shard_count: 1,
  }),
  svc("firehose", "Kinesis Firehose", "Analytics", "aws_kinesis_firehose_delivery_stream", {
    name: "__NAME__",
  }),
  svc("msk", "MSK (Managed Kafka)", "Analytics", "aws_msk_cluster", {
    cluster_name: "__NAME__",
    kafka_version: "3.6.0",
    number_of_broker_nodes: 3,
  }),
  svc("lake_formation", "Lake Formation", "Analytics", "aws_lakeformation_data_lake_settings"),

  // Messaging & Integration
  svc("sqs", "SQS Queue", "Messaging & Integration", "aws_sqs_queue", { name: "__NAME__" }),
  svc("sns", "SNS Topic", "Messaging & Integration", "aws_sns_topic", { name: "__NAME__" }),
  svc("eventbridge_bus", "EventBridge Bus", "Messaging & Integration", "aws_cloudwatch_event_bus", {
    name: "__NAME__",
  }),
  svc(
    "eventbridge_rule",
    "EventBridge Rule",
    "Messaging & Integration",
    "aws_cloudwatch_event_rule",
    { name: "__NAME__" }
  ),
  svc("mq", "Amazon MQ Broker", "Messaging & Integration", "aws_mq_broker", {
    broker_name: "__NAME__",
    engine_type: "RabbitMQ",
    engine_version: "3.12.13",
    host_instance_type: "mq.t3.micro",
  }),
  svc("ses", "SES Domain Identity", "Messaging & Integration", "aws_ses_domain_identity", {
    domain: "example.com",
  }),
  svc("pinpoint", "Pinpoint App", "Messaging & Integration", "aws_pinpoint_app", {
    name: "__NAME__",
  }),

  // Security & Identity
  svc("kms", "KMS Key", "Security & Identity", "aws_kms_key", {
    description: "Managed by Infrager",
    enable_key_rotation: true,
  }),
  svc("secrets_manager", "Secrets Manager Secret", "Security & Identity", "aws_secretsmanager_secret", {
    name: "__NAME__",
  }),
  svc("ssm_parameter", "SSM Parameter", "Security & Identity", "aws_ssm_parameter", {
    name: "__NAME__",
    type: "SecureString",
  }),
  svc("acm", "ACM Certificate", "Security & Identity", "aws_acm_certificate", {
    domain_name: "example.com",
    validation_method: "DNS",
  }),
  svc("waf", "WAF Web ACL", "Security & Identity", "aws_wafv2_web_acl", {
    name: "__NAME__",
    scope: "REGIONAL",
  }),
  svc("shield", "Shield Protection", "Security & Identity", "aws_shield_protection", {
    name: "__NAME__",
  }),
  svc("guardduty", "GuardDuty Detector", "Security & Identity", "aws_guardduty_detector", {
    enable: true,
  }),
  svc("macie", "Macie", "Security & Identity", "aws_macie2_account"),
  svc("security_hub", "Security Hub", "Security & Identity", "aws_securityhub_account"),
  svc("cognito", "Cognito User Pool", "Security & Identity", "aws_cognito_user_pool", {
    name: "__NAME__",
  }),
  svc("iam_user", "IAM User", "Security & Identity", "aws_iam_user", { name: "__NAME__" }),
  svc("iam_group", "IAM Group", "Security & Identity", "aws_iam_group", { name: "__NAME__" }),
  svc("iam_policy", "IAM Managed Policy", "Security & Identity", "aws_iam_policy", {
    name: "__NAME__",
  }),
  svc("organizations", "Organizations", "Security & Identity", "aws_organizations_organization"),

  // Management & Monitoring
  svc("cw_log_group", "CloudWatch Log Group", "Management & Monitoring", "aws_cloudwatch_log_group", {
    name: "__NAME__",
    retention_in_days: 30,
  }),
  svc("cw_alarm", "CloudWatch Alarm", "Management & Monitoring", "aws_cloudwatch_metric_alarm", {
    alarm_name: "__NAME__",
    comparison_operator: "GreaterThanThreshold",
    evaluation_periods: 1,
  }),
  svc("cw_dashboard", "CloudWatch Dashboard", "Management & Monitoring", "aws_cloudwatch_dashboard", {
    dashboard_name: "__NAME__",
  }),
  svc("cloudtrail", "CloudTrail", "Management & Monitoring", "aws_cloudtrail", {
    name: "__NAME__",
  }),
  svc("config", "AWS Config Recorder", "Management & Monitoring", "aws_config_configuration_recorder"),
  svc("xray", "X-Ray Sampling Rule", "Management & Monitoring", "aws_xray_sampling_rule", {
    rule_name: "__NAME__",
  }),
  svc("appconfig", "AppConfig Application", "Management & Monitoring", "aws_appconfig_application", {
    name: "__NAME__",
  }),

  // Developer Tools
  svc("codebuild", "CodeBuild Project", "Developer Tools", "aws_codebuild_project", {
    name: "__NAME__",
  }),
  svc("codepipeline", "CodePipeline", "Developer Tools", "aws_codepipeline", {
    name: "__NAME__",
  }),
  svc("codecommit", "CodeCommit Repository", "Developer Tools", "aws_codecommit_repository", {
    repository_name: "__NAME__",
  }),
  svc("codedeploy", "CodeDeploy App", "Developer Tools", "aws_codedeploy_app", {
    name: "__NAME__",
  }),
  svc("codeartifact", "CodeArtifact Domain", "Developer Tools", "aws_codeartifact_domain", {
    domain: "__NAME__",
  }),
  svc("amplify", "Amplify App", "Developer Tools", "aws_amplify_app", { name: "__NAME__" }),

  // AI & ML
  svc("sagemaker_notebook", "SageMaker Notebook", "AI & ML", "aws_sagemaker_notebook_instance", {
    name: "__NAME__",
    instance_type: "ml.t3.medium",
  }),
  svc("sagemaker_model", "SageMaker Model", "AI & ML", "aws_sagemaker_model", {
    name: "__NAME__",
  }),
  svc("sagemaker_endpoint", "SageMaker Endpoint", "AI & ML", "aws_sagemaker_endpoint", {
    name: "__NAME__",
  }),
  svc("comprehend", "Comprehend Classifier", "AI & ML", "aws_comprehend_document_classifier"),
  svc("kendra", "Kendra Index", "AI & ML", "aws_kendra_index", { name: "__NAME__" }),
  svc("lex", "Lex Bot", "AI & ML", "aws_lexv2models_bot", { name: "__NAME__" }),

  // End User & Media
  svc("workspaces", "WorkSpaces Directory", "End User & Media", "aws_workspaces_directory"),
  svc("connect", "Connect Instance", "End User & Media", "aws_connect_instance", {
    identity_management_type: "CONNECT_MANAGED",
    inbound_calls_enabled: true,
    outbound_calls_enabled: true,
  }),
  svc("gamelift", "GameLift Fleet", "End User & Media", "aws_gamelift_fleet", {
    name: "__NAME__",
  }),
  svc("iot", "IoT Thing", "End User & Media", "aws_iot_thing", { name: "__NAME__" }),
  svc("medialive", "MediaLive Channel", "End User & Media", "aws_medialive_channel", {
    name: "__NAME__",
  }),
  svc("ivs", "IVS Channel", "End User & Media", "aws_ivs_channel", { name: "__NAME__" }),
];
