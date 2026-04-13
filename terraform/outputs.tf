output "web_app_url" {
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
  description = "The URL of the deployed web application"
}

output "storage_account_name" {
  value = azurerm_storage_account.storage.name
}

output "cosmos_db_endpoint" {
  value     = azurerm_cosmosdb_account.cosmos.endpoint
  sensitive = true
}
