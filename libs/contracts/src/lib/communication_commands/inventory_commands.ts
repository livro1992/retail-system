/** RabbitMQ message patterns for inventory-service integration */
export enum InventoryCommand {
  checkStatus = 'check_status',
  checkAvailability = 'check_availability',
  /** Verifica che gli SKU esistano in anagrafica (prima di creare SubOrder operative). */
  validateOrderProducts = 'validate_order_products',
  reserveStockForOrder = 'reserve_stock_for_order',
  releaseStockForOrder = 'release_stock_for_order',
  deductInstantSale = 'deduct_instant_sale',
}
