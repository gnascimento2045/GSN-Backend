import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('CASCADE')

      // Tipo e prioridade
      table.enum('type', [
        'low_stock',         // Estoque baixo
        'product_expiring',  // Produto vencendo
        'cash_difference',   // Diferença no caixa
        'payment_received',  // Pagamento recebido
        'credit_overdue',    // Fiado vencido
        'system',            // Notificação do sistema
        'alert',             // Alerta importante
        'info'               // Informação
      ]).notNullable()

      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium')

      // Conteúdo
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.string('action_url', 500).nullable() // Link de ação
      table.string('action_label', 100).nullable() // Texto do botão

      // Status
      table.boolean('is_read').defaultTo(false)
      table.timestamp('read_at').nullable()

      // Referência
      table.string('entity_type', 100).nullable()
      table.integer('entity_id').unsigned().nullable()

      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'is_read', 'created_at'])
      table.index(['user_id', 'is_read'])
      table.index(['type', 'priority'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
